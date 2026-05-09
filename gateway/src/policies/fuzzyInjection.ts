/**
 * Fuzzy prompt-injection detector — character n-gram + Jaccard similarity.
 *
 * The existing `promptInjection` policy does exact substring matching against
 * a curated payload library. That is robust for verbatim attacks but brittle
 * against trivial obfuscation:
 *
 *   "ignore previous instructions"         → exact match, blocked
 *   "ig n0re previous   instructions"      → no exact substring, would slip
 *   "iGnore  previous\u200binstructions"   → no exact substring, would slip
 *
 * This module computes a normalized character-trigram set for the input and
 * for each known-bad payload, then uses Jaccard similarity (|A ∩ B| / |A ∪ B|)
 * to flag inputs that *resemble* a payload above a threshold.
 *
 * Properties:
 *   - Pure JavaScript, no model dependency, runs in microseconds per request.
 *   - Catches whitespace, punctuation, and case obfuscation by construction.
 *   - Catches single-character substitutions (typos, leetspeak) above threshold.
 *   - False-positive rate is bounded because we require similarity ≥ threshold
 *     against an *entire* known-bad payload, not a fragment.
 *
 * This is *defense in depth* on top of the substring-match policy. If you have
 * an embedding-API key, prefer an embedding-based classifier; this is the
 * zero-key fallback.
 */

import type { LlmRequest, RequestPolicy } from "../types.js";
import {
  INJECTION_PAYLOADS,
  type InjectionPayload,
} from "./promptInjectionPayloads.js";

const NGRAM = 3;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function trigrams(text: string, n = NGRAM): Set<string> {
  const normalized = normalize(text);
  const out = new Set<string>();
  if (normalized.length < n) return out;
  for (let i = 0; i <= normalized.length - n; i++) {
    out.add(normalized.slice(i, i + n));
  }
  return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const PAYLOAD_TRIGRAMS: Array<{ payload: InjectionPayload; grams: Set<string> }> =
  INJECTION_PAYLOADS.filter(p => p.payload.length >= NGRAM).map(p => ({
    payload: p,
    grams: trigrams(p.payload),
  }));

export interface FuzzyInjectionMatch {
  payload: InjectionPayload;
  similarity: number;
}

export function findFuzzyMatches(
  text: string,
  threshold: number
): FuzzyInjectionMatch[] {
  const inputGrams = trigrams(text);
  if (inputGrams.size === 0) return [];
  const matches: FuzzyInjectionMatch[] = [];
  for (const { payload, grams } of PAYLOAD_TRIGRAMS) {
    const sim = jaccard(inputGrams, grams);
    if (sim >= threshold) matches.push({ payload, similarity: sim });
  }
  matches.sort((a, b) => b.similarity - a.similarity);
  return matches;
}

export interface FuzzyInjectionPolicyOptions {
  enabled?: boolean;
  /** Minimum Jaccard similarity to count as a match. Default: 0.6. */
  threshold?: number;
  /** Block when similarity ≥ blockThreshold. Default: 0.75. */
  blockThreshold?: number;
  onMatch?: (match: FuzzyInjectionMatch) => void;
}

function extractUserText(req: LlmRequest): string {
  const parts: string[] = [];
  for (const m of req.messages) {
    if (m.role !== "user") continue;
    if (typeof m.content === "string") parts.push(m.content);
    else if (Array.isArray(m.content)) {
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

export function createFuzzyInjectionPolicy(
  opts: FuzzyInjectionPolicyOptions = {}
): RequestPolicy {
  const enabled = opts.enabled ?? true;
  const matchThreshold = opts.threshold ?? 0.6;
  const blockThreshold = opts.blockThreshold ?? 0.75;

  return async ({ request }) => {
    if (!enabled) return { kind: "allow" };
    const text = extractUserText(request);
    if (!text) return { kind: "allow" };
    const matches = findFuzzyMatches(text, matchThreshold);
    if (matches.length === 0) return { kind: "allow" };

    if (opts.onMatch) {
      for (const m of matches) opts.onMatch(m);
    }

    const worst = matches[0];
    if (worst && worst.similarity >= blockThreshold) {
      return {
        kind: "block",
        reason: "prompt_injection_fuzzy_match",
        status: 422,
        detail: {
          payloadId: worst.payload.id,
          payloadName: worst.payload.name,
          category: worst.payload.category,
          severity: worst.payload.severity,
          similarity: Number(worst.similarity.toFixed(3)),
        },
      };
    }
    return { kind: "allow" };
  };
}
