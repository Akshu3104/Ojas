# End-User License Agreement — Ojas VS Code Extension

> **Status: First-draft template — pending lawyer review.**
> Replace `{{PLACEHOLDER}}` values per `REPLACE_BEFORE_PUBLISHING.md`.
> VS Code Marketplace requires a license link in `package.json`;
> point that to the published version of this file.

**Last updated:** [Date of lawyer-approved version]

This End-User License Agreement (the **"EULA"**) is a binding
agreement between **{{COMPANY_LEGAL_NAME}}**
(**"{{COMPANY_SHORT_NAME}}"**, **"we"**, **"us"**, **"our"**) and the
person or entity that installs or uses the Ojas VS Code extension
(the **"Extension"**, "you", "your").

By installing or using the Extension, you agree to be bound by this
EULA and by the [Terms of Service](./TERMS_OF_SERVICE.md) and
[Privacy Policy](./PRIVACY_POLICY.md). If you do not agree, do not
install or use the Extension.

## 1. License grant

Subject to your compliance with this EULA, the Terms of Service,
and the Acceptable Use Policy, we grant you a personal,
non-exclusive, non-transferable, non-sublicensable, revocable
licence to install and use the Extension on devices you own or
control, solely for the purpose of using the Ojas service or
exploring its features locally.

## 2. Restrictions

You may not:

- Distribute, sell, sublicense, rent, or lease the Extension.
- Reverse-engineer, decompile, or disassemble the Extension,
  except to the extent permitted by applicable law.
- Modify, adapt, or create derivative works of the Extension.
- Remove or alter any proprietary notices.
- Use the Extension in violation of the
  [Acceptable Use Policy](./ACCEPTABLE_USE_POLICY.md).
- Use the Extension to scan systems you do not own or have
  written permission to scan.

## 3. Updates

The Extension may automatically download and install updates from
the VS Code Marketplace. By using the Extension, you consent to
those updates. We may add, change, or remove features in updates
as we see fit.

## 4. Data the Extension processes

The Extension may, depending on which features you invoke:

- Read source files inside your currently open workspace to scan
  for shadow API definitions (Express, FastAPI, Flask, Django,
  Spring, Laravel). **Workspace files are processed locally on
  your machine; their contents are not transmitted to
  {{COMPANY_SHORT_NAME}}.**
- Send test requests to a configurable gateway endpoint when you
  use the gateway-tester webview. The test prompt content **is**
  sent to the configured gateway endpoint (which may be the Ojas
  cloud gateway, or one you self-host).
- Read your sign-in token and gateway URL from VS Code's secret
  storage in order to authenticate API calls.
- Emit anonymous telemetry about feature usage, subject to your
  VS Code telemetry settings.

If you sign into a paid Ojas account through the Extension, the
[Privacy Policy](./PRIVACY_POLICY.md) governs that processing.

## 5. Open-source components

The Extension may include or link to open-source components. Each
such component is governed by its own licence. A list of bundled
open-source components and their licences is available in the
Extension's `THIRD_PARTY_NOTICES.md` file (or `LICENSES` folder).

The Extension itself is **proprietary** software, made available
under this EULA — it is not open source.

## 6. No warranty

THE EXTENSION IS PROVIDED **"AS IS"** AND **"AS AVAILABLE"**,
WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING ANY
WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE EXTENSION WILL
BE ERROR-FREE, SECURE, OR UNINTERRUPTED.

## 7. Limitation of liability

IN NO EVENT WILL {{COMPANY_SHORT_NAME}}'S TOTAL LIABILITY ARISING
OUT OF OR RELATING TO THIS EULA EXCEED **{{LIABILITY_CAP_INR}}** OR
THE AMOUNT YOU PAID FOR THE EXTENSION (IF ANY) IN THE 12 MONTHS
PRECEDING THE CLAIM, WHICHEVER IS GREATER. SUBJECT TO APPLICABLE
LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
CONSEQUENTIAL, OR PUNITIVE DAMAGES.

This Section 7 does not apply to liability that cannot be limited
under applicable law (for example, in India, gross negligence or
wilful misconduct).

## 8. Termination

This EULA terminates automatically if you violate any of its
terms. On termination, you must uninstall the Extension and
destroy any copies in your possession or control. Sections 2, 5,
6, 7, 8, and 9 survive termination.

## 9. Governing law and disputes

This EULA is governed by the laws of India. Disputes are
resolved as described in Section 13 of the Terms of Service.

## 10. Changes

We may revise this EULA from time to time. The current version
is always published at the URL above. If a change is material,
we will surface it in the Extension's release notes.

## 11. Contact

Questions about this EULA: {{LEGAL_EMAIL}}

*— End of EULA —*
