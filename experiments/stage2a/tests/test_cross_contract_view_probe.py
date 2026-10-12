import hashlib
from pathlib import Path

SOURCE = Path(__file__).parents[1] / "contracts" / "view_source_probe.py"
CALLER = Path(__file__).parents[1] / "contracts" / "view_caller_probe.py"


def test_registry_style_cross_contract_view_read(direct_deploy):
    source_address = hashlib.sha256(str(SOURCE.resolve()).encode()).digest()[:20]
    direct_deploy(str(SOURCE))
    caller = direct_deploy(str(CALLER), source_address)

    assert caller.read_source_marker("FICT-P-001") == (
        "FICT-P-001:fictional-registry-marker"
    )
