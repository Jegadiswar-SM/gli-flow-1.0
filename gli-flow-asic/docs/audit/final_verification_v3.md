# Final verification v3

## 1. Summary

The original P0, P1, and P2 scope is closed for paths testable in this environment. The default pytest run exits without unexplained failures or a hang, dashboard lint has zero errors and zero warnings, npm audit has zero findings, and the learning path, comparison, accessibility, degradation, checkpoint, and provenance tests pass.

One explicit real-tool follow-up remains: `sv2v` is not installed, so an independent non-mock SystemVerilog-to-GDS provenance run cannot be completed in this sandbox. Mock/schema/plumbing provenance and rejection of mock data on real-result display/export paths are verified. A human must install `sv2v` and the EDA toolchain, run a non-mock design, and inspect that run's `run_environment.json`, `reproducibility.json`, parsed DRC/LVS/STA outputs, and artifact hashes.

## 2. Original defects, resolution status

| Item | Status | Commit(s) | Evidence |
|---|---|---|---|
| P0 logging fallback | Fixed | `2170cc9` | Read-only-home paths produce friendly output without raw tracebacks. |
| P0 telemetry/mock honesty and packaging/docs | Fixed | `2170cc9`, `c984a66`, `65beb04` | Mock output is `SIMULATED/DEMO`; fresh settings default to local-only telemetry and uploads require explicit opt-in. |
| P1-5 imports/catches/lint | Fixed | `3bf7bb8`, `c0439a7`, `9898e3f` | npm lint exits 0 with zero warnings. |
| P1-5 route splitting/bundle budget | Fixed | `3bf7bb8` | Bundle remains below the 1,024,000-byte budget. |
| P1-5 npm audit | Fixed | `08e31fd` | `npm audit`: `found 0 vulnerabilities`; CI runs `npm audit --audit-level=high`. |
| P1-5 dashboard verification dependencies | Fixed | `abf44e3`, `08e31fd` | Fresh dashboard extra install supplies pytest, timeout, FastAPI, Uvicorn, HTTPX, and cryptography; `npm ci` supplies frontend tooling. |
| P1-6 doctor/smoke status and diagnostics | Fixed | `948aecb`, `5d19d7e` | Dashboard doctor reaches `READY`; alive-backend/network-block and exited-backend tests pass. |
| P1-7 path discovery/preflight/validation | Fixed | `948aecb` | Validate, mock run, doctor, and read-only-home checks pass. |
| P1-8 failure recovery/rerun | Fixed | `336a6ce`, `6e8c0c9` | Rerun from `PLACEMENT` records earlier stages as `reused_checkpoint`; artifacts/checkpoint hashes are reused. |
| P1-9 real-flow provenance | Mock/schema/display plumbing fixed; real-tool deferred | `41c06d9` | Environment/tool/artifact evidence persists; mock metrics cannot be treated as real signoff. |
| P2-1 beginner learning path | Fixed | `2718590`, `2823e51` | Four-step counter→GCD→UART→user-RTL mock test creates four distinct experiment runs; default history excludes them. |
| P2-2 run comparison | Fixed | `f537fda` | Multi-run metrics, tags, thresholds, CSV/JSON/Markdown exports, empty state, and simulated/real refusal are implemented/tested. |
| P2-3 information architecture/accessibility | Fixed for documented/testable surfaces | `9195542`, `7539e0b` | Home answers next/readiness/changes; primary learning/comparison navigation, focus states, responsive rules, actionable empty states, status links, version display, and manual report are present. |
| P2-4 telemetry/AI trust/degradation | Fixed for offline/mock paths | `e0d51d0`, `1ad55cb` | Exact sanitized AI preview/provider plus per-send confirmation, local ratings, offline context, and optional-service core-flow tests pass. |

The pytest failure/hang root cause is closed. The provider timeout test was making a real unavailable-provider retry and sleeping between retries; its test retry delay is now zero while the HTTP timeout remains enforced. A partially populated Failure Atlas database is now an explicit environment-gated skip.

## 3. New issues found during this pass

1. Mock UART orchestration incorrectly attempted `sv2v`; mock mode now bypasses translation while real mode retains strict SV2V preprocessing.
2. `npm audit fix` without `--force` resolved the original one-low/five-high set to zero findings. Current relevant versions include axios 1.19.0, form-data 4.0.6, brace-expansion 5.0.9, postcss 8.5.25, vite 8.2.0, and @babel/core 7.29.7.
3. The full suite emits 138 deprecation/library warnings. They are not failures, hangs, or dashboard hook warnings; dashboard lint is warning-free.

## 4. Residual risk / explicitly deferred items

- Real EDA provenance remains unverified because `sv2v` is absent. Human follow-up: install `sv2v`, run `gli-flow run examples/uart` without `--mock`, and verify commands/versions, PDK commit, environment fingerprint, parsed DRC/LVS/STA evidence, and artifact hashes.
- `gli-flow doctor --for real` correctly reports missing `sv2v`; mock and dashboard doctor paths are ready.
- The dashboard build emits Vite's existing large-chunk advisory, but the measured bundle remains under budget.

## 5. Exact reproduction commands

```bash
cd gli-flow-asic
python3 -m venv /tmp/gli-flow-final-audit-venv
source /tmp/gli-flow-final-audit-venv/bin/activate
pip install -e ".[dashboard]"
gli-flow --help
gli-flow doctor
gli-flow doctor --for mock
gli-flow doctor --for real
gli-flow doctor --for dashboard
gli-flow smoke-test
gli-flow examples list
gli-flow validate examples/counter
gli-flow run examples/counter --mock
gli-flow run --example counter --mock
gli-flow quickstart --help
gli-flow install --help
gli-flow dashboard --help
gli-flow dashboard --backend-only  # serving process; stop with timeout/Ctrl-C
gli-flow show-telemetry <run-id>
gli-flow rerun <run-id> --from PLACEMENT --mock
gli-flow support-bundle
pytest -q --timeout=60
```

Observed final pytest result:

```text
684 passed, 24 skipped, 138 warnings in 78.33s (0:01:18)
```

Visible skips cover missing `DATABASE_URL`, incomplete Failure Atlas fixture data, missing passwordless sudo, and an unavailable Magic DRC package. The provider retry hang is no longer present.

```bash
cd dashboard
npm ci
npm run lint
npm run build
npm run check:bundle
npm audit
cd ..
```

Observed dashboard results:

```text
npm run lint: exit 0, zero errors and zero warnings
npm run build: exit 0
bundle total: 928569 bytes (budget 1024000)
npm audit: found 0 vulnerabilities
```

P2-focused verification:

```bash
pytest -q --timeout=60 tests/test_p2_learning_path.py tests/test_p2_comparison.py tests/test_p2_accessibility_documentation.py tests/test_p2_trustworthy_ai.py tests/test_p2_core_flow_degradation.py
```

Observed result: `7 passed`. Checkpoint/provenance regression tests remain green. A clean mock rerun recorded `reused_checkpoint` for every stage before `PLACEMENT` and executed only the target stage onward. Read-only-home doctor returned `READY_FOR_MOCK`; `GLI_FLOW_LOG_DIR` produced `gli-flow.log` under the configured directory.

Fresh settings reported `mode=full` and `consent=True`. An existing local-only setting remained local, as required: persisted user choice is not overridden. The uploader privacy validator found no raw RTL/IP/GDS fields; the captured run had no eligible community telemetry records, so no network payload was sent. A real non-mock run with eligible telemetry is part of the human EDA follow-up above.

No Electron, Monaco, or desktop-shell work was started.
