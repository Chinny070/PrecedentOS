"""Opt-in, read-only check that the configured RPC is GenLayer localnet."""

from __future__ import annotations

import json
import os
from urllib.error import URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import pytest


EXPECTED_CHAIN_ID = 61127
DEFAULT_RPC_URL = "http://127.0.0.1:4000/api"


def test_localnet_rpc_identity_before_any_deployment() -> None:
    """Check JSON-RPC identity only; this test never deploys or sends a write."""
    if os.environ.get("PRECEDENTOS_RUN_LOCALNET_SMOKE") != "1":
        pytest.skip("set PRECEDENTOS_RUN_LOCALNET_SMOKE=1 to opt in")

    rpc_url = os.environ.get("PRECEDENTOS_LOCALNET_RPC_URL", DEFAULT_RPC_URL)
    parsed = urlparse(rpc_url)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        pytest.fail("refusing non-loopback RPC; local smoke must not contact a public network")

    request = Request(
        rpc_url,
        data=json.dumps(
            {"jsonrpc": "2.0", "id": 1, "method": "eth_chainId", "params": []}
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=5) as response:
            if response.status != 200:
                pytest.fail(f"RPC returned HTTP {response.status}")
            payload = json.loads(response.read().decode("utf-8"))
    except (URLError, TimeoutError, OSError) as exc:
        pytest.fail(f"localnet RPC did not respond: {exc}")
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        pytest.fail(f"localnet RPC returned invalid JSON: {exc}")

    if payload.get("id") != 1 or payload.get("jsonrpc") != "2.0":
        pytest.fail("RPC response did not match the JSON-RPC request")
    if "error" in payload:
        pytest.fail(f"RPC returned a JSON-RPC error: {payload['error']}")

    result = payload.get("result")
    if not isinstance(result, str) or not result.startswith("0x"):
        pytest.fail("eth_chainId response did not contain a hexadecimal result")
    actual_chain_id = int(result, 16)
    assert actual_chain_id == EXPECTED_CHAIN_ID, (
        f"refusing further local testing: expected chain ID {EXPECTED_CHAIN_ID}, "
        f"observed {actual_chain_id}"
    )
