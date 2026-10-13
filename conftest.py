"""Protect repository data from GenLayer Test's artifact cleanup hook."""

from pathlib import Path

import pytest

from scripts.artifact_safety import allocate_artifact_directory, validate_artifact_directory


@pytest.hookimpl(tryfirst=True)
def pytest_sessionstart(session):
    """Override gltest's unsafe repo-local default before its cleanup hook runs."""
    config = session.config
    repo_root = Path(__file__).resolve().parent
    configured = config.getoption("--artifacts-dir", default=None)
    if configured is None:
        artifact_dir = allocate_artifact_directory(repo_root)
    else:
        try:
            artifact_dir = validate_artifact_directory(
                Path(configured), repo_root, require_empty=True
            )
        except ValueError as exc:
            pytest.exit(str(exc), returncode=2)

    # gltest's pytest_sessionstart calls shutil.rmtree() on its configured path.
    # Set it before that hook executes, and only after checking repo/temp scope.
    try:
        from gltest_cli.config.general import get_general_config

        general = get_general_config()
        general.plugin_config.artifacts_dir = artifact_dir
    except Exception as exc:
        pytest.exit(f"could not set guarded GenLayer Test artifact directory: {exc}", returncode=2)
    config._precedentos_artifacts_dir = artifact_dir
    reporter = config.pluginmanager.get_plugin("terminalreporter")
    if reporter:
        reporter.write_line(f"Protected GenLayer artifacts: {artifact_dir}")
