# Privacy Policy

> **Status: First-draft template — pending lawyer review.**
> Do not publish without redlining by a qualified privacy lawyer.
> Replace every `{{PLACEHOLDER}}` per `REPLACE_BEFORE_PUBLISHING.md`.

**Last updated:** [Date of lawyer-approved version]
**Effective date:** [Date document goes live]

This Privacy Policy explains how **{{COMPANY_LEGAL_NAME}}**
(**"{{COMPANY_SHORT_NAME}}"**, **"we"**, **"us"**, **"our"**) collects,
uses, discloses, and protects personal data. It applies to the Ojas
service, our website at {{COMPANY_WEBSITE}}, our SDKs, our VS Code
extension, and any related communications.

If you are an enterprise customer, our processing of personal data
within data you submit (your "Customer Data") is governed by the
[Data Processing Addendum](./DPA.md) and we act as a **data processor
/ data fiduciary (where applicable)** for that data.

## 1. Who we are

**Data controller / data fiduciary:** {{COMPANY_LEGAL_NAME}},
{{COMPANY_ADDRESS}}. CIN: {{COMPANY_CIN}}.

**Privacy contact:** {{PRIVACY_EMAIL}}
**Data Protection Officer:** {{DPO_NAME}}
**EU representative (GDPR Art. 27):** {{EU_REP_NAME}}

## 2. Data we collect

### 2.1 Account data
When you sign up:
- Full name
- Email address
- Hashed password (we never store the plaintext)
- Display preferences, locale, time zone
- Optional: SSO identifier (`sub` claim from your OIDC/SAML IdP)

### 2.2 Billing data
When you subscribe to a paid plan:
- Billing contact name and email
- Billing address (collected by our payment processor)
- GSTIN, if applicable
- Last four digits and brand of the payment instrument (we **never**
  see the full card number — it goes directly to our payment processor)
- Invoice history

### 2.3 Service usage data
When you use the Ojas service:
- API metadata: token counts, model name, latency, error codes,
  timestamps
- Gateway audit metadata: request fingerprints, blocked-request
  counts, policy-match counts
- Cost analytics: per-model, per-tenant, per-time-window cost
  aggregates
- Red-team metadata: scan counts, severity histograms, score trends
- Audit log entries for authentication, role changes, policy edits,
  data exports

By default we do **not** store the full content of prompts or
responses. Full content is stored only if you explicitly enable a
debugging, replay, or red-team-capture feature in your workspace
settings — and even then we apply automated PII redaction first
unless you turn it off.

### 2.4 Identity claims received via SSO
When you sign in via SAML or OIDC, your identity provider sends us:
- Subject (`sub` claim)
- Email
- Display name
- (Optional) Group claims and other custom attributes

We use these only to authenticate you and provision your account.
Group claims are stored as metadata; they are never used to
automatically grant elevated permissions.

### 2.5 Diagnostic and technical data
We automatically collect:
- IP address (truncated to /24 for analytics; full IP retained in
  security audit logs for 90 days)
- User-agent string and approximate device class
- Page interactions (anonymous, aggregated by our analytics
  provider — see [SUBPROCESSORS.md](./SUBPROCESSORS.md))
- Crash and error reports

### 2.6 Cookies
See the [Cookie Policy](./COOKIE_POLICY.md) for the full list of
cookies, their purpose, duration, and how to opt out.

### 2.7 Data we do NOT collect
- Biometric data
- Location data more granular than country (derived from IP)
- Health information
- Children's data (the Service is not directed to anyone under 18)
- Financial-account numbers
- Plaintext payment-card data
- Government-issued ID numbers, except a GSTIN you voluntarily
  provide for invoicing

## 3. How we use your data

We use personal data for the following purposes and on the legal
bases below. Where multiple bases could apply, the one shown is the
primary basis for that purpose.

| Purpose | Categories of data | Legal basis (GDPR / DPDPA) |
|---|---|---|
| Create, authenticate, and operate your account | Account, SSO claims, diagnostic | Contract (Art. 6(1)(b) GDPR / S. 7(a) DPDPA — necessary to provide the Service) |
| Process payments and produce GST-compliant invoices | Billing | Contract + legal obligation (Art. 6(1)(b)/(c) GDPR; Indian GST law) |
| Provide the Ojas Service: route LLM requests, scan for PII, enforce policies, render dashboards | Service usage | Contract |
| Detect abuse, secure the Service, debug | Diagnostic, audit logs | Legitimate interests (Art. 6(1)(f) GDPR — operating a secure service) |
| Send service-related emails (security notices, billing, outage notifications) | Account, billing | Contract |
| Send marketing emails about new features | Account | Consent (Art. 6(1)(a) GDPR — you can opt out in settings) |
| Comply with law and respond to legal process | Any | Legal obligation (Art. 6(1)(c) GDPR) |
| Improve the Service using aggregated, de-identified analytics | Service usage (de-identified) | Legitimate interests |

**We will not use the content of your prompts, responses, or Customer
Data to train generally available AI models.** Aggregated,
de-identified telemetry (e.g. "P95 gateway latency was 412 ms last
week") may be used to improve our internal systems.

## 4. How we share data

We share personal data only:

### 4.1 With sub-processors
We engage third-party service providers to host infrastructure,
process payments, send transactional emails, and analyze product
usage. Each sub-processor is bound by a written agreement to process
data only on our instructions and to maintain appropriate security.
The full list is at [`SUBPROCESSORS.md`](./SUBPROCESSORS.md).

### 4.2 With upstream LLM providers
When you send a prompt through the Ojas gateway, the prompt is
forwarded to the LLM provider you have configured (OpenAI, Anthropic,
Bedrock, etc.). Their privacy practices apply to that data. We
recommend you review each provider's privacy policy and configure
data-retention controls (e.g. OpenAI's zero-data-retention setting,
Anthropic's HIPAA-eligible endpoints) where appropriate.

### 4.3 With your administrators
If you joined an Ojas workspace as an Authorized User, the
workspace's administrators can see your name, email, role, last
sign-in time, and the audit log of your actions within that
workspace.

### 4.4 With other customers — never
We do not share, sell, or rent personal data to other Ojas customers
or to advertisers.

### 4.5 Legal disclosures
We may disclose personal data if required by valid legal process
(court order, subpoena, statute), to enforce our agreements, or to
protect the rights, property, or safety of {{COMPANY_SHORT_NAME}},
our users, or the public. Where legally permitted, we will give you
prior notice.

### 4.6 Business transfers
If we are involved in a merger, acquisition, asset sale, or
bankruptcy, your data may be transferred to the successor entity.
We will notify you and the new entity will be bound by terms at
least as protective as this Policy.

## 5. International transfers

We are headquartered in India. Personal data we process may be
transferred to, and stored in, countries other than the one you
reside in.

### 5.1 Transfers out of the EEA / UK / Switzerland
For transfers out of the European Economic Area, the United Kingdom,
or Switzerland, we rely on:
- **Standard Contractual Clauses (SCCs)** — Module 2 (controller-to-
  processor) or Module 3 (processor-to-processor) as applicable,
  incorporated into our DPA.
- **Adequacy decisions** where the destination country is recognized
  by the European Commission as offering adequate protection.

### 5.2 Transfers out of India under DPDPA
Cross-border transfers from India are permitted under the Digital
Personal Data Protection Act, 2023 except to countries specifically
restricted by the Central Government. As of this Policy's effective
date, no countries are on the restricted list. We will update this
section if that changes.

## 6. Data retention

We retain personal data for the periods described in the
[Data Retention Schedule](./DATA_RETENTION.md). Summary:

| Category | Retention |
|---|---|
| Account profile | Active duration of your account + 90 days |
| Billing records | 7 years (Indian tax law) |
| Gateway audit logs (metadata) | 12 months |
| Gateway audit logs (full request/response, only if enabled) | 30 days |
| Security audit logs (full IP, user-agent) | 90 days |
| Backups | Encrypted, 35-day rolling window |
| Aggregated, de-identified telemetry | Indefinitely (no longer personal data) |

After expiry, we delete or de-identify the data using a documented
process.

## 7. Your rights

Subject to applicable law, you have the right to:
- **Access** the personal data we hold about you
- **Rectify** inaccurate data
- **Erase** your data ("right to be forgotten") — subject to lawful
  retention periods
- **Restrict** processing
- **Port** your data in a structured, machine-readable format
- **Object** to processing based on legitimate interests or to
  marketing
- **Withdraw consent** at any time (without affecting prior
  processing)
- **Lodge a complaint** with your supervisory authority

To exercise any of these rights, write to {{PRIVACY_EMAIL}}. We will
respond within 30 days (or sooner if required by law). We may
verify your identity before acting on a request.

### India-specific (DPDPA 2023)
If you are an Indian resident, you also have the right to:
- Nominate another individual to exercise your rights in case of
  death or incapacity
- Grievance redressal — write to our DPO at {{PRIVACY_EMAIL}}; if
  not resolved within 7 days you may approach the Data Protection
  Board of India

### EU / UK
You may lodge a complaint with the data-protection authority in
your country of residence. The Irish DPC ([dataprotection.ie](https://www.dataprotection.ie))
is our lead supervisory authority for EU operations once we have
appointed an EU representative.

### California
California residents have additional rights under the California
Consumer Privacy Act, including the right to opt out of "sales" or
"sharing" of personal information. **We do not sell or share
personal information.** Submit California-specific requests to
{{PRIVACY_EMAIL}}.

## 8. Security

We protect personal data using a combination of administrative,
technical, and physical safeguards described in our
[Security Statement](./SECURITY.md). Highlights:
- AES-256 encryption at rest
- TLS 1.2+ in transit
- AES-256-GCM for tenant secrets (per-tenant keys, AAD-bound)
- Mandatory 2FA for {{COMPANY_SHORT_NAME}} staff
- Principle-of-least-privilege access to customer data
- Audit logging of every administrative action
- 24x7 security monitoring with on-call escalation

No system is perfectly secure. If we become aware of a personal-
data breach affecting you, we will notify you and, where required,
the relevant authority within 72 hours of discovery.

## 9. Children

The Service is not directed to, and we do not knowingly collect
data from, anyone under 18. If you believe we have inadvertently
collected such data, contact {{PRIVACY_EMAIL}} and we will delete
it.

## 10. Automated decision-making

The Service uses automated systems to score risk (Unified Risk
Score Engine), classify content (PII redaction, prompt-injection
detection), and decide whether to block individual API requests
(kill-switch, token-budget enforcement). These decisions are made
on the basis of objective rules and thresholds you configure; they
do not produce legal effects on you as a natural person. You can
override most automated decisions through workspace settings.

We do not engage in profiling for advertising or evaluation of
individuals beyond the scope necessary to operate the Service.

## 11. Marketing

If you opt in, we may send you product updates, feature
announcements, and educational content. You can unsubscribe at any
time from the link in any marketing email, or by writing to
{{PRIVACY_EMAIL}}. Unsubscribing does not affect transactional
emails (billing, security notices, outage alerts).

## 12. Changes to this Policy

We will post material changes to this Policy on {{COMPANY_WEBSITE}}
and notify Customers by email at least 30 days before the new
version takes effect. The "Last updated" date at the top of this
Policy shows the most recent revision.

## 13. Contact us

For privacy questions or to exercise your rights:
**{{PRIVACY_EMAIL}}**

For postal mail:
{{COMPANY_LEGAL_NAME}}
Attn: Data Protection Officer
{{COMPANY_ADDRESS}}

*— End of Privacy Policy —*
