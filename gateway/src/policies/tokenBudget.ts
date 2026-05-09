/**
 * Token-budget / per-tenant quota policy.
 *
 * The DevPulse server is the source of truth for each tenant's daily token
 * quota. The gateway caches the quota state for `cacheMs` ms (default 30s)
 * to avoid round-tripping on every request, and degrades fail-open if the
 * server is unreachable (the gateway should never become a SPOF for the
 * customer's LLM traffic — DevPulse can always retroactively flag overages).
 *
 * Two enforcement modes:
 *   - "soft": annotate the request and let it through (default for free tier).
 *   - "hard": block with HTTP 402 (Payment Required) once the quota is hit.
 *
 * The policy never *consumes* tokens — that happens server-side when the
 * gateway emits the post-call audit record. We only *check* the running total.
 */
import type { PolicyDecision, RequestPolicy } from "../types.js";

export interface TokenBudgetState {
  /** ISO yyyy-mm-dd window the count belongs to. */
  windowStart: string;
  /** Tokens consumed in the current window. */
  used: number;
  /** Hard cap; null = unlimited. */
  limit: number | null;
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
}

interface CachedState {
  state: TokenBudgetState;
  fetchedAt: number;
}

export function createTokenBudgetPolicy(
  cfg: TokenBudgetPolicyConfig = {}
): RequestPolicy {
  const fetchFn = cfg.fetchImpl ?? fetch;
  const cacheMs = cfg.cacheMs ?? 30_000;
  const failOpen = cfg.failOpen !== false;
  const now = cfg.now ?? (() => Date.now());
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
      return decide(cached.state);
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
      // Cache the absence briefly so we don't hammer the server if it's down.
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
    return decide(state);
  };
}

function decide(state: TokenBudgetState): PolicyDecision {
  if (state.limit === null) return { kind: "allow" };
  if (state.used < state.limit) return { kind: "allow" };
  if (state.mode === "soft") return { kind: "allow" };
  return {
    kind: "block",
    reason: "token_budget_exceeded",
    status: 402,
    detail: {
      used: state.used,
      limit: state.limit,
      windowStart: state.windowStart,
    },
  };
}
