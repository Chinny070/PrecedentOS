import json
from types import SimpleNamespace

import pytest

from scripts import deploy_studionet


def test_deployment_cli_resolution_rejects_global_only_install(monkeypatch, tmp_path):
    package = tmp_path / "node_modules" / "genlayer"
    monkeypatch.setattr(deploy_studionet, "LOCAL_GENLAYER_PACKAGE", package)
    monkeypatch.setattr(deploy_studionet, "LOCAL_GENLAYER_PACKAGE_JSON", package / "package.json")
    monkeypatch.setattr(deploy_studionet.shutil, "which", lambda _: "C:/global/node.exe")

    with pytest.raises(RuntimeError, match="global CLI executables are never used"):
        deploy_studionet.local_cli_command()


def test_deployment_cli_resolution_requires_exact_local_version(monkeypatch, tmp_path):
    package = tmp_path / "node_modules" / "genlayer"
    package.mkdir(parents=True)
    (package / "package.json").write_text(json.dumps({"version": "0.40.0-rc.3", "bin": {"genlayer": "cli.js"}}))
    monkeypatch.setattr(deploy_studionet, "LOCAL_GENLAYER_PACKAGE", package)
    monkeypatch.setattr(deploy_studionet, "LOCAL_GENLAYER_PACKAGE_JSON", package / "package.json")

    with pytest.raises(RuntimeError, match="expected 0.39.1"):
        deploy_studionet.local_cli_command()


def test_deployment_cli_resolves_only_the_repository_local_binary(monkeypatch, tmp_path):
    package = tmp_path / "node_modules" / "genlayer"
    package.mkdir(parents=True)
    binary = package / "dist" / "cli.js"
    binary.parent.mkdir()
    binary.write_text("// local CLI stub")
    (package / "package.json").write_text(json.dumps({"version": "0.39.1", "bin": {"genlayer": "dist/cli.js"}}))
    monkeypatch.setattr(deploy_studionet, "LOCAL_GENLAYER_PACKAGE", package)
    monkeypatch.setattr(deploy_studionet, "LOCAL_GENLAYER_PACKAGE_JSON", package / "package.json")
    monkeypatch.setattr(deploy_studionet.shutil, "which", lambda name: "C:/node/node.exe" if name == "node" else None)

    assert deploy_studionet.local_cli_command() == ["C:/node/node.exe", str(binary.resolve())]


def test_deployment_preflight_uses_cli_network_and_active_account(monkeypatch):
    outputs = {
        ("--version",): "0.39.1\n",
        ("network", "info"): (
            "alias: 'studionet'\nchainId: '61999'\nrpc: 'https://studio.genlayer.com/api'\n"
        ),
        ("account",): (
            "name: 'my-studionet-wallet'\n"
            "address: '0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b'\n"
            "balance: '214.9 GEN'\nnetwork: 'Genlayer Studio Network'\nactive: true\n"
        ),
    }
    monkeypatch.setattr(
        deploy_studionet,
        "run_cli",
        lambda args, **kwargs: SimpleNamespace(stdout=outputs[tuple(args)], stderr="", returncode=0),
    )

    plan = deploy_studionet.gather_plan()

    assert plan.network_name == "studionet"
    assert plan.chain_id == 61999
    assert plan.account_network == "Genlayer Studio Network"
    assert plan.wallet_address.lower() == "0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b"
    assert set(plan.source_hashes) == {"registry", "evaluator", "case_court"}


def test_deployment_preflight_rejects_unexpected_account_network(monkeypatch):
    outputs = {
        ("--version",): "0.39.1\n",
        ("network", "info"): (
            "alias: 'studionet'\nchainId: '61999'\nrpc: 'https://studio.genlayer.com/api'\n"
        ),
        ("account",): (
            "name: 'wallet'\naddress: '0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b'\n"
            "balance: '1 GEN'\nnetwork: 'Other Network'\nactive: true\n"
        ),
    }
    monkeypatch.setattr(
        deploy_studionet,
        "run_cli",
        lambda args, **kwargs: SimpleNamespace(stdout=outputs[tuple(args)], stderr="", returncode=0),
    )

    with pytest.raises(RuntimeError, match="expected 'Genlayer Studio Network'"):
        deploy_studionet.gather_plan()


def test_cli_code_output_wrapper_is_removed_without_normalizing_source():
    source = "# contract\n\nclass Example:\n    pass\n\n\n"

    assert deploy_studionet.extract_cli_code(f"\nResult:\n{source}\n\n") == source


def test_cli_code_output_requires_expected_result_wrapper():
    with pytest.raises(RuntimeError, match="Could not isolate"):
        deploy_studionet.extract_cli_code("unrecognized output")


def test_replacement_deployment_preserves_prior_finalized_record():
    previous = {"status": "finalized", "address": "0xold", "tx_hash": "0xoldtx"}
    manifest = {"contracts": {"case_court": {"status": "finalized"}}}

    deploy_studionet.preserve_deployment_history(manifest, "case_court", previous, "0xnew")
    deploy_studionet.preserve_deployment_history(manifest, "case_court", previous, "0xnew")

    history = manifest["case_court_history"]
    assert len(history) == 1
    assert history[0]["address"] == "0xold"
    assert history[0]["superseded_by"] == "0xnew"


def test_source_comparison_normalizes_only_windows_newlines():
    assert deploy_studionet.comparable_source_bytes(b"a\r\nb\n") == b"a\nb\n"
    assert deploy_studionet.comparable_source_bytes(b"a\rb") == b"a\rb"
