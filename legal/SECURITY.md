# Security at Ojas — Trust Statement

> **Status: First-draft template — pending review.**
> Replace `{{PLACEHOLDER}}` values per `REPLACE_BEFORE_PUBLISHING.md`.
> Every claim in this document must be **factually accurate** before
> publishing — do not claim certifications you have not actually
> obtained. Mark items "planned" where not yet achieved.

**Last updated:** [Date]

Security is foundational to **{{COMPANY_SHORT_NAME}}**. This page
describes the technical and organisational controls that protect
Customer Data and the Ojas service. It is intended for security and
procurement teams evaluating Ojas for use.

For the legal commitments on how we process personal data, see the
[Privacy Policy](./PRIVACY_POLICY.md) and the
[Data Processing Addendum](./DPA.md).

For sub-processors, see [`SUBPROCESSORS.md`](./SUBPROCESSORS.md).

For vulnerability reporting, see
[`VULNERABILITY_DISCLOSURE.md`](./VULNERABILITY_DISCLOSURE.md).

## 1. Compliance posture

| Framework | Status as of this update |
|---|---|
| SOC 2 Type I | **In progress** — controls implemented; auditor engagement pending |
| SOC 2 Type II | Planned (12-month observation window starts after Type I) |
| ISO/IEC 27001:2022 | Planned (post-SOC 2) |
| DPDPA 2023 (India) | Compliant by design (privacy-by-default architecture; see DPA) |
| GDPR / UK GDPR | Compliant by design (SCCs in DPA; data minimisation; right-of-access tooling) |
| CCPA / CPRA | Compliant by design (no sale or sharing of personal information) |
| HIPAA | **Not** offered out-of-the-box. Talk to us if you need a BAA |

We will update this page as our certifications progress. We will
not claim a certification we do not hold.

## 2. Architecture and tenancy

- **Multi-tenant, logically isolated.** Every record carries a
  tenant identifier; queries are scoped server-side using
  workspace-level RBAC. No tenant can access another tenant's
  rows.
- **Workspace-level RBAC** with four roles (`admin`, `member`,
  `viewer`, `service`) across nine resource types, enforced on
  every API path.
- **Stateless API tier** that scales horizontally behind a load
  balancer.
- **Inline gateway** with hot-path policies (rate limit, kill
  switch, token budget, prompt-injection scoring, PII redaction)
  before any prompt reaches an upstream LLM.

## 3. Encryption

- **At rest:** AES-256 for all production databases and object
  stores.
- **In transit:** TLS 1.2 minimum, 1.3 preferred. HSTS enforced.
- **Tenant secrets:** Per-tenant **AES-256-GCM** with
  Additional-Authenticated-Data bound to the tenant identifier.
  Decryption fails if the AAD does not match the tenant making the
  request.
- **Backups:** Encrypted with separate keys from primary storage.

## 4. Access control

- **Single sign-on with mandatory 2FA** for every
  {{COMPANY_SHORT_NAME}} staff account.
- **Just-in-time elevation** for production access; no standing
  production privileges.
- **Quarterly access reviews.**
- **Immediate de-provisioning** on personnel change.
- **All admin actions audit-logged** to an immutable log.

## 5. Application security

- Code review is required for every change.
- Static analysis and dependency scanning run in CI.
- Threat modelling for new product surfaces.
- Authenticated penetration test by an independent firm — planned
  once the Service has been live in production for 12 months;
  results summary will be made available to Enterprise customers
  under NDA.
- Bug bounty / responsible-disclosure program
  ([`VULNERABILITY_DISCLOSURE.md`](./VULNERABILITY_DISCLOSURE.md)).

## 6. Data protection features built into the Service

These are user-facing security features Customers can enable to
protect their own data and end-users:

- **PII redaction at the gateway** — Indian PII (Aadhaar, PAN,
  IFSC, Indian-passport, Indian phone), plus global PII (email,
  US/EU phone, credit-card via Luhn check) — applied before
  prompts reach upstream providers, configurable per workspace.
- **Reversible encryption vault** — for redactions that need to
  be unredacted in your own pipeline (per-tenant AES-256-GCM
  keys, AAD-bound).
- **Prompt-injection scoring** — 87-payload library across 8
  categories; configurable block thresholds.
- **Kill switch** — autonomous shutoff when token velocity, error
  rate, or risk score breaches policy.
- **Token budget enforcement** — soft warnings at 80% / 90% /
  100%, hard cap, configurable per model and per hour.
- **Workspace-level RBAC** with four roles and nine resource
  types.
- **SAML 2.0 and OIDC SSO** with JIT user provisioning.
- **Comprehensive audit log** — authentication, RBAC changes,
  policy edits, data exports, admin actions.
- **YAML Policy DSL** — declarative policy authoring with five
  production templates (Strict / Balanced / Permissive /
  India-PII / Demo).
- **Data export** — JSON, NDJSON, CSV, PDF, on demand or via API.

## 7. Reliability and disaster recovery

- **Multi-AZ hot standby** for the primary database.
- **Daily encrypted backups** retained for 35 days.
- **Cross-region encrypted backup copies.**
- **Annual restore-test exercise.**
- **Recovery Point Objective:** ≤ 1 hour for catastrophic loss of
  primary region.
- **Recovery Time Objective:** ≤ 4 hours for catastrophic loss of
  primary region.

## 8. Monitoring and incident response

- 24x7 synthetic monitoring of public endpoints; on-call rotation.
- Anomaly alerting on error rates, latency, kill-switch
  activations.
- Documented incident-response runbook with severity levels,
  escalation, and post-mortem requirements.
- Post-mortem of every Severity-1 incident; summary shared with
  affected Enterprise customers under NDA on request.
- Customer-data-breach notification within 48 hours of confirmed
  breach (per [DPA](./DPA.md) Section 8).

## 9. Vendor and Sub-processor management

- Written DPA in place with each Sub-processor before any Customer
  Data is processed.
- Annual reassessment of Sub-processor security posture and SOC 2
  / ISO 27001 evidence.
- Public sub-processor list maintained at
  [`SUBPROCESSORS.md`](./SUBPROCESSORS.md), with 30-day prior
  notice of changes.

## 10. People

- Background checks (subject to local law) for personnel with
  production access.
- Mandatory annual security and privacy awareness training.
- Written confidentiality and IP-assignment agreements.

## 11. Responsible AI

- We do **not** train any model on Customer Data.
- We do not retain prompts or responses by default; full-content
  storage requires explicit opt-in.
- Built-in guardrails (PII redaction, prompt-injection scoring,
  kill switch) reduce the blast radius of AI misuse.
- We publish a [Acceptable Use Policy](./ACCEPTABLE_USE_POLICY.md)
  that prohibits high-risk and harmful uses of the Service.

## 12. How to ask security questions

| Question type | Contact |
|---|---|
| General security questions | {{SECURITY_EMAIL}} |
| Customer security questionnaire | {{SECURITY_EMAIL}} (we respond to most CAIQ / SIG-Lite within 5 business days) |
| Report a vulnerability | See [`VULNERABILITY_DISCLOSURE.md`](./VULNERABILITY_DISCLOSURE.md) |
| Privacy / data-subject request | {{PRIVACY_EMAIL}} |
| Active incident affecting your account | {{SUPPORT_EMAIL}} (mark "SEV-1") |

For PGP-encrypted communication, our key is at:
`{{COMPANY_WEBSITE}}/.well-known/security.txt`.

*— End of Security Statement —*
