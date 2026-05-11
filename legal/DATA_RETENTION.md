# Data Retention Schedule

> **Status: First-draft template — pending review.**
> Replace `{{PLACEHOLDER}}` values per `REPLACE_BEFORE_PUBLISHING.md`.
> This document is internal-facing.  Customer-facing retention
> commitments are in the [Privacy Policy](./PRIVACY_POLICY.md) and
> [DPA](./DPA.md) — keep them in sync.

**Owner:** {{DPO_NAME}} (Data Protection Officer)
**Last updated:** [Date]
**Review cadence:** Annual

This schedule lists every category of data that flows through the
Ojas systems, where it lives, who has access, and how long it is
retained.

## 1. Customer-facing data

| Category | Storage | Retention | Deletion mechanism |
|---|---|---|---|
| Account profile (name, email, role, IdP `sub`) | Primary Postgres `users` table | Active duration of account + 90 days after account closure | Soft delete on close, hard delete after 90 days via daily job |
| Hashed password | `users.password_hash` | Same as profile | Same |
| Workspace membership | `workspace_members` | Active duration + 90 days | Same |
| Billing records (invoices, payments) | Primary Postgres + Stripe | **7 years** (Indian tax law) | Annual purge of records ≥ 7 years |
| Subscription / plan history | Primary Postgres | 7 years | Same |
| Gateway audit log — metadata (token counts, latency, model, masked fingerprint) | Primary Postgres + cold storage S3 | **12 months** active; 7 years cold | Daily rotate; quarterly purge of cold ≥ 7 years |
| Gateway audit log — full request/response (only if explicitly enabled) | S3 with per-tenant prefix | **30 days** | Daily lifecycle policy on S3 |
| Security audit log (auth events, IP, UA) | Primary Postgres | **90 days** | Daily job |
| Backups (encrypted, full) | S3 in distinct region | **35 days** rolling | S3 lifecycle |
| Backups (point-in-time WAL) | RDS PITR | 7 days | RDS native |
| Cookies | Browser, local | See [Cookie Policy](./COOKIE_POLICY.md) | Browser/expiry |
| Customer Data (prompts, responses, scan results) | Primary Postgres | Active duration + 30 days after account closure | Soft delete on close, hard delete after 30 days |
| Exported reports (PDFs, CSVs) | S3 with per-tenant prefix, signed URLs | **7 days** from creation | S3 lifecycle |
| Email content (transactional) | Email provider | Provider default (typically 30 days) | Provider auto-purge |
| Email content (marketing) | Email provider | 12 months | Quarterly purge |
| Telemetry to product analytics | Provider (e.g. PostHog) | 12 months (anonymous) | Provider auto-purge |
| Error logs (Sentry / Datadog) | Provider | 90 days | Provider retention setting |

## 2. Internal data

| Category | Storage | Retention | Deletion mechanism |
|---|---|---|---|
| Employee records | HR system | Active employment + 7 years (statutory) | Annual review |
| Recruitment records | ATS | 12 months from application close | Annual purge |
| Vendor contracts | Document management | Term + 7 years | Annual review |
| Sub-processor agreements | Document management | Term + 7 years | Same |
| Source code | GitHub | Indefinite | Manual |
| Build artifacts | Container registry | 90 days for non-release; indefinite for release tags | Lifecycle policy |
| CI / CD logs | CI provider | 90 days | Provider default |
| Internal Slack / docs | Slack / Notion / etc. | Per workspace retention setting | Configured per platform |

## 3. Backups and archives

- **Daily encrypted backups** of the primary Postgres database to
  S3 in a geographically distinct region.
- **35-day rolling** retention.
- Backups are encrypted with separate keys from primary storage.
- Backups are not used for active access; they exist solely for
  disaster recovery.
- On account closure, primary data is deleted within 30 days.
  Backups containing the data continue to age out on the 35-day
  cycle. After 35 days, no copies remain.

## 4. Deletion process

### 4.1 Account closure (Customer-initiated)
1. User clicks "Close account" or admin terminates Subscription.
2. Account is marked `closed_at = now`; access is revoked
   immediately.
3. Daily job, on day 31, hard-deletes:
   - Customer Data rows (prompts/responses, scan results, audit
     log with `tenant_id` = closed account)
   - User profile, workspace membership
4. Backups age out within 35 days; no manual action required.
5. Billing records are retained for 7 years per Indian tax law.

### 4.2 Data-subject erasure request (GDPR Art. 17 / DPDPA)
1. Receive request at {{PRIVACY_EMAIL}}.
2. Verify identity (within 5 business days).
3. Identify all systems holding the subject's data:
   - Primary Postgres
   - Email provider mailing lists
   - Error tracker
   - Product analytics
   - Audit logs (retain metadata only where required for legal
     compliance — Art. 17(3)(b))
4. Delete or pseudonymise within **30 days** of request.
5. Confirm completion in writing to the requester.
6. Log the deletion in our `data_subject_requests` table.

### 4.3 Specific exclusions from deletion (legal-hold)
Personal data may be retained beyond the schedule above where:
- Required by law (tax records, regulatory investigation).
- Necessary for the establishment, exercise, or defence of legal
  claims.
- Necessary to comply with a court order or government request.

Each legal-hold exception is recorded in the legal-hold register
maintained by the DPO and reviewed quarterly.

## 5. Annual review

This schedule is reviewed annually by the DPO and signed off by an
officer of {{COMPANY_LEGAL_NAME}}. Changes are version-controlled
in this repository.

| Review date | Reviewer | Changes |
|---|---|---|
| [YYYY-MM-DD] | {{DPO_NAME}} | Initial version |

*— End of Data Retention Schedule —*
