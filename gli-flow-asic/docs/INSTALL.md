# GLI-FLOW installation

Recommended: Ubuntu 22.04/24.04 or WSL2, or the repository Docker image. Native
Windows and macOS are experimental. Use Python 3.9–3.12 in a virtual environment.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dashboard]"
gli-flow smoke-test --non-interactive
gli-flow run --example counter --mock --non-interactive
```

The dashboard backend is included by the supported source install. Frontend
development dependencies are separate: `cd dashboard && npm ci`; start with
`gli-flow dashboard --backend-only` to verify `GET /health` without Node.

For reproducible dashboard development, install constraints after the package:
`python -m pip install -c constraints/dashboard-py312.txt -e ".[dashboard]"`.
For offline use, populate a wheel cache first and add `--no-index --find-links
PATH/TO/CACHE` to pip. A mock run normally takes less than one minute; real EDA
tool installation requires substantially more disk and time.

Before any signoff-adjacent conclusion: mock output is simulated and does not
prove synthesis quality, STA closure, DRC cleanliness, LVS equivalence, or
functional correctness. Real readiness requires real tool evidence, required
artifacts, and an explicit signoff checklist.
