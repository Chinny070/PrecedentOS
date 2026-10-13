export type AuthorityDisclosure = {
  label: string;
  authoritative: boolean;
  explanation: string;
};

export function authorityDisclosure(status: string): AuthorityDisclosure {
  switch (status) {
    case 'USER_ASSERTED_UNVERIFIED':
      return { label: 'USER ASSERTED · UNVERIFIED', authoritative: false, explanation: 'A participant supplied this edge; the protocol has not verified its claim.' };
    case 'AI_PROPOSED_NOT_AUTHORITATIVE':
      return { label: 'AI PROPOSED · NOT AUTHORITY', authoritative: false, explanation: 'An accepted assessment proposed this relation. It does not reverse or establish precedent.' };
    case 'LOCAL_VALIDATED_CLIENT_ONLY':
      return { label: 'LOCAL CHECK · CLIENT ONLY', authoritative: false, explanation: 'A browser-side check is not an on-chain authority record.' };
    case 'CASECOURT_APPELLATE_RECORD_REQUIRES_FINALITY_PROOF':
      return { label: 'APPELLATE RECORD · FINALITY UNVERIFIED', authoritative: false, explanation: 'A CaseCourt appellate record supports this edge; transaction finality remains unverified.' };
    default:
      return { label: 'AUTHORITY UNKNOWN', authoritative: false, explanation: 'No verified authority provenance is available.' };
  }
}
