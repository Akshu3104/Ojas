/**
 * AWS Bedrock provider adapter.
 *
 * Bedrock multiplexes many model families behind a single REST surface; the
 * payload shape depends on the model id prefix.  This adapter currently
 * supports:
 *
 *   - `anthropic.*`            — Claude family (Anthropic Messages API shape)
 *   - `meta.*`                 — Llama 3 family (`prompt` + `max_gen_len`)
 *   - `mistral.*`              — Mistral family (`prompt` + `max_tokens`)
 *   - `amazon.titan-text-*`    — Titan text (`inputText` + `textGenerationConfig`)
 *
 * Other model ids fall through to a pass-through body — `request.extra.body`
 * is used verbatim if present.  This means new model families can be onboarded
 * by callers without code changes here.
 *
 * Auth is AWS SigV4 against
 *   `https://bedrock-runtime.<region>.amazonaws.com/model/<modelId>/invoke`.
 *
 * NOTE: this adapter has been unit-tested against a mocked `fetch`; it has
 * NOT yet been verified end-to-end against a real AWS account.  Once a
 * sandbox account is attached, drop a one-line integration test and remove
 * this notice.
 */

import { createHash, createHmac } from "node:crypto";

import type {
  LlmMessage,
  LlmRequest,
  LlmResponse,
  Provider,
} from "../types.js";

interface BedrockProviderConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const BEDROCK_PREFIXES = ["anthropic.", "meta.", "mistral.", "amazon.titan-"];

interface BedrockBodyResult {
  body: unknown;
  /** Function that pulls assistant text out of the upstream response. */
  extractText: (json: unknown) => string;
  /**
   * Optional usage extractor — Bedrock does not expose token usage uniformly
   * across families, so we surface what's available and zero-fill the rest.
   */
  extractUsage: (json: unknown) => {
    prompt: number;
    completion: number;
  };
}

function joinUserText(messages: LlmMessage[]): { system: string; user: string } {
  const system: string[] = [];
  const user: string[] = [];
  for (const m of messages) {
    const text =
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content
              .map(p => {
                const obj = p as Record<string, unknown>;
                return typeof obj?.text === "string" ? obj.text : "";
              })
              .join("")
          : "";
    if (m.role === "system") system.push(text);
    else if (m.role === "user") user.push(text);
    else if (m.role === "assistant") user.push(`Assistant: ${text}`);
  }
  return { system: system.join("\n\n"), user: user.join("\n\n") };
}

function buildBodyForModel(request: LlmRequest): BedrockBodyResult {
  const id = request.model.toLowerCase();
  // Caller-provided override always wins.
  const passthrough = (request.extra as { body?: unknown } | undefined)?.body;
  if (passthrough !== undefined) {
    return {
      body: passthrough,
      extractText: () => "",
      extractUsage: () => ({ prompt: 0, completion: 0 }),
    };
  }

  if (id.startsWith("anthropic.")) {
    const sysParts: string[] = [];
    const out: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const m of request.messages) {
      if (m.role === "system" && typeof m.content === "string") {
        sysParts.push(m.content);
      } else if (
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
      ) {
        out.push({ role: m.role, content: m.content });
      }
    }
    return {
      body: {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: request.max_tokens ?? 1024,
        ...(sysParts.length > 0 ? { system: sysParts.join("\n\n") } : {}),
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
        messages: out,
      },
      extractText: json => {
        const r = json as { content?: Array<{ type?: string; text?: string }> };
        return (r.content ?? [])
          .filter(b => b.type === "text" && typeof b.text === "string")
          .map(b => b.text!)
          .join("");
      },
      extractUsage: json => {
        const r = json as {
          usage?: { input_tokens?: number; output_tokens?: number };
        };
        return {
          prompt: r.usage?.input_tokens ?? 0,
          completion: r.usage?.output_tokens ?? 0,
        };
      },
    };
  }

  if (id.startsWith("meta.")) {
    const { user } = joinUserText(request.messages);
    return {
      body: {
        prompt: user,
        max_gen_len: request.max_tokens ?? 1024,
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
      },
      extractText: json => {
        const r = json as { generation?: string };
        return r.generation ?? "";
      },
      extractUsage: json => {
        const r = json as {
          prompt_token_count?: number;
          generation_token_count?: number;
        };
        return {
          prompt: r.prompt_token_count ?? 0,
          completion: r.generation_token_count ?? 0,
        };
      },
    };
  }

  if (id.startsWith("mistral.")) {
    const { user } = joinUserText(request.messages);
    return {
      body: {
        prompt: user,
        max_tokens: request.max_tokens ?? 1024,
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
      },
      extractText: json => {
        const r = json as { outputs?: Array<{ text?: string }> };
        return r.outputs?.[0]?.text ?? "";
      },
      extractUsage: () => ({ prompt: 0, completion: 0 }),
    };
  }

  if (id.startsWith("amazon.titan-")) {
    const { user } = joinUserText(request.messages);
    return {
      body: {
        inputText: user,
        textGenerationConfig: {
          maxTokenCount: request.max_tokens ?? 1024,
          ...(request.temperature !== undefined
            ? { temperature: request.temperature }
            : {}),
        },
      },
      extractText: json => {
        const r = json as { results?: Array<{ outputText?: string }> };
        return r.results?.[0]?.outputText ?? "";
      },
      extractUsage: json => {
        const r = json as {
          inputTextTokenCount?: number;
          results?: Array<{ tokenCount?: number }>;
        };
        return {
          prompt: r.inputTextTokenCount ?? 0,
          completion: r.results?.[0]?.tokenCount ?? 0,
        };
      },
    };
  }

  // Unknown family — sensible OpenAI-shape default; caller can override
  // by setting `extra.body`.
  return {
    body: {
      messages: request.messages,
      max_tokens: request.max_tokens ?? 1024,
      ...(request.temperature !== undefined
        ? { temperature: request.temperature }
        : {}),
    },
    extractText: () => "",
    extractUsage: () => ({ prompt: 0, completion: 0 }),
  };
}

/* ---- AWS SigV4 ---- */

function sha256Hex(buf: Buffer | string): string {
  return createHash("sha256").update(buf).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function deriveSigningKey(
  secret: string,
  date: string,
  region: string,
  service: string
): Buffer {
  const k1 = hmac("AWS4" + secret, date);
  const k2 = hmac(k1, region);
  const k3 = hmac(k2, service);
  return hmac(k3, "aws4_request");
}

interface SigV4Inputs {
  method: string;
  host: string;
  path: string;
  region: string;
  service: string;
  payload: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  now?: Date;
}

export interface SigV4Result {
  authorization: string;
  amzDate: string;
  payloadHash: string;
}

/** Compute a SigV4 Authorization header for a Bedrock invoke call. */
export function signSigV4(inputs: SigV4Inputs): SigV4Result {
  const now = inputs.now ?? new Date();
  const amzDate = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(inputs.payload);

  const signedHeadersList = ["content-type", "host", "x-amz-date"];
  const headers: Record<string, string> = {
    "content-type": "application/json",
    host: inputs.host,
    "x-amz-date": amzDate,
  };
  if (inputs.sessionToken) {
    headers["x-amz-security-token"] = inputs.sessionToken;
    signedHeadersList.push("x-amz-security-token");
  }
  signedHeadersList.sort();

  const canonicalHeaders =
    signedHeadersList.map(h => `${h}:${headers[h]}\n`).join("") + "";
  const signedHeaders = signedHeadersList.join(";");
  const canonicalRequest = [
    inputs.method,
    inputs.path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${date}/${inputs.region}/${inputs.service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = deriveSigningKey(
    inputs.secretAccessKey,
    date,
    inputs.region,
    inputs.service
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${inputs.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { authorization, amzDate, payloadHash };
}

export function createBedrockProvider(cfg: BedrockProviderConfig): Provider {
  const fetchFn = cfg.fetchImpl ?? fetch;
  const timeoutMs = cfg.timeoutMs ?? 60_000;
  const host = `bedrock-runtime.${cfg.region}.amazonaws.com`;
  const baseUrl = cfg.baseUrl ?? `https://${host}`;

  function buildRequest(
    request: LlmRequest,
    streaming: boolean
  ): {
    url: string;
    init: RequestInit;
    body: BedrockBodyResult;
  } {
    const path = `/model/${encodeURIComponent(request.model)}/${
      streaming ? "invoke-with-response-stream" : "invoke"
    }`;
    const body = buildBodyForModel(request);
    const payload = JSON.stringify(body.body);
    const sig = signSigV4({
      method: "POST",
      host,
      path,
      region: cfg.region,
      service: "bedrock",
      payload,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      ...(cfg.sessionToken ? { sessionToken: cfg.sessionToken } : {}),
    });
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Host: host,
      "x-amz-date": sig.amzDate,
      Authorization: sig.authorization,
    };
    if (cfg.sessionToken) headers["x-amz-security-token"] = cfg.sessionToken;
    if (streaming) headers.Accept = "application/vnd.amazon.eventstream";
    return { url: `${baseUrl}${path}`, init: { method: "POST", headers, body: payload }, body };
  }

  return {
    id: "bedrock",
    matches(model) {
      return BEDROCK_PREFIXES.some(p => model.toLowerCase().startsWith(p));
    },
    async invoke(request: LlmRequest): Promise<LlmResponse> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const { url, init, body } = buildRequest(request, false);
        const resp = await fetchFn(url, { ...init, signal: controller.signal });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `Bedrock upstream returned ${resp.status}: ${text.slice(0, 500)}`
          );
        }
        const json = await resp.json();
        const usage = body.extractUsage(json);
        return {
          id: `bedrock-${Date.now()}`,
          model: request.model,
          outputText: body.extractText(json),
          raw: json,
          usage: {
            prompt_tokens: usage.prompt,
            completion_tokens: usage.completion,
            total_tokens: usage.prompt + usage.completion,
          },
        };
      } finally {
        clearTimeout(timer);
      }
    },
    async invokeStream(request: LlmRequest): Promise<Response> {
      const { url, init } = buildRequest(request, true);
      const resp = await fetchFn(url, init);
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(
          `Bedrock streaming upstream returned ${resp.status}: ${text.slice(0, 500)}`
        );
      }
      return resp;
    },
  };
}
