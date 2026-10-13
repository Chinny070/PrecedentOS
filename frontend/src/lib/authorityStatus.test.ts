import { describe, expect, it } from 'vitest';
import { authorityDisclosure } from './authorityStatus';

describe('authority provenance disclosures', () => {
  it.each([
    ['USER_ASSERTED_UNVERIFIED', 'USER ASSERTED · UNVERIFIED'],
    ['AI_PROPOSED_NOT_AUTHORITATIVE', 'AI PROPOSED · NOT AUTHORITY'],
    ['LOCAL_VALIDATED_CLIENT_ONLY', 'LOCAL CHECK · CLIENT ONLY'],
    ['CASECOURT_APPELLATE_RECORD_REQUIRES_FINALITY_PROOF', 'APPELLATE RECORD · FINALITY UNVERIFIED'],
  ])('never upgrades %s to verified authority', (status, label) => {
    const disclosure = authorityDisclosure(status);
    expect(disclosure.label).toBe(label);
    expect(disclosure.authoritative).toBe(false);
  });

  it('treats unknown statuses conservatively', () => {
    expect(authorityDisclosure('FINALIZED_LEGAL_PRECEDENT').authoritative).toBe(false);
  });
});
