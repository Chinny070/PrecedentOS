"""Direct Mode checks for the isolated callback capture comparison only."""

from pathlib import Path


ROOT = Path(__file__).parents[1]
PROBE = ROOT / "experiments" / "stage9" / "nondet_storage_capture_probe.py"


def test_bound_and_module_level_callback_cases_execute_in_direct_mode(direct_vm, direct_deploy):
    probe = direct_deploy(str(PROBE))

    probe.run_bound_helper_case()
    probe.run_pure_function_case()

    state = probe.get_probe_state()
    assert state == {
        "bound_runs": "1",
        "pure_runs": "1",
        "bound_result": "True",
        "pure_result": "True",
    }


def test_production_callbacks_do_not_reference_storage_backed_self():
    """A source guard for callback bodies; Direct Mode cannot prove VM storage safety."""
    import ast

    for relative, class_name in (
        ("contracts/precedent_evaluator.py", "PrecedentEvaluator"),
        ("contracts/case_court.py", "CaseCourt"),
        ("experiments/stage6/studio_runtime_probe.py", "StudioRuntimeProbe"),
    ):
        tree = ast.parse((ROOT / relative).read_text(encoding="utf-8"))
        contract = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == class_name)
        pure_helpers = [
            node for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name.startswith("_pure_")
        ]
        assert pure_helpers, f"{relative} has no module-level pure nondeterministic helpers"
        for helper in pure_helpers:
            assert not any(
                isinstance(node, ast.Name) and node.id == "self"
                for node in ast.walk(helper)
            ), f"{relative}:{helper.name} refers to contract instance state"
        for method in contract.body:
            if not isinstance(method, ast.FunctionDef):
                continue
            nondet_calls = [
                node for node in ast.walk(method)
                if isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr == "run_nondet_unsafe"
            ]
            if not nondet_calls:
                continue
            callbacks = {
                node.name: node for node in method.body
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
                and node.name in {"analyze", "validator_fn", "leader_fn"}
            }
            for callback in callbacks.values():
                assert not any(
                    isinstance(node, ast.Name) and node.id == "self"
                    for node in ast.walk(callback)
                ), f"{relative}:{method.name}:{callback.name} captures self"
