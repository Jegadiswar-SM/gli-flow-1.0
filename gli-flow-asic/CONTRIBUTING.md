# Contributing to GLI-FLOW

GLI-FLOW prioritizes reproducibility, deterministic infrastructure behavior,
machine-readable observability, and structured diagnostics.

## Development workflow

```bash
python3 -m venv .venv && source .venv/bin/activate
python -m pip install -e ".[dashboard,dev]"
pytest -q --timeout=60
cd dashboard && npm ci && npm run build
```

Preserve repository structure, documented behavior, and machine-readable output.
Keep beginner-facing output honest: simulated values must be labeled, and no
change may turn missing tool evidence into a signoff claim.

Before submitting a dashboard change, also run `npm run lint`, `npm run
check:bundle`, and `npm test`. Update `docs/README.md` and the relevant guide
when a public command, endpoint, configuration key, artifact, or limitation
changes. Do not commit generated databases, `node_modules`, virtual
environments, credentials, or support bundles containing private data.
