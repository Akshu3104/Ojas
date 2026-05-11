# Records of Processing Activities

> **Status: First-draft template — pending review.**
> Replace `{{PLACEHOLDER}}` values per `REPLACE_BEFORE_PUBLISHING.md`.
> This document is internal and is produced for regulators on
> request (Art. 30 GDPR; DPDPA equivalent reporting).

**Controller:** {{COMPANY_LEGAL_NAME}}
**Address:** {{COMPANY_ADDRESS}}
**Contact:** {{DPO_NAME}} — {{PRIVACY_EMAIL}}
**EU representative:** {{EU_REP_NAME}}

**Last updated:** [Date]
**Review cadence:** Quarterly

This Record of Processing Activities (RoPA) is maintained under
Article 30 of the GDPR and the equivalent obligation under the
Digital Personal Data Protection Act, 2023 (India). It describes
each processing activity carried out by {{COMPANY_LEGAL_NAME}}.

---

## Activity 1 — User account management

| Field | Value |
|---|---|
| Controller | {{COMPANY_LEGAL_NAME}} |
| Purpose | Create and manage user accounts; authenticate sign-ins |
| Lawful basis (GDPR) | Art. 6(1)(b) Contract |
| Lawful basis (DPDPA) | S. 7(a) Performance of a contract |
| Categories of Data Subjects | Customers' end-users, free-tier signups |
| Categories of personal data | Name, email, hashed password, IdP `sub`, role, last sign-in time, sign-in IP, user-agent |
| Recipients | Internal staff (production access); IdP (if SSO configured) |
| Cross-border transfer | Yes — primary processing in {{HOSTING_REGION}}; international SaaS providers per [SUBPROCESSORS.md](./SUBPROCESSORS.md) |
| Transfer safeguard | SCCs / DPDPA cross-border permissions |
| Retention | Active account + 90 days |
| Security measures | Encryption at rest (AES-256), TLS 1.2+ in transit, mandatory 2FA for staff, RBAC |

---

## Activity 2 — Billing and invoicing

| Field | Value |
|---|---|
| Controller | {{COMPANY_LEGAL_NAME}} |
| Purpose | Charge customers; issue GST-compliant invoices |
| Lawful basis (GDPR) | Art. 6(1)(b) Contract + Art. 6(1)(c) Legal obligation |
| Lawful basis (DPDPA) | S. 7(a) Contract + S. 7(b) Legal obligation |
| Categories of Data Subjects | Billing contacts |
| Categories of personal data | Name, billing email, billing address, GSTIN, payment-method last-4 |
| Recipients | Payment processor (Stripe / Razorpay); internal billing; tax authorities |
| Cross-border transfer | Payment-processor primary may be US (Stripe) or India (Razorpay) |
| Transfer safeguard | Processor's own SCCs / India processor for Indian customers |
| Retention | 7 years (Indian tax law) |
| Security measures | Last-4 only — no PAN handling by Ojas; TLS 1.2+; processor PCI-DSS Level 1 |

---

## Activity 3 — Gateway request logging (metadata)

| Field | Value |
|---|---|
| Controller | Customer (as data controller of own use) — Ojas is processor |
| Purpose | Provide service: token counting, cost analytics, anomaly detection, billing |
| Lawful basis (GDPR) | Art. 6(1)(b) Contract |
| Lawful basis (DPDPA) | S. 7(a) Contract |
| Categories of Data Subjects | Customer's own end-users (incidental, where present in prompt metadata) |
| Categories of personal data | None by design (token counts, model name, timestamp, latency) — masked-content fingerprints stored without raw content |
| Recipients | Customer's workspace administrators; upstream LLM provider for the request itself |
| Cross-border transfer | Yes — to upstream LLM providers as configured by Customer |
| Transfer safeguard | SCCs in DPA; Customer chooses providers |
| Retention | 12 months active; 7 years cold |
| Security measures | Per-tenant scoping, RBAC, encryption at rest |

---

## Activity 4 — Gateway request logging (full content, opt-in)

| Field | Value |
|---|---|
| Controller | Customer — Ojas is processor |
| Purpose | Debugging, red-team capture, audit (only when Customer enables) |
| Lawful basis (GDPR) | Art. 6(1)(b) Contract |
| Lawful basis (DPDPA) | S. 7(a) Contract |
| Categories of Data Subjects | Customer's own end-users (incidental) |
| Categories of personal data | Whatever Customer or end-users put into prompts; redaction applied unless disabled |
| Recipients | Customer's workspace administrators only |
| Cross-border transfer | Storage in {{HOSTING_REGION}} |
| Transfer safeguard | DPA Section 10 |
| Retention | **30 days** |
| Security measures | Per-tenant S3 prefix, signed URLs, lifecycle deletion, encryption with per-tenant KEKs |

---

## Activity 5 — Security audit logs

| Field | Value |
|---|---|
| Controller | {{COMPANY_LEGAL_NAME}} |
| Purpose | Detect and investigate security incidents; comply with DPA breach-notification obligations |
| Lawful basis (GDPR) | Art. 6(1)(f) Legitimate interests — operating a secure service |
| Lawful basis (DPDPA) | S. 7(a) (Service operation) and S. 7(b) (Legal obligation, where applicable) |
| Categories of Data Subjects | Customer's end-users; visitors; Ojas staff |
| Categories of personal data | IP address, user-agent, action, timestamp, account ID |
| Recipients | Internal security team |
| Cross-border transfer | {{HOSTING_REGION}} |
| Transfer safeguard | Primary processing within designated hosting region |
| Retention | 90 days |
| Security measures | Append-only, immutable log; staff access logged |

---

## Activity 6 — Sub-processor management

| Field | Value |
|---|---|
| Controller | {{COMPANY_LEGAL_NAME}} |
| Purpose | Onboard and govern third-party processors |
| Lawful basis | Art. 6(1)(f) Legitimate interests (vendor governance) |
| Categories of Data Subjects | Sub-processor employees (limited contact data) |
| Categories of personal data | Name, work email, role of Sub-processor contacts |
| Recipients | Internal procurement, legal, security |
| Cross-border transfer | None other than to Sub-processors themselves |
| Retention | Sub-processor relationship + 7 years |

---

## Activity 7 — Customer support tickets

| Field | Value |
|---|---|
| Controller | {{COMPANY_LEGAL_NAME}} |
| Purpose | Respond to customer enquiries |
| Lawful basis | Art. 6(1)(b) Contract; or Art. 6(1)(f) for free-tier |
| Categories of Data Subjects | Customer staff who open tickets |
| Categories of personal data | Name, email, ticket content, any screenshots they attach |
| Recipients | Support staff; engineering for escalations |
| Cross-border transfer | {{HOSTING_REGION}} |
| Retention | 24 months |

---

## Activity 8 — Marketing email (opt-in)

| Field | Value |
|---|---|
| Controller | {{COMPANY_LEGAL_NAME}} |
| Purpose | Send product announcements and educational content |
| Lawful basis | Art. 6(1)(a) Consent — opt-in only |
| Categories of Data Subjects | Subscribers |
| Categories of personal data | Email; engagement metrics |
| Recipients | Email service provider |
| Cross-border transfer | Provider-dependent |
| Retention | 12 months after last engagement, or until opt-out |
| Security measures | Provider's own controls; rapid unsubscribe |

---

## Activity 9 — Recruitment

| Field | Value |
|---|---|
| Controller | {{COMPANY_LEGAL_NAME}} |
| Purpose | Evaluate and hire candidates |
| Lawful basis | Art. 6(1)(b) Steps prior to entering a contract; consent for sensitive fields |
| Categories of Data Subjects | Job applicants |
| Categories of personal data | CV, interview notes, references |
| Recipients | Hiring panel; ATS provider |
| Cross-border transfer | ATS provider; references in applicant's country |
| Retention | 12 months from application close |

---

## Activity 10 — Internal staff records

| Field | Value |
|---|---|
| Controller | {{COMPANY_LEGAL_NAME}} |
| Purpose | Employment administration |
| Lawful basis | Contract; legal obligation; legitimate interests |
| Categories of Data Subjects | Employees and contractors |
| Categories of personal data | Statutory employment data |
| Recipients | HR system; statutory authorities |
| Retention | Employment + 7 years (statutory) |

---

## Review log

| Review date | Reviewer | Notes |
|---|---|---|
| [YYYY-MM-DD] | {{DPO_NAME}} | Initial version |

*— End of RoPA —*
