import json

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
