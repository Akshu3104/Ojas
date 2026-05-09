/**
 * @devpulse/sdk — Node SDK for the DevPulse Inline LLM Gateway.
 *
 * The simplest integration:
 *
 * ```ts
 * import OpenAI from "openai";
 * import { withDevPulse } from "@devpulse/sdk";
 *
 * const openai = withDevPulse(new OpenAI(), {
 *   gatewayUrl: "https://gateway.devpulse.example",
 *   apiKey: process.env.DEVPULSE_API_KEY!,
 * });
 *
 * const completion = await openai.chat.completions.create({
 *   model: "gpt-4o-mini",
 *   messages: [{ role: "user", content: "hello" }],
 * });
 * ```
 *
 * Under the hood we re-point the OpenAI client's `baseURL` at the DevPulse
 * gateway and inject `Authorization: Bearer <DEVPULSE_API_KEY>` instead of
 * the upstream OpenAI key (the gateway holds the upstream key server-side).
 *
 * This file is intentionally tiny — the SDK is a thin client. Anything that
 * could break privacy guarantees (PII redaction, prompt-injection blocking)
 * lives in the gateway, not here. The SDK never edits the prompt.
 */

interface OpenAILikeClient {
  baseURL?: string;
  apiKey?: string;
  defaultHeaders?: Record<string, string>;
}

export interface DevPulseConfig {
  /** Base URL of the DevPulse gateway, e.g. `https://gateway.example.com`. */
  gatewayUrl: string;
  /**
   * DevPulse-issued API key. Surface in the dashboard. NEVER commit; use a
   * secret manager.
   */
  apiKey: string;
  /**
   * Optional metadata captured in the gateway's audit log alongside this call.
   * Keys are arbitrary strings; values must be primitives.
   */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Wrap an OpenAI client (or anything with a `baseURL` / `apiKey` property) so
 * its requests flow through the DevPulse gateway.
 *
 * We attempt to mutate the existing client in place (returning the same
 * reference) so existing application code continues to work without
 * refactoring.
 */
export function withDevPulse<T extends OpenAILikeClient>(
  client: T,
  cfg: DevPulseConfig
): T {
  if (!cfg.gatewayUrl) {
    throw new Error("withDevPulse: missing gatewayUrl");
  }
  if (!cfg.apiKey) {
    throw new Error("withDevPulse: missing apiKey");
  }
  const base = cfg.gatewayUrl.replace(/\/$/, "");
  client.baseURL = `${base}/v1`;
  // Replace the OpenAI key with the DevPulse one. The gateway substitutes
  // the upstream key on the way out.
  client.apiKey = cfg.apiKey;
  client.defaultHeaders = {
    ...(client.defaultHeaders ?? {}),
    Authorization: `Bearer ${cfg.apiKey}`,
    ...(cfg.metadata
      ? { "x-devpulse-metadata": encodeMetadata(cfg.metadata) }
      : {}),
  };
  return client;
}

function encodeMetadata(
  metadata: Record<string, string | number | boolean>
): string {
  // Header-safe URL-encoded JSON. We deliberately do NOT log `metadata`
  // anywhere on the client — it travels to the gateway where the audit
  // pipeline persists it.
  return encodeURIComponent(JSON.stringify(metadata));
}

/**
 * Lightweight raw fetch helper for callers who don't use the OpenAI SDK and
 * just want to call the gateway directly.
 */
export async function chatCompletions(
  cfg: DevPulseConfig,
  body: {
    model: string;
    messages: Array<{ role: string; content: string | unknown[] }>;
    temperature?: number;
    max_tokens?: number;
  }
): Promise<unknown> {
  const base = cfg.gatewayUrl.replace(/\/$/, "");
  const resp = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(cfg.metadata
        ? { "x-devpulse-metadata": encodeMetadata(cfg.metadata) }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new GatewayError(
      `DevPulse gateway returned ${resp.status}: ${text.slice(0, 500)}`,
      resp.status
    );
  }
  return resp.json();
}

export class GatewayError extends Error {
  override readonly name = "GatewayError";
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}
