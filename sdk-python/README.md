# `devpulse` — Python SDK for the DevPulse Inline LLM Gateway

Mirror of `@devpulse/sdk` (Node) for Python applications.

```python
import os
import openai
from devpulse import with_devpulse

client = with_devpulse(
    openai.OpenAI(),
    gateway_url=os.environ["DEVPULSE_GATEWAY_URL"],
    api_key=os.environ["DEVPULSE_API_KEY"],
)

resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "hello"}],
)
```

The OpenAI Python SDK is **optional** — if you'd rather not depend on it,
call the gateway directly:

```python
from devpulse import chat_completions

resp = chat_completions(
    gateway_url=os.environ["DEVPULSE_GATEWAY_URL"],
    api_key=os.environ["DEVPULSE_API_KEY"],
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "hello"}],
)
```

## Installation

```sh
pip install devpulse
# or, with the OpenAI extra:
pip install "devpulse[openai]"
```

## What lives where

- **PII redaction**, **prompt-injection blocking**, **kill-switch enforcement**,
  **token caps**: all at the gateway, never in this SDK.
- **The DevPulse API key** identifies your tenant to the gateway. The gateway
  holds the upstream provider key (OpenAI / Anthropic / Bedrock / etc.).
- **Metadata** (`team`, `env`, etc.) flows through the
  `x-devpulse-metadata` header and is captured in the gateway audit log.

## Async

```python
from devpulse import chat_completions_async

resp = await chat_completions_async(
    gateway_url=...,
    api_key=...,
    model="gpt-4o-mini",
    messages=[...],
)
```

## Errors

Non-2xx gateway responses raise `devpulse.GatewayError`:

```python
from devpulse import GatewayError

try:
    chat_completions(...)
except GatewayError as e:
    if e.status == 422:
        # blocked by an injection-detection policy
        ...
    elif e.status == 402:
        # kill-switch active or budget exceeded
        ...
```
