# `@devpulse/sdk`

Node SDK that routes OpenAI / Anthropic SDK traffic through the **DevPulse
Inline LLM Gateway**. The gateway enforces the kill-switch, redacts PII,
blocks known prompt-injection payloads, and captures token-level cost
telemetry — none of which the SDK does on its own.

## Status

- **MVP.** Covers OpenAI-compatible clients (`openai` v4/v5).
- Anthropic native client wrapper is roadmap (Sprint 3).
- Streaming responses pass through but bypass the response-side redaction
  layer (gateway is request-side only in MVP).

## Install

```bash
pnpm add @devpulse/sdk
```

## Usage with the OpenAI SDK

```ts
import OpenAI from "openai";
import { withDevPulse } from "@devpulse/sdk";

const openai = withDevPulse(new OpenAI(), {
  gatewayUrl: "https://gateway.devpulse.example",
  apiKey: process.env.DEVPULSE_API_KEY!,
});

const r = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "hello" }],
});
```

That's the full delta. All your existing OpenAI SDK code continues to work;
the gateway transparently sees every request.

## Direct usage (no OpenAI SDK)

```ts
import { chatCompletions } from "@devpulse/sdk";

const r = await chatCompletions(
  { gatewayUrl: "...", apiKey: "..." },
  {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "hello" }],
  }
);
```

## Why does this exist?

Without a SDK, every caller has to manually rewrite the `baseURL` and
`Authorization` header for every OpenAI client they construct. This SDK
keeps that wiring in one place and lets us add per-request metadata
(captured in the gateway's audit log) without changing call sites.
