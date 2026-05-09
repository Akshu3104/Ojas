/**
 * Kill-switch policy: blocks requests when the user's budget cap has been
 * tripped on the DevPulse server.
 *
 * The check is intentionally a fast remote call with a short cache so a
 * crashed DevPulse server fails *open* (we'd rather serve traffic than ship
 * 5xx). For stricter setups, switch `failPolicy` to `"closed"`.
 *
 * In Sprint 2 the API contract with the DevPulse server is:
 *
 *   GET {DEVPULSE_GATEWAY_DEVPULSE_URL}/api/internal/kill-switch/{tenantId}
 *   Authorization: Bearer {DEVPULSE_GATEWAY_DEVPULSE_TOKEN}
 *
 *   200 -> { isActive: boolean, currentSpendUSD: number, budgetLimitUSD: number }
 *   404 -> tenant has never set a kill-switch (treat as inactive)
 */

import type { RequestPolicy } from "../types.js";

interface KillSwitchState {
  isActive: boolean;
  fetchedAt: number;
}

interface KillSwitchOptions {
  devpulseUrl?: string;
  serviceToken?: string;
  cacheTtlMs?: number;
  failPolicy?: "open" | "closed";
  /**
   * Optional injection point for tests — replace with a stub to avoid network
   * calls.
   */
  fetchImpl?: typeof fetch;
}

const DEFAULT_TTL_MS = 5_000;

export function createKillSwitchPolicy(opts: KillSwitchOptions = {}): RequestPolicy {
  const cache = new Map<string, KillSwitchState>();
  const ttl = opts.cacheTtlMs ?? DEFAULT_TTL_MS;
  const failPolicy = opts.failPolicy ?? "open";
  const fetchFn = opts.fetchImpl ?? fetch;

  async function readState(tenantId: string): Promise<KillSwitchState> {
    const now = Date.now();
    const cached = cache.get(tenantId);
    if (cached && now - cached.fetchedAt < ttl) return cached;

    if (!opts.devpulseUrl || !opts.serviceToken) {
      // No backend wired — treat as inactive in dev.
      const state: KillSwitchState = { isActive: false, fetchedAt: now };
      cache.set(tenantId, state);
      return state;
    }

    try {
      const resp = await fetchFn(
        `${opts.devpulseUrl.replace(/\/$/, "")}/api/internal/kill-switch/${encodeURIComponent(tenantId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${opts.serviceToken}`,
            Accept: "application/json",
          },
        }
      );
      if (resp.status === 404) {
        const state: KillSwitchState = { isActive: false, fetchedAt: now };
        cache.set(tenantId, state);
        return state;
      }
      if (!resp.ok) {
        if (failPolicy === "closed") {
          return { isActive: true, fetchedAt: now };
        }
        return { isActive: false, fetchedAt: now };
      }
      const body = (await resp.json()) as { isActive?: boolean };
      const state: KillSwitchState = {
        isActive: Boolean(body.isActive),
        fetchedAt: now,
      };
      cache.set(tenantId, state);
      return state;
    } catch {
      // Network/parse failure — fall back to fail policy.
      return {
        isActive: failPolicy === "closed",
        fetchedAt: now,
      };
    }
  }

  return async ({ ctx }) => {
    const state = await readState(ctx.tenantId);
    if (state.isActive) {
      return {
        kind: "block",
        reason: "kill_switch_active",
        status: 402, // Payment Required — semantically right for budget cap
        detail: {
          message:
            "Your DevPulse kill-switch is engaged. Reset it in the dashboard to resume LLM traffic.",
        },
      };
    }
    return { kind: "allow" };
  };
}
