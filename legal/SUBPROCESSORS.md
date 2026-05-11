# Sub-processors

> **Status: First-draft template — pending lawyer review.**
> Replace `{{PLACEHOLDER}}` values per `REPLACE_BEFORE_PUBLISHING.md`.
> **Confirm the actual list of sub-processors you use in production
> before publishing this page.** A wrong list here is a contract
> breach to every customer with a DPA in place.

**Last updated:** [Date]

This page lists the third-party service providers (the
**"Sub-processors"**) that **{{COMPANY_LEGAL_NAME}}** engages to
process personal data on behalf of customers of the Ojas service,
as contemplated by the [Data Processing Addendum](./DPA.md).

We require each Sub-processor to enter into a written agreement that
imposes data-protection and security obligations no less protective
than our [DPA](./DPA.md). We remain liable to our customers for the
acts and omissions of Sub-processors as if they were our own.

## Notification of changes

We will provide at least **30 days' prior notice** of any addition
or replacement of a Sub-processor, by:
1. Updating this page; **and**
2. Notifying customers' billing contact by email or in-app banner.

If you object to a new Sub-processor on data-protection grounds
within 14 days of notice, you may terminate the affected portion
of the Service in accordance with Section 6 of the DPA.

To subscribe to notifications, email {{PRIVACY_EMAIL}} with the
subject "Sub-processor notifications".

## Current Sub-processors

### A. Infrastructure and hosting

| Sub-processor | Function | Data processed | Location |
|---|---|---|---|
| Amazon Web Services, Inc. | Primary compute, database, object storage, queue services | All Customer Data | {{HOSTING_REGION}} (primary), with cross-region encrypted backups |
| Cloudflare, Inc. | DNS, CDN, WAF, DDoS protection | Request metadata (IP, user-agent, URL) | Global edge network |
| Redis Ltd. (Redis Cloud) | In-memory cache and rate-limit storage | Token-budget counters, session tokens (short TTL) | Same region as primary |

### B. Authentication and identity

| Sub-processor | Function | Data processed | Location |
|---|---|---|---|
| (Your IdP — Auth0 / Okta / WorkOS / similar) | Sign-in, MFA, SAML/OIDC federation | Email, IdP `sub` claim, sign-in timestamps | US (or as your IdP discloses) |

### C. Payments and billing

| Sub-processor | Function | Data processed | Location |
|---|---|---|---|
| Stripe, Inc. (or your payment processor) | Payment processing, invoicing | Billing contact, billing address, last-4 of card, payment events | US, EU, India |

### D. Email and communications

| Sub-processor | Function | Data processed | Location |
|---|---|---|---|
| Postmark / SendGrid / Amazon SES (your transactional email provider) | Transactional and security email delivery | Recipient email, subject, body of transactional emails | US, EU |
| Slack Technologies LLC | Internal incident-response communications (no Customer Data is intentionally placed in Slack) | Aggregated incident summaries only | US |

### E. Observability

| Sub-processor | Function | Data processed | Location |
|---|---|---|---|
| Datadog, Inc. (or your APM provider) | Server logs, metrics, traces | Service-side telemetry, error stacks. Customer-content fields are redacted before they reach the observability provider. | US, EU |
| Sentry / Bugsnag (or your error tracker) | Error tracking | Stack traces, browser metadata; Customer-content fields are scrubbed | US, EU |

### F. Product analytics

| Sub-processor | Function | Data processed | Location |
|---|---|---|---|
| PostHog (or your analytics provider) | Anonymous product analytics; opt-in only | Anonymous distinct ID, page interactions | EU / US depending on instance |

### G. Upstream LLM providers (Customer-configured)

When you, the Customer, configure an upstream LLM provider in your
workspace settings, your prompts and any text you submit through
the gateway are forwarded to that provider. These providers
process prompts and responses under **their own** terms and privacy
policies — we recommend you read them.

| Provider | Function | Their privacy policy |
|---|---|---|
| OpenAI | LLM completions / embeddings | https://openai.com/policies/privacy-policy |
| Anthropic | LLM completions | https://www.anthropic.com/legal/privacy |
| Amazon Web Services (Bedrock) | LLM completions hosted on AWS | https://aws.amazon.com/privacy/ |
| Google Cloud (Vertex AI) | LLM completions hosted on Google | https://cloud.google.com/terms/data-processing-terms |
| (Other providers as you configure) | LLM completions | Provider's own policy |

You can control which upstream providers your prompts reach by
removing or rotating provider keys in workspace settings.

### H. Compliance, audit, and security testing

| Sub-processor | Function | Data processed | Location |
|---|---|---|---|
| (Vanta / Drata — once selected) | Continuous compliance monitoring for SOC 2 / ISO 27001 | Limited metadata: control evidence, employee directory, IT inventory | US |
| (Independent penetration testing firm) | Annual penetration test | Limited test data only | India / as engaged |

---

## How we choose Sub-processors

Before onboarding, we evaluate each Sub-processor on:
1. **Security posture:** SOC 2 / ISO 27001 reports, recent
   pen-test summaries, encryption practices.
2. **Privacy compliance:** Public DPA / SCC support, sub-processor
   transparency, data-residency options.
3. **Operational reliability:** uptime track record, incident
   transparency, support quality.
4. **Strategic fit:** alignment with our product, no conflict of
   interest.

We re-assess our Sub-processors at least annually.

## Questions

Write to {{PRIVACY_EMAIL}}.

*— End of Sub-processor list —*
