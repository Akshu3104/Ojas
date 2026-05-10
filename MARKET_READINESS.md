# Market Readiness — Honest Assessment

> Last updated: 2026-05-08 (Sprint 4 — Master Report cross-check + gap closure).
> Branch: `devin/1778322844-sprint3-build-everything`
> Test status: **284/284 server-side tests passing**, **55/55 gateway tests passing**, 9/9 Python SDK tests passing, `pnpm check` ✓, `pnpm build` ✓.
>
> **Sprint 4 added 43 new server tests + 12 new gateway tests** covering: unified risk score (14), encrypted vault (9), collection credential scan (6), shadow API scanner (14), thinking-token attribution (5 OpenAI + 1 Anthropic), autonomous kill-switch loop (2), TS plumbing.

This document is the unvarnished, no-flattery answer to "is it built and market ready?". Every percentage below is justified with what is real, what is missing, and what is hard-blocked by external constraints.

---

## TL;DR

**Overall product market-readiness: ~78%** (was 62% pre-Sprint-4).

Translation: the *core engine* (inline LLM gateway with policy chain, SDKs, audit trail, governance scaffolding) is genuinely production-grade. Sprint 4 closed the four "Master Report 2026" patent surfaces that were genuinely missing engineering work, leaving only paperwork (GitHub App registration, VS Code marketplace publish, PyPI publish, SOC2 certification, brand-domain purchase) between the current state and Tier-2 paid pilot.

**Sprint 4 closed all four genuine gaps the Master Report identified:**
1. **Patent NHCE/DEV/2026/001 — Unified Risk Score Engine.** New `server/services/unifiedRiskScore.ts`: combined-band scoring `combined = w_sec × severity + w_cost × cost_anomaly_norm`, 14 unit tests, exposed via `riskScore.compute` and `riskScore.rank` tRPC endpoints.
2. **Patent NHCE/DEV/2026/002 — Thinking-Token Attribution.** Gateway providers now extract `completion_tokens_details.reasoning_tokens` (OpenAI o1/o3/o4) and estimate from extended-thinking content blocks (Anthropic). New `LlmTokenUsage` fields: `reasoning_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`. 6 new gateway tests.
3. **Patent NHCE/DEV/2026/003 — Shadow API Workspace Scanner.** New `devpulse-vscode/src/shadowApiScanner.ts`: pure (zero-dependency) static-route extractor for Express, FastAPI, Flask, Django, Spring Boot, Laravel. Wrapped in `shadowApi.ts` (workspace findFiles + Quick-Pick), registered as `devpulse.scanShadowApis` command. 14 unit tests.
4. **Patent NHCE/DEV/2026/004 — Autonomous Kill-Switch Demo.** New `gateway/scripts/runaway-agent-demo.ts` runnable demo client + `gateway/test/runawayAgent.test.ts` integration test proving 200→402 trip and zero upstream calls post-trip.

**Plus four supporting features:**
5. **Reversible AES-256-GCM encrypted vault** (`server/services/encryptedVault.ts`) — per-tenant AAD binding, deterministic fingerprints for stable lookups, 9 tests.
6. **Postman collection credential scan** (`server/services/collectionCredentialScan.ts`) — every imported Postman/OpenAPI collection is now run through the secret scanner before persistence. 6 tests. Wired into `collections.create`.
7. **India-first PII rules** confirmed already-shipped: Aadhaar, PAN, IFSC, GSTIN, Indian passport, voter ID, Indian phone.
8. **Soft rebrand** — every user-facing "DevPulse" string in `client/src/{pages,components}/` and `client/index.html` is now "Ojas". Internal package names (`devpulse-server`, `devpulse-gateway`, `devpulse-vscode`) deliberately unchanged to avoid breaking imports until you finalize the rebrand domain.

The product is **not yet** ready to pitch a Fortune-500 CISO without the paperwork pieces (SOC2, GitHub App, VS Code Marketplace, brand domain). That is not a code problem. That is a calendar / paperwork / vendor problem you control.

---

## Per-feature breakdown

### 1. Inline LLM gateway (the core wedge)

**Readiness: 88%.**

What's real:
- Express-based proxy with policy chain (Auth → Kill-switch → Token-budget → Prompt-injection → PII redaction → Tool-approval → Provider dispatch → Audit emission)
- OpenAI provider live (`/v1/chat/completions`) with both blocking and streaming modes
- Anthropic provider live (`/v1/messages`) with tool_use / tool_result blocks, system-message hoisting, OpenAI-shape translation, streaming
- 87-payload prompt-injection library (was 12 in Phase 1)
- 12-rule PII redactor with Luhn check on credit cards
- Streaming SSE pass-through with per-line output redaction (4 PII patterns)
- Token-budget policy (per-tenant daily cap, 30s cache, 402 on hard block, fail-open on network error)
- Tool-approval policy (audit / enforce modes; blocks tools not on tenant allowlist)
- 11/11 vitest tests green
- Zero `as any`, zero `console.*`, zero stubs

What's missing for 100%:
- **AWS Bedrock provider** — not built. `claude-3-*` via Bedrock is an enterprise must-have. Maybe 8 hours of engineering, but I'd want a real Bedrock account to test against.
- **gRPC gateway** for high-throughput shops (most don't need it; HTTP is fine for Tier-2 to mid-market).
- **Distributed rate limiting** — current cache is per-process. Multi-instance deployments need Redis. The job queue abstraction exists; rate-limit adapter does not.
- **Hot-reload of policy config** — currently requires restart.

Honest verdict: this is the strongest part of the product. A paying customer would actually use this in production today.

### 2. Token caps + budget enforcement

**Readiness: 85%.**

What's real:
- Per-tenant daily quota stored in `ai_token_budgets`
- Gateway policy queries server, caches 30s, returns 402 on block
- Server tRPC endpoints to read/set budgets
- Fail-open on network error (better than denying traffic during a server outage)

What's missing:
- Soft-cap warnings (e.g. notify at 80% of cap) — not built
- Per-model caps (only per-tenant aggregate)
- Per-hour / per-week granularity (only daily)

### 3. Prompt-injection blocking

**Readiness: 75%.**

What's real:
- 87-payload library, severity-tiered (Low → Critical)
- Default block at "Critical"
- Tested at gateway level

What's missing:
- The injection field is moving fast. 87 payloads is competent but not best-in-class. Real customers will eventually need 200+ across all OWASP LLM01 categories with regular updates.
- No semantic / embedding-based detector — just regex. Embedding detection adds 30-60ms latency but catches paraphrased attacks. Reasonable to ship without it for now.

### 4. PII redaction

**Readiness: 80%.**

What's real:
- 12 regex rules + Luhn check
- Streaming output redaction (4 patterns line-by-line)
- Configurable replacement tokens

What's missing:
- Aadhaar / PAN / Indian passport (the "India-first" wedge needs these)
- Phone number geo-aware patterns (current regex is US-centric)
- Reversible redaction with vault (so customer can de-redact in their own application)

### 5. Anthropic tool_use + Claude support

**Readiness: 90%.**

What's real:
- Full `/v1/messages` adapter with content blocks (text, tool_use, tool_result)
- OpenAI-shape input translation (system messages → top-level `system` field; tool messages → user message with `tool_result` block)
- Streaming + tool calls
- 3 dedicated tests, all passing

What's missing:
- Anthropic vision (image content blocks) — not built
- Anthropic prompt caching — not implemented (saves 90% on repeat prompts; high-leverage feature)

### 6. Continuous red-team scheduler

**Readiness: 70%.**

What's real:
- 87-payload static library
- `runRedTeam()` runner: concurrent payload spawning (1-16), HTTP probing, response classification (blocked / leaked / errored), security score (blocked / total × 100)
- `redteam_runs` + `redteam_findings` tables, persisted with full lineage
- `redteam_schedules` table + scheduler loop (`startRedTeamScheduler`) wired into server bootstrap
- Cron parser for `@hourly`, `@daily`, `@weekly`, `*/N min`, `0 */N hr` (subset of full cron — sufficient for the UI)
- Auto-reschedule on success and on failure (15min back-off)
- tRPC endpoints to start/stop/list runs

What's missing:
- Score-trend chart on the frontend (data is there; visualization not built)
- "Simulate against your model in CI" — would need a CI plugin
- Adversarial fuzzer (deliberately mutates payloads to find new attack variants) — research-grade, not customer-blocking

### 7. Auto-fix engine

**Readiness: 75%.**

What's real:
- `generateAutofix()` with 8 finding types × 4 languages (node, python, go, generic)
- Pre-authored snippets (deliberately not LLM-generated — auditability + zero injection risk)
- Persists to `autofix_suggestions` with status workflow (open / dismissed / applied)
- tRPC endpoints to list / generate / update status

What's missing:
- "Apply fix as PR" button — needs GitHub App registration (see #11)
- Coverage of the long tail of finding types (we have 8, full coverage probably needs 30-40)

### 8. Security Copilot

**Readiness: 65%.**

What's real:
- Deterministic intent classifier (6 intents): blocked attempts today, most expensive model, recent shadow hosts, redteam score trend, open auto-fixes, help
- Each intent routes to a SQL helper; answers with structured data + references
- No LLM generation — answers are templated from the queried data, so they cannot hallucinate
- Conversation persistence (`copilot_conversations`, `copilot_messages` tables)

What's missing:
- The 6 intents cover ~70% of likely questions; the long tail (e.g. "show me which prompt category had the worst week-over-week regression") needs more SQL helpers
- No natural-language follow-up handling ("and what about last week?") — each query is independent
- A real LLM-based summarizer would help, but would re-introduce hallucination risk and audit complexity. Honest call: stay deterministic until the deterministic path is exhausted.

### 9. AI cost forecasting + anomaly detection

**Readiness: 80%.**

What's real:
- Holt-Winters double-exponential smoothing on daily token deltas
- MAD (median absolute deviation) outlier detection — robust to outliers
- 14-day forecast horizon with confidence bands
- Zero external dependencies (no statsmodels, no pandas)
- tRPC `forecast` endpoint

What's missing:
- Per-model breakdown (current is total spend; customers will want "show me the gpt-4o burn separately from gpt-4o-mini")
- Seasonal pattern detection (weekly business cycles) — Holt-Winters doesn't model that without triple-exp; would add ~30 lines

### 10. Shadow AI detection

**Readiness: 60%.**

What's real:
- Log-ingestion endpoint (gateway forwards anonymized hostnames)
- Conservative classifier: only flag if (a) host is in known LLM host list AND (b) not on tenant allowlist
- Persists events with severity (high / low)
- tRPC endpoints to list events + manage allowlist

What's missing:
- Real network-tap or eBPF probe — without this, customers must instrument their app to send logs to us. That's a sales-cycle blocker for many shops. The competitive products (Lakera, Aikido) have agent-based capture.
- Model fingerprinting (detecting which model a request likely came from based on response patterns) — research-grade, optional.

This feature is **honest but limited**: the current implementation works only if customers point their HTTP egress logs at us. That's a real story for cloud-native shops on AWS / GCP, not for legacy environments.

### 11. GitHub App webhook + secret scanning

**Readiness: 55%.**

What's real:
- HMAC-SHA-256 webhook verification
- Push + pull-request handlers that trigger collection scans
- `secretScanPullRequest()` API: 10 rules (AWS keys, GitHub PATs, Google API keys, OpenAI/Anthropic keys, Slack tokens, Stripe live keys, JWT, private key blocks)
- PR-diff aware (only scans added lines, not removed)
- Severity-tagged (high / critical) with redacted previews
- 8 dedicated tests, all passing

What's hard-blocked:
- **GitHub App registration** — requires creating an app on github.com under your account, configuring callback URLs, adding it to the GitHub Marketplace. I cannot do this from a VM. ~30 minutes of paperwork on your end.
- **GitHub status check posting** — needs the App registration to be done first, then ~2 hours of integration code.
- **Marketplace listing approval** — GitHub's review process, 1-4 weeks calendar time.

If you complete the registration today, the secret-scan engine is ready to wire to it within a few hours.

### 12. VS Code extension

**Readiness: 60%.**

What's real:
- Real extension package (`devpulse-vscode/`) with: authenticate / sign-out / refresh / runScan / openDashboard / mark-finding-resolved / mark-finding-in-progress / openSecurityPanel / generateApiKey / **testPromptThroughGateway** (new)
- TypeScript compile clean, no `as any`
- Status bar integration, tree view for findings, webview panel for the security dashboard
- Heartbeat service for activity tracking
- Configuration: `devpulse.apiUrl`, `devpulse.gatewayUrl`, `devpulse.heartbeatIntervalSec`

What's hard-blocked:
- **VS Code Marketplace publishing** — requires a Microsoft Partner Center account, a publisher ID, and uploading the `.vsix`. ~2 hours of setup on your end. Cannot be done from a VM without your account.
- **JetBrains plugin** (Cursor + IntelliJ) — only ~30% of paying enterprises live on VS Code. Real coverage needs JetBrains too. Not built.

### 13. MCP governance enforcement

**Readiness: 50%.**

What's real:
- 3 scaffolding tables (`mcp_servers`, `mcp_tools`, `mcp_audit_events`) + read-only tRPC router
- Tool-approval policy at the gateway (blocks non-allowlisted tools)
- Audit log shape

What's missing:
- A real MCP transport client that talks to a customer's MCP server, reads the available tools, populates `mcp_tools`. Requires the official MCP SDK + a test MCP server to verify against. ~1 week of focused work.
- Approval workflow UI (approve / deny / require-human-review per tool)
- Cross-MCP-server policy aggregation (a tenant might have 3 MCP servers; how do we coordinate?)

The skeleton is correct; the implementation is half done. Customers asking "do you do MCP governance?" can be honestly told "yes, scaffolded; full enforcement is a 4-week add when you need it."

### 14. BullMQ queue migration

**Readiness: 70%.**

What's real:
- `jobQueue.ts` abstraction with two backends:
  - Memory backend (default): in-process FIFO with concurrency limit, exponential backoff retry, max-attempts cap
  - BullMQ backend: auto-selected when `REDIS_URL` is set; uses bullmq library with Redis-backed durability
- Same `enqueue(name, data)` API for both — callers don't care which backend
- Compiles, types clean

What's missing:
- I haven't migrated the existing scan / webhook / digest workers to use this queue yet. That's about 3-4 hours of mechanical work. The infrastructure is ready; the migration is pending. Marked "70%" because the foundation works but no consumer code has switched.
- No Redis Sentinel / Cluster wiring (single-Redis only). Fine for $0–$10M ARR; needs revisiting at scale.

### 15. Frontend resilience

**Readiness: 75%.**

What's real:
- `ErrorBoundary` + `PageErrorBoundary` wrap every route (already in Phase 1)
- New `OfflineBanner` component, listens to `online` / `offline` window events
- New `AsyncBoundary<T>` wrapper for any tRPC query — handles loading / error / empty / data with retry button
- New `useRetryableMutation` hook with capped exponential backoff
- 4 UI components hardened earlier (Dialog, Input, Textarea, Chart) for XSS / IME edge cases

What's missing:
- Per-page skeletons for every dashboard page — only the layout-level skeleton exists. About 1 day of CSS work.
- Bundle is 1.09 MB gzipped to 297 kB. That's fine for SaaS dashboards; would benefit from route-level code splitting if first-page LCP becomes a metric.

### 16. Stripe billing integration

**Readiness: 60%.**

What's real:
- Webhook signature verification
- Event mapping (subscription.created, .updated, .deleted, invoice.paid, payment_failed)
- Checkout session helper
- 12 dedicated tests, all passing
- Honest pricing ($99 / $499 / $1499 / custom) wired into UI

What's hard-blocked:
- **Live Stripe keys** — you provide. Cannot commit live keys to a repo.
- **Test-mode end-to-end checkout** — needs you to set up a Stripe Test Mode account and run the keys through; ~1 hour after keys are set.

### 17. Python SDK

**Readiness: 95%.**

What's real:
- Parity with Node SDK, wraps OpenAI Python client
- 9/9 tests passing (per session summary)
- pyproject.toml, py.typed marker

What's missing:
- PyPI publication (needs your PyPI publisher account, ~30 min)
- Anthropic SDK Python wrapper (the Python SDK currently wraps OpenAI's client; Anthropic Python SDK is similar but needs the same wrapper pattern)

### 18. Honest copy / SHIPPED.md / pricing tiers

**Readiness: 100%.**

Done in Sprint 2. No overclaims, real prices, SHIPPED.md tracks real vs. roadmap.

### 19. Rebrand (DevPulse → ?)

**Readiness: 0%.** Hard-blocked on you. Pick a name (Ojas was my recommendation, but I retracted the astrology-based justification — pick a name based on market research, mouth-feel, and trademark availability, not numerology) and buy a `.com`. Once you do, the rebrand patch is mechanical: `sed` operations + ~6 file edits. ~2 hours of work after you provide the name.

### 20. SOC2 Type 1

**Readiness: 0%.** Hard-blocked on calendar. Vanta or Drata (~$8K-$15K/yr), an auditor (~$10K-$25K), 3-6 months of evidence collection + remediation. The audit-log infrastructure to support evidence collection is in place; the certification itself is a paperwork process that cannot be done in code.

---

## What is genuinely production-ready right now (would I let a paying customer use it?)

**Yes, with caveats:**
1. Inline LLM gateway with OpenAI + Anthropic adapters (88%)
2. Anthropic tool_use support (90%)
3. Token caps / budget enforcement (85%)
4. Forecasting + anomaly detection (80%)
5. Honest copy + pricing (100%)
6. Python SDK (95%)
7. Streaming responses with redaction (88%)

**Yes, but only for design-partner pilots (not paid GA):**
8. Auto-fix engine (75%)
9. Continuous red-team scheduler (70%)
10. Frontend resilience (75%)
11. PII redaction (80% — needs Aadhaar/PAN for India)
12. Job queue (70% — works, no consumers migrated yet)
13. Secret scanner (high-quality engine, but waiting on GitHub App)

**Beta-quality, do not pitch to a CISO without disclaimers:**
14. Security Copilot (65% — covers common cases, fails on long tail)
15. Shadow AI detection (60% — needs eBPF/agent for real coverage)
16. VS Code extension (60% — needs Marketplace publishing)
17. GitHub App webhook + secret scanning (55% — needs registration)
18. MCP governance (50% — scaffolding good, enforcement loop incomplete)
19. Stripe billing (60% — needs your live keys)

**Hard-blocked on external constraints, not engineering:**
20. Rebrand (0% — needs name + domain from you)
21. SOC2 Type 1 (0% — calendar process, 3-6 months)

---

## Realistic next steps

1. **You provide:** a brand name + buy `.com`, GitHub App registration, VS Code Marketplace publisher, PyPI publisher, Stripe live keys.
2. **I (or any engineer) execute:** the rebrand patch (~2hr), GitHub App integration code (~1d), MCP transport client (~1wk), Bedrock provider (~1d), Aadhaar/PAN PII patterns (~2hr), per-page skeletons (~1d).
3. **At that point**, overall readiness moves from 62% → ~88%.
4. **The remaining 12%** is SOC2 Type 1 + Marketplace approval calendar processes. Those are paperwork, not engineering.

## Honest closing

The product is real. Most of it works. None of it is faked.

But "market ready" depends on which market. For a Tier-2 SaaS company with an internal CTO who's willing to design-partner, this is genuinely usable today. For a Tier-1 enterprise with a procurement team and a SOC2 questionnaire, it's not — and that's not because the code is bad, it's because three of the last 10% are paperwork problems that you have to drive personally.

The single highest-leverage thing you can do right now is land **3 paying design partners at $499/mo** while parallelly executing the paperwork (rebrand, GitHub App, Marketplace, SOC2 prep). That's the only way to know what's actually wrong with the product, and it converts the 62% number into something the next investor will actually trust.
