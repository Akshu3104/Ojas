# Terms of Service

> **Status: First-draft template — pending lawyer review.**
> Do not publish without redlining by a qualified Indian advocate.
> Replace every `{{PLACEHOLDER}}` per `REPLACE_BEFORE_PUBLISHING.md`.

**Last updated:** [Date of lawyer-approved version]
**Effective date:** [Date document goes live]

These Terms of Service (the **"Terms"**) form a binding agreement
between **{{COMPANY_LEGAL_NAME}}**, a company incorporated under the
Companies Act, 2013 of India, having its registered office at
{{COMPANY_ADDRESS}} (**"{{COMPANY_SHORT_NAME}}"**, **"we"**, **"us"**,
**"our"**), and the person or entity that creates an account on, or
otherwise uses, the Ojas service (**"you"**, **"your"**, **"Customer"**).

By creating an account, clicking "I agree", or by using the Ojas
service, you confirm that you have read, understood, and agreed to be
bound by these Terms. **If you do not agree, you may not use Ojas.**

## 1. Definitions

1.1 **"Service"** means the Ojas software-as-a-service platform —
including the inline LLM gateway, telemetry SDKs (Python, Node.js,
others), the dashboard at {{COMPANY_WEBSITE}}, the VS Code extension,
APIs, command-line tools, and any documentation we provide.

1.2 **"Customer Data"** means all data, content, or material that
you, your users, or your end-users submit to, transmit through, or
generate using the Service — including prompts, responses, API
metadata, configuration, policies, scan results, and audit logs.

1.3 **"Output"** means responses returned by third-party large
language models or other AI providers routed through the Service.

1.4 **"Authorized User"** means each natural person to whom you grant
access under your account, whether an employee, contractor, or agent.

1.5 **"Subscription"** means a paid plan you choose at sign-up or
upgrade, as described at {{DEFAULT_PRICING_PAGE}}.

1.6 **"Confidential Information"** means any non-public information
disclosed by one party to the other, whether oral or written, that is
designated as confidential or that a reasonable person would
understand to be confidential. The Service itself, the prices we
charge, and Customer Data are each Confidential Information of the
party they belong to.

1.7 **"Effective Date"** is the date you first accept these Terms.

## 2. Account Registration

2.1 You must be at least 18 years old, legally capable of entering
into a binding contract, and not barred from receiving the Service
under the laws of India or any other applicable jurisdiction.

2.2 You agree to provide accurate, current, and complete registration
information and to keep it up to date.

2.3 You are responsible for safeguarding your credentials and for all
activities under your account. Notify us immediately at
{{SECURITY_EMAIL}} of any suspected unauthorized access.

2.4 You may invite Authorized Users into your account. You are
responsible for ensuring each Authorized User complies with these
Terms.

## 3. Use of the Service

3.1 **License grant.** Subject to your continuing compliance with
these Terms and your payment of all fees, {{COMPANY_SHORT_NAME}}
grants you a limited, non-exclusive, non-transferable, non-
sublicensable, revocable right to access and use the Service during
the term of your Subscription, solely for your internal business
purposes.

3.2 **Acceptable Use.** Your use of the Service is subject to the
Acceptable Use Policy at
[`legal/ACCEPTABLE_USE_POLICY.md`](./ACCEPTABLE_USE_POLICY.md),
which is incorporated by reference. Violations of the AUP entitle us
to suspend or terminate your access under Section 12.

3.3 **Beta features.** We may make features available on a "beta",
"alpha", "early access", or "experimental" basis. Beta features are
provided **as-is** with no SLA, no warranty, and may be modified or
discontinued at any time. Do not use beta features for any
production-critical purpose.

3.4 **Third-party providers.** The Service routes requests to third-
party AI providers (OpenAI, Anthropic, Amazon Bedrock, Google, and
others — see [`SUBPROCESSORS.md`](./SUBPROCESSORS.md)). Their terms
and conditions apply to your use of those providers' models, and
they — not {{COMPANY_SHORT_NAME}} — are responsible for the
correctness, safety, and legality of Output. We are not responsible
for changes any third-party provider makes to model behaviour,
pricing, availability, or terms.

## 4. Customer Data and Output

4.1 **Ownership.** As between you and {{COMPANY_SHORT_NAME}}, you own
all rights, title, and interest in and to your Customer Data. We
claim no ownership.

4.2 **Licence to {{COMPANY_SHORT_NAME}}.** You grant
{{COMPANY_SHORT_NAME}} a worldwide, non-exclusive, royalty-free
licence to host, store, transmit, process, modify, and display
Customer Data solely to (a) provide and improve the Service to you,
(b) prevent or address technical or security issues, (c) comply with
law, and (d) produce aggregated, de-identified analytics that do not
identify you or your users. We will not use Customer Data to train
generally available AI models.

4.3 **Prompts and responses.** By default, the Service stores only
metadata (token counts, model name, latency, masked-/hashed-content
fingerprints, redacted PII-classification results). Full prompts and
responses are **not** stored unless you explicitly enable debugging,
red-team capture, or audit logging in your workspace settings.

4.4 **Output disclaimer.** Output is generated by third-party AI
models. {{COMPANY_SHORT_NAME}} makes no representation that Output is
accurate, lawful, non-infringing, complete, or fit for any purpose.
You must independently evaluate Output before relying on it,
particularly for high-stakes use cases (medical, legal, financial,
safety-critical). You bear all risk arising from your use of Output.

4.5 **Privacy.** Our processing of personal data within Customer Data
is governed by the [Privacy Policy](./PRIVACY_POLICY.md) and, where
applicable, the [Data Processing Addendum](./DPA.md).

## 5. Fees, Billing, and Taxes

5.1 **Fees.** You will pay the fees applicable to your Subscription
as described on {{DEFAULT_PRICING_PAGE}} or in an order form executed
with us.

5.2 **Billing cycle.** Subscription fees are billed in advance for
each billing period (monthly or annually, as you select). Usage-based
overage fees are billed in arrears.

5.3 **Payment method.** You authorize us (and our payment processor)
to charge your nominated payment method for all fees due. If a charge
fails, we may suspend the Service until payment is received.

5.4 **Taxes.** All fees are exclusive of taxes. You are responsible
for all sales, use, value-added, GST, withholding, and similar taxes,
other than taxes on {{COMPANY_SHORT_NAME}}'s net income.

5.5 **Invoicing.** GST-compliant invoices are issued at the end of
each billing cycle and emailed to {{BILLING_EMAIL}} (or your
nominated billing contact). Disputes regarding an invoice must be
raised within 30 days of issue or are deemed waived.

5.6 **Refunds.** Refunds are governed by the
[Refund Policy](./REFUND_POLICY.md). No refunds for partial billing
periods unless the Refund Policy provides otherwise.

5.7 **Price changes.** We may change Subscription prices on 30 days'
notice. The new price takes effect at your next renewal. If you do
not agree, you may cancel before the renewal date.

## 6. Intellectual Property

6.1 **{{COMPANY_SHORT_NAME}}'s IP.** The Service, including all
software, dashboards, SDKs, documentation, brand marks, the YAML
Policy DSL grammar, the Unified Risk Score methodology, the Shadow-
API Workspace Scanner, the Thinking-Token Attribution method, and
all derivatives or improvements thereof, are the exclusive property
of {{COMPANY_SHORT_NAME}} (and its licensors). Except for the limited
licence in Section 3.1, no rights are granted to you.

6.2 **Feedback.** If you provide feedback, suggestions, or ideas
about the Service, you assign all rights in that feedback to
{{COMPANY_SHORT_NAME}} on a perpetual, royalty-free, worldwide basis.
We may use it without obligation to you.

6.3 **Open-source components.** Parts of the Service are made
available under open-source licences (notably the Python and Node.js
SDKs and the VS Code extension). The applicable open-source licence
governs your use of those components; nothing in these Terms
restricts your rights under those licences.

6.4 **Trade marks.** "Ojas" and the Ojas logo are trade marks of
{{COMPANY_SHORT_NAME}}. You may not use them without our prior
written consent, except (a) factual nominative use ("we use Ojas") and
(b) as expressly permitted by the brand-asset guidelines at
{{BRAND_ASSETS_URL}}.

## 7. Confidentiality

7.1 Each party will hold the other's Confidential Information in
strict confidence, use it only to perform under these Terms, and
protect it with at least the same standard of care it uses for its
own confidential information (and no less than a reasonable standard).

7.2 The obligations in Section 7.1 do not apply to information that
(a) is or becomes public through no fault of the receiving party,
(b) was known to the receiving party before disclosure, (c) is
independently developed by the receiving party without reference to
the disclosing party's information, or (d) is rightfully received
from a third party without a confidentiality obligation.

7.3 The receiving party may disclose Confidential Information if
required by law or court order, provided it gives the disclosing
party prompt notice (where legally permitted) and reasonable
assistance to seek a protective order.

## 8. Warranties and Disclaimers

8.1 **Mutual warranties.** Each party warrants that it (a) is duly
organized and validly existing, (b) has full power and authority to
enter into these Terms, and (c) will comply with all applicable laws
in performing under these Terms.

8.2 **Limited service warranty.** {{COMPANY_SHORT_NAME}} warrants
that the Service will perform substantially in accordance with the
applicable documentation. Your sole remedy for a breach is the
service-credit regime in the [SLA](./SLA.md) and, if we cannot cure
the breach within 30 days, termination under Section 12 with a
pro-rata refund of pre-paid fees for the unused portion of the
Subscription.

8.3 **Disclaimer of all other warranties.** EXCEPT AS EXPRESSLY SET
OUT IN THIS SECTION 8, THE SERVICE IS PROVIDED **"AS IS"** AND **"AS
AVAILABLE"** WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING ANY WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE, NON-INFRINGEMENT, OR THAT THE SERVICE WILL BE
UNINTERRUPTED, ERROR-FREE, OR SECURE.
{{COMPANY_SHORT_NAME}} DOES NOT WARRANT THAT OUTPUT IS ACCURATE,
SAFE, COMPLETE, OR FIT FOR ANY PARTICULAR USE.

## 9. Indemnification

9.1 **By {{COMPANY_SHORT_NAME}} — IP infringement.**
{{COMPANY_SHORT_NAME}} will defend you against any third-party claim
that the Service, when used as authorized under these Terms, infringes
the intellectual-property rights of that third party, and will
indemnify you against any damages and costs finally awarded by a
court of competent jurisdiction (or agreed in settlement) for such
claim. We have no obligation under this Section 9.1 to the extent
the claim arises from (a) Customer Data, (b) any combination of the
Service with materials not provided by us, (c) your use of the
Service in violation of these Terms, or (d) any beta or experimental
feature.

9.2 **By you — Customer Data and misuse.** You will defend us
against any third-party claim arising from (a) Customer Data,
(b) your or your Authorized Users' violation of the AUP, (c) your
use of Output, or (d) your breach of Section 6 or Section 7, and
will indemnify us against any damages and costs finally awarded
(or agreed in settlement) for such claim.

9.3 **Process.** The indemnified party will (a) promptly notify the
indemnifying party of the claim in writing, (b) give the indemnifying
party sole control of the defence and settlement, and (c) provide
reasonable cooperation at the indemnifying party's expense. The
indemnifying party may not settle in a way that admits the
indemnified party's liability or imposes any non-monetary obligation
on the indemnified party without that party's prior written consent.

## 10. Limitation of Liability

10.1 **Cap.** EXCEPT FOR THE EXCLUDED LIABILITIES BELOW, EACH PARTY'S
TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS,
WHETHER IN CONTRACT, TORT, OR OTHERWISE, IS LIMITED TO THE GREATER OF
(A) THE FEES YOU PAID TO {{COMPANY_SHORT_NAME}} IN THE 12 MONTHS
PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR (B) {{LIABILITY_CAP_INR}}.

10.2 **Excluded liabilities.** The cap in Section 10.1 does **not**
apply to (a) your obligation to pay fees due, (b) either party's
indemnification obligations under Section 9, (c) either party's
breach of Section 7 (Confidentiality), or (d) liability that cannot
be limited under applicable law (including, in India, liability for
gross negligence or wilful misconduct).

10.3 **No consequential damages.** EXCEPT AS EXCLUDED IN SECTION
10.2, NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS,
LOST REVENUE, LOST DATA, OR BUSINESS INTERRUPTION, EVEN IF ADVISED
OF THE POSSIBILITY.

10.4 The cap is allocated cumulatively across all claims and is not
multiplied by the number of incidents or affiliates.

## 11. Term

These Terms take effect on the Effective Date and continue until
terminated under Section 12. Subscription terms (initial period and
renewal) are described in your order form or the dashboard.

## 12. Termination

12.1 **For convenience.** Either party may terminate a Subscription
at the end of the then-current term by giving notice at least 30
days before the renewal date.

12.2 **For cause.** Either party may terminate immediately on notice
if the other party (a) materially breaches these Terms and fails to
cure within 30 days of written notice, (b) becomes insolvent or files
for bankruptcy, or (c) ceases to do business.

12.3 **For AUP violation.** We may suspend or terminate your access
immediately, without notice, if we determine in good faith that your
use violates the AUP and poses a risk to the Service, other
customers, or the public.

12.4 **Effect of termination.** On termination: (a) your right to
access the Service ends, (b) you must pay all fees accrued through
the termination date, (c) within 30 days you may export your
Customer Data using the Data Export feature, and (d) after 30 days
we may delete Customer Data (subject to backup-retention periods in
the [Data Retention Schedule](./DATA_RETENTION.md)).

12.5 **Survival.** Sections 4.1 (Ownership), 5 (Fees, for amounts
accrued before termination), 6 (IP), 7 (Confidentiality), 8.3
(Disclaimer), 9 (Indemnification), 10 (Limitation of Liability), 12.4
(Effect of termination), 13 (Governing Law), and 14 (Miscellaneous)
survive termination.

## 13. Governing Law and Dispute Resolution

13.1 **Governing law.** These Terms are governed by the laws of
India, without regard to conflict-of-laws principles.

13.2 **Dispute resolution.** Any dispute, claim, or controversy
arising out of or relating to these Terms must first be raised in
writing to {{LEGAL_EMAIL}}. The parties will negotiate in good faith
for 30 days to resolve the dispute.

13.3 **Arbitration.** If not resolved, the dispute will be referred
to and finally resolved by arbitration administered under the
{{ARBITRATION_RULES}} by a sole arbitrator appointed under those
rules. The seat of arbitration is {{ARBITRATION_SEAT}}; the language
is English.

13.4 **Equitable relief.** Notwithstanding Section 13.3, either
party may seek injunctive or other equitable relief from the
{{COURT_JURISDICTION}} to protect its intellectual-property rights
or Confidential Information.

13.5 **No class actions.** To the extent permitted by law, all
disputes are resolved on an individual basis. Neither party may
bring or participate in a class, collective, or representative
action.

## 14. Miscellaneous

14.1 **Notices.** Notices must be in writing and sent to (a) for us:
{{LEGAL_EMAIL}} and {{COMPANY_ADDRESS}}; (b) for you: the email and
address on your account. Email notices are effective on receipt;
courier notices are effective on delivery.

14.2 **Assignment.** You may not assign these Terms without our
prior written consent (not to be unreasonably withheld), except in a
merger, acquisition, or sale of substantially all your assets.
{{COMPANY_SHORT_NAME}} may freely assign to an affiliate or
successor-in-interest. Any non-permitted assignment is void.

14.3 **Force majeure.** Neither party is liable for failure or delay
caused by events beyond its reasonable control (acts of God, war,
terrorism, pandemic, government action, internet failure,
third-party AI-provider outage, etc.), provided it gives prompt
notice and resumes performance as soon as reasonably possible.

14.4 **Independent contractors.** The parties are independent
contractors. Nothing in these Terms creates a partnership, agency,
joint venture, or employment relationship.

14.5 **No third-party beneficiaries.** These Terms do not confer any
rights on persons other than the parties (and their permitted
successors and assigns).

14.6 **Severability.** If any provision is held unenforceable, the
remainder of these Terms remains in effect.

14.7 **No waiver.** Failure to enforce a right is not a waiver of
that right.

14.8 **Entire agreement.** These Terms (with the documents
incorporated by reference: AUP, Privacy Policy, SLA, DPA where
applicable, and any executed order form) are the entire agreement
between the parties and supersede all prior agreements regarding the
subject matter.

14.9 **Changes to these Terms.** We may update these Terms from time
to time. Material changes will be notified at least 30 days before
they take effect. Continued use after the effective date constitutes
acceptance. If you do not agree, you may cancel under Section 12.1.

14.10 **Language.** These Terms are made in English. Any translation
is for convenience; the English text controls in case of conflict.

---

**Acknowledgment**

By using the Service, you confirm that you have read these Terms and
agree to be bound by them, and that the person accepting on behalf of
an entity has authority to bind that entity.

If you have questions about these Terms, write to {{LEGAL_EMAIL}}.

*— End of Terms of Service —*
