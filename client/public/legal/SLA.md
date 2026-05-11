# Service Level Agreement

> **Status: First-draft template — pending lawyer review.**
> Replace `{{PLACEHOLDER}}` values per `REPLACE_BEFORE_PUBLISHING.md`.
> The uptime commitment and credit schedule are commercial decisions
> — confirm with the founder before publishing.

**Last updated:** [Date of lawyer-approved version]

This Service Level Agreement (the **"SLA"**) supplements the
[Terms of Service](./TERMS_OF_SERVICE.md) and governs availability
and support for paid **{{COMPANY_SHORT_NAME}}** Subscriptions.

This SLA does **not** apply to:
- Free-tier or trial Subscriptions
- Beta, alpha, or experimental features
- Customer Data inside upstream third-party AI providers
  (OpenAI, Anthropic, etc. — each provider has its own SLA, and
  outages of those providers are excluded from our calculation)

## 1. Definitions

**"Service"** has the meaning given in the Terms of Service.

**"Monthly Uptime Percentage"** is calculated for a calendar month as:

```
Uptime% = ((Total minutes in month) − (Downtime minutes)) / (Total minutes in month) × 100
```

**"Downtime minutes"** are minutes in which the production dashboard
or the gateway API returns HTTP 5xx errors for more than 50% of
requests in the minute, as measured by our public status-page
synthetic monitors, **excluding** Excluded Events (Section 5).

**"Excluded Events"** are listed in Section 5.

## 2. Service availability commitment

| Subscription tier | Monthly uptime commitment |
|---|---|
| **Free / trial** | None (best-effort) |
| **Starter** | 99.5% |
| **Growth** | 99.9% |
| **Enterprise** | 99.95% |

## 3. Service credits

If the Monthly Uptime Percentage falls below the commitment for the
Customer's tier, the Customer is eligible for a service credit
calculated as a percentage of the monthly fees paid for the
affected Service in the impacted month:

| Uptime in month | Service credit |
|---|---|
| ≥ tier commitment | 0% |
| Below commitment but ≥ 99% | 10% |
| ≥ 95% but < 99% | 25% |
| < 95% | 50% |

### How to claim a service credit
- Submit a written claim to {{SUPPORT_EMAIL}} within **30 days** of
  the end of the affected month.
- The claim must include the date(s) and time(s) of the incident,
  affected requests, and your account identifier.

If we verify the claim, we will apply the credit to the Customer's
next invoice. Credits cannot be exchanged for cash and have no value
on termination of the Subscription.

Service credits are the Customer's **sole and exclusive remedy** for
any availability shortfall, except in case of a sustained breach
(see Section 6).

## 4. Support response targets

Support requests are routed by severity. Targets are best-effort
**initial response** times during business hours (09:00–18:00 IST,
Monday–Friday, excluding public holidays in Karnataka, India),
unless an Enterprise customer has purchased 24x7 support.

| Severity | Definition | Response target |
|---|---|---|
| **Severity 1** | Production Service is unavailable or unusable; no workaround | 1 business hour |
| **Severity 2** | Significant impairment; workaround exists but is materially inconvenient | 4 business hours |
| **Severity 3** | Minor impairment; workaround exists | 1 business day |
| **Severity 4** | Question / how-to / feature request | 2 business days |

For Severity-1 incidents, we will also post status updates on our
public status page at least every 30 minutes until resolved.

## 5. Excluded events

The following are excluded from Downtime minutes and from any
service-credit calculation:

1. Scheduled maintenance, where we have given at least 48 hours'
   notice (we will, except in genuinely urgent situations, schedule
   maintenance during low-usage windows in the Customer's primary
   region).
2. Emergency maintenance to address a security vulnerability where
   delay would cause greater harm.
3. Outages caused by upstream LLM providers (OpenAI, Anthropic,
   AWS, etc.), including their rate limits, model deprecations, or
   outages.
4. Outages caused by the Customer's misconfiguration, the
   Customer's own systems, or their network.
5. Outages caused by Customer's violation of the
   [AUP](./ACCEPTABLE_USE_POLICY.md).
6. Force-majeure events (Section 14.3 of the Terms).
7. DDoS attacks the Customer or their end-users have not given us
   reasonable assistance to mitigate.
8. Beta or experimental features.
9. Features behind feature flags not generally available.
10. Free-tier and trial Subscriptions.

## 6. Sustained breach

If, in any three (3) consecutive months, the Monthly Uptime
Percentage falls below the tier commitment, the Customer may
terminate the affected Service on 30 days' notice and receive a
pro-rata refund of pre-paid fees for the unused portion of the
Subscription. This is the Customer's exclusive remedy for sustained
SLA breach.

## 7. Status page

Our public status page (URL to be confirmed at launch) reports
real-time and historical availability. Customers are encouraged to
subscribe to its RSS or email feed.

## 8. Updates

We may update this SLA from time to time. Material changes will be
notified at least 30 days before they take effect. The Customer's
existing Subscription tier will remain on the SLA in force at the
time it was purchased until the next renewal.

## 9. Contact

Status, incident, or credit questions: {{SUPPORT_EMAIL}}.

*— End of SLA —*
