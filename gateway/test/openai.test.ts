/**
 * Tests for the OpenAI provider adapter — focused on usage accounting and
 * reasoning-token attribution (Patent 2 surface).
 */
import { describe, it, expect, vi } from "vitest";
import { createOpenAIProvider } from "../src/providers/openai.js";

describe("OpenAI provider", () => {
  it("matches gpt / o1 / o3 / o4 / chatgpt prefixes only", () => {
    const provider = createOpenAIProvider({
      apiKey: "sk-test",
      baseUrl: "http://upstream.invalid/v1",
    });
    expect(provider.matches("gpt-4o-mini")).toBe(true);
    expect(provider.matches("o1-preview")).toBe(true);
    expect(provider.matches("o3-mini")).toBe(true);
    expect(provider.matches("o4-mini")).toBe(true);
    expect(provider.matches("chatgpt-4o-latest")).toBe(true);
    expect(provider.matches("claude-3-5-sonnet-20241022")).toBe(false);
    expect(provider.matches("gemini-1.5-pro")).toBe(false);
  });

  it("surfaces standard usage (prompt/completion/total)", async () => {
    const fake = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          id: "cmpl_1",
          model: "gpt-4o-mini",
          choices: [
            { message: { role: "assistant", content: "hi" }, finish_reason: "stop" },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createOpenAIProvider({
      apiKey: "sk-test",
      baseUrl: "http://upstream.invalid/v1",
      fetchImpl: fake as unknown as typeof fetch,
    });
    const resp = await provider.invoke({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(resp.outputText).toBe("hi");
    expect(resp.usage?.prompt_tokens).toBe(10);
    expect(resp.usage?.completion_tokens).toBe(5);
    expect(resp.usage?.total_tokens).toBe(15);
    expect(resp.usage?.reasoning_tokens).toBeUndefined();
  });

  it("surfaces reasoning_tokens for o1/o3/o4 reasoning models", async () => {
    // OpenAI returns reasoning tokens nested inside completion_tokens_details.
    const fake = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          id: "cmpl_o3_1",
          model: "o3-mini",
          choices: [
            {
              message: { role: "assistant", content: "Final answer." },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 20,
            completion_tokens: 12,
            total_tokens: 32,
            completion_tokens_details: {
              reasoning_tokens: 4096,
              accepted_prediction_tokens: 0,
              rejected_prediction_tokens: 0,
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createOpenAIProvider({
      apiKey: "sk-test",
      baseUrl: "http://upstream.invalid/v1",
      fetchImpl: fake as unknown as typeof fetch,
    });
    const resp = await provider.invoke({
      model: "o3-mini",
      messages: [{ role: "user", content: "Solve a hard problem." }],
    });
    // Patent 2: reasoning tokens are isolated and attributed back to the call.
    expect(resp.usage?.reasoning_tokens).toBe(4096);
    expect(resp.usage?.completion_tokens).toBe(12);
    expect(resp.usage?.prompt_tokens).toBe(20);
  });

  it("omits reasoning_tokens when the upstream response does not include it", async () => {
    const fake = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          id: "cmpl_no_reason",
          model: "gpt-4o",
          choices: [
            { message: { role: "assistant", content: "done" }, finish_reason: "stop" },
          ],
          usage: {
            prompt_tokens: 5,
            completion_tokens: 2,
            total_tokens: 7,
            completion_tokens_details: {},
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createOpenAIProvider({
      apiKey: "sk-test",
      baseUrl: "http://upstream.invalid/v1",
      fetchImpl: fake as unknown as typeof fetch,
    });
    const resp = await provider.invoke({
      model: "gpt-4o",
      messages: [{ role: "user", content: "ping" }],
    });
    expect(resp.usage?.reasoning_tokens).toBeUndefined();
  });

  it("throws when the upstream returns a non-2xx response", async () => {
    const fake = vi.fn(async () => {
      return new Response(
        JSON.stringify({ error: { message: "rate_limit" } }),
        { status: 429, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createOpenAIProvider({
      apiKey: "sk-test",
      baseUrl: "http://upstream.invalid/v1",
      fetchImpl: fake as unknown as typeof fetch,
    });
    await expect(
      provider.invoke({
        model: "gpt-4o",
        messages: [{ role: "user", content: "x" }],
      })
    ).rejects.toThrow(/OpenAI upstream returned 429/);
  });
});
