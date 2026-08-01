# Final verification v2

## 1. Summary

The P1 gate is satisfied for the correctness paths testable in this
environment. P2 was not started. The default pytest run exits without a hang
or unexplained failure, dashboard lint has zero errors and zero warnings,
rerun now uses persisted stage checkpoints, and run provenance is persisted
and enforced at result-display time.

Two environment/security follow-ups remain explicit. `sv2v` is not installed,
so a real EDA flow and independent real-tool provenance cannot be completed
here; the mock/schema/plumbing and mock-result rejection paths are verified.
The original npm audit attempt failed with `getaddrinfo EAI_AGAIN`; a later
retry reached advisory data and reported six findings (one low, five high).
CI correctly gates high/critical findings with `npm audit --audit-level=high`.

## 2. Original defects, resolution status

| Item | Status | Commit(s) | Evidence |
|---|---|---|---|
| P0 logging fallback | Fixed | `2170cc9` | CLI emits the fallback message without a traceback |
| P0 telemetry/mock honesty and packaging/docs | Fixed | `2170cc9`, `c984a66` | Mock output is labeled `SIMULATED/DEMO OUTPUT`; isolated editable install passes |
| P1-5 unused imports/empty catches/lint errors | Fixed | `3bf7bb8`, `c0439a7`, `9898e3f` | `npm run lint`: exit 0, no errors or warnings; all former 11 hook warnings individually reviewed |
| P1-5 route splitting/bundle budget | Fixed | `3bf7bb8` | `npm run check:bundle`: 909318 bytes total, 601954-byte largest asset, 1024000-byte budget |
| P1-5 npm audit | Deferred and CI-gated | `b3a5297` | README records the EAI_AGAIN limitation and exact `npm audit`; CI acceptance job gates high/critical findings; later retry reports 6 findings |
| P1-5 frontend tests | Partially fixed / no page suite configured | `abf44e3` | Fresh `.[dashboard]` install supplies pytest and HTTP dependencies; `npm ci`, lint, build, and bundle checks pass |
| P1-6 doctor/smoke status enum and verdicts | Fixed for dashboard diagnostic quality | `948aecb`, `5d19d7e` | `doctor --for dashboard` is `READY`; alive-backend/network-block and exited-backend diagnostics have focused tests |
| P1-7 path discovery/preflight/validation | Fixed for tested paths | `948aecb` | Existing validation and mock preflight tests pass in the full suite |
| P1-8 failure recovery/rerun | Fixed in mock mode | `336a6ce`, `6e8c0c9` | Per-stage checkpoints contain hashes; rerun copies prior outputs, skips earlier stages, and executes only from target onward; focused test passes |
| P1-9 independent real-flow claims | Mock/schema/display plumbing fixed; real-tool verification deferred | `41c06d9` | Environment fingerprint, tool commands/versions, PDK commit field, artifact hashes, and result evidence persist; mock result is rejected by real-result display guard; real closure requires `sv2v` and a human real-flow run |
| P2-1 learning path | Deferred | — | Not started because this session was limited to P1 |
| P2-2 comparison | Deferred | — | Not started because this session was limited to P1 |
| P2-3 information architecture/accessibility | Deferred | — | Not started because this session was limited to P1 |
| P2-4 telemetry/AI trust | Deferred | — | Not started because this session was limited to P1 |

The original pytest failures were category (b) regressions in the task's own
changes: the CLI test asserted obsolete `SUCCESS` wording after mock-honesty
changes; a resolution test fixture lacked the new classification column; and
hard-coded trust-test dates had decayed below their intended threshold. The
indefinite behavior was addressed by making telemetry consent non-interactive
and joining the heartbeat thread during cleanup. Environment-gated installer
and failure-atlas tests are visibly skipped; the suite has a 60-second test
timeout and supports `--all` for explicit gated execution.

## 3. New issues found during this pass

1. A fresh `python3 -m venv` plus `pip install -e ".[dashboard]"` succeeds and
   installs `pytest`, `pytest-timeout`, FastAPI, Uvicorn, Pydantic, HTTPX, and
   cryptography. Frontend tooling remains the documented separate `npm ci`.
2. Dashboard provenance endpoints previously searched the wrong manifest path
   and fabricated inferred tool values. They now read actual root-level run
   manifests and return no fabricated provenance.
3. A later npm audit retry reached advisory data and identified six findings;
   no `npm audit fix --force` was run. Dependency remediation remains owned by
   the dependency maintainers, with CI configured to gate it.

## 4. Residual risk / explicitly deferred items

- P2 was not started.
- Real EDA execution and independent real-tool provenance remain unverified
  because `sv2v` is absent in this environment. A human follow-up must install
  the supported EDA toolchain, run a non-mock design, and verify the generated
  `run_environment.json`, `reproducibility.json`, parsed DRC/LVS/STA reports,
  and artifact hashes.
- The full suite still emits 138 existing deprecation/library warnings; these
  are warnings, not test failures or hangs.
- The npm audit is not a green dependency result; CI is intentionally the
  acceptance gate and currently reports high findings when registry access is
  available.

## 5. Exact reproduction commands

```bash
cd gli-flow-asic
python3 -m venv /tmp/gli-flow-p1-venv
/tmp/gli-flow-p1-venv/bin/pip install -e ".[dashboard]"
/tmp/gli-flow-p1-venv/bin/pytest -q --timeout=60

cd dashboard
npm ci
npm run lint
npm run build
npm run check:bundle
npm audit

cd ..
/tmp/gli-flow-p1-venv/bin/gli-flow doctor --for dashboard
```

Observed final pytest result:

```text
677 passed, 24 skipped, 138 warnings in 93.17s (0:01:33)
pytest_exit=0
```

The skips are reported with reasons including missing `DATABASE_URL`, missing
failure-atlas data, and lack of passwordless sudo. The focused checkpoint and
provenance command was:

```bash
/tmp/gli-flow-p1-venv/bin/pytest -q tests/test_checkpoint_resume.py tests/test_provenance.py
```

Observed result: `4 passed`.

Observed final dashboard results:

```text
> dashboard@0.0.0 lint
> eslint .
lint_exit=0

bundle total: 909318 bytes (budget 1024000)
bundle_exit=0

Dashboard backend: FastAPI import, backend startup, and GET /health passed
FINAL_VERDICT: READY
```

The committed checkpoints/provenance changes are `6e8c0c9` and `41c06d9`.
No P2 work was performed.
