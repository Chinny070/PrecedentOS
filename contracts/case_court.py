# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from datetime import datetime, timezone
import hashlib
import json

from genlayer import *


SUPPORTED_CASE_SCHEMA_VERSION = u32(1)
SUPPORTED_POLICY_VERSION = u32(1)
SUPPORTED_EVIDENCE_SCHEMA_VERSION = u32(1)
APPEAL_SCHEMA_VERSION = u32(1)
MAX_CASES = u32(100000)
MAX_ACTIONS = u32(1000000)
MAX_ACTIONS_PER_CASE = u32(128)
MAX_EVIDENCE_PER_CASE = u32(32)
MAX_CASE_ID_LENGTH = 48
MAX_ACTION_ID_LENGTH = 48
MAX_EVIDENCE_ID_LENGTH = 48
MAX_CASE_TYPE_LENGTH = 64
MAX_FREEZE_SECONDS = 86400
ZERO_ADDRESS = Address("0x0000000000000000000000000000000000000000")

CASE_PHASE_EVIDENCE_OPEN = "EVIDENCE_OPEN"
CASE_PHASE_EVIDENCE_LOCKED = "EVIDENCE_LOCKED"
CASE_PHASE_DECISION_RECORDED = "DECISION_RECORDED"
CASE_PHASE_CHALLENGE_OPEN = "CHALLENGE_OPEN"
CASE_PHASE_FROZEN = "FROZEN"

DECISION_AUTHORITY_UNVERIFIED = "UNVERIFIED_CALLER_ASSERTION"
APPEAL_STATUS_FILED_UNADJUDICATED = "FILED_UNADJUDICATED"

CHALLENGE_GROUNDS = (
    "NEW_EVIDENCE",
    "MATERIAL_ERROR",
    "PROCEDURAL_CONCERN",
)


class CaseCourt(gl.Contract):
    """Deterministic, append-only case lifecycle and governance foundation.

    This contract does not adjudicate legal questions, call the existing
    Registry/Evaluator, or claim a referenced decision has been verified.
    Every protected transition is local to this contract so its freeze guard
    cannot be bypassed through another CaseCourt entry point.
    """

    records: TreeMap[str, str]
    case_count: u32
    action_count: u32

    def __init__(self):
        self.records = TreeMap[str, str]()
        self.case_count = u32(0)
        self.action_count = u32(0)

    @gl.public.write
    def open_case(
        self,
        case_id: str,
        action_id: str,
        respondent: Address,
        case_type: str,
        policy_version: u32,
        opening_evidence_digest: str,
    ) -> None:
        self._validate_id(case_id, MAX_CASE_ID_LENGTH, "invalid case identifier")
        self._validate_action_id(action_id)
        self._validate_public_label(case_type, MAX_CASE_TYPE_LENGTH, "invalid case type")
        self._validate_digest(opening_evidence_digest, "invalid evidence commitment")
        if policy_version != SUPPORTED_POLICY_VERSION:
            raise gl.vm.UserError("unsupported policy version")
        case_key = self._case_key(case_id)
        if case_key in self.records:
            raise gl.vm.UserError("case identifier already used")
        if respondent == ZERO_ADDRESS or respondent == gl.message.sender_address:
            raise gl.vm.UserError("case parties must be distinct nonzero addresses")
        if self.case_count >= MAX_CASES:
            raise gl.vm.UserError("case capacity reached")
        self._ensure_action_available(action_id, None)
        self._ensure_capacity(None)

        sender = gl.message.sender_address
        now = self._now_iso()
        snapshot = {
            "case_id": case_id,
            "petitioner": sender.as_hex,
            "respondent": respondent.as_hex,
            "case_type": case_type,
            "schema_version": int(SUPPORTED_CASE_SCHEMA_VERSION),
            "policy_version": int(policy_version),
            "phase": CASE_PHASE_EVIDENCE_OPEN,
            "version": 1,
            "evidence_count": 0,
            "action_count": 0,
            "opening_evidence_digest": opening_evidence_digest,
            "decision_ref_id": "",
            "decision_digest": "",
            "decision_submitter": ZERO_ADDRESS.as_hex,
            "decision_authority": DECISION_AUTHORITY_UNVERIFIED,
            "challenge_id": "",
            "frozen": False,
            "freeze_used": False,
            "frozen_by": ZERO_ADDRESS.as_hex,
            "freeze_until": 0,
            "opened_at": now,
        }
        payload_digest = self._payload_digest(
            ["open_case", case_id, str(respondent), case_type, str(policy_version), opening_evidence_digest]
        )
        self.records[case_key] = self._encode(snapshot)
        self.case_count = u32(self.case_count + 1)
        snapshot = self._append_action(snapshot, action_id, "CASE_OPENED", sender, u32(0), payload_digest, "")
        self.records[case_key] = self._encode(snapshot)

    @gl.public.write
    def append_evidence(
        self,
        case_id: str,
        expected_version: u32,
        action_id: str,
        evidence_id: str,
        digest: str,
        evidence_schema_version: u32,
        source_reference_digest: str,
    ) -> None:
        self._validate_case_id(case_id)
        self._validate_action_id(action_id)
        self._validate_id(evidence_id, MAX_EVIDENCE_ID_LENGTH, "invalid evidence identifier")
        self._validate_digest(digest, "invalid evidence commitment")
        self._validate_digest(source_reference_digest, "invalid source reference commitment")
        if evidence_schema_version != SUPPORTED_EVIDENCE_SCHEMA_VERSION:
            raise gl.vm.UserError("unsupported evidence schema version")

        snapshot = self._get_case_or_revert(case_id)
        self._require_not_frozen(snapshot)
        self._require_party(snapshot)
        self._require_version(snapshot, expected_version)
        if snapshot["phase"] != CASE_PHASE_EVIDENCE_OPEN:
            raise gl.vm.UserError("evidence is not open")
        if int(snapshot["evidence_count"]) >= int(MAX_EVIDENCE_PER_CASE):
            raise gl.vm.UserError("case evidence capacity reached")
        evidence_key = self._evidence_key(case_id, evidence_id)
        if evidence_key in self.records:
            raise gl.vm.UserError("evidence identifier already used")
        self._ensure_action_available(action_id, snapshot)
        self._ensure_capacity(snapshot)

        sender = gl.message.sender_address
        next_version = u32(int(snapshot["version"]) + 1)
        reference = {
            "case_id": case_id,
            "evidence_id": evidence_id,
            "digest": digest,
            "schema_version": int(evidence_schema_version),
            "source_reference_digest": source_reference_digest,
            "submitter": sender.as_hex,
            "case_version": int(next_version),
            "recorded_at": self._now_iso(),
        }
        payload_digest = self._payload_digest(
            [
                "append_evidence", case_id, str(expected_version), evidence_id, digest,
                str(evidence_schema_version), source_reference_digest,
            ]
        )
        self.records[evidence_key] = self._encode(reference)
        snapshot["evidence_count"] += 1
        snapshot["version"] = int(next_version)
        snapshot = self._append_action(
            snapshot, action_id, "EVIDENCE_APPENDED", sender, expected_version, payload_digest, evidence_id
        )
        self.records[self._case_key(case_id)] = self._encode(snapshot)

    @gl.public.write
    def lock_evidence(
        self,
        case_id: str,
        expected_version: u32,
        action_id: str,
    ) -> None:
        snapshot = self._prepare_case_action(case_id, expected_version, action_id)
        self._require_party(snapshot)
        if snapshot["phase"] != CASE_PHASE_EVIDENCE_OPEN:
            raise gl.vm.UserError("evidence cannot be locked from this state")
        if int(snapshot["evidence_count"]) == 0:
            raise gl.vm.UserError("case requires at least one evidence reference")
        payload_digest = self._payload_digest(["lock_evidence", case_id, str(expected_version)])
        snapshot["phase"] = CASE_PHASE_EVIDENCE_LOCKED
        snapshot["version"] += 1
        snapshot = self._append_action(
            snapshot, action_id, "EVIDENCE_LOCKED", gl.message.sender_address,
            expected_version, payload_digest, ""
        )
        self.records[self._case_key(case_id)] = self._encode(snapshot)

    @gl.public.write
    def attach_decision_reference(
        self,
        case_id: str,
        expected_version: u32,
        action_id: str,
        decision_ref_id: str,
        decision_digest: str,
    ) -> None:
        self._validate_case_id(case_id)
        self._validate_action_id(action_id)
        self._validate_id(decision_ref_id, MAX_EVIDENCE_ID_LENGTH, "invalid decision reference")
        self._validate_digest(decision_digest, "invalid decision commitment")
        snapshot = self._get_case_or_revert(case_id)
        self._require_not_frozen(snapshot)
        self._require_party(snapshot)
        self._require_version(snapshot, expected_version)
        if snapshot["phase"] != CASE_PHASE_EVIDENCE_LOCKED:
            raise gl.vm.UserError("decision reference cannot be attached from this state")
        self._ensure_action_available(action_id, snapshot)
        self._ensure_capacity(snapshot)

        payload_digest = self._payload_digest(
            ["attach_decision_reference", case_id, str(expected_version), decision_ref_id, decision_digest]
        )
        snapshot["decision_ref_id"] = decision_ref_id
        snapshot["decision_digest"] = decision_digest
        snapshot["decision_submitter"] = gl.message.sender_address.as_hex
        # The current Evaluator stores pair-comparison results, not a case-bound
        # ruling. Until an authorized, runtime-verified IC view path can validate
        # Registry/Evaluator identity and case evidence, this remains an assertion.
        snapshot["decision_authority"] = DECISION_AUTHORITY_UNVERIFIED
        snapshot["phase"] = CASE_PHASE_DECISION_RECORDED
        snapshot["version"] += 1
        snapshot = self._append_action(
            snapshot, action_id, "DECISION_REFERENCE_ATTACHED", gl.message.sender_address,
            expected_version, payload_digest, decision_ref_id
        )
        self.records[self._case_key(case_id)] = self._encode(snapshot)

    @gl.public.write
    def challenge_decision(
        self,
        case_id: str,
        expected_version: u32,
        action_id: str,
        challenge_id: str,
        decision_digest: str,
        grounds_code: str,
        grounds_digest: str,
    ) -> None:
        self._validate_case_id(case_id)
        self._validate_action_id(action_id)
        self._validate_id(challenge_id, MAX_ACTION_ID_LENGTH, "invalid challenge identifier")
        self._validate_digest(decision_digest, "invalid decision commitment")
        self._validate_digest(grounds_digest, "invalid challenge grounds commitment")
        if grounds_code not in CHALLENGE_GROUNDS:
            raise gl.vm.UserError("unsupported challenge grounds")
        snapshot = self._get_case_or_revert(case_id)
        self._require_not_frozen(snapshot)
        self._require_party(snapshot)
        self._require_version(snapshot, expected_version)
        if snapshot["phase"] != CASE_PHASE_DECISION_RECORDED:
            raise gl.vm.UserError("decision cannot be challenged from this state")
        if decision_digest != snapshot["decision_digest"]:
            raise gl.vm.UserError("stale decision commitment")
        if self._same_address(gl.message.sender_address.as_hex, snapshot["decision_submitter"]):
            raise gl.vm.UserError("decision submitter cannot challenge its own reference")
        if self._challenge_key(challenge_id) in self.records:
            raise gl.vm.UserError("challenge identifier already used")
        self._ensure_action_available(action_id, snapshot)
        self._ensure_capacity(snapshot)

        payload_digest = self._payload_digest(
            [
                "challenge_decision", case_id, str(expected_version), challenge_id,
                decision_digest, grounds_code, grounds_digest,
            ]
        )
        snapshot["challenge_id"] = challenge_id
        snapshot["phase"] = CASE_PHASE_CHALLENGE_OPEN
        snapshot["version"] += 1
        appeal_record = {
            "appeal_id": challenge_id,
            "case_id": case_id,
            "schema_version": int(APPEAL_SCHEMA_VERSION),
            "level": 1,
            "parent_appeal_id": "",
            "status": APPEAL_STATUS_FILED_UNADJUDICATED,
            "appellant": gl.message.sender_address.as_hex,
            "decision_ref_id": snapshot["decision_ref_id"],
            "decision_digest": decision_digest,
            "grounds_code": grounds_code,
            "grounds_digest": grounds_digest,
            # A digest is only a commitment supplied by the party; no bytes or
            # external source are fetched or authenticated in this version.
            "new_evidence_commitment": grounds_digest if grounds_code == "NEW_EVIDENCE" else "",
            "recorded_at": self._now_iso(),
        }
        snapshot = self._append_action(
            snapshot, action_id, "DECISION_CHALLENGED", gl.message.sender_address,
            expected_version, payload_digest, challenge_id
        )
        self.records[self._challenge_key(challenge_id)] = "1"
        self.records[self._appeal_key(challenge_id)] = self._encode(appeal_record)
        self.records[self._case_key(case_id)] = self._encode(snapshot)

    @gl.public.write
    def request_freeze(
        self,
        case_id: str,
        expected_version: u32,
        action_id: str,
        grounds_digest: str,
    ) -> None:
        self._validate_case_id(case_id)
        self._validate_action_id(action_id)
        self._validate_digest(grounds_digest, "invalid freeze grounds commitment")
        snapshot = self._get_case_or_revert(case_id)
        self._require_not_frozen(snapshot)
        self._require_party(snapshot)
        self._require_version(snapshot, expected_version)
        if snapshot["phase"] != CASE_PHASE_CHALLENGE_OPEN:
            raise gl.vm.UserError("freeze requires an open challenge")
        if snapshot["freeze_used"]:
            raise gl.vm.UserError("case freeze already used")
        self._ensure_action_available(action_id, snapshot)
        self._ensure_capacity(snapshot)

        now = self._now_unix()
        until = u64(now + MAX_FREEZE_SECONDS)
        payload_digest = self._payload_digest(
            ["request_freeze", case_id, str(expected_version), grounds_digest, str(until)]
        )
        snapshot["frozen"] = True
        snapshot["freeze_used"] = True
        snapshot["frozen_by"] = gl.message.sender_address.as_hex
        snapshot["freeze_until"] = int(until)
        snapshot["phase"] = CASE_PHASE_FROZEN
        snapshot["version"] += 1
        snapshot = self._append_action(
            snapshot, action_id, "CASE_FROZEN", gl.message.sender_address,
            expected_version, payload_digest, snapshot["challenge_id"]
        )
        self.records[self._case_key(case_id)] = self._encode(snapshot)

    @gl.public.write
    def unfreeze_case(
        self,
        case_id: str,
        expected_version: u32,
        action_id: str,
    ) -> None:
        self._validate_case_id(case_id)
        self._validate_action_id(action_id)
        snapshot = self._get_case_or_revert(case_id)
        self._require_version(snapshot, expected_version)
        if not snapshot["frozen"] or snapshot["phase"] != CASE_PHASE_FROZEN:
            raise gl.vm.UserError("case is not frozen")
        sender = gl.message.sender_address
        expired = self._now_unix() >= snapshot["freeze_until"]
        if not expired:
            self._require_party(snapshot)
            if not self._same_address(sender.as_hex, snapshot["frozen_by"]):
                raise gl.vm.UserError("only freeze requester may unfreeze before expiry")
        self._ensure_action_available(action_id, snapshot)
        self._ensure_capacity(snapshot)

        payload_digest = self._payload_digest(
            ["unfreeze_case", case_id, str(expected_version), str(sender)]
        )
        snapshot["frozen"] = False
        snapshot["frozen_by"] = ZERO_ADDRESS.as_hex
        snapshot["freeze_until"] = 0
        snapshot["phase"] = CASE_PHASE_CHALLENGE_OPEN
        snapshot["version"] += 1
        snapshot = self._append_action(
            snapshot, action_id, "CASE_UNFROZEN", sender,
            expected_version, payload_digest, snapshot["challenge_id"]
        )
        self.records[self._case_key(case_id)] = self._encode(snapshot)

    @gl.public.view
    def has_case(self, case_id: str) -> bool:
        self._validate_case_id(case_id)
        return self._case_key(case_id) in self.records

    @gl.public.view
    def get_case(self, case_id: str) -> dict[str, str]:
        self._validate_case_id(case_id)
        key = self._case_key(case_id)
        if key not in self.records:
            return {}
        snapshot = self._decode(self.records[key])
        return {
            name: ("true" if value else "false") if isinstance(value, bool) else str(value)
            for name, value in snapshot.items()
        }

    @gl.public.view
    def get_evidence(self, case_id: str, evidence_id: str) -> dict[str, str]:
        self._validate_case_id(case_id)
        self._validate_id(evidence_id, MAX_EVIDENCE_ID_LENGTH, "invalid evidence identifier")
        key = self._evidence_key(case_id, evidence_id)
        if key not in self.records:
            return {}
        reference = self._decode(self.records[key])
        return {name: str(value) for name, value in reference.items()}

    @gl.public.view
    def get_appeal(self, appeal_id: str) -> dict[str, str]:
        self._validate_id(appeal_id, MAX_ACTION_ID_LENGTH, "invalid appeal identifier")
        key = self._appeal_key(appeal_id)
        if key not in self.records:
            return {}
        appeal = self._decode(self.records[key])
        return {
            name: ("true" if value else "false") if isinstance(value, bool) else str(value)
            for name, value in appeal.items()
        }

    @gl.public.view
    def get_case_action(self, case_id: str, case_sequence: u32) -> dict[str, str]:
        self._validate_case_id(case_id)
        key = self._case_action_key(case_id, case_sequence)
        if key not in self.records:
            return {}
        action = self._decode(self.records[key])
        return {name: str(value) for name, value in action.items()}

    @gl.public.view
    def get_case_action_count(self, case_id: str) -> u32:
        self._validate_case_id(case_id)
        key = self._case_key(case_id)
        if key not in self.records:
            return u32(0)
        return u32(self._decode(self.records[key])["action_count"])

    @gl.public.view
    def get_case_count(self) -> u32:
        return self.case_count

    @gl.public.view
    def get_action_count(self) -> u32:
        return self.action_count

    def _prepare_case_action(self, case_id: str, expected_version: u32, action_id: str) -> dict[str, object]:
        self._validate_case_id(case_id)
        self._validate_action_id(action_id)
        snapshot = self._get_case_or_revert(case_id)
        self._require_not_frozen(snapshot)
        self._require_version(snapshot, expected_version)
        self._ensure_action_available(action_id, snapshot)
        self._ensure_capacity(snapshot)
        return snapshot

    def _get_case_or_revert(self, case_id: str) -> dict[str, object]:
        key = self._case_key(case_id)
        if key not in self.records:
            raise gl.vm.UserError("case not found")
        return self._decode(self.records[key])

    def _require_party(self, snapshot: dict[str, object]) -> None:
        sender = gl.message.sender_address.as_hex
        if not self._same_address(sender, str(snapshot["petitioner"])) and not self._same_address(sender, str(snapshot["respondent"])):
            raise gl.vm.UserError("caller is not a case participant")

    def _require_not_frozen(self, snapshot: dict[str, object]) -> None:
        if bool(snapshot["frozen"]):
            raise gl.vm.UserError("case is frozen")

    def _require_version(self, snapshot: dict[str, object], expected_version: u32) -> None:
        if int(snapshot["version"]) != int(expected_version):
            raise gl.vm.UserError("stale case version")

    def _ensure_action_available(self, action_id: str, snapshot: dict[str, object] | None) -> None:
        if self._action_replay_key(action_id) in self.records:
            raise gl.vm.UserError("action identifier already used")
        if snapshot is not None and int(snapshot["action_count"]) >= int(MAX_ACTIONS_PER_CASE):
            raise gl.vm.UserError("case action capacity reached")

    def _ensure_capacity(self, snapshot: dict[str, object] | None) -> None:
        if self.action_count >= MAX_ACTIONS:
            raise gl.vm.UserError("action capacity reached")

    def _append_action(
        self,
        snapshot: dict[str, object],
        action_id: str,
        action_kind: str,
        actor: Address,
        expected_version: u32,
        payload_digest: str,
        reference_id: str,
    ) -> dict[str, object]:
        global_sequence = u32(self.action_count + 1)
        case_sequence = u32(int(snapshot["action_count"]) + 1)
        action = {
            "global_sequence": int(global_sequence),
            "case_sequence": int(case_sequence),
            "case_id": str(snapshot["case_id"]),
            "action_id": action_id,
            "action_kind": action_kind,
            "actor": actor.as_hex,
            "expected_version": int(expected_version),
            "new_version": int(snapshot["version"]),
            "payload_digest": payload_digest,
            "reference_id": reference_id,
            "recorded_at": self._now_iso(),
        }
        self.records[self._case_action_key(str(snapshot["case_id"]), case_sequence)] = self._encode(action)
        self.records[self._action_replay_key(action_id)] = "1"
        self.action_count = global_sequence
        snapshot["action_count"] = int(case_sequence)
        return snapshot

    def _validate_case_id(self, value: str) -> None:
        self._validate_id(value, MAX_CASE_ID_LENGTH, "invalid case identifier")

    def _validate_action_id(self, value: str) -> None:
        self._validate_id(value, MAX_ACTION_ID_LENGTH, "invalid action identifier")

    def _validate_id(self, value: str, maximum: int, error: str) -> None:
        if not isinstance(value, str) or len(value) < 3 or len(value) > maximum:
            raise gl.vm.UserError(error)
        if value[0] not in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789":
            raise gl.vm.UserError(error)
        previous_hyphen = False
        for character in value:
            if character == "-":
                if previous_hyphen:
                    raise gl.vm.UserError(error)
                previous_hyphen = True
            elif character in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789":
                previous_hyphen = False
            else:
                raise gl.vm.UserError(error)
        if previous_hyphen:
            raise gl.vm.UserError(error)

    def _validate_public_label(self, value: str, maximum: int, error: str) -> None:
        if not isinstance(value, str) or len(value) < 1 or len(value) > maximum:
            raise gl.vm.UserError(error)
        for character in value:
            if character not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,_()-/":
                raise gl.vm.UserError(error)

    def _validate_digest(self, value: str, error: str) -> None:
        if not isinstance(value, str) or len(value) != 64:
            raise gl.vm.UserError(error)
        for character in value:
            if character not in "0123456789abcdef":
                raise gl.vm.UserError(error)

    def _evidence_key(self, case_id: str, evidence_id: str) -> str:
        return "E:" + case_id + ":" + evidence_id

    def _case_action_key(self, case_id: str, sequence: u32) -> str:
        return "A:" + case_id + ":" + str(sequence)

    def _case_key(self, case_id: str) -> str:
        return "C:" + case_id

    def _action_replay_key(self, action_id: str) -> str:
        return "X:" + action_id

    def _challenge_key(self, challenge_id: str) -> str:
        return "Q:" + challenge_id

    def _appeal_key(self, appeal_id: str) -> str:
        return "P:" + appeal_id

    def _same_address(self, left: str, right: str) -> bool:
        return left.lower() == right.lower()

    def _encode(self, value: dict[str, object]) -> str:
        return json.dumps(value, separators=(",", ":"), ensure_ascii=True)

    def _decode(self, value: str) -> dict[str, object]:
        return json.loads(value)

    def _payload_digest(self, fields: list[str]) -> str:
        canonical = json.dumps(fields, separators=(",", ":"), ensure_ascii=True)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def _now_iso(self) -> str:
        return gl.message_raw["datetime"]

    def _now_unix(self) -> int:
        return int(datetime.now(timezone.utc).timestamp())
