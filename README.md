# DevPulse — AI Security & Cost Guardrails (Sprint 2)

> **Honest status, May 2026.** This repo is in active development toward a real
> *AI runtime governance* product. Phase 1 (auth, OWASP API scanning,
> observability, cost dashboard, audit log) is shipped and production-hardened.
> Phase 2 (this sprint) introduces an **inline LLM gateway** that turns the
> kill-switch and prompt-injection blocking from dashboard features into
> **enforcing controls in the request path**. See `SHIPPED.md` for what is
> real today vs. roadmap.
>
> The product positioning is being narrowed (see `MARKET_ANALYSIS.md`) and a
> rebrand is pending — the codebase still uses the `DevPulse` name.

[![CI/CD Pipeline](https://github.com/yourname/devpulse/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourname/devpulse/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What DevPulse does today

| Pillar | Capabilities | Status |
| --- | --- | --- |
| **Inline LLM Gateway** (Sprint 2) | OpenAI-compatible proxy, token metering, kill-switch enforcement, PII redaction, prompt-injection blocking | **MVP** |
| **AI Cost Visibility** | Per-model token analytics, weekly digest, anomaly alerts, budget caps | Production |
| **API Security Audits** | OWASP Top 10 scanning of Postman / OpenAPI collections, severity scoring, audit-grade PDF export | Production |
| **Spec-drift / shadow-API discovery** | Diff between declared and observed endpoints | Production |
| **AI Red-Team Library** | 85+ curated prompt-injection / jailbreak payloads across 10 OWASP LLM01 categories | Static |
| **MCP Governance** (Sprint 2) | Tool-call audit log, permission graph data model | Scaffolded |
| **Observability** | Prometheus metrics, Sentry with PII scrubbing, structured pino logs, audit log per user | Production |
| **Compliance evidence** | Audit-trail export, OWASP / PCI-DSS-prep / GDPR-prep / SOC2-prep report templates *(reports help you prepare; they do not certify you)* | Production |
| **Team & Access** | RBAC, team invitations, multi-session management, refresh-token rotation, brute-force lockout | Production |
| **Integrations** | tRPC + WebSocket SDK, VS Code extension (findings tree), GitHub push/PR webhooks, Slack alerts, Razorpay (INR) + Stripe (USD) billing | Production / scaffolded |

See `SHIPPED.md` for the precise per-feature status and `PRODUCT_ROADMAP.md`
for what is sequenced next (continuous AI red-team scheduler, full MCP
enforcement, AI-BOM, SSO/SAML, SOC2 Type 1).

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- MySQL 8.0 (or Docker)

### Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/yourname/devpulse.git
   cd devpulse
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Access the Application**
   - Dashboard: http://localhost:3001 (devpulse-frontend)
   - API: http://localhost:3000 (Node.js tRPC backend)
   - Marketing Site: http://localhost:3002 (client/ - Vite-based)

### Development Mode

```bash
# Install dependencies
pnpm install

# Start the Node.js backend (tRPC + Express)
pnpm dev

# In a separate terminal, start the dashboard (Next.js)
cd devpulse-frontend && pnpm dev

# In another terminal, start the marketing site (Vite)
cd client && pnpm dev
```

## Architecture

### Project Structure

```
devpulse-app/
├── server/              # Node.js tRPC Backend (Main API)
│   ├── _core/          # Core middleware, auth, config
│   ├── routers/        # tRPC routers (collections, scanning, payments, etc.)
│   ├── db/            # Database queries and connection
│   └── payments.ts    # Razorpay payment integration
│
├── devpulse-frontend/   # Next.js Dashboard (Product UI)
│   └── app/           # Main application pages
│       ├── dashboard/  # Real-time monitoring dashboard
│       ├── collections/# API collection management
│       ├── scanning/   # Security scanning interface
│       ├── analytics/  # Token usage analytics
│       ├── team/       # Team management
│       └── admin/      # Admin dashboard
│
├── client/            # Vite React Marketing Site
│   └── src/           # Landing pages, pricing, about
│
├── drizzle/           # Database schema and migrations
├── shared/            # Shared types and constants
└── docker-compose.prod.yml  # Production deployment
```

### Frontend Structure Clarification

| Directory            | Framework    | Purpose                                                                               | Auth Required |
| -------------------- | ------------ | ------------------------------------------------------------------------------------- | ------------- |
| `devpulse-frontend/` | Next.js 14+  | **Main Product Dashboard** - Collections, scanning, analytics, team management, admin | Yes           |
| `client/`            | Vite + React | **Marketing Website** - Landing page, pricing, about, contact                         | No            |

**Note:** The `devpulse-frontend/` directory contains the actual DevPulse product interface. The `client/` directory is the public-facing marketing website.

### Backend Architecture

**Single Backend: Node.js + tRPC**

The application uses a single Node.js backend with tRPC for type-safe API calls:

- **Auth:** JWT-based authentication with Google OAuth support
- **Database:** MySQL with Drizzle ORM
- **Real-time:** WebSocket for live updates
- **Payments:** Razorpay integration for subscriptions
- **Security:** OWASP Top 10 scanning, shadow API detection

**Retired:** The Python FastAPI backend (`devpulse-backend/`) has been retired and should be deleted for cleanliness. All functionality has been migrated to the Node.js backend.

## Security & hardening (Phase 1)

- **Password hashing:** PBKDF2-SHA512, 100k iterations, per-user salt.
- **Sessions:** JWT (HS256) cookie + refresh-token rotation primitives, IP + user-agent tracked per session, brute-force login lockout, password-reset tokens expire after 24h.
- **Webhooks:** Razorpay / Stripe / GitHub signatures verified with timing-safe compare; `processed_webhook_events` table dedupes replays during the 24h retry window.
- **Network:** strict CORS allowlist (`devpluse.in` + `www.devpluse.in` + `app.devpluse.in` in prod), helmet CSP with nonce, HSTS, COEP/COOP/CORP, Permissions-Policy lockdown.
- **Rate limiting:** distributed sliding-window via Redis sorted-sets (works across multi-instance deploys); fail-open on Redis outages with structured warning.
- **Outbound calls:** every fetch / axios call has an explicit timeout (`fetchWithTimeout`).
- **Database:** explicit `ON DELETE CASCADE` foreign keys (migration `0006_cascade_deletes.sql`) so manual deletes can't leave orphans.
- **Config:** Zod schema validates env vars at startup, fail-fast on bad config in prod, soft-warn in dev.
- **Observability:** pino structured logs with PII redaction, Sentry events scrubbed before send.

## Configuration

Environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing secret
- `GITHUB_WEBHOOK_SECRET` - GitHub webhook verification secret

## Security & Compliance — what is true

DevPulse is designed with privacy-by-design principles, but please read these
claims carefully — they are deliberately precise:

- **PII Redaction at the gateway** — `gateway/` proxies LLM traffic and
  applies regex + entity redaction before forwarding to the upstream model.
  PII never lands in DevPulse's logs.
- **Audit logs** — every state-changing action is logged with actor + IP +
  timestamp + resource. The export format is suitable as **evidence** during
  a SOC2 audit; it does **not** make you SOC2-certified.
- **PCI DSS / GDPR / DPDP Act / SOC2-prep reports** — DevPulse generates
  reports that help you prepare for these audits. DevPulse itself is not
  certified against any of these frameworks at this time.
- **Data residency** — self-hostable option (Docker Compose) for on-premise
  deployments. Single-tenant SaaS is roadmap.

If you need a certified vendor, this is not it yet.

## License

Copyright (c) 2024 DevPulse Inc. All rights reserved.

MIT License - see LICENSE file for details.
