/**
 * End-to-end test for the Autonomous Kill-Switch demonstration
 * (Patent surface NHCE/DEV/2026/004).
 *
 * The demo script (`scripts/runaway-agent-demo.ts`) drives a hot loop
 * against the gateway. We don't spawn the script here — we exercise the
 * same shape directly so this test runs offline and remains hermetic.
 *
 * What we verify:
 *   1. While the kill-switch is OFF the loop succeeds (HTTP 200).
 *   2. The instant the kill-switch flips ON, the very next call gets
 *      blocked with HTTP 402 and the upstream provider is NOT invoked.
 *   3. After the trip, every subsequent call also gets HTTP 402 — i.e.
 *      severance is autonomous and does not require client cooperation.
 */
import { describe, it, expect } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import pino from "pino";
import { createGateway } from "../src/index.js";
import { createKillSwitchPolicy } from "../src/policies/killSwitch.js";
import type { LlmRequest, LlmResponse, Provider } from "../src/types.js";

const baseEnv = {
  DEVPULSE_GATEWAY_PORT: 0,
  DEVPULSE_GATEWAY_API_KEYS: "tenant-a:devp_test_aaa",
  DEVPULSE_GATEWAY_UPSTREAM_OPENAI_BASE: "http://upstream.invalid/v1",
  DEVPULSE_GATEWAY_UPSTREAM_ANTHROPIC_BASE: "http://upstream.invalid",
  DEVPULSE_GATEWAY_REDACT_PII: false,
  DEVPULSE_GATEWAY_BLOCK_INJECTIONS: false,
  NODE_ENV: "test" as const,
};

function fakeProvider(state: { calls: number }): Provider {
  return {
    id: "openai",
    matches: m => m.startsWith("gpt-"),
    invoke: async (req: LlmRequest): Promise<LlmResponse> => {
      state.calls++;
      return {
        id: `fake-${state.calls}`,
        model: req.model,
        outputText: "ok",
        raw: {
          id: `fake-${state.calls}`,
          model: req.model,
          choices: [],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        },
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      };
    },
  };
}

async function startServer(killSwitchActive: { current: boolean }) {
  const providerState = { calls: 0 };
  const fakeFetch: typeof fetch = async () =>
    new Response(JSON.stringify({ isActive: killSwitchActive.current }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  const app = createGateway({
    env: baseEnv,
    apiKeyStore: new Map([["devp_test_aaa", "tenant-a"]]),
    policies: [
      createKillSwitchPolicy({
        devpulseUrl: "http://devpulse.invalid",
        serviceToken: "stub",
        // Cache TTL of 0 makes every request consult the (fake) backend so
        // the test can flip state mid-loop without fighting cache eviction.
        cacheTtlMs: 0,
        fetchImpl: fakeFetch,
      }),
    ],
    providers: [fakeProvider(providerState)],
    emitAudit: async () => {},
    logger: pino({ level: "silent" }),
  });
  return new Promise<{
    url: string;
    close: () => Promise<void>;
    providerState: { calls: number };
  }>(resolve => {
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise(res => server.close(() => res())),
        providerState,
      });
    });
  });
}

async function callOnce(url: string): Promise<number> {
  const resp = await fetch(`${url}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer devp_test_aaa`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Loop forever" }],
      max_tokens: 1,
    }),
  });
  // Drain so node doesn't keep the connection alive.
  await resp.text().catch(() => "");
  return resp.status;
}

describe("Autonomous Kill-Switch demo (Patent NHCE/DEV/2026/004)", () => {
  it("flips from 200 to 402 at the moment the kill-switch engages", async () => {
    const killSwitchActive = { current: false };
    const { url, close, providerState } = await startServer(killSwitchActive);
    try {
      // Phase 1: kill-switch off, loop should succeed.
      for (let i = 0; i < 5; i++) {
        const status = await callOnce(url);
        expect(status).toBe(200);
      }
      expect(providerState.calls).toBe(5);

      // Phase 2: trip the switch — autonomous severance kicks in.
      killSwitchActive.current = true;

      const tripStatuses: number[] = [];
      for (let i = 0; i < 10; i++) {
        tripStatuses.push(await callOnce(url));
      }
      // Every post-trip call must be HTTP 402.
      expect(tripStatuses.every(s => s === 402)).toBe(true);
      // Provider must NOT have been called once after the trip.
      expect(providerState.calls).toBe(5);
    } finally {
      await close();
    }
  });

  it("never invokes the upstream provider after the kill-switch is engaged", async () => {
    const killSwitchActive = { current: true };
    const { url, close, providerState } = await startServer(killSwitchActive);
    try {
      const N = 25;
      const statuses = await Promise.all(
        Array.from({ length: N }, () => callOnce(url))
      );
      expect(statuses.every(s => s === 402)).toBe(true);
      expect(providerState.calls).toBe(0);
    } finally {
      await close();
    }
  });
});
