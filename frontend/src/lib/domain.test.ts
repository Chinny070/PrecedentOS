import { describe, expect, it } from 'vitest';
import { DEMO_EVALUATIONS, DEMO_PRECEDENTS, DEMO_RELATIONSHIPS } from '../fixtures/demo';

describe('fictional fixture boundaries', () => {
  it('contains only explicitly labeled demo records and comparisons', () => {
    expect(DEMO_PRECEDENTS).toHaveLength(6);
    expect(DEMO_PRECEDENTS.every((item) => item.provenance === 'demo' && item.id.startsWith('FICT-'))).toBe(true);
    expect(DEMO_EVALUATIONS).toHaveLength(2);
    expect(DEMO_EVALUATIONS.every((item) => item.provenance === 'demo' && item.id.startsWith('DEMO-'))).toBe(true);
  });

  it('never labels fixture data as a chain timestamp or deployment', () => {
    expect(DEMO_PRECEDENTS.every((item) => !('blockTimestamp' in item))).toBe(true);
    expect(DEMO_RELATIONSHIPS.every((edge) => edge.label.startsWith('DEMO'))).toBe(true);
  });
});
