/**
 * PII redaction policy.
 *
 * Walks every user-role message and replaces matched PII with a typed
 * placeholder (`<EMAIL_REDACTED>`, `<CREDIT_CARD_REDACTED>`, …). Returns a
 * `mutate` decision so the rest of the policy chain (and the upstream
 * provider) sees a redacted prompt.
 *
 * IMPORTANT: regex-based redaction is intentionally a baseline. Production
 * deployments should layer a Microsoft Presidio / spaCy NER recognizer on
 * top — the `extraRecognizers` hook below is the integration point.
 */

import type { LlmRequest, LlmMessage, RequestPolicy } from "../types.js";

interface RedactionRule {
  /** Stable id used in the audit log. */
  id: string;
  /** Single regex per rule for clarity & easier auditing. */
  pattern: RegExp;
  /** Placeholder inserted in the redacted text. */
  placeholder: string;
}

/**
 * Default ruleset. Conservative — false positives are harmful here because
 * they alter prompt semantics. We only redact patterns whose syntax is
 * unambiguous.
 */
const DEFAULT_RULES: RedactionRule[] = [
  {
    id: "email",
    // RFC-5322 simplified. Good enough; we don't need the full grammar.
    pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    placeholder: "<EMAIL_REDACTED>",
  },
  {
    id: "credit-card",
    // 13–19 digit numbers with optional separators. Luhn check happens after
    // a regex match — see redactWithLuhn below.
    pattern: /\b(?:\d[ -]?){13,19}\b/g,
    placeholder: "<CREDIT_CARD_REDACTED>",
  },
  {
    id: "ssn-us",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    placeholder: "<SSN_REDACTED>",
  },
  {
    id: "aadhaar-in",
    // Indian Aadhaar — 12 digits, optionally space-separated 4-4-4.
    pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    placeholder: "<AADHAAR_REDACTED>",
  },
  {
    id: "pan-in",
    // Indian PAN — 5 letters, 4 digits, 1 letter.
    pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
    placeholder: "<PAN_REDACTED>",
  },
  {
    id: "phone-e164",
    pattern: /\b\+?\d[\d\s().-]{7,16}\b/g,
    placeholder: "<PHONE_REDACTED>",
  },
  {
    id: "ipv4",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    placeholder: "<IP_REDACTED>",
  },
  {
    id: "aws-access-key",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    placeholder: "<AWS_KEY_REDACTED>",
  },
  {
    id: "stripe-secret",
    pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
    placeholder: "<STRIPE_SECRET_REDACTED>",
  },
  {
    id: "openai-key",
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
    placeholder: "<OPENAI_KEY_REDACTED>",
  },
  {
    id: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,
    placeholder: "<GITHUB_TOKEN_REDACTED>",
  },
  {
    id: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    placeholder: "<JWT_REDACTED>",
  },
];

interface RedactionOptions {
  /** Default `true`. When false, this policy short-circuits to `allow`. */
  enabled?: boolean;
  /** Extra rules to run after the defaults. */
  extraRules?: RedactionRule[];
  /** Notification hook for the audit log. */
  onRedaction?: (event: { ruleId: string; count: number }) => void;
  /** Skip the Luhn verification on credit-card matches (for tests). */
  skipLuhn?: boolean;
}

function luhnValid(digits: string): boolean {
  const cleaned = digits.replace(/[\s-]/g, "");
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    const ch = cleaned[i];
    if (ch === undefined) return false;
    let n = Number.parseInt(ch, 10);
    if (Number.isNaN(n)) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function redactString(
  input: string,
  rules: RedactionRule[],
  opts: RedactionOptions,
  counts: Map<string, number>
): string {
  let text = input;
  for (const rule of rules) {
    text = text.replace(rule.pattern, match => {
      // For credit-cards, run a Luhn check to suppress false positives.
      if (rule.id === "credit-card" && !opts.skipLuhn) {
        if (!luhnValid(match)) return match;
      }
      counts.set(rule.id, (counts.get(rule.id) ?? 0) + 1);
      return rule.placeholder;
    });
  }
  return text;
}

function redactMessage(
  m: LlmMessage,
  rules: RedactionRule[],
  opts: RedactionOptions,
  counts: Map<string, number>
): LlmMessage {
  if (typeof m.content === "string") {
    return { ...m, content: redactString(m.content, rules, opts, counts) };
  }
  if (Array.isArray(m.content)) {
    const next = m.content.map(part => {
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        (part as { type?: string }).type === "text" &&
        "text" in part
      ) {
        const t = (part as { text?: unknown }).text;
        if (typeof t === "string") {
          return {
            ...(part as Record<string, unknown>),
            text: redactString(t, rules, opts, counts),
          };
        }
      }
      return part;
    });
    return { ...m, content: next };
  }
  return m;
}

export function createPiiRedactionPolicy(
  opts: RedactionOptions = {}
): RequestPolicy {
  const enabled = opts.enabled ?? true;
  const rules = [...DEFAULT_RULES, ...(opts.extraRules ?? [])];

  return async ({ request }) => {
    if (!enabled) return { kind: "allow" };
    const counts = new Map<string, number>();
    const messages: LlmMessage[] = request.messages.map(m =>
      m.role === "system" || m.role === "tool"
        ? m // never alter system or tool messages
        : redactMessage(m, rules, opts, counts)
    );

    if (counts.size === 0) return { kind: "allow" };

    if (opts.onRedaction) {
      for (const [ruleId, count] of counts.entries()) {
        opts.onRedaction({ ruleId, count });
      }
    }

    const next: LlmRequest = { ...request, messages };
    return {
      kind: "mutate",
      request: next,
      detail: { redactions: Object.fromEntries(counts) },
    };
  };
}

export const PII_RULES = DEFAULT_RULES;
