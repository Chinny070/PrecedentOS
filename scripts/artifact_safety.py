"""Path checks for the GenLayer Test runner's destructive artifact cleanup."""

from __future__ import annotations

import os
from pathlib import Path
import tempfile


def is_within(path: Path, parent: Path) -> bool:
    """Return True if path resolves to parent or one of its descendants."""
    candidate = os.path.normcase(str(path.resolve(strict=False)))
    root = os.path.normcase(str(parent.resolve(strict=False)))
    try:
        return os.path.commonpath((candidate, root)) == root
    except ValueError:  # Different drives on Windows.
        return False


def allocate_artifact_directory(repo_root: Path) -> Path:
    """Allocate a fresh, unique path under the system temp directory."""
    temp_root = Path(tempfile.gettempdir()).resolve()
    if is_within(temp_root, repo_root):
        raise RuntimeError("system temp directory resolves inside the repository")
    result = Path(tempfile.mkdtemp(prefix="precedentos-gltest-", dir=temp_root)).resolve()
    validate_artifact_directory(result, repo_root, require_empty=True)
    return result


def validate_artifact_directory(path: Path, repo_root: Path, *, require_empty: bool) -> Path:
    """Reject any cleanup target inside the repo or containing existing files."""
    resolved = path.resolve(strict=False)
    if is_within(resolved, repo_root):
        raise ValueError(f"refusing GenLayer Test artifact path inside repository: {resolved}")
    if resolved == resolved.anchor or len(resolved.parts) < 3:
        raise ValueError(f"refusing unsafe artifact path: {resolved}")
    if resolved.exists() and require_empty and any(resolved.iterdir()):
        raise ValueError(f"refusing non-empty artifact directory: {resolved}")
    return resolved
