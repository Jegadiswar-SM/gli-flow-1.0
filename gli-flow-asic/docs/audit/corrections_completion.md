# Corrections audit completion

This file records the current implementation and verification status for
`/corrections.md`. P2-4 (Telemetry and AI trust) is intentionally excluded
from this completion pass, as requested. Supabase is also unchanged by
request.

## Completed scope

- P0: dashboard dependencies and health checks, logging fallback, local-only
  telemetry default, honest mock-mode output, side-effect-free help, and
  deterministic non-interactive first-run commands.
- P1: version/source-path consistency, constrained Python support, source and
  wheel installation paths, dry-run/re-runnable installer behavior, safe
  temporary download files, dashboard lint/build/bundle/audit gates, doctor
  readiness modes, manifest-relative path resolution, rerun links, support
  bundle redaction, provenance hashes, signoff evidence gates, and the safe
  user-local uninstall script.
- P2-1: guided counter → GCD → UART → user RTL learning path with isolated
  experiment metadata.
- P2-2: run comparison, baseline/regression fields, tags, and sanitized
  report/export paths.
- P2-3: beginner-first home/run/validate/dashboard surfaces, actionable empty
  states, live run status, artifact/reproducibility views, keyboard focus
  styles, responsive layout, and accessibility documentation.
- Documentation/CI: current repository URLs, WSL2/install guidance, privacy
  language, version consistency checks, clean-environment CLI/backend checks,
  frontend lint/build/bundle/test/audit checks, and Python test execution.

## Subsequent Workbench and desktop-install additions

The following work was completed after the original corrections audit and is
now part of the current repository state:

- Electron/Monaco RTL Workbench: multi-file tabs with dirty indicators and
  close protection, Monaco minimap and editing actions, breadcrumbs, outline
  navigation, command palette, global search, status bar, and Electron-only
  file CRUD.
- Secure EDA access: the Electron Workbench provides one-click Yosys,
  OpenROAD, and KLayout availability checks. The backend accepts only those
  allowlisted tools through the existing per-launch desktop token; browser
  mode cannot execute tools or file mutations.
- One-command desktop setup: `scripts/install.sh --desktop` installs the
  Python environment, dashboard dependencies, self-hosted Monaco build, and
  Electron dependencies, then prints the launch command. The normal installer
  remains the lighter CLI/browser path. System EDA tools remain an explicit
  optional install step.
- Status and verification evidence: see
  [`docs/desktop_workbench_status.md`](../desktop_workbench_status.md) for the
  tier-by-tier implementation, bundle measurements, and deferred scope.

The explicit P2-4 exclusion remains unchanged. Supabase remains unchanged by
request.

## Verification commands

```bash
pytest -q --timeout=60
cd dashboard
npm ci
npm run lint
npm run build
npm run check:bundle
npm test
npm audit --audit-level=high
```

The remaining skipped tests are environment-gated real-tool, PostgreSQL,
passwordless-system-mutation, or populated-dataset tests; they do not make
mock/local workflows unavailable.
