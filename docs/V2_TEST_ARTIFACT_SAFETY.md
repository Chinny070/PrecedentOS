# GenLayer Test Artifact Safety

## Risk

The installed `gltest_cli.config.plugin.py` implements `pytest_sessionstart` by recursively clearing its configured artifact directory with `shutil.rmtree`. Its default destination can be the repository-root `artifacts/`. A plain pytest invocation therefore must not be allowed to inherit that repository-local default.

## Protection implemented

Root `conftest.py` has a `pytest_sessionstart` hook marked `tryfirst=True`. Before the GenLayer Test cleanup hook runs, it allocates a fresh unique directory under Python's system temp directory when no explicit option was supplied, checks that it resolves outside the repository, then sets GenLayer Test's configured destination. An explicitly supplied path inside the repository, a root-like path, or a non-empty existing directory is rejected before GenLayer Test can clear it.

`scripts/run_tests_safe.py` is the recommended entry point. It allocates and validates a new temp directory and does not permit callers to override `--artifacts-dir`. The wrapper preserves its generated artifacts; it does not clean them after pytest. Keep these temp outputs unless you separately decide to remove a specific one.

## Commands

Recommended:

```powershell
python scripts/run_tests_safe.py tests
python scripts/run_tests_safe.py tests/test_case_court_contradictions_authority.py
```

Ordinary invocation from the repository also runs the root preflight:

```powershell
python -m pytest tests
```

The guard itself is covered by `tests/test_artifact_safety.py`. A path-inside-repository check was also exercised through ordinary pytest; the GenLayer plugin log showed only a unique `%TEMP%\precedentos-gltest-*` path. The repository `artifacts/` file count was 0 both before and after the direct guard test. No existing ignored output was cleaned or restored in this stage.

Do not bypass the root `conftest.py` or invoke a separately configured GenLayer Test runner that ignores this guard. Do not manually pass an existing artifacts directory, even outside the repository; the guard rejects non-empty targets.

## Historical note

Stage 5's report records an earlier accidental cleanup of the ignored repository `artifacts/` directory during a mistyped test invocation. No tracked file was affected and no recovery was attempted. This implementation prevents normal pytest use from targeting that path; it does not reconstruct prior generated data.
