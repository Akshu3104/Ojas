/**
 * DevPulse Inline LLM Gateway.
 *
 * Single Express process. Exposes an OpenAI-compatible `/v1/chat/completions`
 * endpoint, runs every request through a configurable policy chain, and
 * forwards to the matching upstream provider.
 *
 * Run with `pnpm dev` (tsx watch) or `pnpm start` after `pnpm build`.
 */

import express, { type Express, type Request, type Response } from "express";
import { randomUUID, createHash } from "node:crypto";
import pino from "pino";

import { loadEnv, parseDevApiKeys, type GatewayEnv } from "./config.js";
import {
  type AuditRecord,
  type LlmRequest,
  type LlmTokenUsage,
  type PolicyDecision,
  type Provider,
  type RequestContext,
  type RequestPolicy,
} from "./types.js";
import { createKillSwitchPolicy } from "./policies/killSwitch.js";
import { createPromptInjectionPolicy } from "./policies/promptInjection.js";
import { createPiiRedactionPolicy } from "./policies/piiRedaction.js";
import { createTokenBudgetPolicy } from "./policies/tokenBudget.js";
import { createToolApprovalPolicy } from "./policies/toolApproval.js";
import { createOpenAIProvider } from "./providers/openai.js";
import { createAnthropicProvider } from "./providers/anthropic.js";
import { createBedrockProvider } from "./providers/bedrock.js";

interface GatewayDeps {
  env: GatewayEnv;
  /** API key -> tenantId. */
  apiKeyStore: Map<string, string>;
  policies: RequestPolicy[];
  providers: Provider[];
  /** Audit fan-out hook. Async; failures are logged but never block traffic. */
  emitAudit: (record: AuditRecord) => Promise<void>;
  logger: pino.Logger;
}

export function createGateway(deps: GatewayDeps): Express {
  const app = express();
  // Limit body size — the gateway is a proxy, not a file upload service.
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post(
    "/v1/chat/completions",
    asyncHandler(async (req, res) => {
      const ctx = buildContext(req);
      const log = deps.logger.child({
        requestId: ctx.requestId,
        tenantId: ctx.tenantId,
      });
      const startedAt = ctx.startedAt;

      // 1. Auth.
      const apiKey = readApiKey(req);
      if (!apiKey) {
        respondError(res, 401, "missing_api_key", "Missing Authorization header");
        return;
      }
      const tenantId = deps.apiKeyStore.get(apiKey);
      if (!tenantId) {
        respondError(res, 401, "invalid_api_key", "Invalid DevPulse API key");
        return;
      }
      ctx.tenantId = tenantId;

      // 2. Validate request.
      const parseResult = parseRequest(req.body);
      if (!parseResult.ok) {
        respondError(res, 400, "invalid_request", parseResult.error);
        return;
      }
      let llmRequest: LlmRequest = parseResult.value;

      // 3. Run policy chain. `mutate` decisions update the request in place
      //    (functionally — never mutate the original).
      const policyDetails: Record<string, unknown> = {};
      for (const policy of deps.policies) {
        let decision: PolicyDecision;
        try {
          decision = await policy({ ctx, request: llmRequest });
        } catch (err) {
          log.warn({ err }, "[Policy] crashed; treating as allow");
          continue;
        }
        if (decision.kind === "block") {
          const audit: AuditRecord = {
            requestId: ctx.requestId,
            tenantId,
            startedAt,
            endedAt: Date.now(),
            model: llmRequest.model,
            decision: "blocked",
            blockReason: decision.reason,
            promptFingerprint: fingerprint(llmRequest),
          };
          deps.emitAudit(audit).catch(err =>
            log.warn({ err }, "[Audit] emit failed")
          );
          respondError(
            res,
            decision.status ?? 403,
            decision.reason,
            "Request blocked by DevPulse policy",
            decision.detail
          );
          return;
        }
        if (decision.kind === "mutate") {
          llmRequest = decision.request;
          if (decision.detail)
            Object.assign(policyDetails, decision.detail);
        }
      }

      // 4. Pick provider.
      const provider = deps.providers.find(p => p.matches(llmRequest.model));
      if (!provider) {
        respondError(
          res,
          404,
          "no_provider",
          `No provider configured for model ${llmRequest.model}`
        );
        return;
      }

      // 5. Forward upstream.
      try {
        if (llmRequest.stream === true && provider.invokeStream) {
          await streamUpstream({
            provider,
            request: llmRequest,
            ctx,
            res,
            tenantId,
            startedAt,
            log,
            emitAudit: deps.emitAudit,
          });
          return;
        }
        const llmResponse = await provider.invoke(llmRequest);
        const audit: AuditRecord = {
          requestId: ctx.requestId,
          tenantId,
          startedAt,
          endedAt: Date.now(),
          model: llmRequest.model,
          provider: provider.id,
          decision: "allowed",
          ...(llmResponse.usage !== undefined ? { usage: llmResponse.usage } : {}),
          promptFingerprint: fingerprint(llmRequest),
        };
        deps.emitAudit(audit).catch(err =>
          log.warn({ err }, "[Audit] emit failed")
        );

        // 6. Pass response through. We deliberately return the provider's raw
        //    body so OpenAI SDKs see the exact OpenAI shape they expect.
        res.status(200).json(llmResponse.raw);
      } catch (err) {
        log.error({ err }, "[Gateway] upstream call failed");
        const audit: AuditRecord = {
          requestId: ctx.requestId,
          tenantId,
          startedAt,
          endedAt: Date.now(),
          model: llmRequest.model,
          provider: provider.id,
          decision: "errored",
          promptFingerprint: fingerprint(llmRequest),
        };
        deps.emitAudit(audit).catch(err2 =>
          log.warn({ err: err2 }, "[Audit] emit failed")
        );
        respondError(res, 502, "upstream_error", "LLM provider call failed");
      }
    })
  );

  return app;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>
): (req: Request, res: Response) => void {
  return (req, res) => {
    fn(req, res).catch(err => {
      // Express's default error handler will deal with this; we log first.
      // eslint-disable-next-line no-console
      console.error("[Gateway] unhandled handler error", err);
      if (!res.headersSent) {
        res.status(500).json({
          error: { code: "internal_error", message: "Unexpected error" },
        });
      }
    });
  };
}

function buildContext(req: Request): RequestContext {
  const headerId =
    typeof req.headers["x-request-id"] === "string"
      ? req.headers["x-request-id"]
      : undefined;
  const ipHeader = req.headers["x-forwarded-for"];
  const ip = Array.isArray(ipHeader)
    ? ipHeader[0]
    : typeof ipHeader === "string"
      ? ipHeader.split(",")[0]?.trim()
      : (req.socket.remoteAddress ?? undefined);
  return {
    requestId: headerId ?? randomUUID(),
    tenantId: "", // populated after auth
    ...(ip !== undefined ? { ip } : {}),
    startedAt: Date.now(),
  };
}

function readApiKey(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length).trim() || undefined;
  }
  const xKey = req.headers["x-devpulse-api-key"];
  if (typeof xKey === "string") return xKey || undefined;
  return undefined;
}

interface ParseSuccess {
  ok: true;
  value: LlmRequest;
}
interface ParseFailure {
  ok: false;
  error: string;
}

function parseRequest(body: unknown): ParseSuccess | ParseFailure {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const rec = body as Record<string, unknown>;
  if (typeof rec.model !== "string") {
    return { ok: false, error: "Missing string field 'model'" };
  }
  if (!Array.isArray(rec.messages)) {
    return { ok: false, error: "Missing array field 'messages'" };
  }
  // We don't validate the message shape strictly — providers will reject
  // malformed messages downstream and we don't want to drift from OpenAI's
  // schema as it evolves.
  // Gather provider-specific fields (tools, response_format, …) under `extra`
  // so policies (e.g. toolApproval) can inspect them and providers can pass
  // them through verbatim.
  const known = new Set([
    "model",
    "messages",
    "temperature",
    "max_tokens",
    "stream",
  ]);
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (!known.has(k)) extra[k] = v;
  }
  const result: LlmRequest = {
    model: rec.model,
    messages: rec.messages as LlmRequest["messages"],
    ...(typeof rec.temperature === "number"
      ? { temperature: rec.temperature }
      : {}),
    ...(typeof rec.max_tokens === "number"
      ? { max_tokens: rec.max_tokens }
      : {}),
    ...(typeof rec.stream === "boolean" ? { stream: rec.stream } : {}),
    ...(Object.keys(extra).length > 0 ? { extra } : {}),
  };
  return { ok: true, value: result };
}

function fingerprint(req: LlmRequest): string {
  // We never log raw prompts. Instead the audit record carries a SHA-256
  // truncated to 16 hex chars, useful for "is this the same prompt?" queries
  // but reversible only with cooperation from the customer.
  const concat = req.messages
    .map(m =>
      typeof m.content === "string" ? m.content : JSON.stringify(m.content)
    )
    .join("\u0000");
  return createHash("sha256")
    .update(`${req.model}\u0000${concat}`)
    .digest("hex")
    .slice(0, 16);
}

function respondError(
  res: Response,
  status: number,
  code: string,
  message: string,
  detail?: Record<string, unknown>
): void {
  res.status(status).json({
    error: { code, message, ...(detail ? { detail } : {}) },
  });
}

/** PII patterns mirrored from policies/piiRedaction.ts for output side. */
const STREAM_REDACTORS: Array<{ rx: RegExp; replacement: string }> = [
  { rx: /[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/g, replacement: "[REDACTED_EMAIL]" },
  {
    rx: /\bsk-[A-Za-z0-9-_]{16,}\b/g,
    replacement: "[REDACTED_OPENAI_KEY]",
  },
  {
    rx: /\bAKIA[0-9A-Z]{16}\b/g,
    replacement: "[REDACTED_AWS_ACCESS_KEY]",
  },
  {
    rx: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[REDACTED_SSN]",
  },
];

function redactStreamLine(line: string): string {
  let out = line;
  for (const r of STREAM_REDACTORS) out = out.replace(r.rx, r.replacement);
  return out;
}

interface StreamUpstreamArgs {
  provider: Provider;
  request: LlmRequest;
  ctx: RequestContext;
  res: Response;
  tenantId: string;
  startedAt: number;
  log: pino.Logger;
  emitAudit: (record: AuditRecord) => Promise<void>;
}

async function streamUpstream(args: StreamUpstreamArgs): Promise<void> {
  const { provider, request, ctx, res, tenantId, startedAt, log, emitAudit } =
    args;
  if (!provider.invokeStream) {
    res.status(501).json({
      error: {
        code: "stream_unsupported",
        message: `Provider ${provider.id} does not support streaming`,
      },
    });
    return;
  }
  const upstream = await provider.invokeStream(request);
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  let usage: LlmTokenUsage | undefined;
  let buffer = "";
  if (!upstream.body) {
    res.end();
    return;
  }
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl = buffer.indexOf("\n");
      while (nl !== -1) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        nl = buffer.indexOf("\n");
        if (line.startsWith("data: ")) {
          const payload = line.slice(6);
          if (payload === "[DONE]") {
            res.write("data: [DONE]\n\n");
            continue;
          }
          // Try to extract token usage if the provider sent it.
          try {
            const event = JSON.parse(payload) as {
              usage?: LlmTokenUsage;
            };
            if (event.usage) usage = event.usage;
          } catch {
            // partial / non-JSON event — ignore parse errors
          }
          res.write(`data: ${redactStreamLine(payload)}\n\n`);
        } else if (line.length > 0) {
          res.write(`${redactStreamLine(line)}\n`);
        } else {
          res.write("\n");
        }
      }
    }
    if (buffer.length > 0) res.write(redactStreamLine(buffer));
  } catch (err) {
    log.error({ err }, "[Gateway] stream relay failed");
  } finally {
    res.end();
    const audit: AuditRecord = {
      requestId: ctx.requestId,
      tenantId,
      startedAt,
      endedAt: Date.now(),
      model: request.model,
      provider: provider.id,
      decision: "allowed",
      ...(usage ? { usage } : {}),
      promptFingerprint: fingerprint(request),
    };
    emitAudit(audit).catch(err =>
      log.warn({ err }, "[Audit] emit failed")
    );
  }
}

// ----------------------------------------------------------------------------
// Standalone bootstrap
//
// Runs only when this file is the process entrypoint. Importing this module
// from a test or another package no longer starts a server listener as a
// side-effect — keeping `pnpm test` and library use-cases clean.
// ----------------------------------------------------------------------------

const isMain =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  // Compare resolved script path against this file's URL.
  // Works for both `tsx watch src/index.ts` and `node dist/index.js`.
  (import.meta.url.endsWith(process.argv[1]) ||
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/")));

if (isMain) {
  const env = loadEnv();
  const logger = pino({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    redact: ["req.headers.authorization", "req.headers['x-devpulse-api-key']"],
  });

  const apiKeyStore = parseDevApiKeys(env.DEVPULSE_GATEWAY_API_KEYS);
  if (apiKeyStore.size === 0 && env.NODE_ENV !== "production") {
    logger.warn(
      "No DEVPULSE_GATEWAY_API_KEYS set; the gateway will reject every request"
    );
  }

  const providers: Provider[] = [];
  if (env.DEVPULSE_GATEWAY_UPSTREAM_OPENAI_KEY) {
    providers.push(
      createOpenAIProvider({
        apiKey: env.DEVPULSE_GATEWAY_UPSTREAM_OPENAI_KEY,
        baseUrl: env.DEVPULSE_GATEWAY_UPSTREAM_OPENAI_BASE,
      })
    );
  }
  if (env.DEVPULSE_GATEWAY_UPSTREAM_ANTHROPIC_KEY) {
    providers.push(
      createAnthropicProvider({
        apiKey: env.DEVPULSE_GATEWAY_UPSTREAM_ANTHROPIC_KEY,
        baseUrl: env.DEVPULSE_GATEWAY_UPSTREAM_ANTHROPIC_BASE,
        enablePromptCaching: env.DEVPULSE_GATEWAY_ANTHROPIC_PROMPT_CACHING,
      })
    );
  }
  if (
    env.DEVPULSE_GATEWAY_BEDROCK_REGION &&
    env.DEVPULSE_GATEWAY_BEDROCK_ACCESS_KEY_ID &&
    env.DEVPULSE_GATEWAY_BEDROCK_SECRET_ACCESS_KEY
  ) {
    providers.push(
      createBedrockProvider({
        region: env.DEVPULSE_GATEWAY_BEDROCK_REGION,
        accessKeyId: env.DEVPULSE_GATEWAY_BEDROCK_ACCESS_KEY_ID,
        secretAccessKey: env.DEVPULSE_GATEWAY_BEDROCK_SECRET_ACCESS_KEY,
        ...(env.DEVPULSE_GATEWAY_BEDROCK_SESSION_TOKEN
          ? { sessionToken: env.DEVPULSE_GATEWAY_BEDROCK_SESSION_TOKEN }
          : {}),
      })
    );
  }

  const policies: RequestPolicy[] = [
    createKillSwitchPolicy({
      ...(env.DEVPULSE_GATEWAY_DEVPULSE_URL
        ? { devpulseUrl: env.DEVPULSE_GATEWAY_DEVPULSE_URL }
        : {}),
      ...(env.DEVPULSE_GATEWAY_DEVPULSE_TOKEN
        ? { serviceToken: env.DEVPULSE_GATEWAY_DEVPULSE_TOKEN }
        : {}),
    }),
    createTokenBudgetPolicy({
      ...(env.DEVPULSE_GATEWAY_DEVPULSE_URL
        ? { devpulseUrl: env.DEVPULSE_GATEWAY_DEVPULSE_URL }
        : {}),
      ...(env.DEVPULSE_GATEWAY_DEVPULSE_TOKEN
        ? { serviceToken: env.DEVPULSE_GATEWAY_DEVPULSE_TOKEN }
        : {}),
    }),
    createPromptInjectionPolicy({
      enabled: env.DEVPULSE_GATEWAY_BLOCK_INJECTIONS,
      onMatch: ({ payload }) =>
        logger.warn(
          { payloadId: payload.id, severity: payload.severity },
          "[Policy] prompt-injection match"
        ),
    }),
    createPiiRedactionPolicy({
      enabled: env.DEVPULSE_GATEWAY_REDACT_PII,
      onRedaction: ev =>
        logger.info(ev, "[Policy] PII redaction applied"),
    }),
    createToolApprovalPolicy({
      mode: env.DEVPULSE_GATEWAY_TOOL_MODE,
      // Default approval hook: if no DevPulse server is wired, allow all tools.
      // Once wired, this hook should call /api/internal/tool-approval and
      // honor the tenant's MCP governance configuration.
      isToolApproved: () => true,
    }),
  ];

  const emitAudit = async (record: AuditRecord): Promise<void> => {
    if (!env.DEVPULSE_GATEWAY_DEVPULSE_URL || !env.DEVPULSE_GATEWAY_DEVPULSE_TOKEN) {
      logger.debug({ record }, "[Audit] no DevPulse server wired; logging only");
      return;
    }
    try {
      const resp = await fetch(
        `${env.DEVPULSE_GATEWAY_DEVPULSE_URL.replace(/\/$/, "")}/api/internal/gateway-audit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.DEVPULSE_GATEWAY_DEVPULSE_TOKEN}`,
          },
          body: JSON.stringify(record),
        }
      );
      if (!resp.ok) {
        logger.warn(
          { status: resp.status },
          "[Audit] DevPulse server rejected event"
        );
      }
    } catch (err) {
      logger.warn({ err }, "[Audit] DevPulse server unreachable");
    }
  };

  const app = createGateway({
    env,
    apiKeyStore,
    policies,
    providers,
    emitAudit,
    logger,
  });

  app.listen(env.DEVPULSE_GATEWAY_PORT, () => {
    logger.info(
      {
        port: env.DEVPULSE_GATEWAY_PORT,
        providers: providers.map(p => p.id),
        policies: [
          "killSwitch",
          "tokenBudget",
          "promptInjection",
          "piiRedaction",
          "toolApproval",
        ],
      },
      "DevPulse Gateway listening"
    );
  });
}
