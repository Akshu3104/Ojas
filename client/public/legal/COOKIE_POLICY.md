# Cookie Policy

> **Status: First-draft template — pending lawyer review.**
> Replace `{{PLACEHOLDER}}` values per `REPLACE_BEFORE_PUBLISHING.md`.

**Last updated:** [Date of lawyer-approved version]

This Cookie Policy explains what cookies and similar tracking
technologies **{{COMPANY_SHORT_NAME}}** uses on the Ojas website
({{COMPANY_WEBSITE}}) and dashboard, what they do, and how you can
control them.

This Policy supplements the [Privacy Policy](./PRIVACY_POLICY.md).
Capitalised terms used but not defined here have the meaning given
in the Terms of Service.

## 1. What is a cookie?

A "cookie" is a small text file placed on your device by a website
or web application. Cookies allow sites to remember your actions,
preferences, and authentication state. We also use other similar
technologies (local storage, session storage, web beacons) for the
same purposes; references to "cookies" in this Policy include those
technologies.

## 2. Categories of cookies we use

### 2.1 Strictly necessary — always on
These are essential to the operation of the Ojas Service. Without
them, parts of the Service will not work. **You cannot opt out of
strictly necessary cookies, because the Service is unusable
without them.**

| Name | Provider | Purpose | Duration |
|---|---|---|---|
| `ojas_session` | Ojas (first-party) | Authenticated session token | Session (cleared on sign-out) |
| `ojas_refresh` | Ojas (first-party) | Refresh-token rotation | 30 days |
| `ojas_csrf` | Ojas (first-party) | Cross-site request forgery protection | Session |
| `ojas_locale` | Ojas (first-party) | Preferred language and timezone | 1 year |
| `ojas_consent` | Ojas (first-party) | Records your cookie-consent choices | 1 year |
| `cf_clearance` | Cloudflare | Bot protection and DDoS mitigation | 30 minutes |

### 2.2 Preferences — opt-in by default
These remember non-essential settings such as dashboard theme and
table column layouts.

| Name | Provider | Purpose | Duration |
|---|---|---|---|
| `ojas_theme` | Ojas (first-party) | Light / dark / system theme | 1 year |
| `ojas_table_*` | Ojas (first-party) | Per-table column order and width | 1 year |

### 2.3 Analytics — opt-in
We use a privacy-respecting analytics provider to understand how the
dashboard is used (page views, navigation paths, feature adoption).
Analytics data is aggregated; we do not use it to build profiles of
individual users. **You can opt out without losing any
functionality.**

| Name | Provider | Purpose | Duration |
|---|---|---|---|
| `_pa_id` | PostHog (or [your final analytics provider]) | Anonymous distinct visitor ID | 12 months |
| `_pa_session` | Same | Session continuity | 30 minutes |

### 2.4 Marketing — opt-in
We do not currently run third-party marketing or retargeting
cookies. If we add any in the future, we will update this Policy
and require fresh consent.

## 3. How to control cookies

### 3.1 In Ojas
A consent banner appears on your first visit. You can re-open
"Cookie preferences" any time from the footer of the dashboard or
the marketing site. From there you can:
- Allow all
- Allow only necessary
- Customize per category

### 3.2 In your browser
Most browsers let you block, delete, or be notified about cookies
in their settings. Helpful links:
- Chrome: [chrome://settings/cookies](chrome://settings/cookies)
- Firefox: [about:preferences#privacy](about:preferences#privacy)
- Safari: Preferences → Privacy
- Edge: Settings → Cookies and site permissions

### 3.3 "Do Not Track"
We honour the `DNT: 1` request header — when set, we do not load
analytics cookies for that session, regardless of your in-app
preference.

## 4. Changes to this Policy

We may update this Cookie Policy from time to time. Material
changes will be reflected in the cookie banner and the "Last
updated" date at the top. Continued use of the Service after a
material change constitutes acceptance.

## 5. Contact

Questions about this Cookie Policy? Write to {{PRIVACY_EMAIL}}.

*— End of Cookie Policy —*
