import type { Evaluation, Precedent } from '../types/domain';

export const DEMO_PRECEDENTS: Precedent[] = [
  {
    id: 'FICT-MUNI-001', title: 'The Lantern Walkway Decision', jurisdiction: 'North Quay District',
    decisionDate: '2030-03-14', category: 'Public access / permits', court: 'Fictional Civic Review Panel',
    outcome: 'Permit denied',
    summary: 'A temporary market canopy narrowed a shared walkway below the district’s published access width.',
    passage: 'Fictional record FICT-MUNI-001. A market canopy narrowed the shared walkway to 1.4 metres. The district access rule required 1.8 metres. No exception was documented. The permit was denied.',
    documentDigest: '', provenance: 'demo', citedIds: ['FICT-MUNI-003'], accent: 'coral',
  },
  {
    id: 'FICT-MUNI-002', title: 'The Rain Shelter Exception', jurisdiction: 'North Quay District',
    decisionDate: '2030-04-02', category: 'Public access / permits', court: 'Fictional Civic Review Panel',
    outcome: 'Permit allowed with conditions',
    summary: 'A temporary shelter occupied the same route, but an express emergency-weather exception applied.',
    passage: 'Fictional record FICT-MUNI-002. A rain shelter narrowed the shared walkway to 1.4 metres. The district access rule required 1.8 metres. A published emergency-weather exception allowed a 48-hour shelter, and the permit included that limit.',
    documentDigest: '', provenance: 'demo', citedIds: ['FICT-MUNI-001'], accent: 'cyan',
  },
  {
    id: 'FICT-MUNI-003', title: 'The Unmarked Ramp', jurisdiction: 'North Quay District',
    decisionDate: '2030-06-11', category: 'Public access / permits', court: 'Fictional Civic Review Panel',
    outcome: 'Insufficient record',
    summary: 'The excerpt omits measurements and the controlling rule, leaving the comparison unresolved.',
    passage: 'Fictional record FICT-MUNI-003. The applicant requested a temporary ramp beside the market. The available excerpt does not state the resulting walkway width, the applicable access rule, or the panel’s final order.',
    documentDigest: '', provenance: 'demo', citedIds: ['FICT-MUNI-001'], accent: 'violet',
  },
  {
    id: 'FICT-HOUS-004', title: 'The Quiet Hour Repair', jurisdiction: 'Fictional Cedar Borough',
    decisionDate: '2030-01-15', category: 'Residential / quiet hours', court: 'Fictional Housing Review Board',
    outcome: 'Warning issued',
    summary: 'Late-night amplified music breached a published quiet-hours rule without a listed exception.',
    passage: 'Fictional record FICT-HOUS-004. A resident played amplified music at 22:40 on a weekday. The building rule prohibited amplified sound after 22:00. No emergency or repair exception applied. The board issued a warning.',
    documentDigest: '', provenance: 'demo', citedIds: ['FICT-HOUS-005'], accent: 'coral',
  },
  {
    id: 'FICT-HOUS-005', title: 'The Urgent Pipe Repair', jurisdiction: 'Fictional Cedar Borough',
    decisionDate: '2030-02-03', category: 'Residential / quiet hours', court: 'Fictional Housing Review Board',
    outcome: 'No violation',
    summary: 'Work after quiet hours was treated differently because the rule expressly exempted urgent repairs.',
    passage: 'Fictional record FICT-HOUS-005. A plumber repaired a burst pipe at 22:40 on a weekday. The building rule prohibited amplified sound after 22:00 but expressly exempted urgent repairs necessary to prevent active water damage. The board found no violation.',
    documentDigest: '', provenance: 'demo', citedIds: ['FICT-HOUS-004'], accent: 'citron',
  },
  {
    id: 'FICT-TRANS-006', title: 'The Shared Cycle Bay', jurisdiction: 'Fictional Eastbank Ward',
    decisionDate: '2030-05-29', category: 'Shared transport / access', court: 'Fictional Transit Ombuds Panel',
    outcome: 'Relocation ordered',
    summary: 'A cycle rack overlapped a marked boarding zone despite an earlier permit diagram.',
    passage: 'Fictional record FICT-TRANS-006. A fixed cycle rack extended into the painted boarding zone. The permit diagram showed the rack 0.6 metres outside the zone. A later site measurement placed it inside by 0.2 metres. The panel ordered relocation.',
    documentDigest: '', provenance: 'demo', citedIds: [], accent: 'cyan',
  },
];

export const DEMO_EVALUATIONS: Evaluation[] = [
  {
    id: 'DEMO-EVAL-MUNI-01', a: 'FICT-MUNI-001', b: 'FICT-MUNI-002', classification: 'material_similarity',
    same_material_issue: true, evidence_sufficient: true, outcomes_differ: true, material_similarity: true,
    potential_contradiction: false, similarities: ['Same district route and access-width rule', 'Both passages report a 1.4 metre path'],
    differences: ['The second passage identifies an express 48-hour emergency exception'], contradictions: [],
    reasoning: 'The outcomes differ, but the supplied exception is a material distinction in the fictional record.',
    inputCommitment: '', provenance: 'demo',
  },
  {
    id: 'DEMO-EVAL-HOUS-02', a: 'FICT-HOUS-004', b: 'FICT-HOUS-005', classification: 'material_similarity',
    same_material_issue: true, evidence_sufficient: true, outcomes_differ: true, material_similarity: true,
    potential_contradiction: false, similarities: ['Same weekday and time after 22:00', 'Both concern the quiet-hours rule'],
    differences: ['A burst pipe triggered an express urgent-repair exception'], contradictions: [],
    reasoning: 'The passages share an issue but the stated exception distinguishes the outcomes.',
    inputCommitment: '', provenance: 'demo',
  },
];

export const DEMO_RELATIONSHIPS = [
  { from: 'FICT-MUNI-001', to: 'FICT-MUNI-002', type: 'compared', label: 'DEMO · comparison' },
  { from: 'FICT-MUNI-001', to: 'FICT-MUNI-003', type: 'cites', label: 'DEMO · explicit fictional reference' },
  { from: 'FICT-HOUS-004', to: 'FICT-HOUS-005', type: 'compared', label: 'DEMO · comparison' },
];
