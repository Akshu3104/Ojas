/**
 * Shared types for the inline LLM gateway.
 *
 * The gateway is provider-agnostic at the type level: a request enters as a
 * normalized `LlmRequest`, runs through the policy chain, gets dispatched to a
 * `Provider`, and exits as a normalized `LlmResponse`.
 */

export interface LlmMessage {
  role: "system" | "user" | "assistant" | "tool";
  /**
   * Either a plain string or an array of OpenAI-style content parts.
   * We deliberately keep this loose so we don't have to model every provider's
   * content schema in the gateway.
   */
  content: string | unknown[];
  name?: string;
  tool_call_id?: string;
}

export interface LlmRequest {
  model: string;
  messages: LlmMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  /** Free-form passthrough for provider-specific fields. */
  extra?: Record<string, unknown>;
}

export interface LlmTokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LlmResponse {
  id: string;
  model: string;
  /** Concatenated assistant message text — convenience for redaction. */
  outputText: string;
  /** Original provider response shape, for streaming back to the caller. */
  raw: unknown;
  usage?: LlmTokenUsage;
}

export interface RequestContext {
  tenantId: string;
  /** Per-request id (correlation across logs + policies). */
  requestId: string;
  /** Source IP (best-effort, may be `undefined` behind proxies w/o XFF). */
  ip?: string;
  /** Wall-clock start, set by the entry middleware. */
  startedAt: number;
}

export type PolicyDecision =
  | { kind: "allow" }
  | {
      kind: "block";
      reason: string;
      detail?: Record<string, unknown>;
      /** HTTP status to return to caller. Defaults to 403. */
      status?: number;
    }
  | {
      kind: "mutate";
      /** A patched copy of the request. The original must NOT be mutated. */
      request: LlmRequest;
      /** Optional notes captured for the audit log. */
      detail?: Record<string, unknown>;
    };

export interface PolicyInput {
  ctx: RequestContext;
  request: LlmRequest;
}

export type RequestPolicy = (input: PolicyInput) => Promise<PolicyDecision>;

export interface ResponsePolicyInput {
  ctx: RequestContext;
  request: LlmRequest;
  response: LlmResponse;
}

export type ResponsePolicy = (
  input: ResponsePolicyInput
) => Promise<PolicyDecision>;

export interface Provider {
  /** e.g. `"openai"`, `"anthropic"`, `"bedrock"`. */
  readonly id: string;
  /** Whether this provider can serve the given model id. */
  matches(model: string): boolean;
  /** Forward a request and return a normalized response. */
  invoke(request: LlmRequest): Promise<LlmResponse>;
}

export interface AuditRecord {
  requestId: string;
  tenantId: string;
  startedAt: number;
  endedAt: number;
  model: string;
  provider?: string;
  decision: "allowed" | "blocked" | "errored";
  blockReason?: string;
  usage?: LlmTokenUsage;
  /** Fingerprint of the request — never the raw prompt. */
  promptFingerprint: string;
}
