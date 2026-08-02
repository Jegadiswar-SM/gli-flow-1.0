# Testing guide

## Test layers

The repository's pytest suite is under 'tests/' and includes:

- Unit tests for parsers, QoR, signoff, database, telemetry, installers, and
  individual analysis engines.
- Integration and end-to-end tests for the mock pipeline and counter flow.
- Adversarial tests for environment resilience, tool discovery, permissions,
  and malicious/invalid inputs.
- Regression tests for previously identified tool and path failures.
- Failure Atlas, investigation, resolution intelligence, prediction, and
  provenance tests.
- Dashboard/backend tests, including health and desktop Workbench behavior.
- P2 learning, comparison, accessibility, and degradation tests.

The frontend has a Node test under 'dashboard/test'. ESLint, Vite build, bundle
budget, and npm audit are separate quality gates.

## Local setup

~~~bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dashboard,dev]"
~~~

For dashboard checks:

~~~bash
cd dashboard
npm ci
~~~

## Recommended commands

Run the complete Python suite:

~~~bash
pytest -q --timeout=60
~~~

Run a focused area:

~~~bash
pytest -q tests/test_orchestrator.py tests/test_mock_adapter.py
pytest -q tests/test_installer.py tests/test_environment_infrastructure.py
pytest -q tests/failure_atlas tests/investigation tests/resolution_intelligence
pytest -q tests/e2e tests/integration
~~~

Run the dashboard gates:

~~~bash
cd dashboard
npm run lint
npm run build
npm run check:bundle
npm test
npm audit --audit-level=high
~~~

Build/test the desktop shell after installing its dependencies:

~~~bash
npm --prefix desktop ci
npm --prefix desktop run pack
~~~

## Environment-dependent skips

Some tests intentionally skip when the environment cannot provide:

- A functional EDA binary such as Magic, OpenROAD, Netgen, or KLayout.
- PostgreSQL and its driver/database.
- Passwordless privileged package installation.
- Real or populated external datasets.
- A non-root user for Unix permission simulation.
- A local backend socket in restricted or headless test environments.

A skip should explain the missing capability. Do not replace an environment
skip with a broad pass or delete a test that protects a real workflow.

## CI

The checked-in workflow is '.github/workflows/ci.yml'. It runs Python jobs
against Ubuntu 22.04 and 24.04 with Python 3.10 and 3.11, plus WSL detection,
failure corpus, doctor hardening, release validation, dashboard gates, and
backend/CLI checks. CI does not install the full EDA stack or run a tapeout
flow with real tools.

## Interpreting results

A passing mock pipeline means the manifest, orchestration lifecycle, mock
adapter, persistence, and reporting path worked. It does not validate the
real EDA adapters. A real run should be evaluated from tool logs, parsed
reports, artifact hashes, reproducibility data, and the signoff gate, not only
from its process exit code.

