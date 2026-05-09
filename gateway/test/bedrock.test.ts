import { describe, expect, it, vi } from "vitest";
import { createBedrockProvider, signSigV4 } from "../src/providers/bedrock.js";
import type { LlmRequest } from "../src/types.js";

describe("AWS SigV4 (Bedrock)", () => {
  it("produces a deterministic signature for a known input", () => {
    // Sanity check: with fixed inputs, SigV4 must be deterministic.
    const result = signSigV4({
      method: "POST",
      host: "bedrock-runtime.us-east-1.amazonaws.com",
      path: "/model/anthropic.claude-3-haiku/invoke",
      region: "us-east-1",
      service: "bedrock",
      payload: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      now: new Date("2025-01-01T00:00:00Z"),
    });
    expect(result.authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIA/);
    expect(result.authorization).toContain("SignedHeaders=content-type;host;x-amz-date");
    expect(result.authorization).toMatch(/Signature=[0-9a-f]{64}/);
    expect(result.amzDate).toBe("20250101T000000Z");
  });

  it("includes session token in signed headers when provided", () => {
    const result = signSigV4({
      method: "POST",
      host: "bedrock-runtime.us-west-2.amazonaws.com",
      path: "/model/x/invoke",
      region: "us-west-2",
      service: "bedrock",
      payload: "{}",
      accessKeyId: "AKIA_TMP",
      secretAccessKey: "secret",
      sessionToken: "sessionTok==",
      now: new Date("2025-06-01T12:34:56Z"),
    });
    expect(result.authorization).toContain(
      "SignedHeaders=content-type;host;x-amz-date;x-amz-security-token"
    );
  });
});

describe("Bedrock provider", () => {
  it("matches anthropic., meta., mistral., amazon.titan- prefixes only", () => {
    const p = createBedrockProvider({
      region: "us-east-1",
      accessKeyId: "x",
      secretAccessKey: "y",
    });
    expect(p.matches("anthropic.claude-3-haiku-20240307-v1:0")).toBe(true);
    expect(p.matches("meta.llama3-70b-instruct-v1:0")).toBe(true);
    expect(p.matches("mistral.mistral-large-2402-v1:0")).toBe(true);
    expect(p.matches("amazon.titan-text-express-v1")).toBe(true);
    expect(p.matches("gpt-4o")).toBe(false);
    expect(p.matches("claude-3-haiku")).toBe(false); // direct API, not Bedrock
  });

  it("invokes Anthropic-on-Bedrock model with the bedrock anthropic_version", async () => {
    const captured: { url?: string; body?: unknown } = {};
    const fake = vi.fn(async (url: string | URL, init?: RequestInit) => {
      captured.url = String(url);
      captured.body = init?.body ? JSON.parse(String(init.body)) : undefined;
      return new Response(
        JSON.stringify({
          content: [{ type: "text", text: "I'm Claude on Bedrock." }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createBedrockProvider({
      region: "us-east-1",
      accessKeyId: "AKIA_TEST",
      secretAccessKey: "secret",
      fetchImpl: fake as unknown as typeof fetch,
    });
    const req: LlmRequest = {
      model: "anthropic.claude-3-haiku-20240307-v1:0",
      messages: [
        { role: "system", content: "be brief" },
        { role: "user", content: "hi" },
      ],
      max_tokens: 100,
    };
    const resp = await provider.invoke(req);
    expect(resp.outputText).toBe("I'm Claude on Bedrock.");
    expect(resp.usage?.prompt_tokens).toBe(10);
    expect(resp.usage?.completion_tokens).toBe(5);
    expect(captured.url).toContain("/model/anthropic.claude-3-haiku-20240307-v1%3A0/invoke");
    const body = captured.body as Record<string, unknown>;
    expect(body.anthropic_version).toBe("bedrock-2023-05-31");
    expect(body.system).toBe("be brief");
  });

  it("invokes Llama-on-Bedrock with the meta-format body", async () => {
    const captured: { body?: unknown } = {};
    const fake = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      captured.body = init?.body ? JSON.parse(String(init.body)) : undefined;
      return new Response(
        JSON.stringify({
          generation: "hello from llama",
          prompt_token_count: 7,
          generation_token_count: 4,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createBedrockProvider({
      region: "us-west-2",
      accessKeyId: "AKIA_TEST",
      secretAccessKey: "secret",
      fetchImpl: fake as unknown as typeof fetch,
    });
    const resp = await provider.invoke({
      model: "meta.llama3-70b-instruct-v1:0",
      messages: [{ role: "user", content: "say hello" }],
    });
    expect(resp.outputText).toBe("hello from llama");
    expect(resp.usage?.prompt_tokens).toBe(7);
    expect(resp.usage?.completion_tokens).toBe(4);
    const body = captured.body as Record<string, unknown>;
    expect(body.prompt).toBe("say hello");
    expect(body.max_gen_len).toBe(1024);
  });

  it("uses Titan textGenerationConfig shape", async () => {
    const captured: { body?: unknown } = {};
    const fake = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      captured.body = init?.body ? JSON.parse(String(init.body)) : undefined;
      return new Response(
        JSON.stringify({
          inputTextTokenCount: 3,
          results: [{ outputText: "ok", tokenCount: 1 }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createBedrockProvider({
      region: "us-east-1",
      accessKeyId: "AKIA_TEST",
      secretAccessKey: "secret",
      fetchImpl: fake as unknown as typeof fetch,
    });
    const resp = await provider.invoke({
      model: "amazon.titan-text-express-v1",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 50,
      temperature: 0.2,
    });
    expect(resp.outputText).toBe("ok");
    const body = captured.body as { textGenerationConfig: Record<string, unknown> };
    expect(body.textGenerationConfig.maxTokenCount).toBe(50);
    expect(body.textGenerationConfig.temperature).toBe(0.2);
  });

  it("passes through extra.body verbatim for unknown families", async () => {
    const captured: { body?: unknown } = {};
    const fake = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      captured.body = init?.body ? JSON.parse(String(init.body)) : undefined;
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const provider = createBedrockProvider({
      region: "us-east-1",
      accessKeyId: "AKIA_TEST",
      secretAccessKey: "secret",
      fetchImpl: fake as unknown as typeof fetch,
    });
    await provider.invoke({
      model: "anthropic.claude-3-haiku-20240307-v1:0",
      messages: [],
      extra: { body: { custom: "payload", arr: [1, 2, 3] } },
    });
    expect(captured.body).toEqual({ custom: "payload", arr: [1, 2, 3] });
  });

  it("attaches Authorization, x-amz-date, and x-amz-security-token headers", async () => {
    const captured: { headers?: Record<string, string> } = {};
    const fake = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      captured.headers = init?.headers as Record<string, string>;
      return new Response(
        JSON.stringify({
          content: [{ type: "text", text: "ok" }],
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const provider = createBedrockProvider({
      region: "us-east-1",
      accessKeyId: "AKIA_TEST",
      secretAccessKey: "secret",
      sessionToken: "tok==",
      fetchImpl: fake as unknown as typeof fetch,
    });
    await provider.invoke({
      model: "anthropic.claude-3-haiku-20240307-v1:0",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(captured.headers?.Authorization).toMatch(/^AWS4-HMAC-SHA256 /);
    expect(captured.headers?.["x-amz-date"]).toMatch(/^\d{8}T\d{6}Z$/);
    expect(captured.headers?.["x-amz-security-token"]).toBe("tok==");
  });
});
