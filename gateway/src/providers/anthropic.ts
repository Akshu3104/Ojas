/**
 * Anthropic provider adapter.
 *
 * Translates the gateway's normalized OpenAI-style request into Anthropic's
 * `/v1/messages` format. Supports:
 *   - system prompts (concatenated, sent as top-level `system`)
 *   - tool_use / tool_result content blocks
 *   - non-streaming responses (returned shape is the raw Anthropic JSON)
 *   - streaming via `invokeStream`
 */

import type {
  LlmMessage,
  LlmRequest,
  LlmResponse,
  Provider,
} from "../types.js";

interface AnthropicProviderConfig {
  apiKey: string;
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const ANTHROPIC_MODEL_PREFIXES = ["claude-"];

interface AnthropicContentBlock {
  type: string;
  text?: string;
  tool_use_id?: string;
  name?: string;
  input?: unknown;
  content?: unknown;
}

interface AnthropicMessageResp {
  id: string;
  model: string;
  content: AnthropicContentBlock[];
  stop_reason?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: AnthropicContentBlock[] | string;
}

function normalizeMessages(messages: LlmMessage[]): {
  system: string;
  messages: AnthropicMessage[];
} {
  const systemParts: string[] = [];
  const out: AnthropicMessage[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      if (typeof m.content === "string") systemParts.push(m.content);
      else if (Array.isArray(m.content)) {
        for (const part of m.content) {
          if (
            part &&
            typeof part === "object" &&
            "text" in (part as Record<string, unknown>)
          ) {
            const text = (part as { text?: unknown }).text;
            if (typeof text === "string") systemParts.push(text);
          }
        }
      }
      continue;
    }
    if (m.role === "tool") {
      // OpenAI-style tool message → Anthropic tool_result block on a user msg.
      const block: AnthropicContentBlock = {
        type: "tool_result",
        ...(m.tool_call_id ? { tool_use_id: m.tool_call_id } : {}),
        content:
          typeof m.content === "string"
            ? m.content
            : (m.content as unknown[]),
      };
      out.push({ role: "user", content: [block] });
      continue;
    }
    if (m.role === "user" || m.role === "assistant") {
      if (typeof m.content === "string") {
        out.push({ role: m.role, content: m.content });
      } else if (Array.isArray(m.content)) {
        const blocks: AnthropicContentBlock[] = m.content.map(part => {
          const obj = part as Record<string, unknown>;
          // Pass through if already in Anthropic shape.
          if (obj && typeof obj === "object" && typeof obj.type === "string") {
            return obj as unknown as AnthropicContentBlock;
          }
          return { type: "text", text: String(part) };
        });
        out.push({ role: m.role, content: blocks });
      } else {
        out.push({ role: m.role, content: String(m.content) });
      }
    }
  }
  return { system: systemParts.join("\n\n"), messages: out };
}

export function createAnthropicProvider(
  cfg: AnthropicProviderConfig
): Provider {
  const fetchFn = cfg.fetchImpl ?? fetch;
  const timeoutMs = cfg.timeoutMs ?? 60_000;

  function buildBody(request: LlmRequest, stream: boolean): unknown {
    const { system, messages } = normalizeMessages(request.messages);
    const tools = (request.extra as { tools?: unknown } | undefined)?.tools;
    return {
      model: request.model,
      max_tokens: request.max_tokens ?? 1024,
      ...(request.temperature !== undefined
        ? { temperature: request.temperature }
        : {}),
      ...(system.length > 0 ? { system } : {}),
      messages,
      ...(tools ? { tools } : {}),
      ...(stream ? { stream: true } : {}),
    };
  }

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
        const resp = await fetchFn(`${cfg.baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": cfg.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(buildBody(request, false)),
          signal: controller.signal,
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `Anthropic upstream returned ${resp.status}: ${text.slice(0, 500)}`
          );
        }
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
    async invokeStream(request: LlmRequest): Promise<Response> {
      const resp = await fetchFn(`${cfg.baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cfg.apiKey,
          "anthropic-version": "2023-06-01",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(buildBody(request, true)),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `Anthropic streaming upstream returned ${resp.status}: ${text.slice(0, 500)}`
        );
      }
      return resp;
    },
  };
}
