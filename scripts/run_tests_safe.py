"""Safe pytest entry point; GenLayer Test may clear only a fresh temp folder."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import subprocess
import sys
import tempfile

from artifact_safety import allocate_artifact_directory, validate_artifact_directory


REPO_ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run pytest with a unique temporary GenLayer artifact directory."
    )
    parser.add_argument("pytest_args", nargs=argparse.REMAINDER)
    parsed = parser.parse_args()
    args = parsed.pytest_args
    if args and args[0] == "--":
        args = args[1:]
    if any(arg == "--artifacts-dir" or arg.startswith("--artifacts-dir=") for arg in args):
        parser.error("do not provide --artifacts-dir; this wrapper owns and guards that path")
    if any(arg == "--basetemp" or arg.startswith("--basetemp=") for arg in args):
        parser.error("do not provide --basetemp; this wrapper owns and guards that path")

    artifact_dir = allocate_artifact_directory(REPO_ROOT)
    validate_artifact_directory(artifact_dir, REPO_ROOT, require_empty=True)
    print(f"GenLayer Test artifacts: {artifact_dir}", flush=True)
    # pytest's own default base temp directory (pytest-of-<user> under the system
    # temp root) can be left with a broken or overly restrictive ACL by an earlier
    # crashed run or another tool, which breaks every test using the built-in
    # tmp_path/tmp_path_factory fixtures with a bare PermissionError unrelated to
    # this project's code. Point pytest at a fresh, uniquely named directory (the
    # same allocation pattern already used for GenLayer artifacts above) instead
    # of trying to repair or delete that shared system directory.
    basetemp_dir = Path(tempfile.mkdtemp(prefix="precedentos-pytest-basetemp-"))
    validate_artifact_directory(basetemp_dir, REPO_ROOT, require_empty=True)
    print(f"Pytest basetemp: {basetemp_dir}", flush=True)
    command = [
        sys.executable, "-m", "pytest",
        f"--artifacts-dir={artifact_dir}", f"--basetemp={basetemp_dir}", *args,
    ]
    result = subprocess.run(command, cwd=REPO_ROOT, check=False)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
