"""DevPulse Python SDK — client implementation.

Intentionally tiny: anything that could break privacy guarantees lives in
the gateway, not here. The SDK never edits prompts.
"""

from __future__ import annotations

import json
import os
import typing as _t
from dataclasses import dataclass, field
from urllib.parse import quote

import httpx


__all__ = [
    "DevPulseConfig",
    "DevPulseError",
    "GatewayError",
    "chat_completions",
    "chat_completions_async",
    "with_devpulse",
]


class DevPulseError(Exception):
    """Base class for all DevPulse SDK errors."""


class GatewayError(DevPulseError):
    """Raised when the gateway returns a non-2xx response."""

    def __init__(self, message: str, status: int, body: _t.Any = None) -> None:
        super().__init__(message)
        self.status = status
        self.body = body


@dataclass
class DevPulseConfig:
    """Configuration for routing a request through the DevPulse gateway."""

    gateway_url: str
    api_key: str
    metadata: _t.Mapping[str, _t.Union[str, int, float, bool]] = field(
        default_factory=dict
    )
    timeout: float = 60.0

    def __post_init__(self) -> None:
        if not self.gateway_url:
            raise DevPulseError("DevPulseConfig: gateway_url is required")
        if not self.api_key:
            raise DevPulseError("DevPulseConfig: api_key is required")
        # Normalize trailing slash.
        self.gateway_url = self.gateway_url.rstrip("/")


def _encode_metadata(
    metadata: _t.Mapping[str, _t.Union[str, int, float, bool]],
) -> str:
    return quote(json.dumps(dict(metadata), separators=(",", ":"), sort_keys=True))


def _request_headers(cfg: DevPulseConfig) -> _t.Dict[str, str]:
    headers = {
        "Authorization": f"Bearer {cfg.api_key}",
        "Content-Type": "application/json",
    }
    if cfg.metadata:
        headers["x-devpulse-metadata"] = _encode_metadata(cfg.metadata)
    return headers


def with_devpulse(
    client: _t.Any,
    *,
    gateway_url: _t.Optional[str] = None,
    api_key: _t.Optional[str] = None,
    metadata: _t.Optional[
        _t.Mapping[str, _t.Union[str, int, float, bool]]
    ] = None,
) -> _t.Any:
    """Re-point an OpenAI Python SDK client at the DevPulse gateway.

    Mutates the client in place AND returns it, so existing application
    code continues to work without refactoring. Equivalent to ``withDevPulse``
    in the Node SDK.
    """
    gateway_url = gateway_url or os.environ.get("DEVPULSE_GATEWAY_URL")
    api_key = api_key or os.environ.get("DEVPULSE_API_KEY")
    if not gateway_url:
        raise DevPulseError(
            "with_devpulse: gateway_url not provided and DEVPULSE_GATEWAY_URL not set"
        )
    if not api_key:
        raise DevPulseError(
            "with_devpulse: api_key not provided and DEVPULSE_API_KEY not set"
        )

    base = gateway_url.rstrip("/")
    base_v1 = f"{base}/v1"

    # The OpenAI Python SDK accepts attribute assignment on `base_url` and
    # `api_key`. We touch only those public attributes — never reach into
    # `_client` internals — to stay forward-compatible with future SDK
    # versions.
    try:
        client.base_url = base_v1
    except (AttributeError, TypeError) as exc:  # pragma: no cover - defensive
        raise DevPulseError(
            f"with_devpulse: client does not expose a writable base_url: {exc}"
        ) from exc
    try:
        client.api_key = api_key
    except (AttributeError, TypeError) as exc:  # pragma: no cover - defensive
        raise DevPulseError(
            f"with_devpulse: client does not expose a writable api_key: {exc}"
        ) from exc

    # Inject metadata header. The OpenAI Python SDK exposes this via
    # `default_headers` on construction; for an existing instance we merge
    # into whatever attribute the SDK uses for default headers.
    if metadata:
        encoded = _encode_metadata(metadata)
        existing_headers = getattr(client, "default_headers", None)
        if isinstance(existing_headers, dict):
            existing_headers["x-devpulse-metadata"] = encoded
        else:
            try:
                client.default_headers = {"x-devpulse-metadata": encoded}
            except (AttributeError, TypeError):
                # If the SDK doesn't expose default_headers, the metadata
                # is a soft feature — log nothing, just skip.
                pass

    return client


def _build_body(
    *,
    model: str,
    messages: _t.Sequence[_t.Mapping[str, _t.Any]],
    temperature: _t.Optional[float] = None,
    max_tokens: _t.Optional[int] = None,
    stream: bool = False,
    extra: _t.Optional[_t.Mapping[str, _t.Any]] = None,
) -> _t.Dict[str, _t.Any]:
    body: _t.Dict[str, _t.Any] = {
        "model": model,
        "messages": list(messages),
    }
    if temperature is not None:
        body["temperature"] = temperature
    if max_tokens is not None:
        body["max_tokens"] = max_tokens
    if stream:
        body["stream"] = True
    if extra:
        for key, value in extra.items():
            if key not in body:
                body[key] = value
    return body


def _check_response(resp: httpx.Response) -> None:
    if resp.is_success:
        return
    body: _t.Any
    try:
        body = resp.json()
    except ValueError:
        body = resp.text[:500]
    raise GatewayError(
        f"DevPulse gateway returned {resp.status_code}",
        status=resp.status_code,
        body=body,
    )


def chat_completions(
    *,
    gateway_url: str,
    api_key: str,
    model: str,
    messages: _t.Sequence[_t.Mapping[str, _t.Any]],
    temperature: _t.Optional[float] = None,
    max_tokens: _t.Optional[int] = None,
    metadata: _t.Optional[
        _t.Mapping[str, _t.Union[str, int, float, bool]]
    ] = None,
    timeout: float = 60.0,
    extra: _t.Optional[_t.Mapping[str, _t.Any]] = None,
) -> _t.Dict[str, _t.Any]:
    """Synchronous chat-completions call against the gateway.

    Use this when you don't want a dependency on the OpenAI SDK.
    """
    cfg = DevPulseConfig(
        gateway_url=gateway_url,
        api_key=api_key,
        metadata=metadata or {},
        timeout=timeout,
    )
    body = _build_body(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=False,
        extra=extra,
    )
    with httpx.Client(timeout=cfg.timeout) as client:
        resp = client.post(
            f"{cfg.gateway_url}/v1/chat/completions",
            content=json.dumps(body).encode("utf-8"),
            headers=_request_headers(cfg),
        )
    _check_response(resp)
    return resp.json()


async def chat_completions_async(
    *,
    gateway_url: str,
    api_key: str,
    model: str,
    messages: _t.Sequence[_t.Mapping[str, _t.Any]],
    temperature: _t.Optional[float] = None,
    max_tokens: _t.Optional[int] = None,
    metadata: _t.Optional[
        _t.Mapping[str, _t.Union[str, int, float, bool]]
    ] = None,
    timeout: float = 60.0,
    extra: _t.Optional[_t.Mapping[str, _t.Any]] = None,
) -> _t.Dict[str, _t.Any]:
    """Async equivalent of :func:`chat_completions`."""
    cfg = DevPulseConfig(
        gateway_url=gateway_url,
        api_key=api_key,
        metadata=metadata or {},
        timeout=timeout,
    )
    body = _build_body(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=False,
        extra=extra,
    )
    async with httpx.AsyncClient(timeout=cfg.timeout) as client:
        resp = await client.post(
            f"{cfg.gateway_url}/v1/chat/completions",
            content=json.dumps(body).encode("utf-8"),
            headers=_request_headers(cfg),
        )
    _check_response(resp)
    return resp.json()
