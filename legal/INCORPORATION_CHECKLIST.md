# Incorporation & Pre-Launch Checklist

> **Internal — do not publish.**
> This is the ordered list of things only **you** (the founder) can
> do, and that must be completed before Ojas can lawfully take paid
> revenue or sign an enterprise contract.  None of these are
> engineering tasks.

The list assumes:
- Country of incorporation: **India**
- Founder is an Indian citizen
- Default state: **Karnataka**
- Brand: **Ojas**

If any of those assumptions are wrong, swap providers and timelines
accordingly.

Status legend: ☐ Not started · ◐ In progress · ☑ Done

---

## Phase 1 — Stand up the legal entity (week 1–3)

| # | Task | How | Cost (approx.) | Status |
|---|---|---|---|---|
| 1.1 | Decide entity type | Private Limited recommended (limits liability, scales for funding). LLP fine if no plan to raise outside India. Sole Proprietorship not suitable for SaaS taking customer data. | — | ☐ |
| 1.2 | Reserve company name | MCA RUN service. Apply for "Ojas Technologies Private Limited" + 1 backup ("Ojas Cyber Private Limited"). | ₹1,000 | ☐ |
| 1.3 | Get Digital Signature Certificate (DSC) for directors | eMudhra / Sify / Vsign | ₹1,500–2,500 / director | ☐ |
| 1.4 | Get Director Identification Number (DIN) for each director | Filed with SPICe+ form | Included with SPICe+ | ☐ |
| 1.5 | File SPICe+ form (incorporation) | MCA portal — combines incorporation + PAN + TAN + EPFO + ESIC + GSTIN (if opted) | ₹0 govt fee for authorized capital up to ₹15 lakh; agent fees ₹3,000–10,000 | ☐ |
| 1.6 | Draft and adopt MoA + AoA | Use SPICe-MoA / SPICe-AoA on MCA portal; review with company-secretary | Included | ☐ |
| 1.7 | Receive Certificate of Incorporation + CIN | MCA emails the CoI; CIN appears on the portal | — | ☐ |
| 1.8 | Receive PAN and TAN | Automatic with SPICe+ | — | ☐ |
| 1.9 | Open a current account in the company's name | Bank of your choice; bring CoI + MoA/AoA + PAN + ID + address proof | Bank charges | ☐ |
| 1.10 | Deposit subscriber capital | Within 60 days of incorporation; transfer per MoA | Capital you committed | ☐ |
| 1.11 | File INC-20A (declaration of commencement) | Within 180 days; required before doing business | ₹0 govt; ₹500 agent | ☐ |
| 1.12 | Register on Udyam (MSME) if eligible | udyamregistration.gov.in | Free; unlocks payment-protection law | ☐ |

**Estimated calendar time:** 10–14 business days end-to-end.
**Recommended vendor:** Vakilsearch / IndiaFilings / Razorpay
Rize — all do the entire stack for ₹10–25k. Skip if you have a
company-secretary contact.

---

## Phase 2 — Tax registrations (week 2–4, in parallel with Phase 1)

| # | Task | How | Status |
|---|---|---|---|
| 2.1 | GST registration | gst.gov.in. **Required** for any inter-state SaaS revenue and for any revenue at all if turnover crosses ₹20 lakh / ₹40 lakh. Apply now — registration is free, voluntary registration is fine. | ☐ |
| 2.2 | Professional Tax registration | State-level (Karnataka). Required to pay employee PT. | ☐ |
| 2.3 | ESIC registration | Required if you employ 10+ people. | ☐ |
| 2.4 | EPFO registration | Required at 20+ employees, voluntary earlier. | ☐ |
| 2.5 | Choose GST scheme | Default regular scheme; composition scheme is not available for SaaS. | ☐ |
| 2.6 | Set up GST-compliant invoicing | Zoho Books / Xero / Razorpay Invoice — make sure invoices include CIN, GSTIN, HSN/SAC code (998313 for software services), place-of-supply, IGST/CGST/SGST split. | ☐ |
| 2.7 | Optional: LUT for export of services | Required to invoice export customers without GST. File on GST portal. | ☐ |

---

## Phase 3 — Brand and IP (week 1, in parallel)

| # | Task | How | Cost (approx.) | Status |
|---|---|---|---|---|
| 3.1 | Lock in the brand name | Search trademark database (ipindiaonline.gov.in) for "Ojas". You will find many existing registrations — check Class 9 (software) and Class 42 (SaaS) specifically. | Free | ☐ |
| 3.2 | File trademark application | Class 9 + Class 42; combined application is cheaper. **You can use ™ from the day of filing**, even before registration. | ₹4,500 / class for individual/MSME, ₹9,000 / class otherwise | ☐ |
| 3.3 | Buy the .com (and .in, .ai) | Namecheap, Cloudflare Registrar, or GoDaddy. Lock the domain with 2FA. | ₹5,000–50,000 depending on availability | ☐ |
| 3.4 | Brand-safe handles on socials | At minimum: GitHub org, Twitter/X, LinkedIn, YouTube. Reserve them even if you don't use them yet. | Free | ☐ |
| 3.5 | File provisional patents on NHCE/DEV/2026/001–004 | Indian provisional patent ~₹8,000 / patent for individual + attorney drafting fees. Cite the actual repo paths and tests already in main. | ₹50k–1.5L per surface incl. attorney | ☐ |

---

## Phase 4 — Banking and payments (week 3–5)

| # | Task | How | Status |
|---|---|---|---|
| 4.1 | Activate Stripe (India) / Razorpay account | Need: CoI, GSTIN, bank, director KYC | ☐ |
| 4.2 | Configure UPI / IMPS / international cards | Razorpay supports all; Stripe India does international cards | ☐ |
| 4.3 | Decide pricing currency | USD pricing typical for SaaS; INR for India-only customers; multi-currency adds complexity to accounting | ☐ |
| 4.4 | Wire payment processor → Ojas billing service | Use Stripe live keys / Razorpay live keys | ☐ |
| 4.5 | Set up an accounting solution | Zoho Books (₹0 to ₹2k/mo) or Xero. Connect bank + Stripe. | ☐ |

---

## Phase 5 — Compliance program (parallel; long calendar)

| # | Task | Time | Status |
|---|---|---|---|
| 5.1 | Choose compliance platform: Vanta vs Drata vs Sprinto | Eval in 1 week | ☐ |
| 5.2 | Sign Vanta/Drata/Sprinto | $5–15k/yr | ☐ |
| 5.3 | Engage SOC 2 auditor | Big-four-tier $20–40k; local firms in India $8–15k | ☐ |
| 5.4 | SOC 2 Type 1 | 3–4 months | ☐ |
| 5.5 | SOC 2 Type 2 | 6–12 month observation window | ☐ |
| 5.6 | ISO 27001 (optional, follow-up) | 6–9 months | ☐ |
| 5.7 | Appoint DPO (DPDPA — required only once designated SDF) | Internal or external | ☐ |
| 5.8 | Appoint EU representative (GDPR Art. 27) — once first EU customer | ~€500–1500/yr (Prighter / DataRep) | ☐ |
| 5.9 | Buy cyber-liability + E&O insurance | ICICI Lombard / Bajaj Allianz / Coalition. ₹5 crore cover ~₹50–100k/yr | ☐ |

---

## Phase 6 — Legal documents (you can start this in parallel with Phase 1)

| # | Task | Status |
|---|---|---|
| 6.1 | First-draft Terms of Service, Privacy Policy, DPA, AUP, Cookie, SLA, Refund, Vuln Disclosure, NDA, Security Statement, VS Code EULA, Data Retention, RoPA | **Already drafted** — see `legal/` folder |
| 6.2 | Engage an Indian SaaS lawyer to redline all of the above | ₹15–50k for a quality review | ☐ |
| 6.3 | Run find-replace pass per `REPLACE_BEFORE_PUBLISHING.md` | After step 6.2 | ☐ |
| 6.4 | Publish to `{{COMPANY_WEBSITE}}/legal/<slug>` and link from footer | After step 6.3 | ☐ |
| 6.5 | Send updated DPA to any in-flight customers | After step 6.3 | ☐ |
| 6.6 | Set calendar reminder for annual review | After step 6.4 | ☐ |

---

## Phase 7 — Platform & marketplace paperwork (week 4 onwards)

| # | Task | Notes | Status |
|---|---|---|---|
| 7.1 | GitHub App registration | github.com → Settings → Developer settings → GitHub Apps | ☐ |
| 7.2 | VS Code Marketplace publisher | Microsoft Partner Center → register publisher → upload .vsix | ☐ |
| 7.3 | PyPI / Trusted Publisher | pypi.org → register → enable PyPI Trusted Publisher for GitHub Actions | ☐ |
| 7.4 | npm org for `@ojas/*` packages | npmjs.com → create org | ☐ |
| 7.5 | DockerHub / GHCR org for container images | Whichever you'll host on | ☐ |
| 7.6 | Status page provider | Statuspage.io, Better Stack, Atlassian Statuspage | ☐ |
| 7.7 | Public docs site | docs.ojas.ai (Mintlify, Docusaurus, etc.) | ☐ |

---

## Quick "open for business" gate

You can take **paid revenue from Indian customers** as soon as:

1. ☐ CoI received (Phase 1.7)
2. ☐ Bank account active and subscriber capital deposited (1.9 + 1.10)
3. ☐ INC-20A filed (1.11)
4. ☐ GST registration active (2.1)
5. ☐ Stripe/Razorpay live keys configured (4.1, 4.4)
6. ☐ Terms / Privacy / Cookie / Refund redlined by a lawyer and live on the site (6.2–6.4)

You can take **paid revenue from EU customers** when, in addition:

7. ☐ DPA template redlined and live (6.2–6.4)
8. ☐ SCCs operational (DPA Annex 3)
9. ☐ EU Art. 27 representative appointed (5.8)
10. ☐ Sub-processor list public and notice mechanism active (SUBPROCESSORS.md publicly available, mailing list working)

You can take **paid revenue from regulated industries (banks,
healthcare, etc.)** when, in addition:

11. ☐ SOC 2 Type 1 report available (5.4)
12. ☐ Cyber-liability insurance in force (5.9)
13. ☐ Annual penetration-test report available

---

## Timeline summary

- **Day 0 to Day 14:** Incorporate, get PAN/TAN/CIN, open bank.
- **Day 7 to Day 30:** GST, trademark filing, domain, legal-doc review.
- **Day 30 to Day 45:** Stripe/Razorpay live, marketplace publisher setup.
- **Month 2 to Month 5:** SOC 2 Type 1.
- **Month 5 onwards:** SOC 2 Type 2 observation window.

Most of Phase 1 + 2 + 3 + 6 can be done in **3–4 weeks** if you
use a service like Vakilsearch + a SaaS lawyer + filing the
trademark yourself.

*— End of checklist —*
