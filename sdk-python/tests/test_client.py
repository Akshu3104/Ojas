"""Unit tests for the DevPulse Python SDK."""

from __future__ import annotations

import json

import httpx
import pytest

from devpulse import (
    DevPulseConfig,
    DevPulseError,
    GatewayError,
    chat_completions,
    chat_completions_async,
    with_devpulse,
)


def test_config_normalizes_trailing_slash():
    cfg = DevPulseConfig(
        gateway_url="https://gateway.example.com/", api_key="dvp_test"
    )
    assert cfg.gateway_url == "https://gateway.example.com"


def test_config_requires_url_and_key():
    with pytest.raises(DevPulseError):
        DevPulseConfig(gateway_url="", api_key="x")
    with pytest.raises(DevPulseError):
        DevPulseConfig(gateway_url="https://x", api_key="")


class _FakeOpenAIClient:
    """Minimal stand-in for the OpenAI Python SDK client."""

    def __init__(self):
        self.base_url = "https://api.openai.com/v1"
        self.api_key = "sk-original"
        self.default_headers: dict = {}


def test_with_devpulse_repoints_client():
    client = _FakeOpenAIClient()
    out = with_devpulse(
        client,
        gateway_url="https://gw.example.com",
        api_key="dvp_test",
        metadata={"env": "prod", "service": "checkout"},
    )
    assert out is client  # mutates in place
    assert client.base_url == "https://gw.example.com/v1"
    assert client.api_key == "dvp_test"
    assert "x-devpulse-metadata" in client.default_headers


def test_with_devpulse_requires_gateway_url():
    client = _FakeOpenAIClient()
    with pytest.raises(DevPulseError):
        with_devpulse(client, gateway_url="", api_key="dvp_test")


def test_with_devpulse_requires_api_key():
    client = _FakeOpenAIClient()
    with pytest.raises(DevPulseError):
        with_devpulse(client, gateway_url="https://gw", api_key="")


def test_with_devpulse_falls_back_to_env(monkeypatch):
    monkeypatch.setenv("DEVPULSE_GATEWAY_URL", "https://env.example.com")
    monkeypatch.setenv("DEVPULSE_API_KEY", "dvp_env")
    client = _FakeOpenAIClient()
    with_devpulse(client)
    assert client.base_url == "https://env.example.com/v1"
    assert client.api_key == "dvp_env"


# ---------------------------------------------------------------------------
# Network-level tests using httpx's MockTransport (no real I/O).
# ---------------------------------------------------------------------------


def _ok_handler(captured: dict):
    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["headers"] = dict(request.headers)
        captured["body"] = json.loads(request.content.decode("utf-8"))
        return httpx.Response(
            200,
            json={
                "id": "chatcmpl-1",
                "choices": [
                    {"index": 0, "message": {"role": "assistant", "content": "ok"}}
                ],
            },
        )

    return handler


def test_chat_completions_sends_bearer_and_metadata(monkeypatch):
    captured: dict = {}
    transport = httpx.MockTransport(_ok_handler(captured))

    real_client = httpx.Client

    def fake_client_factory(*args, **kwargs):
        kwargs["transport"] = transport
        return real_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "Client", fake_client_factory)

    out = chat_completions(
        gateway_url="https://gw.example.com",
        api_key="dvp_test",
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "hello"}],
        metadata={"team": "growth"},
    )

    assert out["id"] == "chatcmpl-1"
    assert (
        captured["url"]
        == "https://gw.example.com/v1/chat/completions"
    )
    assert captured["headers"]["authorization"] == "Bearer dvp_test"
    assert "x-devpulse-metadata" in captured["headers"]
    assert captured["body"]["model"] == "gpt-4o-mini"
    assert captured["body"]["messages"][0]["content"] == "hello"


def test_chat_completions_raises_gateway_error(monkeypatch):
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            422,
            json={"error": {"message": "prompt blocked", "code": "INJECTION"}},
        )

    transport = httpx.MockTransport(handler)
    real_client = httpx.Client

    def fake_client_factory(*args, **kwargs):
        kwargs["transport"] = transport
        return real_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "Client", fake_client_factory)

    with pytest.raises(GatewayError) as exc:
        chat_completions(
            gateway_url="https://gw.example.com",
            api_key="dvp_test",
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "x"}],
        )
    assert exc.value.status == 422
    assert exc.value.body["error"]["code"] == "INJECTION"


@pytest.mark.asyncio
async def test_chat_completions_async(monkeypatch):
    captured: dict = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(request.content.decode("utf-8"))
        return httpx.Response(
            200,
            json={"id": "chatcmpl-async", "choices": []},
        )

    transport = httpx.MockTransport(handler)
    real_async_client = httpx.AsyncClient

    def fake_async_client_factory(*args, **kwargs):
        kwargs["transport"] = transport
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", fake_async_client_factory)

    out = await chat_completions_async(
        gateway_url="https://gw.example.com",
        api_key="dvp_test",
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "ping"}],
        temperature=0.2,
        max_tokens=128,
    )

    assert out["id"] == "chatcmpl-async"
    assert captured["body"]["temperature"] == 0.2
    assert captured["body"]["max_tokens"] == 128
