from pathlib import Path

import pytest

from scripts.artifact_safety import is_within, validate_artifact_directory


def test_artifact_directory_outside_repo_is_allowed_when_empty(tmp_path):
    repo = tmp_path / "repo"
    external = tmp_path / "temp" / "fresh"
    repo.mkdir()
    external.mkdir(parents=True)
    assert validate_artifact_directory(external, repo, require_empty=True) == external.resolve()


@pytest.mark.parametrize("target", ["repo", "artifacts", "nested"])
def test_repository_artifact_paths_are_rejected(tmp_path, target):
    repo = tmp_path / "repo"
    repo.mkdir()
    path = {"repo": repo, "artifacts": repo / "artifacts", "nested": repo / "tests" / "artifacts"}[target]
    with pytest.raises(ValueError, match="inside repository"):
        validate_artifact_directory(path, repo, require_empty=True)


def test_nonempty_external_path_is_rejected(tmp_path):
    repo = tmp_path / "repo"
    external = tmp_path / "temp" / "existing"
    repo.mkdir()
    external.mkdir(parents=True)
    (external / "keep.txt").write_text("preserve", encoding="utf-8")
    with pytest.raises(ValueError, match="non-empty"):
        validate_artifact_directory(external, repo, require_empty=True)
    assert (external / "keep.txt").read_text(encoding="utf-8") == "preserve"


def test_path_scope_detects_repository_ancestor_descendants(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()
    assert is_within(repo / "artifacts", repo)
    assert not is_within(tmp_path / "outside", repo)
