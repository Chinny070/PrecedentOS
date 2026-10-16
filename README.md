# PrecedentOS 2.0

PrecedentOS is a fictional-case research prototype built with three GenLayer Intelligent Contracts and a React/TypeScript frontend. It supports precedent registration and comparison, case evidence and AI assessments, appeals, freeze and resolution flows, contradiction challenges, authority links, and a bounded Web Render path that remains disabled in the current contract source. It is not a court or legal advice. Validator agreement does not establish legal correctness, neutral governance, or fair notice.

## Current repository

- `contracts/precedent_registry.py` — append-only precedent registry.
- `contracts/precedent_evaluator.py` — evidence-bound precedent comparison.
- `contracts/case_court.py` — case lifecycle, evidence, judgments, appeals, challenges, authority, and Web Render methods.
- `frontend/` — React, TypeScript, Vite application using `genlayer-js` and real contract calls when configured.
- `tests/` — Python Direct Mode tests and shared fictional fixtures; Direct Mode mocks do not prove live validator consensus or Studionet behavior.
- `manual-deployment/` — user-maintained deployment material; intentionally untracked.

The frontend targets stable Studionet chain ID `61999`. Current user-reported deployment addresses and verification evidence are in [the deployment manifest](docs/V2_DEPLOYMENT_MANIFEST.md); the repository has not independently matched deployed bytecode to source or fetched all receipts. The current working source includes release changes that require a fresh CaseCourt deployment; the later user-reported address in the manifest must not be assumed to include them.

## Clean-clone setup (Windows PowerShell)

Requirements: Python 3.12+, Node.js `^20.19.0` or `>=22.12.0`, npm, and Git. From the repository root:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
python scripts/run_tests_safe.py tests
genvm-lint check contracts/precedent_registry.py
genvm-lint check contracts/precedent_evaluator.py
genvm-lint check contracts/case_court.py
```

GenVM lint/schema output is a local tool result, not proof of stable-runner compatibility. Do not run Studio Mode/deployment commands against a valuable network as part of setup.

For the frontend:

```powershell
Set-Location frontend
npm ci
Copy-Item .env.example .env.local
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

The browser smoke suite is an optional, pinned setup because Playwright's browser package is not part of the production frontend toolchain:

```powershell
npm install --no-save --package-lock=false @playwright/test@1.56.1
npx playwright install chromium
npm run test:e2e
```

The three `VITE_GENLAYER_*_ADDRESS` values in `.env.local` are public addresses only. Never put private keys or secrets in Vite variables. Wallet writes require an injected wallet connected to Studionet and explicit user signatures. Demo fixtures are local examples and are never presented as chain readbacks.

## Verification boundaries

Frontend write success requires a finalized receipt, majority agreement, and `FINISHED_WITH_RETURN`; a timeout remains unresolved and must not trigger a duplicate write. After a refresh, saved transaction entries are unverified local notes until checked against the network. Dependent case actions require the latest exact on-chain version.

Either named party can submit and lock evidence under the current contract. There is no respondent acknowledgement or general response window, and the appellate reviewer is a mutually approved named participant rather than an independent tribunal. Those are prototype limitations. Appeal freezes can still require the contract's appeal/recovery path if review stalls. Use disposable fictional cases for demonstrations.

See [deployment manifest](docs/V2_DEPLOYMENT_MANIFEST.md), [CaseCourt readiness](docs/V2_CASECOURT_READINESS.md), [Stage 9 live verification](docs/V2_STAGE_9_LIVE_VERIFICATION.md), [acceptance matrix](docs/V2_ACCEPTANCE_MATRIX.md), and [implementation masterplan](docs/V2_IMPLEMENTATION_MASTERPLAN.md) for evidence provenance and outstanding live-work gates.
