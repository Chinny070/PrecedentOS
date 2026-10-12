# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class RegistryViewCaller(gl.Contract):
    registry_address: Address

    def __init__(self, registry_address: Address):
        self.registry_address = registry_address

    @gl.public.view
    def read_record(self, record_id: str) -> dict[str, str]:
        registry = gl.get_contract_at(self.registry_address)
        return registry.view().get_precedent(record_id)

    @gl.public.view
    def has_record(self, record_id: str) -> bool:
        registry = gl.get_contract_at(self.registry_address)
        return registry.view().has_precedent(record_id)
