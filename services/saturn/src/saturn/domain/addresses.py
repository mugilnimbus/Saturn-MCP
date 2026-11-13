"""Saturn is local-only: every address it listens on or calls must be on this computer."""

from __future__ import annotations

import ipaddress
from urllib.parse import urlsplit


def loopback_host(value: str) -> str:
    if value == "localhost":
        return value
    try:
        if ipaddress.ip_address(value.strip("[]")).is_loopback:
            return value
    except ValueError:
        pass
    raise ValueError("Saturn is local-only; use localhost or a loopback address.")


def local_http_url(value: str) -> str:
    """A model-server address: http(s), loopback host, no credentials in the address."""
    url = urlsplit(value)
    if url.scheme not in ("http", "https") or url.username or url.password or not url.hostname:
        raise ValueError("Use a local http:// address without credentials in it, such as http://127.0.0.1:1234/v1.")
    loopback_host(url.hostname)
    return value.rstrip("/")
