# Ojas — Legal Documents

This folder contains the public-facing legal documents that govern use
of the Ojas service.  Every document in this folder is a **first-draft
template** — drafted by an engineer to give your lawyer a solid
starting point, **not** a substitute for legal review.

> ⚠️  **REVIEW STATUS — read this before you publish any of these:**
>
> 1. These drafts assume your operating entity is **Ojas Technologies
>    Private Limited**, incorporated under the Companies Act, 2013 of
>    India, with its registered office in Bengaluru, Karnataka.  If
>    those facts change, every document needs the find-replace pass
>    described in `REPLACE_BEFORE_PUBLISHING.md`.
> 2. Indian SaaS-law specifics (DPDPA 2023, IT Act 2000, Consumer
>    Protection Act, GST invoicing rules) are reflected in the drafts
>    but **must be confirmed by a licensed advocate** before publishing.
> 3. Cross-border data-transfer language (GDPR SCCs, UK IDTA, US
>    state laws, Indian DPDPA cross-border restrictions) is included
>    but **needs review by a privacy lawyer** before you sign a DPA
>    with any EU/UK/US customer.
> 4. Limitation-of-liability caps, indemnity carve-outs, and governing
>    law/jurisdiction clauses are commercial decisions — your lawyer
>    will tune these based on your insurance, customer size, and risk
>    appetite.
>
> **Do not publish, sign, or attach these documents to a contract
> until they have been reviewed by a qualified lawyer.**  A label of
> "draft" on the page or in the contract preamble is not a substitute
> for the review.

---

## Document index

### Public-facing (link from your website footer)

| File | Purpose | Who reads it |
|---|---|---|
| [`TERMS_OF_SERVICE.md`](./TERMS_OF_SERVICE.md) | Master agreement governing all use of Ojas | Every user, every customer |
| [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md) | What personal data we collect, why, how long, your rights | Every user, regulators |
| [`COOKIE_POLICY.md`](./COOKIE_POLICY.md) | What cookies we set and how to opt out | EU/UK visitors, regulators |
| [`ACCEPTABLE_USE_POLICY.md`](./ACCEPTABLE_USE_POLICY.md) | What you may NOT do with Ojas | Every user |
| [`SLA.md`](./SLA.md) | Uptime commitment + service credits | Paid customers |
| [`REFUND_POLICY.md`](./REFUND_POLICY.md) | When you can get your money back | Paying users |
| [`VULNERABILITY_DISCLOSURE.md`](./VULNERABILITY_DISCLOSURE.md) | How security researchers should report bugs | Security researchers |

### Enterprise / B2B contract attachments

| File | Purpose | Attached when |
|---|---|---|
| [`DPA.md`](./DPA.md) | Data Processing Addendum w/ SCCs annex | Customer asks (all EU customers will) |
| [`SUBPROCESSORS.md`](./SUBPROCESSORS.md) | List of third-parties that process customer data | Always available on website |
| [`SECURITY.md`](./SECURITY.md) | Security posture / trust whitepaper | Pre-sales due-diligence |
| [`NDA_MUTUAL.md`](./NDA_MUTUAL.md) | Mutual non-disclosure agreement | Before any pre-contract conversation involving customer secrets |
| [`DATA_RETENTION.md`](./DATA_RETENTION.md) | Internal data-retention schedule | Reference for support + compliance |
| [`RoPA.md`](./RoPA.md) | Records of Processing Activities (GDPR Art. 30 / DPDPA equivalent) | Regulator on request, internal compliance |

### Product-specific

| File | Purpose | Where it lives |
|---|---|---|
| [`VSCODE_EULA.md`](./VSCODE_EULA.md) | End-User License Agreement for the VS Code extension | Required by VS Code Marketplace at publish time |

### Internal / setup checklists (do not publish)

| File | Purpose |
|---|---|
| [`INCORPORATION_CHECKLIST.md`](./INCORPORATION_CHECKLIST.md) | Step-by-step list of company-formation and tax-registration tasks only you can do |
| [`REPLACE_BEFORE_PUBLISHING.md`](./REPLACE_BEFORE_PUBLISHING.md) | Find-replace cheat sheet for every placeholder string across the legal docs |

---

## Publishing checklist

When you're ready to go live:

1. ☐ Incorporate the company (see `INCORPORATION_CHECKLIST.md`).
2. ☐ Get GST + PAN + TAN + bank account.
3. ☐ Have a qualified lawyer review every document in this folder.
4. ☐ Run the find-replace pass from `REPLACE_BEFORE_PUBLISHING.md`.
5. ☐ Publish to your website at `/legal/<slug>` and link from the footer.
6. ☐ Publish `client/public/.well-known/security.txt` with your real
       security contact + PGP key.
7. ☐ Email an updated DPA to any customer currently in flight.
8. ☐ Set a calendar reminder for an annual review of every document.

---

## Drafting decisions you should be aware of

- **Limitation of liability** is set to the **greater of (a) fees paid
  in the trailing 12 months or (b) ₹100,000** — common for early-stage
  SaaS but your customer's procurement team will push to remove the
  ₹100,000 floor.  Decide your walk-away position before the
  conversation.
- **Indemnification** is mutual but capped at the same liability cap.
  IP indemnity is given by you to the customer (you'll defend them if
  Ojas infringes someone else's patent); the customer indemnifies you
  for misuse and for content they submit.
- **Governing law** is Karnataka, India.  Jurisdiction is the courts
  of Bengaluru.  Arbitration clause uses MCIA rules — talk to your
  lawyer about whether you want SIAC or LCIA for international
  customers.
- **Cross-border data transfer** out of India is permitted under
  DPDPA 2023 except to countries on the (currently empty) restricted
  list.  GDPR transfers out of the EEA use Module 2 of the 2021 SCCs.
- **Data residency**: customer data is stored in the AWS Mumbai
  region by default.  If a customer needs strict EU residency you
  must spin up a Frankfurt deployment first — don't promise it in a
  contract before the deployment exists.
- **Sub-processor change notification**: 30 days, opt-out by
  termination.  Some enterprises want 60 days — fine to concede.
- **Audit rights**: the DPA gives the customer a SOC 2 / ISO 27001
  report once you have one.  On-site audits are at customer's cost
  and capped to once per year.

---

## Versioning

Each document carries a `Last updated` date.  When you change
substantive terms (price, scope, liability cap), bump the date and
email every active customer 30 days before the change takes effect.
Minor edits (typos, formatting) do not require notice.
