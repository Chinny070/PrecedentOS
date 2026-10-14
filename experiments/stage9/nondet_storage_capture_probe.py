# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Isolated callback-capture diagnostic; not a production contract."""

from genlayer import *


def _pure_decision() -> bool:
    return True


class NondetStorageCaptureProbe(gl.Contract):
    """Compare self-bound and module-level pure callback captures."""

    bound_runs: u32
    pure_runs: u32
    bound_result: bool
    pure_result: bool

    def __init__(self):
        self.bound_runs = u32(0)
        self.pure_runs = u32(0)
        self.bound_result = False
        self.pure_result = False

    @gl.public.write
    def run_bound_helper_case(self) -> None:
        def leader_fn():
            return self._bound_decision()

        def validator_fn(leader_result) -> bool:
            return isinstance(leader_result, gl.vm.Return) and self._bound_decision() == leader_result.calldata

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        self.bound_runs = u32(int(self.bound_runs) + 1)
        self.bound_result = result

    @gl.public.write
    def run_pure_function_case(self) -> None:
        def leader_fn():
            return _pure_decision()

        def validator_fn(leader_result) -> bool:
            return isinstance(leader_result, gl.vm.Return) and _pure_decision() == leader_result.calldata

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        self.pure_runs = u32(int(self.pure_runs) + 1)
        self.pure_result = result

    @gl.public.view
    def get_probe_state(self) -> dict[str, str]:
        return {
            "bound_runs": str(self.bound_runs),
            "pure_runs": str(self.pure_runs),
            "bound_result": str(self.bound_result),
            "pure_result": str(self.pure_result),
        }

    def _bound_decision(self) -> bool:
        """Pure return value reached through a bound contract instance."""
        return True
