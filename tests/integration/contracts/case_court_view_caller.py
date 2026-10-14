# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class CaseCourtViewCaller(gl.Contract):
    court_address: Address

    def __init__(self, court_address: Address):
        self.court_address = court_address

    @gl.public.view
    def has_case(self, case_id: str) -> bool:
        court = gl.get_contract_at(self.court_address)
        return court.view().has_case(case_id)

    @gl.public.view
    def read_case(self, case_id: str) -> dict[str, str]:
        court = gl.get_contract_at(self.court_address)
        return court.view().get_case(case_id)

    @gl.public.view
    def read_evidence(self, case_id: str, evidence_id: str) -> dict[str, str]:
        court = gl.get_contract_at(self.court_address)
        return court.view().get_evidence(case_id, evidence_id)

    @gl.public.view
    def read_action(self, case_id: str, sequence: u32) -> dict[str, str]:
        court = gl.get_contract_at(self.court_address)
        return court.view().get_case_action(case_id, sequence)
