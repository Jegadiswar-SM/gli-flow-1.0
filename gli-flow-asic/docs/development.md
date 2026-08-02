# Development guide

## Repository setup

From the package root:

~~~bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dashboard,dev]"
~~~

The dashboard and Electron projects use npm lockfiles. Install them separately:

~~~bash
cd dashboard && npm ci
cd ../desktop && npm ci
cd ..
~~~

The Python package exposes the 'gli-flow' console command through setuptools.
The dashboard is a Vite development server. The backend is started by
'gli-flow dashboard' or directly with Uvicorn from the repository root:

~~~bash
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000
~~~

If 'dashboard/dist' exists, the backend mounts it as the root static application.
During frontend development, run Vite separately and use the configured API
base/proxy behavior.

## Development loop

1. Change the smallest relevant Python, JavaScript/JSX, configuration, or
   documentation surface.
2. Run a focused test or lint target.
3. Run the complete relevant gate before opening a pull request.
4. Update the reference docs if a command, endpoint, config key, artifact, or
   limitation changed.
5. Use mock mode for fast orchestration checks; use real EDA tools only for
   changes that affect adapter/tool evidence.

Useful checks:

~~~bash
python -m compileall gli_flow backend
pytest -q --timeout=60
cd dashboard && npm run lint && npm run build && npm run check:bundle && npm test
~~~

## Code organization

- 'gli_flow/cli/' — parser, output, smoke test, status, and command helpers.
- 'gli_flow/core/' — orchestrator, stages, safety, subprocess, logging, and validation.
- 'gli_flow/backends/' — OpenROAD, LibreLane, and ORFS monitoring adapters.
- 'gli_flow/installer/' — platform detection, tool installers, PDK/ORFS setup, validation.
- 'gli_flow/database/' — provider abstraction, migrations, SQLite/PostgreSQL.
- 'gli_flow/telemetry/' — local telemetry, sanitization, queue, upload, and audit.
- 'gli_flow/signoff/' — evidence classification and signoff gate support.
- 'failure_atlas/' — failure taxonomy, signatures, remediation, and records.
- 'backend/' — FastAPI endpoint implementation.
- 'dashboard/src/' — React pages and shared frontend utilities.
- 'desktop/' — Electron process, preload bridge, and packaging.
- 'tests/' — all automated test layers.

## Coding and documentation standards

- Keep subprocesses bounded by timeouts and avoid shell-string execution.
- Preserve evidence provenance and distinguish VERIFIED, HEURISTIC, and
  UNVERIFIED classifications.
- Do not silently convert missing or NOT_RUN evidence into PASS.
- Preserve local/offline core operation.
- Keep beginner-facing output actionable and honest.
- Add tests for regressions and update docs for public behavior.
- Do not commit secrets, generated databases, node_modules, or virtual
  environments.

## Change review checklist

- Is the public command or API behavior documented?
- Are failure and degraded paths documented?
- Are real versus mock outputs clearly distinguished?
- Are links and code examples checked?
- Does the change preserve the Python supported range?
- Does the dashboard still pass lint/build/bundle/test?
- Does the change touch cloud, AI, or telemetry behavior? If so, document
  consent, fallback, and offline behavior explicitly.
