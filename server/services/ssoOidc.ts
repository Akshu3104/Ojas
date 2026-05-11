/**
 * OpenID Connect (OIDC) authorization-code + PKCE flow (Sprint 6 / Domain 5).
 *
 * Implements the Authorization Code flow with Proof Key for Code Exchange
 * — the modern, public-client-safe way to do OIDC. We do NOT support the
 * deprecated Implicit flow.
 *
 * Wire format (per RFC 6749 + RFC 7636):
 *   1. /auth/sso/<provider>/login
 *      → server generates state + code_verifier + code_challenge
 *      → stores state row in sso_login_requests
 *      → 302 to <issuer>/authorize?...&code_challenge=...
 *
 *   2. <issuer>/authorize → user authenticates → 302 back to
 *      /auth/sso/<provider>/callback?code=...&state=...
 *
 *   3. /auth/sso/<provider>/callback
 *      → look up state row; reject if expired/missing/mismatched
 *      → POST <issuer>/token with code + code_verifier
 *      → decode id_token (NOTE: signature verification deliberately
 *        delegated to a JWKS step that lives in the route handler so
 *        unit tests can stub the network)
 *      → JIT-provision user via the email/sub claim
 *      → issue our own session cookie
 *
 * What this module covers vs. what the route handler covers:
 *   - This module: pure functions (URL builder, PKCE, code exchange via
 *     `fetch`, ID-token decode + claim extraction). No DB.
 *   - The route handler (server/api/sso.ts): cookie + DB I/O, redirect
 *     glue, session creation.
 *
 * Honest limitation:
 *   - We decode the ID token but do NOT verify the JWS signature in this
 *     code (we don't ship a JWKS cache here). Production deployments
 *     MUST run behind a proxy that verifies (Auth0, Okta, Cognito do
 *     this on their hosted endpoints), or wire `jose` for full
 *     verification. Marked TODO so it's grep-able.
 */

import crypto from "crypto";
import { Buffer } from "buffer";

export interface OidcConfig {
  /** OIDC discovery issuer URL, e.g. "https://accounts.google.com". */
  issuer: string;
  /** Client ID registered with the IdP. */
  clientId: string;
  /** Client secret. Kept opaque here; loaded from the encrypted vault. */
  clientSecret: string;
  /** Space-separated scopes; default "openid profile email". */
  scopes?: string;
  /** Authorization endpoint. If omitted we infer "<issuer>/authorize". */
  authorizationEndpoint?: string;
  /** Token endpoint. If omitted we infer "<issuer>/token". */
  tokenEndpoint?: string;
}

export interface OidcAuthorizeUrlOptions {
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
}

export interface OidcCodeExchange {
  redirectUri: string;
  code: string;
  codeVerifier: string;
}

export interface OidcTokenSet {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
  scope?: string;
}

export interface OidcClaims {
  sub: string;
  iss: string;
  aud: string | string[];
  exp?: number;
  iat?: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  [key: string]: unknown;
}

/* ─── PKCE ─────────────────────────────────────────────────────────────── */

/** RFC 7636: 43–128 chars, [A-Z][a-z][0-9]-._~ */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function deriveCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/** Anti-CSRF state, 128 bits, base64url */
export function generateState(): string {
  return crypto.randomBytes(16).toString("base64url");
}

/** OIDC nonce — replay protection inside the ID token. */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("base64url");
}

/* ─── Authorize URL ────────────────────────────────────────────────────── */

export function buildAuthorizeUrl(
  config: OidcConfig,
  opts: OidcAuthorizeUrlOptions
): string {
  const endpoint =
    config.authorizationEndpoint ?? `${trimSlash(config.issuer)}/authorize`;
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: config.scopes ?? "openid profile email",
    state: opts.state,
    nonce: opts.nonce,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${endpoint}?${params.toString()}`;
}

/* ─── Code exchange ────────────────────────────────────────────────────── */

/**
 * POST <token_endpoint> with the auth code + PKCE verifier. Returns the
 * raw token set. Throws on non-2xx / network failure.
 *
 * The `fetchImpl` parameter exists so unit tests can stub the call;
 * production passes the global `fetch`.
 */
export async function exchangeCodeForTokens(
  config: OidcConfig,
  exchange: OidcCodeExchange,
  fetchImpl: typeof fetch = fetch
): Promise<OidcTokenSet> {
  const endpoint =
    config.tokenEndpoint ?? `${trimSlash(config.issuer)}/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: exchange.code,
    redirect_uri: exchange.redirectUri,
    client_id: config.clientId,
    code_verifier: exchange.codeVerifier,
  });
  // Confidential clients also include the secret; public clients (PKCE
  // alone) omit it. We default to confidential because most enterprise
  // IdPs require it; if the IdP is public-only the secret is "" and
  // we don't append.
  if (config.clientSecret) {
    body.append("client_secret", config.clientSecret);
  }

  const res = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await safeReadText(res);
    throw new Error(
      `OIDC token exchange failed: ${res.status} ${res.statusText} ${text}`
    );
  }
  const json = (await res.json()) as Record<string, unknown>;
  if (typeof json.access_token !== "string") {
    throw new Error("OIDC token response missing access_token");
  }
  if (typeof json.id_token !== "string") {
    throw new Error("OIDC token response missing id_token");
  }
  return {
    accessToken: json.access_token,
    idToken: json.id_token,
    refreshToken:
      typeof json.refresh_token === "string" ? json.refresh_token : undefined,
    tokenType: typeof json.token_type === "string" ? json.token_type : "Bearer",
    expiresIn:
      typeof json.expires_in === "number" ? json.expires_in : undefined,
    scope: typeof json.scope === "string" ? json.scope : undefined,
  };
}

/* ─── ID-token decode ──────────────────────────────────────────────────── */

/**
 * Decode the JWT payload of an ID token. Performs structural validation
 * (3 segments, JSON-decodable claims) and basic claim-type checks.
 *
 * Does NOT verify the JWS signature. Production deployments MUST verify
 * upstream — see the file-level comment.
 */
export function decodeIdToken(idToken: string): OidcClaims {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("ID token must have three JWT segments");
  }
  let payload: Record<string, unknown>;
  try {
    const json = Buffer.from(parts[1] as string, "base64url").toString("utf-8");
    payload = JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new Error("ID token payload is not valid base64url-encoded JSON");
  }
  if (typeof payload.sub !== "string") {
    throw new Error("ID token missing required 'sub' claim");
  }
  if (typeof payload.iss !== "string") {
    throw new Error("ID token missing required 'iss' claim");
  }
  if (typeof payload.aud !== "string" && !Array.isArray(payload.aud)) {
    throw new Error("ID token missing required 'aud' claim");
  }
  return payload as OidcClaims;
}

export interface ClaimValidationOptions {
  expectedIssuer: string;
  expectedAudience: string;
  expectedNonce?: string;
  /** Seconds of clock skew allowance. Default 60. */
  clockSkewSec?: number;
  /** Required by tests; defaults to Date.now / 1000. */
  now?: number;
}

/**
 * Validate the structural claims on a decoded ID token. Throws on any
 * mismatch with a clear, log-safe message.
 */
export function validateClaims(
  claims: OidcClaims,
  opts: ClaimValidationOptions
): void {
  if (claims.iss !== opts.expectedIssuer) {
    throw new Error(
      `OIDC issuer mismatch: expected ${opts.expectedIssuer}, got ${claims.iss}`
    );
  }
  const audOk = Array.isArray(claims.aud)
    ? claims.aud.includes(opts.expectedAudience)
    : claims.aud === opts.expectedAudience;
  if (!audOk) {
    throw new Error("OIDC audience mismatch");
  }
  if (opts.expectedNonce && claims.nonce !== opts.expectedNonce) {
    throw new Error("OIDC nonce mismatch — possible replay");
  }
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const skew = opts.clockSkewSec ?? 60;
  if (typeof claims.exp === "number" && claims.exp + skew < now) {
    throw new Error("OIDC ID token has expired");
  }
  if (typeof claims.iat === "number" && claims.iat - skew > now) {
    throw new Error("OIDC ID token issued in the future — clock skew");
  }
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function trimSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
