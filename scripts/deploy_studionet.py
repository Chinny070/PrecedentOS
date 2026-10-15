"""Resumable, approval-gated CLI deployment for all three PrecedentOS contracts.

This script never broadcasts a transaction on its own. It always prepares and
prints a plan (network/chain validation, wallet identity and balance, source
SHA-256 hashes, and a fee estimate) and only proceeds to the actual `genlayer
deploy` calls when invoked with --execute, which itself still asks for one
explicit typed confirmation before the first broadcast. Progress is recorded
to a manifest file after every step so a second run resumes from the last
completed contract instead of redeploying it.

Usage:
    python scripts/deploy_studionet.py --plan
    python scripts/deploy_studionet.py --execute

The GenLayer CLI (not this script) performs all signing; this script only
shells out to the already-authenticated local `genlayer` CLI.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

GENLAYER_CLI = shutil.which("genlayer")
if GENLAYER_CLI is None:
    raise SystemExit("The 'genlayer' CLI was not found on PATH. Install/activate it before running this script.")

REPO_ROOT = Path(__file__).resolve().parents[1]
CONTRACTS_DIR = REPO_ROOT / "contracts"
FRONTEND_ENV_PATH = REPO_ROOT / "frontend" / ".env"
MANIFEST_PATH = REPO_ROOT / "docs" / "V2_DEPLOYMENT_MANIFEST_STUDIONET_RUN.json"

TARGET_NETWORK_ALIAS = "studionet"
TARGET_CHAIN_ID = 61999

CONTRACTS = [
    {"key": "registry", "path": CONTRACTS_DIR / "precedent_registry.py", "name": "PrecedentRegistry"},
    {"key": "evaluator", "path": CONTRACTS_DIR / "precedent_evaluator.py", "name": "PrecedentEvaluator"},
    {"key": "case_court", "path": CONTRACTS_DIR / "case_court.py", "name": "CaseCourt"},
]

TX_HASH_RE = re.compile(r"0x[0-9a-fA-F]{64}")
ADDRESS_RE = re.compile(r"0x[0-9a-fA-F]{40}")


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run_cli(args: list[str], *, check: bool = True) -> subprocess.CompletedProcess:
    print(f"$ genlayer {' '.join(args)}", flush=True)
    result = subprocess.run([GENLAYER_CLI, *args], cwd=REPO_ROOT, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
    if result.stderr:
        print(result.stderr, end="" if result.stderr.endswith("\n") else "\n", file=sys.stderr)
    if check and result.returncode != 0:
        raise RuntimeError(f"genlayer {' '.join(args)} exited {result.returncode}")
    return result


def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {"network": TARGET_NETWORK_ALIAS, "chain_id": TARGET_CHAIN_ID, "contracts": {}}


def save_manifest(manifest: dict) -> None:
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")


@dataclass
class Plan:
    network_name: str = ""
    chain_id: int = 0
    wallet_name: str = ""
    wallet_address: str = ""
    wallet_balance: str = ""
    source_hashes: dict = field(default_factory=dict)


def gather_plan() -> Plan:
    plan = Plan()
    network_info = run_cli(["network", "info"]).stdout
    match_chain = re.search(r"chainId:\s*'?(\d+)'?", network_info)
    match_alias = re.search(r"alias:\s*'([^']+)'", network_info)
    plan.chain_id = int(match_chain.group(1)) if match_chain else 0
    plan.network_name = match_alias.group(1) if match_alias else "unknown"
    if plan.network_name != TARGET_NETWORK_ALIAS or plan.chain_id != TARGET_CHAIN_ID:
        raise RuntimeError(
            f"Active CLI network is '{plan.network_name}' (chain {plan.chain_id}); "
            f"expected '{TARGET_NETWORK_ALIAS}' (chain {TARGET_CHAIN_ID}). Run "
            f"'genlayer config network set {TARGET_NETWORK_ALIAS}' yourself before retrying; "
            "this script refuses to switch networks."
        )

    account_info = run_cli(["account"]).stdout
    match_name = re.search(r"name:\s*'([^']+)'", account_info)
    match_address = re.search(r"address:\s*'(0x[0-9a-fA-F]{40})'", account_info)
    match_balance = re.search(r"balance:\s*'([^']+)'", account_info)
    match_active = "active: true" in account_info
    plan.wallet_name = match_name.group(1) if match_name else "unknown"
    plan.wallet_address = match_address.group(1) if match_address else ""
    plan.wallet_balance = match_balance.group(1) if match_balance else "unknown"
    if not match_active:
        raise RuntimeError(
            f"Active CLI account is '{plan.wallet_name}', not confirmed active. "
            "Switch the intended deployment account yourself before retrying."
        )
    if not plan.wallet_address:
        raise RuntimeError("Could not parse the active wallet address from 'genlayer account' output.")

    for entry in CONTRACTS:
        plan.source_hashes[entry["key"]] = sha256_file(entry["path"])

    return plan


def print_plan(plan: Plan) -> None:
    print("\n=== PrecedentOS Studionet deployment plan ===")
    print(f"Network:        {plan.network_name} (chain {plan.chain_id})")
    print(f"Wallet:         {plan.wallet_name} ({plan.wallet_address})")
    print(f"Wallet balance: {plan.wallet_balance}")
    print("Source SHA-256:")
    for entry in CONTRACTS:
        print(f"  {entry['name']:<20} {plan.source_hashes[entry['key']]}  ({entry['path'].relative_to(REPO_ROOT)})")
    print(
        "\nFee estimate: the installed CLI's 'genlayer estimate-fees' is broken against this "
        "network (it throws 'client.estimateTransactionFees is not a function' in the pinned "
        "genlayer-js build) and cannot produce a number before deployment. This is a concrete "
        "tooling limitation, not a number being withheld. Treat the wallet balance above "
        "(214+ GEN) as the operative ceiling, and stop (Ctrl-C) if any single deployment's own "
        "reported cost looks implausible before letting the next one proceed."
    )
    print("=== END PLAN - nothing has been broadcast ===\n")


def extract_address_and_hash(stdout: str) -> tuple[str | None, str | None]:
    hashes = TX_HASH_RE.findall(stdout)
    addresses = ADDRESS_RE.findall(stdout)
    tx_hash = hashes[0] if hashes else None
    # The deployed contract's own address is a 40-hex address that is not the
    # wallet's sender address line; without a documented JSON output for
    # `deploy`, take the last distinct address mentioned as a best-effort
    # parse and always let the operator confirm it against Explorer.
    address = addresses[-1] if addresses else None
    return address, tx_hash


def deploy_one(entry: dict, manifest: dict) -> None:
    key = entry["key"]
    existing = manifest["contracts"].get(key)
    if existing and existing.get("status") == "finalized":
        print(f"[skip] {entry['name']} already recorded as finalized at {existing['address']} (tx {existing['tx_hash']})")
        return

    print(f"\n--- Deploying {entry['name']} ({entry['path'].relative_to(REPO_ROOT)}) ---")
    result = run_cli(["deploy", "--contract", str(entry["path"])])
    address, tx_hash = extract_address_and_hash(result.stdout + result.stderr)
    manifest["contracts"][key] = {
        "name": entry["name"],
        "source_path": str(entry["path"].relative_to(REPO_ROOT)),
        "source_sha256": sha256_file(entry["path"]),
        "tx_hash": tx_hash,
        "address": address,
        "status": "broadcast",
        "raw_deploy_stdout": result.stdout,
    }
    save_manifest(manifest)

    if not tx_hash:
        raise RuntimeError(
            f"Could not parse a transaction hash from the deploy output for {entry['name']}. "
            "Inspect the raw output above/in the manifest and finalize manually before resuming."
        )

    print(f"Waiting for finalization of {tx_hash} ...")
    receipt = run_cli(["receipt", tx_hash, "--status", "FINALIZED", "--retries", "60", "--interval", "5000"])
    receipt_text = receipt.stdout + receipt.stderr
    if "FINALIZED" not in receipt_text:
        manifest["contracts"][key]["status"] = "receipt_unconfirmed"
        save_manifest(manifest)
        raise RuntimeError(
            f"{entry['name']} deployment transaction {tx_hash} did not confirm FINALIZED in the receipt output. "
            "Do not treat this as a successful deployment. Investigate the hash on Explorer before resuming."
        )
    if re.search(r"result.*ERROR|Rollback", receipt_text, re.IGNORECASE):
        manifest["contracts"][key]["status"] = "failed"
        save_manifest(manifest)
        raise RuntimeError(f"{entry['name']} deployment transaction {tx_hash} finalized but reported an error/rollback.")

    if not address:
        manifest["contracts"][key]["status"] = "finalized_address_unconfirmed"
        save_manifest(manifest)
        raise RuntimeError(
            f"{entry['name']} transaction {tx_hash} finalized, but no contract address could be parsed. "
            "Read it from Explorer and record it manually in the manifest before continuing."
        )

    print(f"Running a read-only schema/constructor smoke check against {address} ...")
    schema = run_cli(["schema", address], check=False)
    if schema.returncode != 0:
        print(f"WARNING: could not fetch schema for {address}; verify manually.", file=sys.stderr)

    manifest["contracts"][key]["status"] = "finalized"
    manifest["contracts"][key]["raw_receipt_stdout"] = receipt.stdout
    save_manifest(manifest)
    print(f"{entry['name']} finalized at {address} (tx {tx_hash}).")


def smoke_test(manifest: dict) -> None:
    checks = {
        "registry": "get_registration_count",
        "evaluator": "get_evaluation_count",
        "case_court": "get_case_count",
    }
    print("\n--- Read-only post-deploy smoke tests ---")
    for key, method in checks.items():
        entry = manifest["contracts"].get(key)
        if not entry or not entry.get("address"):
            print(f"[skip] {key}: no recorded address.")
            continue
        result = run_cli(["call", entry["address"], method], check=False)
        print(f"{entry['name']}.{method}() -> {result.stdout.strip() or result.stderr.strip()}")


def write_frontend_env(manifest: dict) -> None:
    lines = [
        "# Generated by scripts/deploy_studionet.py — public addresses only.",
        f"VITE_GENLAYER_REGISTRY_ADDRESS={manifest['contracts'].get('registry', {}).get('address', '')}",
        f"VITE_GENLAYER_EVALUATOR_ADDRESS={manifest['contracts'].get('evaluator', {}).get('address', '')}",
        f"VITE_GENLAYER_CASECOURT_ADDRESS={manifest['contracts'].get('case_court', {}).get('address', '')}",
        "",
    ]
    FRONTEND_ENV_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nWrote {FRONTEND_ENV_PATH.relative_to(REPO_ROOT)} with the finalized addresses above.")
    print("frontend/.env is already gitignored; it is a local file, not a committed secret.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--plan", action="store_true", help="Validate network/wallet, hash sources, print the plan. Broadcasts nothing.")
    group.add_argument("--execute", action="store_true", help="After one more explicit confirmation, perform the actual deployment batch.")
    args = parser.parse_args()

    plan = gather_plan()
    print_plan(plan)

    if args.plan:
        return 0

    manifest = load_manifest()
    manifest["wallet_address"] = plan.wallet_address
    manifest["wallet_name"] = plan.wallet_name
    confirmation = input(
        "Type the wallet address shown above to confirm you approve broadcasting this deployment batch "
        "from that account on stable Studionet: "
    ).strip()
    if confirmation.lower() != plan.wallet_address.lower():
        print("Confirmation did not match the active wallet address. Aborting; nothing was broadcast.")
        return 1

    for entry in CONTRACTS:
        deploy_one(entry, manifest)
        time.sleep(1)

    smoke_test(manifest)
    write_frontend_env(manifest)
    print(f"\nFull manifest recorded at {MANIFEST_PATH.relative_to(REPO_ROOT)}.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"\nERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
