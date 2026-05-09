"""DevPulse Python SDK — thin client for the DevPulse Inline LLM Gateway.

Mirrors the public surface of `@devpulse/sdk` (Node).

The gateway holds the upstream provider key (OpenAI / Anthropic / Bedrock /
etc.) server-side. The SDK only sends the DevPulse-issued API key. All policy
enforcement (PII redaction, prompt-injection blocking, kill-switch, token
caps) happens at the gateway, not in this SDK.

Two integration modes:

1. Wrap an existing OpenAI client::

       import openai
       from devpulse import with_devpulse

       client = with_devpulse(
           openai.OpenAI(),
           gateway_url="https://gateway.example.com",
           api_key=os.environ["DEVPULSE_API_KEY"],
       )

       client.chat.completions.create(
           model="gpt-4o-mini",
           messages=[{"role": "user", "content": "hello"}],
       )

2. Call the gateway directly without the OpenAI SDK::

       from devpulse import chat_completions

       resp = chat_completions(
           gateway_url=...,
           api_key=...,
           model="gpt-4o-mini",
           messages=[{"role": "user", "content": "hello"}],
       )
"""

from __future__ import annotations

from .client import (
    DevPulseConfig,
    DevPulseError,
    GatewayError,
    chat_completions,
    chat_completions_async,
    with_devpulse,
)

__all__ = [
    "DevPulseConfig",
    "DevPulseError",
    "GatewayError",
    "chat_completions",
    "chat_completions_async",
    "with_devpulse",
]

__version__ = "0.1.0"
