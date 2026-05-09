/**
 * Anthropic provider adapter (stub).
 *
 * Sprint 2 ships the OpenAI provider as the reference implementation; the
 * Anthropic adapter follows the same `Provider` contract and is wired in but
 * not tested against live traffic. Once Sprint 3 lands, swap the body
 * builder below for the real `/v1/messages` shape.
 */

import type { LlmRequest, LlmResponse, Provider } from "../types.js";

interface AnthropicProviderConfig {
  apiKey: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const ANTHROPIC_MODEL_PREFIXES = ["claude-"];

export function createAnthropicProvider(
  cfg: AnthropicProviderConfig
): Provider {
  const fetchFn = cfg.fetchImpl ?? fetch;
  const timeoutMs = cfg.timeoutMs ?? 60_000;

  return {
    id: "anthropic",
    matches(model: string) {
      return ANTHROPIC_MODEL_PREFIXES.some(p =>
        model.toLowerCase().startsWith(p)
      );
    },
    async invoke(request: LlmRequest): Promise<LlmResponse> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // Anthropic Messages API format: system messages are top-level, user/
        // assistant alternation is in `messages`. We split here but do not yet
        // support tool_use / tool_result content blocks — that lands in
        // Sprint 3.
        const systemParts: string[] = [];
        const messages: Array<{ role: "user" | "assistant"; content: unknown }> =
          [];
        for (const m of request.messages) {
          if (m.role === "system") {
            if (typeof m.content === "string") systemParts.push(m.content);
          } else if (m.role === "user" || m.role === "assistant") {
            messages.push({ role: m.role, content: m.content });
          }
          // tool messages are dropped here in MVP — see Sprint 3 roadmap.
        }
        const body = {
          model: request.model,
          max_tokens: request.max_tokens ?? 1024,
          ...(request.temperature !== undefined
            ? { temperature: request.temperature }
            : {}),
          ...(systemParts.length > 0 ? { system: systemParts.join("\n\n") } : {}),
          messages,
        };
        const resp = await fetchFn(`${cfg.baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": cfg.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `Anthropic upstream returned ${resp.status}: ${text.slice(0, 500)}`
          );
        }
        type AnthropicMessageResp = {
          id: string;
          model: string;
          content: Array<{ type: string; text?: string }>;
          usage?: { input_tokens?: number; output_tokens?: number };
        };
        const json = (await resp.json()) as AnthropicMessageResp;
        const outputText = (json.content ?? [])
          .filter(b => b.type === "text" && typeof b.text === "string")
          .map(b => b.text!)
          .join("");
        return {
          id: json.id,
          model: json.model,
          outputText,
          raw: json,
          ...(json.usage
            ? {
                usage: {
                  prompt_tokens: json.usage.input_tokens ?? 0,
                  completion_tokens: json.usage.output_tokens ?? 0,
                  total_tokens:
                    (json.usage.input_tokens ?? 0) +
                    (json.usage.output_tokens ?? 0),
                },
              }
            : {}),
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
