import { describe, expect, it } from "vitest";
import { decide, type TokenBudgetState } from "../src/policies/tokenBudget.js";
import type { LlmRequest } from "../src/types.js";

const req = (model = "gpt-4o-mini"): LlmRequest => ({
  model,
  messages: [{ role: "user", content: "hello" }],
});

const baseState = (over: Partial<TokenBudgetState> = {}): TokenBudgetState => ({
  windowStart: "2025-01-01",
  used: 0,
  limit: null,
  mode: "soft",
  ...over,
});

describe("token budget — decide()", () => {
  it("allows when no caps configured", () => {
    expect(decide(baseState(), req(), [0.8, 0.9])).toEqual({ kind: "allow" });
  });

  it("warns at 80% of daily limit (mutate, original request preserved)", () => {
    const r = req();
    const d = decide(
      baseState({ used: 800, limit: 1000 }),
      r,
      [0.8, 0.9]
    );
    expect(d.kind).toBe("mutate");
    if (d.kind === "mutate") {
      expect(d.request).toBe(r);
      const w = (d.detail?.warnings as Array<{ threshold: number; scope: string }>) ?? [];
      expect(w[0]?.scope).toBe("daily");
      expect(w[0]?.threshold).toBe(0.8);
    }
  });

  it("warns at 90% — both 80% and 90% thresholds fire as a single highest-threshold warning", () => {
    const d = decide(
      baseState({ used: 920, limit: 1000 }),
      req(),
      [0.8, 0.9]
    );
    if (d.kind === "mutate") {
      const w = (d.detail?.warnings as Array<{ threshold: number }>) ?? [];
      expect(w[0]?.threshold).toBe(0.9);
    }
  });

  it("blocks 402 in hard mode at 100% of daily limit", () => {
    const d = decide(
      baseState({ used: 1000, limit: 1000, mode: "hard" }),
      req(),
      [0.8, 0.9]
    );
    expect(d.kind).toBe("block");
    if (d.kind === "block") {
      expect(d.status).toBe(402);
      expect(d.reason).toBe("token_budget_exceeded");
    }
  });

  it("blocks 429 in hard mode when hourly limit hit", () => {
    const d = decide(
      baseState({
        used: 100,
        limit: 1000,
        usedHour: 60,
        limitHour: 50,
        mode: "hard",
      }),
      req(),
      [0.8, 0.9]
    );
    expect(d.kind).toBe("block");
    if (d.kind === "block") {
      expect(d.status).toBe(429);
      expect(d.reason).toBe("token_budget_hourly_exceeded");
    }
  });

  it("blocks 402 when per-model cap exhausted in hard mode", () => {
    const d = decide(
      baseState({
        used: 100,
        limit: 1000,
        perModel: { "gpt-4o": { used: 200, limit: 200 } },
        mode: "hard",
      }),
      req("gpt-4o"),
      [0.8, 0.9]
    );
    expect(d.kind).toBe("block");
    if (d.kind === "block") {
      expect(d.status).toBe(402);
      expect(d.reason).toBe("token_budget_model_exceeded");
      expect((d.detail as Record<string, unknown>).model).toBe("gpt-4o");
    }
  });

  it("warns on per-model usage independently from daily warning", () => {
    const d = decide(
      baseState({
        used: 100,
        limit: 1000, // 10% used overall
        perModel: { "gpt-4o": { used: 850, limit: 1000 } }, // 85% used per-model
      }),
      req("gpt-4o"),
      [0.8, 0.9]
    );
    if (d.kind === "mutate") {
      const w = (d.detail?.warnings as Array<{ scope: string; model?: string }>) ?? [];
      const pm = w.find(x => x.scope === "per_model");
      expect(pm?.model).toBe("gpt-4o");
    } else {
      throw new Error("expected mutate decision with warning");
    }
  });

  it("allows in soft mode even past daily cap (warning only, never block)", () => {
    const d = decide(
      baseState({ used: 5000, limit: 1000, mode: "soft" }),
      req(),
      [0.8, 0.9]
    );
    expect(d.kind).toBe("mutate"); // warnings attached, never block in soft
  });
});
