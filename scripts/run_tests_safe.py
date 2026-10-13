"""Safe pytest entry point; GenLayer Test may clear only a fresh temp folder."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import subprocess
import sys

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

    artifact_dir = allocate_artifact_directory(REPO_ROOT)
    validate_artifact_directory(artifact_dir, REPO_ROOT, require_empty=True)
    print(f"GenLayer Test artifacts: {artifact_dir}", flush=True)
    command = [
        sys.executable, "-m", "pytest", f"--artifacts-dir={artifact_dir}", *args
    ]
    result = subprocess.run(command, cwd=REPO_ROOT, check=False)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
