# SHIPPED.md — what is real vs. roadmap

> Written for buyers, auditors, and the founding team. Updated at the end of
> every sprint. **If a feature is not in the "Production" or "MVP" rows
> below, it is not yet usable in your environment.** Marketing copy that
> over-states maturity is a bug; please file an issue if you find any.
>
> Last updated: end of **Sprint 2 (May 2026)**.

## Reality summary

DevPulse is two products glued together:

1. **Phase 1 (production)** — an API security scanner + cost dashboard for
   teams that ship LLM-backed APIs. This works today: scans, audit logs,
   cost meters, kill-switch (dashboard side), reports.
2. **Phase 2 (MVP, this sprint)** — an inline LLM gateway that turns the
   kill-switch and prompt-injection policy from "dashboard alerts" into
   **enforcement points in the request path**. Plus a Node SDK and a
   re-priced billing tier deck.

Phase 2 is what makes the "AI Runtime Governance" claim real. Without it,
the kill-switch is theatre — it sets a DB row but cannot stop traffic.

---

## Production — works today

| Capability | Where | Notes |
| --- | --- | --- |
| Email + password + Google OAuth auth, refresh-token rotation, brute-force lockout | `server/_core/oauth.ts`, `server/api/auth.ts` | Hardened in Phase 1 — see `PHASE_1_HARDENING_REPORT.md`. |
| Postman / OpenAPI scanner with OWASP API Top-10 coverage | `server/services/scanService.ts` | Severity-scored findings, audit-grade PDF export. |
| Cost dashboard, per-model token analytics, weekly digest | `server/api/tokenAnalytics.ts`, `server/jobs/weeklyDigest.ts` | Sentry telemetry + Prometheus `/metrics`. |
| Kill-switch (dashboard + budget caps, Slack/webhook alerting) | `server/api/killSwitch.ts` | **Now also enforced inline at the gateway** as of Sprint 2. |
| Spec-drift / shadow API detection | `server/api/shadowAPI.ts` | Compare declared vs observed endpoints. |
| Compliance evidence templates (OWASP / PCI-prep / GDPR-prep / SOC2-prep) | `server/api/compliance.ts` | **Reports help you prepare; they do not certify you.** |
| RBAC, team invitations, audit log of admin actions | `server/api/team.ts`, `server/api/admin.ts` | Refresh tokens rotate; sessions are revocable. |
| Webhooks (HMAC-signed, idempotent, retried) | `server/services/webhookDelivery.ts` | Deliveries logged in DB; auto-disable after 20 consecutive failures. |
| Razorpay billing (INR) — Free / Pro / Business | `server/payments.ts` | Webhook signatures verified, idempotency table prevents double-upgrade. |
| Pino structured logging w/ request-id + correlation-id middleware | `server/_core/logger.ts` | PII redaction in log keys. |
| Helmet CSP w/ nonces, HSTS, COOP/COEP/CORP, strict CORS allowlist | `server/_core/index.ts` | No wildcard CORS in any environment. |
| Sentry with PII scrubbing | `server/_core/sentry.ts` | Express error handler integrated. |

## MVP — Sprint 2, real code

These are working ends but the production-load envelope is small. Use in
staging first.

| Capability | Where | Sprint-2 status |
| --- | --- | --- |
| **Inline LLM Gateway** (OpenAI-compatible `/v1/chat/completions` proxy) | `gateway/src/index.ts` | Express server, policy chain, OpenAI adapter (live), Anthropic adapter (compiles but not tested against live traffic). |
| **Kill-switch enforcement at the gateway** | `gateway/src/policies/killSwitch.ts` | Calls back to `/api/internal/kill-switch/{tenantId}` with 5s in-memory cache, fail-open on network error. Covered by tests. |
| **Prompt-injection blocking** at the gateway | `gateway/src/policies/promptInjection.ts` | Substring match against the 87-entry static payload library, configurable severity threshold. Covered by tests. |
| **PII redaction** at the gateway | `gateway/src/policies/piiRedaction.ts` | Regex-based with Luhn verification on credit cards. 12 default rules incl. AWS / Stripe / OpenAI / GitHub keys + Indian PAN/Aadhaar. |
| **Server-side internal endpoints** for the gateway | `server/_core/index.ts` | `GET /api/internal/kill-switch/:tenantId`, `POST /api/internal/gateway-audit`. Bearer-authed via `GATEWAY_SERVICE_TOKEN`, constant-time comparison. |
| **Node SDK** routing OpenAI SDK traffic through the gateway | `sdk-node/src/index.ts` | `withDevPulse(new OpenAI(), { gatewayUrl, apiKey })`. Direct `chatCompletions(...)` helper for non-SDK callers. |
| **Expanded prompt-injection library** | `server/utils/promptInjectionPayloads.ts` | 87 payloads across 10 categories: instruction_override, role_hijack, system_prompt_leak, indirect_injection, delimiter_break, encoding_smuggle, tool_misuse, data_exfiltration, policy_bypass, multi_turn_jailbreak. |
| **Stripe billing** (USD rail) | `server/stripe.ts` | Checkout Session creation, HMAC-SHA256 webhook signature verification w/ replay protection, event mapper for subscription/invoice lifecycle. **No live keys committed.** |

## Scaffolded — data model + endpoints exist, no enforcement loop yet

| Capability | Where | What works | What does not |
| --- | --- | --- | --- |
| **MCP Governance** | `drizzle/0007_mcp_governance.sql`, `server/api/mcpGovernance.ts` | 3 new tables (`mcp_servers`, `mcp_tools`, `mcp_invocation_log`), tRPC read endpoints (`listServers`, `listTools`, `recentInvocations`, `summary`), permission-graph data model. | No discovery loop, no enforcement at the MCP transport layer, no UI. **Sprint 3.** |
| **Stripe USD billing** | `server/stripe.ts` | Webhook verification + event-mapping unit-tested. Plan tier amounts in `PLAN_CONFIG` (USD cents column). | Checkout endpoint not exposed via tRPC yet; subscription→plan-tier wiring lives in Sprint 3 once live keys are present. |
| **Anthropic provider** | `gateway/src/providers/anthropic.ts` | Compiles, follows Messages-API shape. | Not tested against live traffic; tool_use / tool_result content blocks dropped in MVP. |

## Static — assets exist, no continuous run

| Capability | Where | Notes |
| --- | --- | --- |
| **Prompt-injection red-team library** (87 payloads) | `server/utils/promptInjectionPayloads.ts` | Used both by the dashboard scanner and the gateway's runtime policy. **No scheduler yet** — re-running against an endpoint is manual. Continuous red-team scoring is a Sprint 4 deliverable. |

## Roadmap — explicitly NOT in this build

These are referenced in `MARKET_ANALYSIS.md` and in the founder's prompt
but did **not** ship in Sprint 2. They are real product surfaces requiring
proper design + scope and stubbing them would be theater.

| Item | Why deferred | Realistic timeline |
| --- | --- | --- |
| **Rebrand** (new name + domain) | Requires founder to pick a name + buy a `.com`. Codebase still uses `DevPulse`. | Pre-Sprint 3 founder decision. |
| **SOC2 Type 1** | Calendar process w/ Vanta/Drata + an auditor. Evidence-collection scaffolding exists; the certification itself does not. | 3–6 months. |
| **Marketing-site consolidation** (kill the Vite app, fold into Next.js) | High-risk refactor. Out of scope of Sprint 2. | Sprint 4. |
| **Python SDK** parity with the Node SDK | Avoid shipping a half-tested second SDK. | Sprint 3. |
| **Continuous AI red-team scheduler** | Static payload library shipped; cron + scoring trend over time is the next layer. | Sprint 4. |
| **Streaming responses through the gateway** | MVP supports non-streaming only; streaming bypasses output-side redaction. | Sprint 3. |
| **MCP transport layer + enforcement** | Data model + read endpoints shipped; the actual stdio / streamable-http / SSE multiplexer + permission enforcement lives in Sprint 3. | Sprint 3. |
| **AI BOM (model + dependency inventory)** | Useful for procurement but not table-stakes. | Sprint 5. |
| **GitHub App / VS Code AI security extension** | Real product surfaces, deserve their own design + sprint. | Sprint 6+. |
| **Security Copilot** (chat over your DevPulse account) | Useful but not a wedge. | Sprint 6+. |
| **Auto-fix engine** (PR generation for findings) | Possible only after deeper findings model. | Sprint 7+. |
| **Distributed BullMQ-backed queue migration** | Current synchronous workflow is sufficient under Sprint-2 traffic. Will be required around 100K LLM calls/day. | Sprint 5. |
| **Lighthouse / load-test pass** | Worthwhile after frontend consolidation lands. | Sprint 4. |

## Compliance language we will and will not use

> We **will** say:
> - "PII redaction at the gateway" (true, regex-based, 12 rules)
> - "Audit-trail evidence suitable for OWASP / PCI / GDPR / SOC2 reviews"
> - "SOC2-prep templates"
> - "Self-hostable; you keep the data"
>
> We **will not** say:
> - "PCI compliant" (we are not certified)
> - "SOC2 certified" (we are not certified)
> - "AI Runtime Governance Platform" without context (the gateway is MVP,
>   not GA — say "MVP" until Sprint 3 wraps)

## Verification

CI green at end of Sprint 2:

- `pnpm check` (TypeScript) — passing
- `pnpm test` — **233 tests passing** (12 new for Stripe, 6 new for gateway, balance unchanged)
- `gateway/`: `tsc --noEmit` passes; `vitest run` — **6 tests passing**

## Where to look next

- The 6-month execution plan: `MARKET_ANALYSIS.md` §5
- Phase 1 hardening details: `PHASE_1_HARDENING_REPORT.md`
- The gateway architecture + run instructions: `gateway/README.md`
- The Node SDK: `sdk-node/README.md`
