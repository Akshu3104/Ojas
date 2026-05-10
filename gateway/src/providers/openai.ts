/**
 * OpenAI provider adapter.
 *
 * Forwards a normalized `LlmRequest` to OpenAI's `/v1/chat/completions`
 * endpoint. Handles non-streaming responses; streaming is implemented at the
 * Express layer (it bypasses the response policy chain — see `index.ts` for
 * the rationale).
 */

import type { LlmRequest, LlmResponse, Provider } from "../types.js";

interface OpenAIProviderConfig {
  apiKey: string;
  baseUrl: string;
  /** Optional fetch override for tests. */
  fetchImpl?: typeof fetch;
  /** Default 60s. Long enough for reasoning models. */
  timeoutMs?: number;
}

const OPENAI_MODEL_PREFIXES = [
  "gpt-",
  "o1",
  "o3",
  "o4",
  "chatgpt-",
  "text-embedding-",
];

interface OpenAIChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message?: { role?: string; content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    /**
     * Present on o1/o3/o4 reasoning-model responses. Wall-clock invisible
     * tokens charged at the completion rate.
     */
    completion_tokens_details?: {
      reasoning_tokens?: number;
      accepted_prediction_tokens?: number;
      rejected_prediction_tokens?: number;
    };
  };
}

export function createOpenAIProvider(cfg: OpenAIProviderConfig): Provider {
  const fetchFn = cfg.fetchImpl ?? fetch;
  const timeoutMs = cfg.timeoutMs ?? 60_000;

  return {
    id: "openai",
    matches(model: string) {
      const m = model.toLowerCase();
      return OPENAI_MODEL_PREFIXES.some(p => m.startsWith(p));
    },
    async invoke(request: LlmRequest): Promise<LlmResponse> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // OpenAI's request shape is a near-superset of our normalized form.
        const body = {
          model: request.model,
          messages: request.messages,
          ...(request.temperature !== undefined
            ? { temperature: request.temperature }
            : {}),
          ...(request.max_tokens !== undefined
            ? { max_tokens: request.max_tokens }
            : {}),
          ...(request.extra ?? {}),
        };
        const resp = await fetchFn(`${cfg.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `OpenAI upstream returned ${resp.status}: ${text.slice(0, 500)}`
          );
        }
        const json = (await resp.json()) as OpenAIChatResponse;
        const message = json.choices[0]?.message;
        const outputText =
          typeof message?.content === "string" ? message.content : "";
        return {
          id: json.id,
          model: json.model,
          outputText,
          raw: json,
          ...(json.usage
            ? {
                usage: {
                  prompt_tokens: json.usage.prompt_tokens ?? 0,
                  completion_tokens: json.usage.completion_tokens ?? 0,
                  total_tokens: json.usage.total_tokens ?? 0,
                  ...(json.usage.completion_tokens_details?.reasoning_tokens !==
                  undefined
                    ? {
                        reasoning_tokens:
                          json.usage.completion_tokens_details.reasoning_tokens,
                      }
                    : {}),
                },
              }
            : {}),
        };
      } finally {
        clearTimeout(timer);
      }
    },
    async invokeStream(request: LlmRequest): Promise<Response> {
      const body = {
        model: request.model,
        messages: request.messages,
        stream: true,
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
        ...(request.max_tokens !== undefined
          ? { max_tokens: request.max_tokens }
          : {}),
        ...(request.extra ?? {}),
      };
      const resp = await fetchFn(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `OpenAI streaming upstream returned ${resp.status}: ${text.slice(0, 500)}`
        );
      }
      return resp;
    },
  };
}
