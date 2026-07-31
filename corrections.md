# GLI-FLOW corrections and product-improvement audit

Audit date: 2026-07-27  
Audited repository: `gli-flow-asic`  
Primary persona: a beginner who knows RTL/Verilog but has never used an EDA tool

## Executive summary

The core mock run is usable after installation, but the beginner path is not yet reliable. The biggest blockers are:

1. The documented install does not install dashboard backend dependencies, so `gli-flow dashboard --backend-only` fails immediately.
2. A fresh virtual environment can fail during installation when pip build isolation cannot reach PyPI; the project needs a more reproducible packaging/install story.
3. The CLI always initializes a log file under `~/.gli-flow`; if that location is read-only, even `gli-flow --help` crashes before showing help.
4. Telemetry consent recommends upload by default even though the documentation says local-only is the default. Let the telemetry upload be default just change in the documentation
5. The dashboard builds but fails lint with 79 errors and 11 warnings.
6. Mock output says both “1 metric failures” and “Tapeout Ready: YES”, which can mislead beginners into treating a simulation as signoff.
7. Installation, version, Docker, and documentation paths are inconsistent. Several archived audits document similar problems, but the current user path still exposes them.
8. When running a design in mock mode it doesn't show in cli or dashboard what's mock mode, so the beginner might get confused, so it should state clearly why mock mode.

Recommended release order: make mock mode and dashboard startup dependable; make privacy/consent truthful; make the real-tool installer deterministic; then improve the dashboard learning loop and advanced features.

## Audit evidence

Run in an isolated Python 3.12 virtual environment:

```text
python3 -m venv /tmp/gli-flow-audit-venv
pip install -e .
gli-flow --help
gli-flow doctor
gli-flow smoke-test
gli-flow run examples/counter --mock
gli-flow run counter --mock
gli-flow quickstart --help
gli-flow install --help
gli-flow dashboard --help
gli-flow dashboard --backend-only
```

Dashboard checks:

```text
npm ci
npm run build
npm run lint
```

Observed:

- Editable Python installation succeeds when package-index access is available.
- The first install attempt failed in a restricted environment because pip build isolation could not download `setuptools`; the documented bootstrap command also attempted network access before installation.
- `gli-flow smoke-test` passes mock readiness but reports missing `fastapi` and `uvicorn`.
- `gli-flow run examples/counter --mock` completes with exit code 0.
- `gli-flow run counter --mock` also resolves to the counter design; this shorthand is undocumented.
- With a read-only home, every CLI command crashes while opening `~/.gli-flow/logs/gli-flow.log`.
- With a writable home, dashboard backend startup cannot import `fastapi`, and `uvicorn` is absent.
- `npm run build` succeeds but reports an 864 kB minified JavaScript bundle.
- `npm run lint` fails with 79 errors and 11 warnings.
- The base environment has no pytest command; CI installs it separately. Contributors do not get a simple documented dev install/test path.

## P0 — must fix before asking beginners to evaluate

### P0-1. Make the documented install install the dashboard backend

Evidence: `setup.py` puts `fastapi`, `uvicorn`, and `pydantic` in the optional dashboard extra, while the README and guides instruct `pip install -e .`. `gli-flow install` installs npm dependencies but not the Python dashboard extra. The result is `ModuleNotFoundError: No module named 'fastapi'` and missing `uvicorn`.

Corrections:

- Add a supported command such as `python -m pip install -e ".[dashboard]"`, or make normal install include backend dependencies.
- Update all guides and the PowerShell installer consistently.
- Change smoke-test fix text to the correct source-install command when running from a clone.
- Test the real backend import and an HTTP health endpoint, not only package presence.
- Give one actionable dashboard error with the exact command and whether frontend or backend dependencies are missing.
- Add a lock/compatibility policy for Python dashboard dependencies.

### P0-2. Prevent logging from crashing all commands

Evidence: `gli_flow/core/logging.py` unconditionally creates `~/.gli-flow/logs/gli-flow.log`. A read-only home causes `gli-flow --help`, `doctor`, `smoke-test`, and `run` to terminate with an uncaught `OSError`.

Corrections:

- Treat file logging as optional; fall back to stderr.
- Print one short warning instead of a traceback.
- Support `GLI_FLOW_LOG_DIR` and an OS-appropriate data directory.
- Make `--help` independent of logging, database, telemetry, and tool discovery.
- Add tests for read-only home, permission denied, invalid log path, and missing home.

### P0-3. Make telemetry consent privacy-safe and consistent

Evidence: the wizard says “Full Sanitized Telemetry [Recommended]” and defaults to option 1, while docs say local-only is the default. The wizard can appear before smoke tests and runs.

Corrections:

- State exactly what leaves the machine, destination, retention, and revocation.
- Make `--non-interactive` deterministic and local-only; never wait for stdin.
- Do not launch consent for `--help`, `doctor`, `smoke-test`, or inspection commands.
- Add dashboard visibility for current mode plus payload preview/export.
- Test that Local and Disabled modes perform no network upload.
- Reconcile privacy language across code, README, guides, and support bundles.

### P0-4. Stop presenting mock output as tapeout signoff

Evidence: mock output reports `1 metric failures`, then `Implementation: SUCCESS`, `Signoff: PASS`, and `Tapeout Ready: YES`, with synthetic timing, utilization, DRC, LVS, and corners.

Corrections:

- Label mock results as simulated/demo results.
- Replace tapeout readiness with “Mock workflow complete — no tapeout conclusion available”.
- Separate “flow path exercised” from “design quality verified”.
- Mark every synthetic metric as simulated, placeholder, or not evaluated.
- Make metric failure produce one consistent warning state.
- Require real tool evidence, artifacts, and a signoff checklist before “tapeout ready”.
- Explain what synthesis, STA, DRC, LVS, and functional simulation do and do not prove.

### P0-5. Make the first command predictable and non-interactive

Evidence: first invocation can show the telemetry wizard; the wizard waits for stdin; `quickstart --help` has almost no useful description.

Corrections:

- Provide a guaranteed first path: install/check → smoke-test → demo → create design.
- Add `--yes`, `--non-interactive`, and `--telemetry local` consistently.
- Ensure pipe/CI use never prompts.
- Add descriptions, examples, expected duration, and success criteria to `quickstart`, `run`, `doctor`, and `install`.
- Keep `--help` side-effect free.

## P1 — high-impact reliability and installation

### P1-1. Define one authoritative version and release source

Evidence: `gli_flow/version.py` says `v1.1.0-beta`; `scripts/install.ps1` says `v1.0.0); Docker says `v1.0.0-mvp); many docs and archived reports say `v1.0.0); README says `v1.1.0-beta`.

Corrections:

- Store the version once and generate package, Docker, CLI, dashboard, and docs values.
- Fail CI when user-visible versions disagree.
- Publish a compatibility table for GLI-FLOW, Python, Ubuntu/WSL, EDA tools, PDK commit, and Node.
- Do not advertise an installer version different from the code.

### P1-2. Replace the split installer model with a supported matrix

Evidence: docs say Linux/WSL2; PowerShell says Windows/WSL2; installer contains macOS branches; Docker pins Ubuntu 22.04; `gli-flow install` can invoke sudo, apt, source builds, downloads, pip, volare, and npm. This is too much hidden system mutation for beginners.

Corrections:

- Clearly label recommended container, Ubuntu/WSL, and experimental macOS/Windows paths.
- Add a dry-run preview listing commands, downloads, paths, disk, and privilege escalation.
- Ask before system changes; provide user-local alternatives.
- Use secure temporary files instead of `tempfile.mktemp()`.
- Pin tool/PDK versions and verify download checksums.
- Make failures resumable with failed step, logs, and recovery command.
- Add a safe uninstall for GLI-FLOW-owned directories only.
- Verify companion binaries/libraries before declaring tools installed.

### P1-3. Fix the PowerShell installer

- Align `$GLIFlowVersion` with the package.
- Do not use `pip install "gli-flow"` unless a tested PyPI release exists; clone installers should install checked-out source.
- Replace the stale `opencode.ai` URL with the canonical docs URL.
- Make the final banner match the mock-first workflow.
- Check exit status for pip, npm, doctor, and activation.
- Do not suppress all error output; save a log and show a concise failure.
- Handle WSL2 before Windows-only WMI paths and use `Get-CimInstance` consistently.
- Explain that child-shell activation does not permanently alter future shells.

### P1-4. Make Python packaging deterministic

- Prefer a modern `pyproject.toml` build backend.
- Add a constraints/lock strategy for supported Python versions.
- Document `pip install -e ".[dev]" && pytest`.
- Ensure wheel package data includes runtime JSON, templates, schemas, and assets.
- Build/test a wheel in CI, then install the wheel in a clean environment.
- Document an offline install using local wheels/cache.
- Make `pip install gli-flow` either a real published release or remove every instruction suggesting it.

### P1-5. Fix dashboard quality gates

Evidence: `npm run build` succeeds, but `npm run lint` fails with 79 errors and 11 warnings: unused imports/props, missing hook dependencies, empty blocks, and state updates inside effects.

Corrections:

- Make lint pass in CI.
- Remove dead imports/props/components or wire them into functionality.
- Refactor derived state to direct calculation or `useMemo`.
- Stabilize callbacks and handle abort/error states.
- Add frontend tests for loading, empty, API unavailable, failed run, and success.
- Test production preview against backend health.
- Split the 864 kB bundle with route-level lazy loading and add a size budget.
- Lock Node/npm versions and define an `npm audit` remediation policy; `npm ci` reported 6 vulnerabilities (1 low, 5 high).

### P1-6. Make `doctor` and `smoke-test` agree

Evidence: `doctor` reports missing `sv2v` but still prints success-oriented next steps and “Running auto-repair”. Smoke test treats dashboard readiness as optional without making dashboard failure clear.

Corrections:

- Define statuses: READY, READY FOR MOCK, READY FOR REAL FLOW, BLOCKED, OPTIONAL.
- Return nonzero when the requested mode is blocked.
- Add `doctor --for mock`, `--for real`, and `--for dashboard`.
- Never imply repair ran unless it ran; distinguish recommendation from action.
- Explain why `sv2v` is needed and whether the manifest uses SystemVerilog.
- Show detected version, required version, and install command.
- End with one script-friendly verdict.

### P1-7. Improve design discovery and validation

Current behavior accepts `counter` although docs show `examples/counter`; useful shorthand is undocumented and can hide wrong-directory mistakes.

Corrections:

- Add `gli-flow examples list` with descriptions and estimated runtime.
- Add explicit `gli-flow run --example counter`.
- Suggest matching examples for missing paths.
- Show manifest, top module, RTL, constraints, PDK, and output directory before starting.
- Resolve manifest paths relative to the manifest directory.
- Add `gli-flow validate <design>` for fast checks without a full run.
- Generate a design README explaining every generated file and next command.

### P1-8. Make failure recovery the center of the workflow

- Every failure should show stage, cause, log path, artifact, fix, and rerun command.
- Add safe `gli-flow rerun <run-id> --from <stage>`.
- Preserve failed runs and never overwrite history.
- Add dashboard “copy diagnostic bundle” and “open failure log”.
- Explain EDA terms inline.
- Scrub secrets, API keys, credentials, IP, and unnecessary absolute paths from support bundles.
- Test malformed YAML, missing RTL, wrong top, missing clock, unsupported PDK, missing tool, permission, disk-full, timeout, and interruption cases.

### P1-9. Make real-flow claims verifiable

- Distinguish tool completion from signoff.
- Record commands, versions, PDK commit, environment, and artifact hashes.
- Verify DRC/LVS/STA values came from real tool output.
- Add functional simulation or make it an explicit prerequisite.
- Block “ready” when required artifacts are absent.
- Make cross-tool DRC `NO_ANALYSIS` a visible warning.

## P2 — education, dashboard, and healthy engagement

These improvements should increase useful return visits without dark patterns or hiding failures.

### P2-1. Build a beginner learning path

- Add “Learn by doing”: counter → GCD → UART → user RTL.
- Teach one concept per step: RTL, synthesis, floorplan, placement, routing, STA, DRC, LVS, simulation.
- Add guided explanations of why each stage matters and what success means.
- Include glossary/tooltips and a “new to EDA?” mode.
- Add safe experiments changing clock period, utilization, or RTL width.
- Keep failed experiments in a separate playground.

### P2-2. Make progress and comparison useful

- Compare timing, area, power, utilization, DRC, and runtime across runs.
- Add tags/branches such as baseline, faster-clock, and low-area.
- Add baselines and regression thresholds with plain-language explanations.
- Explain missing trend data rather than showing empty charts.
- Export sanitized CSV/JSON/Markdown reports.

### P2-3. Improve dashboard information architecture

- Home page should answer “What next?”, “Is my environment ready?”, and “What changed?”
- Put Run Example, Create Design, Validate, and Open Last Result above advanced analytics.
- Group cloud, AI, telemetry, warehouse, and infrastructure under Advanced.
- Add actionable empty states.
- Add keyboard navigation, responsive layout, contrast, focus states, and screen-reader labels.
- Add persistent run status with cancel, logs, elapsed time, stage, and artifacts.

### P2-4. Make telemetry and AI earn trust

- Keep AI opt-in and show exact sanitized input/provider before sending.
- Label speculative recommendations and link them to run evidence.
- Let users rate fixes locally by default.
- Provide local Failure Atlas search without account/network.
- Never block core flow usage on cloud, AI, Supabase, or telemetry.

## Documentation and repository cleanup

- Rewrite README around one tested beginner path; move architecture and historical audits out of the first-click path.
- Add one `docs/INSTALL.md` for Ubuntu, WSL2, Docker, and contributors.
- Document tested versions, expected time, disk, RAM, PATH, ports, and permissions.
- Add a troubleshooting table for Python/pip, npm, FastAPI, OpenROAD, Magic, Netgen, KLayout, PDK, and ports.
- Put “what this does not prove” immediately before signoff/tapeout language.
- Make all links resolve and replace conflicting URLs.
- Add CONTRIBUTING, security reporting, and beginner issue guidance.
- Archive stale audits with a dated index and current status.
- Generate command reference from CLI help to prevent doc drift.
- Add release notes with breaking changes, migration, limitations, and supported tool/PDK combinations.

## CI and acceptance checklist

Add a clean-environment job that:

1. Creates a fresh virtual environment.
2. Installs the wheel and dashboard extra.
3. Runs `gli-flow --help` with a read-only home.
4. Runs `doctor --for mock` and non-interactive smoke test.
5. Runs `gli-flow run --example counter --mock`.
6. Starts the backend and checks `/health`.
7. Runs `npm ci`, `npm run lint`, `npm run build`, and a frontend smoke test.
8. Verifies Local telemetry makes no network upload.
9. Verifies missing real tools produce clear diagnostics.
10. Fails release on version drift, dashboard lint failure, or unsupported tapeout claims.

## Suggested implementation order

1. Logging fallback and side-effect-free help.
2. Dashboard Python dependencies and backend health check.
3. Telemetry default/consent behavior.
4. Honest mock result and signoff gating.
5. Unified versions, URLs, and install docs.
6. Dry-run, resumable, pinned, permission-transparent installer.
7. Passing dashboard lint and clean-environment tests.
8. Beginner wizard, validation, recovery, and dashboard empty states.
9. Run comparison, learning content, and evidence-backed AI/telemetry feedback loops.

