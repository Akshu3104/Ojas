# Replace-Before-Publishing Cheat Sheet

Every placeholder string used across the documents in this folder.
After your lawyer redlines the drafts, run a find-replace pass over
the entire `legal/` folder to substitute your real values.

> ⚠️  **Do not publish any document in this folder while it still
> contains any of the placeholders listed below.**

## Required substitutions

| Placeholder | Description | Default in drafts | Replace with |
|---|---|---|---|
| `{{COMPANY_LEGAL_NAME}}` | Your incorporated entity's full legal name | `Ojas Technologies Private Limited` | Exact name on certificate of incorporation |
| `{{COMPANY_SHORT_NAME}}` | Brand/short name used in body text | `Ojas` | Brand name |
| `{{COMPANY_ADDRESS}}` | Registered office address | `[Registered office address, Bengaluru, Karnataka, India]` | Full address as on MCA filing |
| `{{COMPANY_CIN}}` | Corporate Identity Number from MCA | `[CIN pending]` | 21-char CIN after incorporation |
| `{{COMPANY_GSTIN}}` | GST Identification Number | `[GSTIN pending]` | 15-char GSTIN |
| `{{COMPANY_PAN}}` | Permanent Account Number | `[PAN pending]` | 10-char PAN |
| `{{COMPANY_WEBSITE}}` | Primary website URL | `https://ojas.ai` | Final domain with scheme |
| `{{LEGAL_EMAIL}}` | Legal inquiries inbox | `legal@ojas.ai` | Real inbox you monitor |
| `{{PRIVACY_EMAIL}}` | Privacy inquiries / DPO inbox | `privacy@ojas.ai` | Real inbox you monitor |
| `{{SECURITY_EMAIL}}` | Security disclosure inbox | `security@ojas.ai` | Real inbox you monitor |
| `{{SUPPORT_EMAIL}}` | Support inbox | `support@ojas.ai` | Real inbox you monitor |
| `{{ABUSE_EMAIL}}` | AUP violations inbox | `abuse@ojas.ai` | Real inbox you monitor |
| `{{BILLING_EMAIL}}` | Billing / invoicing inbox | `billing@ojas.ai` | Real inbox you monitor |
| `{{DPO_NAME}}` | Designated Data Protection Officer | `[To be appointed]` | Full name + email |
| `{{EU_REP_NAME}}` | EU representative for GDPR Art. 27 | `[To be appointed via Prighter / similar]` | Provider name + address |
| `{{IN_DPO_NAME}}` | DPDPA-required Data Protection Officer (only mandatory once classified as Significant Data Fiduciary) | `[To be appointed if SDF]` | Full name + email |
| `{{INCIDENT_PHONE}}` | 24x7 incident hotline | `[Hotline pending]` | E.164 number |
| `{{ARBITRATION_SEAT}}` | Arbitration seat | `Bengaluru, India` | Final agreed seat |
| `{{ARBITRATION_RULES}}` | Arbitration rules | `MCIA Rules` | SIAC / LCIA / MCIA / ICC as decided |
| `{{COURT_JURISDICTION}}` | Court jurisdiction | `Courts of Bengaluru, Karnataka, India` | Final agreed court |
| `{{HOSTING_REGION}}` | Default hosting region | `AWS Asia Pacific (Mumbai) – ap-south-1` | Real default region |
| `{{LIABILITY_CAP_INR}}` | Floor for liability cap | `INR 100,000` | Confirm with lawyer + insurance |
| `{{DEFAULT_PRICING_PAGE}}` | Pricing URL | `https://ojas.ai/pricing` | Final pricing URL |
| `{{BRAND_ASSETS_URL}}` | Brand-asset usage page | `https://ojas.ai/brand` | Final brand-asset URL |

## How to do the replacement safely

From the repo root:

```bash
cd legal/

# Preview every placeholder occurrence first
grep -rEn '\{\{[A-Z_]+\}\}' .

# Once happy with the substitution values, do a dry-run replacement
for f in *.md; do
  sed -i.bak \
    -e 's|{{COMPANY_LEGAL_NAME}}|Acme Cyber Private Limited|g' \
    -e 's|{{COMPANY_SHORT_NAME}}|Acme|g' \
    -e 's|{{COMPANY_ADDRESS}}|123 Indiranagar, Bengaluru, Karnataka 560038, India|g' \
    # ... continue for each placeholder
    "$f"
done

# Inspect the diff (the .bak files are the originals)
for f in *.md; do diff -u "${f}.bak" "$f" | head -40; done

# Once satisfied, remove the backup files
rm *.bak

# Sanity-check: no placeholders remain
grep -rEn '\{\{[A-Z_]+\}\}' .   # should print nothing
```

Then commit the substituted versions on a separate branch and have
the lawyer sign off on the final text before merging to `main`.
