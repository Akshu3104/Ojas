# Data Processing Addendum

> **Status: First-draft template — pending lawyer review.**
> Replace `{{PLACEHOLDER}}` values per `REPLACE_BEFORE_PUBLISHING.md`.
> The SCC annex below must be reviewed against the latest European
> Commission decision and the UK ICO IDTA addendum before signing.

**Effective:** the date the Customer accepts these Terms (or the
date of the most recent Order Form, whichever is later).

This Data Processing Addendum (the **"DPA"**) supplements and forms
part of the master Terms of Service ("Agreement") between
**{{COMPANY_LEGAL_NAME}}** (the **"Processor"** /
**"{{COMPANY_SHORT_NAME}}"**) and the customer that has executed
the Agreement (the **"Controller"** / **"Customer"**), and reflects
the parties' agreement on the processing of Personal Data within
Customer Data.

In the event of a conflict between the Agreement and this DPA, the
DPA controls with respect to processing of Personal Data.

## 1. Definitions

Terms in **bold** that are not defined in this DPA have the meaning
given in the GDPR or, where the data subject is in India, the DPDPA.

1.1 **"GDPR"** means Regulation (EU) 2016/679 and its UK equivalent
the UK Data Protection Act 2018 / UK GDPR.

1.2 **"DPDPA"** means the Digital Personal Data Protection Act,
2023 (India) and any rules made thereunder.

1.3 **"Applicable Data Protection Law"** means GDPR, DPDPA, CCPA/CPRA,
and any other data-protection law applicable to the Customer's use
of the Service.

1.4 **"Personal Data"** means any information relating to an
identified or identifiable natural person that is contained within
Customer Data and processed by {{COMPANY_SHORT_NAME}} on behalf of
the Customer.

1.5 **"Data Subject"** is the natural person to whom Personal Data
relates.

1.6 **"Sub-processor"** means any third party engaged by
{{COMPANY_SHORT_NAME}} to process Personal Data on behalf of the
Customer. Current Sub-processors are listed in
[`SUBPROCESSORS.md`](./SUBPROCESSORS.md).

1.7 **"Standard Contractual Clauses"** or **"SCCs"** means the
clauses approved by the European Commission decision of 4 June
2021, Module Two (controller-to-processor) or Module Three
(processor-to-processor) as applicable.

1.8 **"UK Addendum"** means the International Data Transfer
Addendum to the SCCs issued by the UK Information Commissioner's
Office (version B1.0, 21 March 2022).

## 2. Subject matter and duration

The subject matter, nature, purpose, types of Personal Data, and
categories of Data Subjects are described in **Annex 1**. The
duration of processing is the term of the Agreement, plus any
period required for return or deletion of Personal Data under
Section 11.

## 3. Roles and instructions

3.1 The Customer is the **controller** (or, where the Customer is
itself a processor for its own customers, the processor) of
Personal Data. {{COMPANY_SHORT_NAME}} is the **processor**.

3.2 {{COMPANY_SHORT_NAME}} will process Personal Data only on the
documented instructions of the Customer. The Agreement, the DPA,
the Order Form, and any configuration choices the Customer makes
in the Service constitute the Customer's documented instructions.
Additional or different instructions require a written agreement
between the parties.

3.3 {{COMPANY_SHORT_NAME}} will inform the Customer if, in its
opinion, an instruction infringes Applicable Data Protection Law.

3.4 The Customer warrants that it has all necessary rights,
notices, and consents to provide the Personal Data to
{{COMPANY_SHORT_NAME}} for processing.

## 4. Confidentiality

{{COMPANY_SHORT_NAME}} ensures that its personnel who process
Personal Data are bound by written confidentiality obligations
that survive termination of their engagement.

## 5. Security

5.1 {{COMPANY_SHORT_NAME}} implements appropriate technical and
organizational measures to protect Personal Data, as described in
**Annex 2** and updated from time to time, having regard to the
state of the art, cost of implementation, and the nature,
context, scope, and risks of the processing.

5.2 Without limiting the foregoing, {{COMPANY_SHORT_NAME}} agrees
to maintain, at minimum:
- Encryption of Personal Data at rest (AES-256) and in transit
  (TLS 1.2+).
- Role-based access control with least-privilege defaults.
- Mandatory two-factor authentication for all
  {{COMPANY_SHORT_NAME}} personnel with access to production
  systems.
- A formal vulnerability-management program with monthly
  scanning and timely patching.
- A documented incident-response plan tested at least annually.
- Annual penetration testing by a qualified third party (once the
  Service has been live for at least 12 months).
- Periodic personnel security-awareness training.

## 6. Sub-processors

6.1 The Customer authorises {{COMPANY_SHORT_NAME}} to engage the
Sub-processors listed in [`SUBPROCESSORS.md`](./SUBPROCESSORS.md)
as of the Effective Date.

6.2 {{COMPANY_SHORT_NAME}} will give the Customer 30 days' prior
notice of any addition or replacement of a Sub-processor by
updating [`SUBPROCESSORS.md`](./SUBPROCESSORS.md) and notifying
the Customer's billing contact by email or in-app notification.

6.3 If the Customer reasonably objects to a new Sub-processor on
data-protection grounds within 14 days of notice,
{{COMPANY_SHORT_NAME}} will either (a) not use that Sub-processor
to process the Customer's Personal Data, or (b) accept the
Customer's termination of the Agreement for the affected portion
of the Service with a pro-rata refund of pre-paid fees.

6.4 {{COMPANY_SHORT_NAME}} will impose obligations on each
Sub-processor that are no less protective than those in this DPA.

6.5 {{COMPANY_SHORT_NAME}} remains liable to the Customer for the
acts and omissions of its Sub-processors as if they were its own.

## 7. Data Subject rights

7.1 {{COMPANY_SHORT_NAME}} will, taking into account the nature of
the processing, assist the Customer by appropriate technical and
organizational measures to respond to Data Subject requests under
Applicable Data Protection Law.

7.2 If {{COMPANY_SHORT_NAME}} receives a Data Subject request
relating to Personal Data, it will (where lawful) forward the
request to the Customer without responding and will not respond
without the Customer's prior written instructions, unless legally
required to do so.

## 8. Personal Data breach

8.1 {{COMPANY_SHORT_NAME}} will notify the Customer **without undue
delay, and in any event within 48 hours**, of becoming aware of a
Personal Data breach affecting Customer Personal Data.

8.2 The notice will include, to the extent available:
- The nature of the breach
- Categories and approximate number of Data Subjects concerned
- Categories and approximate number of Personal Data records
  concerned
- Likely consequences
- Measures taken or proposed to address and mitigate the breach

8.3 {{COMPANY_SHORT_NAME}} will provide reasonable assistance to
the Customer in meeting its own breach-notification obligations
under Applicable Data Protection Law.

## 9. Data-protection impact assessments and prior consultation

{{COMPANY_SHORT_NAME}} will provide reasonable cooperation to the
Customer in conducting any DPIA required by Article 35 GDPR or
equivalent law, and in any prior-consultation procedure with a
supervisory authority under Article 36 GDPR.

## 10. International transfers

10.1 Where the Customer's transfer of Personal Data to
{{COMPANY_SHORT_NAME}}, or {{COMPANY_SHORT_NAME}}'s onward transfer
to a Sub-processor, requires a transfer mechanism under Applicable
Data Protection Law, the parties agree:

(a) **EEA / Switzerland → India or other third country:** the
2021 SCCs (Module Two if the Customer is a controller, or Module
Three if a processor) apply and are deemed entered into between
the parties (and onward to relevant Sub-processors). The choices
in the SCCs are completed in **Annex 3**.

(b) **UK → India or other third country:** the UK Addendum
applies, completed in **Annex 3**.

(c) **India → another country (DPDPA cross-border restrictions):**
Personal Data may be transferred outside India unless the
destination country is on a restricted list issued by the Central
Government of India.

10.2 If a transfer mechanism is invalidated (for example, by a
court decision), the parties will negotiate in good faith to put
an alternative mechanism in place within 60 days, failing which
either party may terminate the affected portion of the Agreement.

## 11. Return or deletion

11.1 On termination of the Agreement, {{COMPANY_SHORT_NAME}} will,
at the Customer's choice notified in writing within 30 days of
termination, **return** the Personal Data via the Data Export
feature or **delete** the Personal Data.

11.2 If the Customer does not make a choice within 30 days,
{{COMPANY_SHORT_NAME}} will delete the Personal Data.

11.3 Deletion is subject to backup-retention as described in the
[Data Retention Schedule](./DATA_RETENTION.md). Backups are
encrypted and not accessible for active use; they are overwritten
on a 35-day rolling cycle.

## 12. Audit

12.1 On reasonable prior written notice, the Customer may, no more
than once per twelve-month period, request an audit of
{{COMPANY_SHORT_NAME}}'s processing of Personal Data, except where
a regulator requires more frequent audits.

12.2 The Customer's audit right is satisfied by
{{COMPANY_SHORT_NAME}} providing the Customer, on request, with
the latest SOC 2 / ISO 27001 audit report (once available) and
responses to a reasonable security questionnaire. On-site audits
are permitted only where the above does not provide reasonable
assurance and are conducted by independent auditors at the
Customer's expense, during business hours, with no disruption to
{{COMPANY_SHORT_NAME}}'s operations.

12.3 The auditor must sign a written confidentiality undertaking
on terms reasonably acceptable to {{COMPANY_SHORT_NAME}}.

## 13. Liability

Each party's liability under this DPA is subject to the
limitations and exclusions in the Agreement.

## 14. Order of precedence

In the event of conflict between this DPA and the SCCs (Annex 3),
the SCCs control. In all other cases, the DPA controls over the
Agreement with respect to processing of Personal Data.

## 15. Governing law

This DPA is governed by the law specified in the Agreement,
except that the SCCs in Annex 3 are governed by the laws of
Ireland (or as required by the SCCs themselves).

---

## Annex 1 — Details of processing

**Nature and purpose of processing:** Operation of the Ojas
service — routing LLM requests through the gateway, applying
policy controls (PII redaction, prompt-injection scoring, kill
switch, token budgets), generating telemetry and audit logs,
producing dashboards, and providing related features.

**Subject matter:** Personal Data contained in (a) Customer
account records, (b) telemetry metadata, (c) optionally, the
content of prompts and responses where the Customer has enabled
debugging or red-team capture.

**Duration:** The term of the Agreement plus the period in
Section 11.

**Types of Personal Data:**
- Identity data: name, work email, role, IdP `sub` claim
- Contact data: work email
- Technical data: IP address, user-agent
- Usage data: dashboard navigation, feature adoption
- (Where enabled) prompt and response content, which may
  incidentally contain any category of Personal Data the Customer
  or its end-users include

**Categories of Data Subjects:**
- Customer's employees, contractors, and other authorised users
- Customer's own end-users whose data may appear in prompts
  (incidental)

**Sensitive categories (Article 9 GDPR / DPDPA Section 2(t)):**
Not processed by design. If the Customer transmits sensitive data
through the Service, it does so on its own behalf and must
configure appropriate redaction.

**Recipients of Personal Data:**
{{COMPANY_SHORT_NAME}}'s authorized personnel, plus Sub-processors
listed in [`SUBPROCESSORS.md`](./SUBPROCESSORS.md).

**Transfers to third countries:** As described in Section 10.

---

## Annex 2 — Technical and organizational measures

The following describes the technical and organizational measures
implemented by {{COMPANY_SHORT_NAME}} as of the Effective Date.
These measures may be updated from time to time, provided the
overall level of protection is not reduced.

### A. Access control
- Single sign-on with mandatory 2FA for all employee accounts.
- Role-based access control to production systems with
  least-privilege defaults.
- Quarterly access review.
- Immediate revocation on personnel change.
- Encrypted bastion / VPN-only access to production.

### B. System and network security
- All web traffic terminates at a WAF and rate-limited reverse
  proxy.
- Mandatory TLS 1.2+ (1.3 preferred) for all client-server and
  server-to-Sub-processor traffic.
- Encryption at rest for all production data stores using
  AES-256.
- Per-tenant AES-256-GCM encryption for tenant secrets, with AAD
  bound to tenant identifier.
- Regular vulnerability scanning of infrastructure and
  third-party dependencies; CVSS-7+ patched within 14 days, plus
  same-day for actively-exploited CVEs.

### C. Application security
- Secure software development lifecycle including code review,
  static analysis, dependency scanning, and pre-merge tests.
- Threat modelling for new product surfaces.
- Bug bounty / responsible-disclosure program (see
  [`VULNERABILITY_DISCLOSURE.md`](./VULNERABILITY_DISCLOSURE.md)).

### D. Data segregation
- Logical multi-tenancy with tenant-id row scoping at the
  database layer.
- Workspace-level RBAC enforced server-side on every
  data-access path.

### E. Logging and monitoring
- Centralized, immutable audit logs of authentication, RBAC
  changes, policy edits, data exports, and admin actions.
- 24x7 alerting on anomalies; on-call rotation with escalation
  paths.

### F. Backups and disaster recovery
- Encrypted backups taken on a regular cadence.
- Backups stored in a geographically distinct region from
  primary.
- Annual restore-test exercise.

### G. Personnel
- Background checks (subject to local law) for personnel with
  access to production data.
- Mandatory annual security and privacy training.
- Confidentiality and IP-assignment agreements.

### H. Incident response
- Documented incident-response plan with severity levels and
  notification timelines.
- Internal post-mortem of every Severity-1 incident.
- Customer notification within 48 hours of confirmed Personal
  Data breach (see Section 8).

### I. Sub-processor governance
- Written agreement with each Sub-processor incorporating
  equivalent obligations.
- Annual reassessment of Sub-processor security posture.

---

## Annex 3 — Standard Contractual Clauses (Module 2 / Module 3)

By signing the Agreement and this DPA, the parties enter into the
SCCs as approved by Commission Implementing Decision (EU)
2021/914 of 4 June 2021. The following choices apply:

- **Module:** Module Two (controller-to-processor) if the
  Customer is a controller; Module Three (processor-to-processor)
  if the Customer is itself a processor.
- **Docking clause (Clause 7):** Used. Additional parties may
  accede.
- **Sub-processor approval (Clause 9):** Option 2 — General
  authorisation, with the 30-day notice procedure in Section 6 of
  this DPA.
- **Clause 11 (independent dispute resolution):** Not used.
- **Clause 17 (governing law):** Irish law.
- **Clause 18 (jurisdiction):** Irish courts.
- **Annex I.A — List of parties:** the Customer and
  {{COMPANY_LEGAL_NAME}}, with contact details on the Order Form
  and Section 16 of the Privacy Policy.
- **Annex I.B — Description of transfer:** As set out in Annex 1
  of this DPA.
- **Annex I.C — Competent supervisory authority:** Irish DPC.
- **Annex II — Technical and organisational measures:** As set
  out in Annex 2 of this DPA.
- **Annex III — Sub-processors:** As listed in
  [`SUBPROCESSORS.md`](./SUBPROCESSORS.md).

### UK Addendum (where applicable)
Where the data exporter is in the UK, the UK Addendum (version
B1.0) is incorporated and the parties select:
- **Table 1 (parties and key contact information):** As per
  Annex 1 of this DPA.
- **Table 2 (Approved EU SCCs):** The SCCs above.
- **Table 3 (Appendix information):** As per Annexes 1–3 of this
  DPA.
- **Table 4 (Ending the Addendum when the Approved Addendum
  changes):** Either party may end the Addendum as set out in
  Section 19 of the UK Addendum.

*— End of DPA —*
