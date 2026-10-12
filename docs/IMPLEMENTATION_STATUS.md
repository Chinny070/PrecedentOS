# Frontend implementation status

Scope: additive browser-only implementation; no contracts, deployments or transactions changed.
Git baseline: 2ca54609ff6bba77f0b8c4d3a445e95a1513b299 on main.
Network target: stable Studionet, chain ID 61999.

## Implemented in source

- Responsive editorial landing page and workspace shell.
- Routes for lab dashboard, registry, registration, precedent details, pair comparison, evaluation results, graph/lineage, counterfactual simulation, verification history, Web Evidence gate, and settings.
- Six explicitly fictional records and two illustrative result fixtures.
- Exact UTF-8 SHA-256 helper, length-framed v1 evaluation input commitment, and client validation rules corresponding to the existing contract bounds.
- Typed adapter boundary for GenLayerJS reads/writes, injected wallet connection, Studionet identity probe, and finalization observation.
- Local browser storage for public contract addresses and transaction references only.
- Browser-only fictional counterfactual controls, sample graph/lineage view, and verification history; these operate on the bundled subset.
- Web Evidence / Web Render capability page that remains disabled pending runtime proof.

## Not live-verified

- No Studionet endpoint probe, wallet connection, contract address, deployment, signature, or transaction was used.
- No actual AI call, validator vote, consensus result, or finality was produced by the frontend.
- No chain timestamp is displayed as present; registration sequence is not treated as time.
- Web Render remains disabled pending GenVM/Studionet verification.
- The installed GenLayerJS 1.1.8 types compile. Its own declarations and README expose a different receipt/write API from the current online SDK page; the adapter follows 1.1.8 and has not been tested against the network.
- The frontend has ESLint 9 with TypeScript parsing configured; lint passes.
- The landing page was opened in the local browser preview and visually checked. A full accessibility or screen-reader audit has not been completed.

## Preservation and test baseline

- Existing Registry and Evaluator sources and tests were left unchanged.
- Before frontend changes, the existing Direct Mode regression suite passed: 59 passed using a unique temporary artifacts directory.
- Frontend checks after implementation: ESLint passed; strict TypeScript check passed; Vitest 4.0.13 passed 7 tests across 2 files; Vite 8.3.4 production build passed. The 846.51 kB main JavaScript bundle triggers Vite's >500 kB warning; SDK code splitting is a follow-up optimization.
- Existing Registry and Evaluator regression suite was rerun after the frontend work: 59 passed. Cached GenVM lint passed 3 checks and validation for each contract; online runner freshness could not be checked because the environment denied the version-check network socket.
- Two untracked Stage 2D reports were present before this work and remain preserved.
