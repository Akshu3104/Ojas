# `@devpulse/gateway` — Inline LLM Gateway

The DevPulse Inline LLM Gateway is an OpenAI-compatible HTTP proxy that sits in
the request path between your application and the upstream LLM provider
(OpenAI, Anthropic, AWS Bedrock, …). Every request is enforced against the
following policy chain *before* it leaves your network and *before* the
response is returned to your application:

```
client ──> /v1/chat/completions ──┐
                                  │
                              ┌───▼────────────────────────────────┐
                              │  1. Auth (DevPulse API key)        │
                              │  2. Kill-switch check              │  ← blocks if user budget cap hit
                              │  3. Prompt-injection check         │  ← matches against curated payload library
                              │  4. PII redaction (input)          │
                              │  5. Forward to upstream provider   │
                              │  6. PII redaction (output)         │
                              │  7. Token metering & cost record   │
                              └───┬────────────────────────────────┘
                                  │
client <── streamed response ─────┘
```

## Why this exists

DevPulse's "kill-switch" and "prompt-injection blocking" features previously
lived only in the dashboard — they recorded events but did not *enforce*
anything at runtime. This gateway turns them into real enforcing controls.
See `MARKET_ANALYSIS.md §3.1` for the audit that motivated this.

## Status: MVP (Sprint 2)

| Component | Status |
| --- | --- |
| Express HTTP server + `/v1/chat/completions` shim | **Implemented** |
| API-key auth (per-tenant) | **Implemented** |
| Kill-switch policy (in-memory + DevPulse callback) | **Implemented** |
| Prompt-injection blocklist policy (100+ payloads) | **Implemented** |
| PII redaction policy (regex baseline + extension hooks) | **Implemented** |
| Token metering + per-call cost record | **Implemented** |
| Streaming SSE responses | Implemented (passthrough; redaction is on non-streamed responses for now) |
| Provider: OpenAI | **Implemented** |
| Provider: Anthropic | Adapter stub |
| Provider: Bedrock | Adapter stub |
| Audit log fan-out to DevPulse server | Async webhook |

## Run locally

```bash
pnpm install
pnpm dev
# Listens on :8081. Point your OpenAI SDK at:
# OPENAI_BASE_URL=http://localhost:8081/v1
```

Set `DEVPULSE_GATEWAY_UPSTREAM_OPENAI_KEY=sk-…` and an inbound
`DEVPULSE_GATEWAY_API_KEYS=tenant1:devp_xxx,tenant2:devp_yyy` env var (or wire
it to the DevPulse server's tenant store).

## Env vars

| Var | Purpose |
| --- | --- |
| `DEVPULSE_GATEWAY_PORT` | Listen port (default `8081`) |
| `DEVPULSE_GATEWAY_API_KEYS` | Comma-separated `tenantId:apiKey` pairs (dev-only; in prod load from DevPulse server) |
| `DEVPULSE_GATEWAY_UPSTREAM_OPENAI_KEY` | Upstream OpenAI key |
| `DEVPULSE_GATEWAY_DEVPULSE_URL` | DevPulse server URL for kill-switch + audit fan-out |
| `DEVPULSE_GATEWAY_DEVPULSE_TOKEN` | Service-to-service token for the above |
| `DEVPULSE_GATEWAY_REDACT_PII` | `true`/`false` (default `true`) |
| `DEVPULSE_GATEWAY_BLOCK_INJECTIONS` | `true`/`false` (default `true`) |

## Architecture notes

This package is intentionally framework-light: Express + a small policy chain.
We do not pull in `langchain`, `aisdk`, or other LLM-framework dependencies —
the gateway is a *protocol-level* proxy and must not interpret request
semantics any deeper than necessary.

The policy chain is composable: each policy is a function
`(ctx) => Promise<PolicyDecision>` where `PolicyDecision` is one of `allow`,
`block({ reason })`, or `mutate({ patch })`. New policies (e.g. RBAC by tool
name, model-allow-list, regional routing) plug in without touching the core
loop.
