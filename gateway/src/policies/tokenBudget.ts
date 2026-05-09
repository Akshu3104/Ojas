/**
 * Token-budget / per-tenant quota policy.
 *
 * The DevPulse server is the source of truth for each tenant's quota state.
 * The gateway caches the state for `cacheMs` ms (default 30s) to avoid round-
 * tripping on every request, and degrades fail-open if the server is
 * unreachable (the gateway should never become a SPOF for the customer's LLM
 * traffic — DevPulse can always retroactively flag overages).
 *
 * Quotas are evaluated across three dimensions, hardest cap wins:
 *
 *   1. **Daily total** — `used / limit` rolling 24-hour window.
 *   2. **Hourly total** — `usedHour / limitHour` for the current clock hour.
 *      Useful to dampen runaway loops without rejecting whole-day traffic.
 *   3. **Per-model daily** — optional `perModel: { gpt-4o: { used, limit } }`
 *      so a tenant can hard-cap GPT-4 separately from cheaper models.
 *
 * Soft-cap warnings: when usage crosses 80% / 90% of any cap, the policy
 * returns an `allow` decision with `detail.warnings` populated; the caller
 * forwards these through the audit record so the dashboard can surface
 * "approaching limit" banners.
 *
 * Two enforcement modes:
 *   - "soft": annotate the request and let it through (default for free tier).
 *   - "hard": block with HTTP 402 (Payment Required) once any cap is hit.
 *
 * The policy never *consumes* tokens — that happens server-side when the
 * gateway emits the post-call audit record. We only *check* running totals.
 */
import type { LlmRequest, PolicyDecision, RequestPolicy } from "../types.js";

export interface TokenWindow {
  used: number;
  limit: number | null;
}

export interface TokenBudgetState {
  /** ISO yyyy-mm-dd window the daily count belongs to. */
  windowStart: string;
  /** ISO hour (yyyy-mm-ddTHH) the hourly count belongs to. */
  hourStart?: string;
  /** Daily totals. */
  used: number;
  limit: number | null;
  /** Hourly totals (optional). */
  usedHour?: number;
  limitHour?: number | null;
  /** Per-model daily totals (optional). */
  perModel?: Record<string, TokenWindow>;
  /** "soft" or "hard". */
  mode: "soft" | "hard";
}

export interface TokenBudgetPolicyConfig {
  devpulseUrl?: string;
  serviceToken?: string;
  cacheMs?: number;
  fetchImpl?: typeof fetch;
  /**
   * If true (default), missing config is interpreted as "no quota enforcement"
   * rather than fail-closed.
   */
  failOpen?: boolean;
  /** Used in tests. */
  now?: () => number;
  /** Soft-warning thresholds, fractions of cap (default [0.8, 0.9]). */
  warnAt?: number[];
}

interface CachedState {
  state: TokenBudgetState;
  fetchedAt: number;
}

interface BudgetWarning {
  scope: "daily" | "hourly" | "per_model";
  model?: string;
  used: number;
  limit: number;
  fraction: number;
  threshold: number;
}

export function createTokenBudgetPolicy(
  cfg: TokenBudgetPolicyConfig = {}
): RequestPolicy {
  const fetchFn = cfg.fetchImpl ?? fetch;
  const cacheMs = cfg.cacheMs ?? 30_000;
  const failOpen = cfg.failOpen !== false;
  const now = cfg.now ?? (() => Date.now());
  const warnAt = (cfg.warnAt ?? [0.8, 0.9]).slice().sort((a, b) => a - b);
  const cache = new Map<string, CachedState>();

  return async input => {
    if (!cfg.devpulseUrl || !cfg.serviceToken) {
      return failOpen
        ? { kind: "allow" }
        : ({
            kind: "block",
            reason: "budget_unconfigured",
            status: 503,
          } satisfies PolicyDecision);
    }
    const tenantId = input.ctx.tenantId;
    if (!tenantId) return { kind: "allow" };

    const cached = cache.get(tenantId);
    if (cached && now() - cached.fetchedAt < cacheMs) {
      return decide(cached.state, input.request, warnAt);
    }

    let state: TokenBudgetState | null = null;
    try {
      const url = `${cfg.devpulseUrl.replace(/\/$/, "")}/api/internal/token-budget/${encodeURIComponent(tenantId)}`;
      const resp = await fetchFn(url, {
        headers: { Authorization: `Bearer ${cfg.serviceToken}` },
      });
      if (resp.ok) {
        state = (await resp.json()) as TokenBudgetState;
      }
    } catch {
      // Network failure — fail open.
    }
    if (!state) {
      cache.set(tenantId, {
        state: {
          windowStart: new Date(now()).toISOString().slice(0, 10),
          used: 0,
          limit: null,
          mode: "soft",
        },
        fetchedAt: now(),
      });
      return { kind: "allow" };
    }
    cache.set(tenantId, { state, fetchedAt: now() });
    return decide(state, input.request, warnAt);
  };
}

function checkWarning(
  scope: BudgetWarning["scope"],
  used: number,
  limit: number | null | undefined,
  thresholds: number[],
  model?: string
): BudgetWarning | undefined {
  if (limit === null || limit === undefined || limit <= 0) return undefined;
  const fraction = used / limit;
  let firedThreshold: number | undefined;
  for (const t of thresholds) {
    if (fraction >= t) firedThreshold = t;
  }
  if (firedThreshold === undefined) return undefined;
  return {
    scope,
    used,
    limit,
    fraction,
    threshold: firedThreshold,
    ...(model ? { model } : {}),
  };
}

export function decide(
  state: TokenBudgetState,
  request: LlmRequest,
  warnAt: number[]
): PolicyDecision {
  const requestModel = request.model;
  // Hard blocks — return immediately on the first one we encounter.
  if (
    state.limit !== null &&
    state.used >= state.limit &&
    state.mode === "hard"
  ) {
    return {
      kind: "block",
      reason: "token_budget_exceeded",
      status: 402,
      detail: {
        scope: "daily",
        used: state.used,
        limit: state.limit,
        windowStart: state.windowStart,
      },
    };
  }
  if (
    state.limitHour !== undefined &&
    state.limitHour !== null &&
    (state.usedHour ?? 0) >= state.limitHour &&
    state.mode === "hard"
  ) {
    return {
      kind: "block",
      reason: "token_budget_hourly_exceeded",
      status: 429,
      detail: {
        scope: "hourly",
        used: state.usedHour ?? 0,
        limit: state.limitHour,
        hourStart: state.hourStart,
      },
    };
  }
  const perModelEntry = state.perModel?.[requestModel];
  if (
    perModelEntry &&
    perModelEntry.limit !== null &&
    perModelEntry.used >= perModelEntry.limit &&
    state.mode === "hard"
  ) {
    return {
      kind: "block",
      reason: "token_budget_model_exceeded",
      status: 402,
      detail: {
        scope: "per_model",
        model: requestModel,
        used: perModelEntry.used,
        limit: perModelEntry.limit,
      },
    };
  }

  // Otherwise, allow but maybe attach warnings.
  const warnings: BudgetWarning[] = [];
  const dailyW = checkWarning("daily", state.used, state.limit, warnAt);
  if (dailyW) warnings.push(dailyW);
  const hourlyW = checkWarning(
    "hourly",
    state.usedHour ?? 0,
    state.limitHour ?? null,
    warnAt
  );
  if (hourlyW) warnings.push(hourlyW);
  if (perModelEntry) {
    const pmW = checkWarning(
      "per_model",
      perModelEntry.used,
      perModelEntry.limit,
      warnAt,
      requestModel
    );
    if (pmW) warnings.push(pmW);
  }

  if (warnings.length === 0) return { kind: "allow" };
  // We need to emit detail without changing the request — `mutate` with the
  // unchanged request preserves typing while letting the gateway record the
  // warning in policyDetails. The gateway must NOT mutate the original.
  return {
    kind: "mutate",
    request,
    detail: { warnings },
  };
}
