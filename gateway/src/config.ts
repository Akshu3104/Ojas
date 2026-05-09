/**
 * Environment configuration for the gateway.
 *
 * We use Zod to validate at startup and fail fast on bad config. Mirrors the
 * pattern in `server/_core/env.ts`.
 */
import { z } from "zod";

const envSchema = z.object({
  DEVPULSE_GATEWAY_PORT: z
    .string()
    .default("8081")
    .transform(s => Number.parseInt(s, 10))
    .pipe(z.number().int().positive().max(65535)),
  /**
   * Comma-separated `tenantId:apiKey` pairs. Local-dev convenience only.
   * In production, the gateway loads keys via the DevPulse server (server-to-
   * server call below) and caches them with a short TTL.
   */
  DEVPULSE_GATEWAY_API_KEYS: z.string().optional(),
  DEVPULSE_GATEWAY_UPSTREAM_OPENAI_KEY: z.string().optional(),
  DEVPULSE_GATEWAY_UPSTREAM_OPENAI_BASE: z
    .string()
    .url()
    .default("https://api.openai.com/v1"),
  DEVPULSE_GATEWAY_UPSTREAM_ANTHROPIC_KEY: z.string().optional(),
  DEVPULSE_GATEWAY_UPSTREAM_ANTHROPIC_BASE: z
    .string()
    .url()
    .default("https://api.anthropic.com"),
  /** DevPulse server URL for kill-switch lookups + audit fan-out. */
  DEVPULSE_GATEWAY_DEVPULSE_URL: z.string().url().optional(),
  DEVPULSE_GATEWAY_DEVPULSE_TOKEN: z.string().optional(),
  DEVPULSE_GATEWAY_REDACT_PII: z
    .string()
    .default("true")
    .transform(s => s === "true"),
  DEVPULSE_GATEWAY_BLOCK_INJECTIONS: z
    .string()
    .default("true")
    .transform(s => s === "true"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type GatewayEnv = z.infer<typeof envSchema>;

export function loadEnv(rawEnv: NodeJS.ProcessEnv = process.env): GatewayEnv {
  const parsed = envSchema.safeParse(rawEnv);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(i => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid gateway env: ${issues}`);
  }
  return parsed.data;
}

/**
 * Parse the dev `DEVPULSE_GATEWAY_API_KEYS=tenant1:devp_xxx,tenant2:devp_yyy`
 * form into a `Map<apiKey, tenantId>` for O(1) lookup.
 */
export function parseDevApiKeys(raw: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!raw) return map;
  for (const pair of raw.split(",")) {
    const [tenantId, apiKey] = pair.trim().split(":");
    if (tenantId && apiKey) map.set(apiKey, tenantId);
  }
  return map;
}
