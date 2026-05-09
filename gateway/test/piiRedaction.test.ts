import { describe, expect, it } from "vitest";
import { createPiiRedactionPolicy } from "../src/policies/piiRedaction.js";
import type { LlmRequest, RequestContext } from "../src/types.js";

const ctx: RequestContext = {
  tenantId: "t1",
  requestId: "r1",
  startedAt: Date.now(),
};

async function redact(text: string): Promise<string> {
  const policy = createPiiRedactionPolicy();
  const request: LlmRequest = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: text }],
  };
  const decision = await policy({ ctx, request });
  if (decision.kind !== "mutate") return text;
  const m = decision.request.messages[0];
  if (m && typeof m.content === "string") return m.content;
  return text;
}

describe("piiRedaction (India patterns)", () => {
  it("redacts Aadhaar", async () => {
    const out = await redact("My aadhaar is 1234 5678 9012 thanks");
    expect(out).toContain("<AADHAAR_REDACTED>");
    expect(out).not.toContain("1234 5678 9012");
  });

  it("redacts PAN", async () => {
    const out = await redact("PAN: ABCDE1234F please confirm");
    expect(out).toContain("<PAN_REDACTED>");
    expect(out).not.toContain("ABCDE1234F");
  });

  it("redacts IFSC bank code", async () => {
    const out = await redact("Use IFSC HDFC0001234 to wire it.");
    expect(out).toContain("<IFSC_REDACTED>");
    expect(out).not.toContain("HDFC0001234");
  });

  it("redacts Indian passport", async () => {
    const out = await redact("Passport J1234567 expires soon.");
    expect(out).toContain("<PASSPORT_IN_REDACTED>");
    expect(out).not.toContain("J1234567");
  });

  it("redacts EPIC voter id", async () => {
    const out = await redact("Voter ID ABC1234567 please confirm");
    expect(out).toContain("<VOTER_ID_REDACTED>");
    expect(out).not.toContain("ABC1234567");
  });

  it("redacts Indian mobile", async () => {
    const out = await redact("Call me on +91 9876543210 anytime");
    expect(out).toContain("<PHONE_IN_REDACTED>");
    expect(out).not.toContain("9876543210");
  });

  it("redacts GSTIN", async () => {
    const out = await redact("Our GSTIN is 22ABCDE1234F1Z5 ok?");
    expect(out).toContain("<GSTIN_REDACTED>");
    expect(out).not.toContain("22ABCDE1234F1Z5");
  });

  it("does not redact normal text without PII", async () => {
    const original = "Hello, this is a perfectly normal prompt.";
    const out = await redact(original);
    expect(out).toBe(original);
  });
});
