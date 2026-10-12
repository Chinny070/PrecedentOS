# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class ViewCallerProbe(gl.Contract):
    source_address: Address

    def __init__(self, source_address: Address):
        self.source_address = source_address

    @gl.public.view
    def read_source_marker(self, record_id: str) -> str:
        source = gl.get_contract_at(self.source_address)
        return source.view().get_marker(record_id)
