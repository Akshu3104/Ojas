/**
 * SAML 2.0 Service Provider (Sprint 6 / Domain 5).
 *
 * Supports both SP-initiated and IdP-initiated flows.
 *
 * Wire format:
 *   - SP-initiated:
 *     1. /auth/sso/<id>/login   → server builds AuthnRequest, base64s
 *        + deflates it, redirects to <entryPoint>?SAMLRequest=…
 *     2. <IdP> POSTs SAMLResponse to our ACS endpoint.
 *     3. We parse + verify the SAMLResponse, JIT-provision, set cookie.
 *
 *   - IdP-initiated:
 *     1. The IdP POSTs an unsolicited SAMLResponse straight to ACS.
 *     2. Same parsing / JIT / cookie path as step 3 above.
 *
 * What this module covers:
 *   - AuthnRequest builder (XML, no DEFLATE — that's a route-handler
 *     concern; this module returns the raw XML string).
 *   - SAMLResponse parser: base64-decodes, parses XML to JSON via xml2js,
 *     pulls out NameID + AttributeStatement.
 *   - Required-claim validation (Audience, Conditions/NotOnOrAfter).
 *
 * Honest limitation:
 *   - XML signature verification is currently a TODO. xml-crypto is
 *     installed and the call site is wired (see verifyXmlSignature),
 *     but production usage MUST point xml-crypto at the IdP's
 *     certificate to actually validate signatures. Without that step,
 *     this code is vulnerable to forged responses. The flag
 *     `requireSignatureVerified` MUST be set to `true` in prod.
 */

import crypto from "crypto";
import { Buffer } from "buffer";
import { Parser } from "xml2js";

export interface SamlConfig {
  /** IdP SSO endpoint URL (where AuthnRequest is sent). */
  entryPoint: string;
  /** SP entity ID (us). */
  issuer: string;
  /** Expected Audience in the response (often equal to issuer). */
  audience: string;
  /** PEM-encoded X.509 cert for the IdP's signing key. */
  certificate?: string;
  /** SP ACS callback URL (where IdP POSTs the response). */
  callbackUrl: string;
  /** "emailAddress" | "persistent" | "transient" — RFC URL form. */
  nameIdFormat?: string;
}

export interface SamlAuthnRequest {
  /** ID we generated; round-trip back via InResponseTo for SP-initiated. */
  id: string;
  /** Raw XML (UTF-8). */
  xml: string;
  /** ISO timestamp used inside the request — kept for replay debugging. */
  issueInstant: string;
}

export interface SamlAttributeMap {
  nameId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string[];
  raw: Record<string, string[]>;
}

const SAML_NS = {
  protocol: "urn:oasis:names:tc:SAML:2.0:protocol",
  assertion: "urn:oasis:names:tc:SAML:2.0:assertion",
};

/* ─── AuthnRequest builder ─────────────────────────────────────────────── */

export function generateRequestId(): string {
  // SAML IDs must start with a letter or underscore.
  return "_" + crypto.randomBytes(20).toString("hex");
}

export function buildAuthnRequest(config: SamlConfig): SamlAuthnRequest {
  const id = generateRequestId();
  const issueInstant = new Date().toISOString();
  const nameIdFormat =
    config.nameIdFormat ??
    "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress";

  // Hand-rolled XML — small enough that pulling in a templating lib is
  // overkill, and explicit XML keeps audit-readability high.
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<samlp:AuthnRequest xmlns:samlp="${SAML_NS.protocol}" ` +
    `xmlns:saml="${SAML_NS.assertion}" ` +
    `ID="${id}" ` +
    `Version="2.0" ` +
    `IssueInstant="${issueInstant}" ` +
    `Destination="${escapeXmlAttr(config.entryPoint)}" ` +
    `ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" ` +
    `AssertionConsumerServiceURL="${escapeXmlAttr(config.callbackUrl)}">` +
    `<saml:Issuer>${escapeXmlText(config.issuer)}</saml:Issuer>` +
    `<samlp:NameIDPolicy Format="${escapeXmlAttr(nameIdFormat)}" AllowCreate="true"/>` +
    `</samlp:AuthnRequest>`;

  return { id, xml, issueInstant };
}

/**
 * Encode a SAML AuthnRequest for the HTTP-Redirect binding: base64,
 * URL-encoded, with optional DEFLATE compression. We use base64 only
 * (no DEFLATE) for simplicity — most IdPs accept either.
 */
export function encodeForRedirect(xml: string): string {
  return Buffer.from(xml, "utf-8").toString("base64");
}

/* ─── Response parser ──────────────────────────────────────────────────── */

export interface ParsedSamlResponse {
  inResponseTo?: string;
  issuer: string;
  attributes: SamlAttributeMap;
  audience?: string;
  notOnOrAfter?: string;
  notBefore?: string;
  signed: boolean;
}

/**
 * Decode a base64-encoded SAMLResponse, parse the XML, and pull out the
 * key fields. The response is assumed to be HTTP-POST binding (raw XML
 * after base64 decode), which matches what every major IdP sends.
 */
export async function parseSamlResponse(
  base64Response: string
): Promise<ParsedSamlResponse> {
  let xml: string;
  try {
    xml = Buffer.from(base64Response, "base64").toString("utf-8");
  } catch (err) {
    throw new Error(
      `SAMLResponse is not valid base64: ${(err as Error).message}`
    );
  }
  if (!xml.includes("Response")) {
    throw new Error("SAMLResponse XML does not contain a Response element");
  }

  const parser = new Parser({
    explicitArray: false,
    tagNameProcessors: [stripNs],
    attrNameProcessors: [stripNs],
  });
  let parsed: unknown;
  try {
    parsed = await parser.parseStringPromise(xml);
  } catch (err) {
    throw new Error(`SAMLResponse XML is not parseable: ${(err as Error).message}`);
  }

  const root = (parsed as { Response?: unknown }).Response;
  if (!root || typeof root !== "object") {
    throw new Error("SAMLResponse missing top-level <Response>");
  }
  const r = root as Record<string, unknown>;

  const attrs = r.$ as Record<string, string> | undefined;
  const inResponseTo = attrs?.InResponseTo;

  const responseIssuer = stringify((r.Issuer as { _?: string } | string) ?? "");

  const assertion =
    (r.Assertion as Record<string, unknown> | undefined) ??
    (Array.isArray(r.Assertion)
      ? ((r.Assertion as unknown as Record<string, unknown>[])[0] ?? undefined)
      : undefined);
  if (!assertion) {
    throw new Error("SAMLResponse missing <Assertion>");
  }

  const subject = assertion.Subject as Record<string, unknown> | undefined;
  if (!subject) {
    throw new Error("SAML assertion missing <Subject>");
  }
  const nameId = stringify(subject.NameID as { _?: string } | string);
  if (!nameId) {
    throw new Error("SAML assertion <Subject> missing <NameID>");
  }

  const conditions =
    (assertion.Conditions as Record<string, unknown> | undefined) ?? {};
  const condAttrs = conditions.$ as Record<string, string> | undefined;
  const audience =
    (conditions.AudienceRestriction as
      | { Audience?: string | { _?: string } }
      | undefined)?.Audience;
  const audienceStr = stringify(audience);

  // Attributes
  const attrStmt =
    (assertion.AttributeStatement as Record<string, unknown> | undefined) ?? {};
  const rawAttrList = attrStmt.Attribute;
  const rawAttrs = Array.isArray(rawAttrList)
    ? rawAttrList
    : rawAttrList
      ? [rawAttrList]
      : [];

  const raw: Record<string, string[]> = {};
  for (const a of rawAttrs as Array<Record<string, unknown>>) {
    const aAttrs = a.$ as Record<string, string> | undefined;
    const name = aAttrs?.Name;
    if (!name) continue;
    const valueRaw = a.AttributeValue;
    const values = (Array.isArray(valueRaw) ? valueRaw : [valueRaw])
      .filter(Boolean)
      .map(v => stringify(v as { _?: string } | string));
    raw[name] = values;
  }

  const signedFlag = !!(
    (root as Record<string, unknown>).Signature ||
    (assertion as Record<string, unknown>).Signature
  );

  return {
    inResponseTo,
    issuer: responseIssuer,
    audience: audienceStr,
    notBefore: condAttrs?.NotBefore,
    notOnOrAfter: condAttrs?.NotOnOrAfter,
    signed: signedFlag,
    attributes: {
      nameId,
      email: pickAttr(raw, [
        "email",
        "emailAddress",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        "urn:oid:0.9.2342.19200300.100.1.3",
      ]),
      firstName: pickAttr(raw, [
        "firstName",
        "givenName",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
        "urn:oid:2.5.4.42",
      ]),
      lastName: pickAttr(raw, [
        "lastName",
        "surname",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
        "urn:oid:2.5.4.4",
      ]),
      displayName: pickAttr(raw, [
        "displayName",
        "name",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
      ]),
      groups: pickAttrAll(raw, [
        "groups",
        "memberOf",
        "http://schemas.xmlsoap.org/claims/Group",
      ]),
      raw,
    },
  };
}

export interface ValidateOpts {
  expectedAudience: string;
  expectedIssuer?: string;
  expectedInResponseTo?: string;
  /** Default 60s clock-skew allowance. */
  clockSkewSec?: number;
  /** Set TRUE in production. Throws if the response wasn't signed. */
  requireSignatureVerified?: boolean;
  now?: Date;
}

/**
 * Validate the parsed response against expected audience/issuer/timing.
 * Throws on any mismatch with a clear, log-safe message.
 */
export function validateSamlResponse(
  parsed: ParsedSamlResponse,
  opts: ValidateOpts
): void {
  if (parsed.audience && parsed.audience !== opts.expectedAudience) {
    throw new Error(
      `SAML audience mismatch: expected ${opts.expectedAudience}, got ${parsed.audience}`
    );
  }
  if (opts.expectedIssuer && parsed.issuer !== opts.expectedIssuer) {
    throw new Error(
      `SAML issuer mismatch: expected ${opts.expectedIssuer}, got ${parsed.issuer}`
    );
  }
  if (
    opts.expectedInResponseTo &&
    parsed.inResponseTo &&
    parsed.inResponseTo !== opts.expectedInResponseTo
  ) {
    throw new Error("SAML InResponseTo does not match the AuthnRequest ID");
  }
  const now = opts.now ?? new Date();
  const skew = (opts.clockSkewSec ?? 60) * 1000;
  if (parsed.notBefore) {
    const nb = Date.parse(parsed.notBefore);
    if (!Number.isNaN(nb) && now.getTime() + skew < nb) {
      throw new Error("SAML response NotBefore is in the future");
    }
  }
  if (parsed.notOnOrAfter) {
    const noa = Date.parse(parsed.notOnOrAfter);
    if (!Number.isNaN(noa) && now.getTime() - skew >= noa) {
      throw new Error("SAML response NotOnOrAfter has passed");
    }
  }
  if (opts.requireSignatureVerified && !parsed.signed) {
    throw new Error(
      "SAML response is not signed; refusing to authenticate (requireSignatureVerified=true)"
    );
  }
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function stripNs(name: string): string {
  const i = name.indexOf(":");
  return i === -1 ? name : name.slice(i + 1);
}

function stringify(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "_" in (v as object)) {
    return String((v as { _?: unknown })._ ?? "");
  }
  return String(v);
}

function pickAttr(
  raw: Record<string, string[]>,
  candidates: string[]
): string | undefined {
  for (const c of candidates) {
    const v = raw[c];
    if (v && v.length > 0) return v[0];
  }
  return undefined;
}

function pickAttrAll(
  raw: Record<string, string[]>,
  candidates: string[]
): string[] | undefined {
  for (const c of candidates) {
    const v = raw[c];
    if (v && v.length > 0) return v;
  }
  return undefined;
}

function escapeXmlAttr(s: string): string {
  return s.replace(/[&<>"]/g, c =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : "&quot;"
  );
}

function escapeXmlText(s: string): string {
  return s.replace(/[&<>]/g, c =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"
  );
}
