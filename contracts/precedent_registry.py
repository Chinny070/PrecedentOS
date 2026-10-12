# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from dataclasses import dataclass

from genlayer import *


SUPPORTED_SCHEMA_VERSION = u32(1)
MAX_RECORD_ID_LENGTH = 48
MAX_METADATA_FIELD_LENGTH = 64
MAX_REGISTRATIONS = u32(1000000)


@allow_storage
@dataclass
class PrecedentRecord:
    record_id: str
    evidence_digest: str
    schema_version: u32
    jurisdiction: str
    decision_date: str
    category: str
    submitter: Address
    registration_sequence: u32


class PrecedentRegistry(gl.Contract):
    """Append-only registry of public precedent commitments, not case text."""

    records: TreeMap[str, PrecedentRecord]
    registration_count: u32

    def __init__(self):
        self.records = TreeMap[str, PrecedentRecord]()
        self.registration_count = u32(0)

    @gl.public.write
    def register_precedent(
        self,
        record_id: str,
        evidence_digest: str,
        schema_version: u32,
        jurisdiction: str,
        decision_date: str,
        category: str,
    ) -> None:
        if not self._valid_record_id(record_id):
            raise gl.vm.UserError("invalid record identifier")
        if not self._valid_digest(evidence_digest):
            raise gl.vm.UserError("invalid evidence digest")
        if schema_version != SUPPORTED_SCHEMA_VERSION:
            raise gl.vm.UserError("unsupported schema version")
        if not self._valid_metadata(jurisdiction, decision_date, category):
            raise gl.vm.UserError("invalid or oversized public metadata")
        if record_id in self.records:
            raise gl.vm.UserError("record identifier already registered")
        if self.registration_count >= MAX_REGISTRATIONS:
            raise gl.vm.UserError("registry capacity reached")

        next_sequence = u32(self.registration_count + 1)
        record = PrecedentRecord(
            record_id=record_id,
            evidence_digest=evidence_digest,
            schema_version=schema_version,
            jurisdiction=jurisdiction,
            decision_date=decision_date,
            category=category,
            submitter=gl.message.sender_address,
            registration_sequence=next_sequence,
        )
        self.records[record_id] = record
        self.registration_count = next_sequence

    @gl.public.view
    def has_precedent(self, record_id: str) -> bool:
        return record_id in self.records

    @gl.public.view
    def get_precedent(self, record_id: str) -> dict[str, str]:
        if record_id not in self.records:
            return {}

        record = self.records[record_id]
        return {
            "record_id": record.record_id,
            "evidence_digest": record.evidence_digest,
            "schema_version": str(record.schema_version),
            "jurisdiction": record.jurisdiction,
            "decision_date": record.decision_date,
            "category": record.category,
            "submitter": record.submitter.as_hex,
            "registration_sequence": str(record.registration_sequence),
        }

    @gl.public.view
    def get_registration_count(self) -> u32:
        return self.registration_count

    def _valid_record_id(self, value: str) -> bool:
        if not isinstance(value, str) or len(value) < 3 or len(value) > MAX_RECORD_ID_LENGTH:
            return False
        if value[0] not in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789":
            return False
        return self._ascii_alphanumeric_or_hyphen(value)

    def _ascii_alphanumeric_or_hyphen(self, value: str) -> bool:
        previous_hyphen = False
        for character in value:
            if character == "-":
                if previous_hyphen:
                    return False
                previous_hyphen = True
            elif character in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789":
                previous_hyphen = False
            else:
                return False
        return not previous_hyphen

    def _valid_digest(self, value: str) -> bool:
        if not isinstance(value, str) or len(value) != 64:
            return False
        for character in value:
            if character not in "0123456789abcdef":
                return False
        return True

    def _valid_metadata(self, jurisdiction: str, decision_date: str, category: str) -> bool:
        if not isinstance(jurisdiction, str) or not jurisdiction or len(jurisdiction) > MAX_METADATA_FIELD_LENGTH:
            return False
        if not isinstance(category, str) or not category or len(category) > MAX_METADATA_FIELD_LENGTH:
            return False
        if not isinstance(decision_date, str) or len(decision_date) != 10:
            return False
        if decision_date[4] != "-" or decision_date[7] != "-":
            return False
        for index, character in enumerate(decision_date):
            if index not in (4, 7) and character not in "0123456789":
                return False
        return (
            self._safe_public_label(jurisdiction)
            and self._safe_public_label(category)
        )

    def _safe_public_label(self, value: str) -> bool:
        for character in value:
            if character not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,_()-/":
                return False
        return True
