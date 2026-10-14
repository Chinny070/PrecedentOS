# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class EvaluatorViewCaller(gl.Contract):
    evaluator_address: Address

    def __init__(self, evaluator_address: Address):
        self.evaluator_address = evaluator_address

    @gl.public.view
    def has_evaluation(self, evaluation_id: str) -> bool:
        evaluator = gl.get_contract_at(self.evaluator_address)
        return evaluator.view().has_evaluation(evaluation_id)

    @gl.public.view
    def read_evaluation(self, evaluation_id: str) -> dict[str, str]:
        evaluator = gl.get_contract_at(self.evaluator_address)
        return evaluator.view().get_evaluation(evaluation_id)
