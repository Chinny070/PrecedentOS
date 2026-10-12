# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class ViewSourceProbe(gl.Contract):
    marker: str

    def __init__(self):
        self.marker = "fictional-registry-marker"

    @gl.public.view
    def get_marker(self, record_id: str) -> str:
        return record_id + ":" + self.marker
