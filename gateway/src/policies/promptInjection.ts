/**
 * Prompt-injection blocking policy.
 *
 * This policy looks at every USER-role message in the request and matches its
 * concatenated text against a curated list of known prompt-injection /
 * jailbreak patterns. A match is *not* automatically a block — we score the
 * match, log it, and only block when the score crosses a threshold or when
 * the matched payload is marked `Critical`.
 *
 * The payload library is the same one shipped to the DevPulse dashboard so
 * findings stay consistent across the static "scan" view and the inline
 * runtime block. See `gateway/src/policies/promptInjectionPayloads.ts` for
 * the full curated set (100+ entries across OWASP LLM01 categories).
 *
 * IMPORTANT: this is *defense in depth*, not a panacea. Adversarial prompt
 * injection is an open research problem; no static list is exhaustive. Treat
 * matches as a strong signal and pair with an LLM-based classifier in
 * front-line products (Sprint 3).
 */

import type { LlmRequest, RequestPolicy } from "../types.js";
import {
  INJECTION_PAYLOADS,
  type InjectionPayload,
} from "./promptInjectionPayloads.js";

interface InjectionPolicyOptions {
  /** Default `true`. */
  enabled?: boolean;
  /**
   * Minimum severity that triggers a block. `"Critical"` blocks only the most
   * severe matches; `"Low"` blocks even the noisiest. Default: `"High"`.
   */
  blockSeverity?: InjectionPayload["severity"];
  /**
   * Optional callback for fan-out to the audit log. Called for every match,
   * even those that don't trigger a block.
   */
  onMatch?: (match: {
    payload: InjectionPayload;
    excerpt: string;
  }) => void;
}

const SEVERITY_RANK: Record<InjectionPayload["severity"], number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function extractUserText(req: LlmRequest): string {
  const parts: string[] = [];
  for (const m of req.messages) {
    if (m.role !== "user") continue;
    if (typeof m.content === "string") {
      parts.push(m.content);
      continue;
    }
    if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: string }).type === "text" &&
          "text" in part
        ) {
          const t = (part as { text?: unknown }).text;
          if (typeof t === "string") parts.push(t);
        }
      }
    }
  }
  return parts.join("\n");
}

/**
 * Lower-cased substring match. We deliberately don't use regex for the bulk of
 * payloads: most injections rely on imperative phrasing rather than structural
 * patterns, and substring search is faster + harder to ReDoS.
 */
function matchPayloads(text: string): InjectionPayload[] {
  const lower = text.toLowerCase();
  const matches: InjectionPayload[] = [];
  for (const p of INJECTION_PAYLOADS) {
    const needle = p.payload.toLowerCase();
    if (!needle) continue;
    if (lower.includes(needle)) matches.push(p);
  }
  return matches;
}

export function createPromptInjectionPolicy(
  opts: InjectionPolicyOptions = {}
): RequestPolicy {
  const enabled = opts.enabled ?? true;
  const blockThreshold = SEVERITY_RANK[opts.blockSeverity ?? "High"];

  return async ({ request }) => {
    if (!enabled) return { kind: "allow" };
    const text = extractUserText(request);
    if (!text) return { kind: "allow" };
    const matches = matchPayloads(text);
    if (matches.length === 0) return { kind: "allow" };

    if (opts.onMatch) {
      for (const m of matches) {
        const idx = text.toLowerCase().indexOf(m.payload.toLowerCase());
        const excerpt = text.slice(Math.max(0, idx - 32), idx + 96);
        opts.onMatch({ payload: m, excerpt });
      }
    }

    const worst = matches.reduce<InjectionPayload | null>((acc, p) => {
      if (!acc || SEVERITY_RANK[p.severity] > SEVERITY_RANK[acc.severity]) {
        return p;
      }
      return acc;
    }, null);

    if (worst && SEVERITY_RANK[worst.severity] >= blockThreshold) {
      return {
        kind: "block",
        reason: "prompt_injection_detected",
        status: 422,
        detail: {
          payloadId: worst.id,
          payloadName: worst.name,
          category: worst.category,
          severity: worst.severity,
          owaspLlmId: worst.owaspLlmId,
          recommendation: worst.recommendation,
        },
      };
    }

    return { kind: "allow" };
  };
}
