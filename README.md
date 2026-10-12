# PrecedentOS

PrecedentOS is a precedent-aware research workbench built around GenLayer Intelligent Contracts. It compares bounded fictional precedent evidence and keeps the inputs, decision fields and transaction lifecycle visible. It is not a court or legal advice; validator agreement under a contract-defined rule does not establish legal correctness.

## Existing protocol

- contracts/precedent_registry.py — append-only fictional precedent commitments.
- contracts/precedent_evaluator.py — bounded AI-assisted comparison with independent decision-field validation.
- tests/ — Direct Mode regression suite and fictional public fixtures.

Both contracts and all existing tests are preserved. Historical Direct Mode evidence is 29 Registry + 30 Evaluator tests; those tests do not establish live validator consensus or Studionet deployment.

## Browser application

The static React/TypeScript frontend lives in frontend/. It has no application backend, database or indexer. Demo mode is available without a wallet; contract writes require configured deployment addresses and an injected wallet.

```powershell
cd frontend
npm install
npm run dev
```

Quality checks: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

Copy frontend/.env.example to frontend/.env.local only when supplying verified public contract addresses. Never place wallet keys or secrets in Vite environment variables. The app targets stable Studionet chain ID 61999; it does not deploy contracts.

## Honest capability status

- Fictional demo records and comparison examples are local fixtures, not chain results.
- Registry enumeration is not available in the current interface; search and graph coverage is limited to loaded examples.
- No verified deployment addresses are bundled.
- Web Render is gated and disabled pending runtime verification.
- Timestamps are shown only as submitter dates or device observations unless an authoritative chain field is later verified.

See [frontend architecture](docs/FRONTEND_ARCHITECTURE.md), [implementation status](docs/IMPLEMENTATION_STATUS.md), and [network verification](docs/NETWORK_VERIFICATION.md).
