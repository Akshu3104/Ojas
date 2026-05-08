# DevPulse — AI Runtime Governance Platform

**DevPulse** is the runtime governance, security and observability layer for production AI agents and LLM-backed APIs. It gives security and platform teams a single control plane to **secure**, **monitor**, and **kill-switch** AI workloads — across cost, prompts, tools, and the underlying APIs they reach.

[![CI/CD Pipeline](https://github.com/yourname/devpulse/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourname/devpulse/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What DevPulse does

| Pillar | Capabilities |
| --- | --- |
| **AI Runtime Governance** | Live token-cost telemetry, kill-switch with budget caps, weekly digest, per-model cost breakdown |
| **API Security** | OWASP Top 10 + Postman / OpenAPI scanning, shadow-API discovery, severity scoring, fix recommendations |
| **Observability** | Prometheus metrics, Sentry error monitoring with PII scrubbing, structured pino logs, audit log per user |
| **Compliance** | PCI DSS, GDPR & SOC2-ready audit trail, exportable compliance reports per collection |
| **Team & Access** | RBAC, team invitations, multi-session management, refresh-token rotation, brute-force lockout |
| **DX & Integrations** | tRPC + WebSocket SDK, VS Code extension, GitHub push/PR webhooks, Slack alerts, Razorpay & Stripe billing |

> **Phase 1 ships today.** Phase 2 (AI runtime telemetry, MCP security governance, Security Copilot, multi-tenancy, SOC2 reports) is sequenced in `PRODUCT_ROADMAP.md`.

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

## Security & Compliance

DevPulse is designed with privacy-by-design principles:

- **PII Redaction** - Automatically scrubs sensitive data before LLM transmission
- **Audit Logs** - All API interactions are logged for SOC2 compliance
- **Data Residency** - Self-hostable option for on-premise deployments

## License

Copyright (c) 2024 DevPulse Inc. All rights reserved.

MIT License - see LICENSE file for details.
