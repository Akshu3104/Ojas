/**
 * Tests for the Anthropic provider adapter.
 */
import { describe, it, expect, vi } from "vitest";
import { createAnthropicProvider } from "../src/providers/anthropic.js";
import type { LlmRequest } from "../src/types.js";

describe("Anthropic provider", () => {
  it("matches claude-* models only", () => {
    const provider = createAnthropicProvider({
      apiKey: "sk-ant-fake",
      baseUrl: "http://upstream.invalid",
    });
    expect(provider.matches("claude-3-5-sonnet-20241022")).toBe(true);
    expect(provider.matches("claude-3-haiku")).toBe(true);
    expect(provider.matches("gpt-4o")).toBe(false);
    expect(provider.matches("gemini-1.5-pro")).toBe(false);
  });

  it("translates system + user messages into Anthropic shape and surfaces tool_use blocks", async () => {
    const captured: { url?: string; body?: unknown } = {};
    const fake = vi
      .fn(async (url: string | URL, init?: RequestInit) => {
        captured.url = String(url);
        captured.body = init?.body
          ? JSON.parse(String(init.body))
          : undefined;
        return new Response(
          JSON.stringify({
            id: "msg_01",
            model: "claude-3-5-sonnet-20241022",
            stop_reason: "tool_use",
            content: [
              { type: "text", text: "I will call a tool." },
              {
                type: "tool_use",
                id: "tu_1",
                name: "search",
                input: { q: "hello" },
              },
            ],
            usage: { input_tokens: 12, output_tokens: 5 },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      });
    const provider = createAnthropicProvider({
      apiKey: "sk-ant-fake",
      baseUrl: "http://upstream.invalid",
      fetchImpl: fake as unknown as typeof fetch,
    });
    const req: LlmRequest = {
      model: "claude-3-5-sonnet-20241022",
      messages: [
        { role: "system", content: "you are concise" },
        { role: "user", content: "find me something" },
      ],
      max_tokens: 256,
      extra: {
        tools: [
          {
            name: "search",
            description: "search the web",
            input_schema: { type: "object" },
          },
        ],
      },
    };
    const resp = await provider.invoke(req);
    expect(resp.id).toBe("msg_01");
    expect(resp.outputText).toBe("I will call a tool.");
    expect(resp.usage?.total_tokens).toBe(17);
    expect(captured.url).toContain("/v1/messages");
    const body = captured.body as Record<string, unknown>;
    expect(body.system).toBe("you are concise");
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.tools).toBeDefined();
  });

  it("enables prompt caching when configured (header + cache_control on system)", async () => {
    const captured: { headers?: Record<string, string>; body?: unknown } = {};
    const fake = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      captured.headers = init?.headers as Record<string, string>;
      captured.body = init?.body ? JSON.parse(String(init.body)) : undefined;
      return new Response(
        JSON.stringify({
          id: "msg_cache",
          model: "claude-3-5-sonnet-20241022",
          content: [{ type: "text", text: "ok" }],
          usage: {
            input_tokens: 4,
            output_tokens: 2,
            cache_creation_input_tokens: 100,
            cache_read_input_tokens: 50,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createAnthropicProvider({
      apiKey: "sk-ant-fake",
      baseUrl: "http://upstream.invalid",
      fetchImpl: fake as unknown as typeof fetch,
      enablePromptCaching: true,
    });
    const resp = await provider.invoke({
      model: "claude-3-5-sonnet-20241022",
      messages: [
        { role: "system", content: "you are a long, expensive system prompt" },
        { role: "user", content: "hello" },
      ],
    });
    expect(captured.headers?.["anthropic-beta"]).toBe(
      "prompt-caching-2024-07-31"
    );
    const body = captured.body as Record<string, unknown>;
    expect(Array.isArray(body.system)).toBe(true);
    const sysBlocks = body.system as Array<Record<string, unknown>>;
    expect(sysBlocks[0]?.cache_control).toEqual({ type: "ephemeral" });
    expect(resp.usage?.prompt_tokens).toBe(154);
    expect(resp.usage?.total_tokens).toBe(156);
  });

  it("does not send caching beta header when not enabled", async () => {
    const captured: { headers?: Record<string, string>; body?: unknown } = {};
    const fake = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      captured.headers = init?.headers as Record<string, string>;
      captured.body = init?.body ? JSON.parse(String(init.body)) : undefined;
      return new Response(
        JSON.stringify({
          id: "msg_nc",
          model: "claude-3-haiku",
          content: [{ type: "text", text: "ok" }],
          usage: { input_tokens: 5, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createAnthropicProvider({
      apiKey: "sk-ant-fake",
      baseUrl: "http://upstream.invalid",
      fetchImpl: fake as unknown as typeof fetch,
    });
    await provider.invoke({
      model: "claude-3-haiku",
      messages: [
        { role: "system", content: "be brief" },
        { role: "user", content: "hi" },
      ],
    });
    expect(captured.headers?.["anthropic-beta"]).toBeUndefined();
    const body = captured.body as Record<string, unknown>;
    expect(typeof body.system).toBe("string");
  });

  it("turns OpenAI-style tool messages into tool_result blocks", async () => {
    const captured: { body?: unknown } = {};
    const fake = vi
      .fn(async (_url: string | URL, init?: RequestInit) => {
        captured.body = init?.body ? JSON.parse(String(init.body)) : undefined;
        return new Response(
          JSON.stringify({
            id: "msg_02",
            model: "claude-3-haiku",
            content: [{ type: "text", text: "ok" }],
            usage: { input_tokens: 5, output_tokens: 1 },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      });
    const provider = createAnthropicProvider({
      apiKey: "sk-ant-fake",
      baseUrl: "http://upstream.invalid",
      fetchImpl: fake as unknown as typeof fetch,
    });
    await provider.invoke({
      model: "claude-3-haiku",
      messages: [
        { role: "user", content: "hi" },
        { role: "tool", content: "found 3 things", tool_call_id: "tu_1" },
      ],
    });
    const body = captured.body as { messages: Array<{ role: string; content: unknown }> };
    const toolResultMsg = body.messages[1];
    expect(toolResultMsg?.role).toBe("user");
    const blocks = toolResultMsg?.content as Array<Record<string, unknown>>;
    expect(blocks?.[0]?.type).toBe("tool_result");
    expect(blocks?.[0]?.tool_use_id).toBe("tu_1");
  });
});
