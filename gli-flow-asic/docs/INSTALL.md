# GLI-FLOW installation

Recommended: Ubuntu 22.04/24.04 or WSL2, or the repository Docker image. Native
Windows and macOS are experimental. Use Python 3.9–3.12 in a virtual environment.

For Windows beginners, follow the complete [Windows + WSL2 setup guide](WINDOWS_WSL2_SETUP.md).

## One-command install (Linux or WSL2)

The easiest path is to run the hosted installer. It creates a virtual
environment, installs GLI-FLOW with dashboard support, and verifies the mock
path:

```bash
curl -fsSL https://raw.githubusercontent.com/Jegadiswar-SM/gli-flow-1.0/main/gli-flow-asic/scripts/install.sh | bash
```

At the end, activate the environment using the command it prints, then try
`gli-flow quickstart`. In WSL2, the installer asks once whether to install the
optional system-level EDA prerequisites.

## Manual install

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

The optional Electron desktop shell uses the same backend and requires the
same Python environment. Build the browser dashboard first, then launch it
with an absolute interpreter path:

```bash
cd dashboard && npm ci && npm run build
cd ..
npm --prefix desktop ci
GLI_FLOW_PROJECT_ROOT="$PWD" \
GLI_FLOW_PYTHON="$PWD/.venv/bin/python" \
npm --prefix desktop run start
```

For CLI/Electron attach mode, run `gli-flow dashboard --backend-only` in one
terminal and `npm --prefix desktop run start -- --attach-only` from the root in
another. See [Desktop and Workbench](../desktop/README.md). Use an absolute
`GLI_FLOW_PYTHON`; a relative value may fail with `spawn ... ENOENT`.

For reproducible dashboard development, install constraints after the package:
`python -m pip install -c constraints/dashboard-py312.txt -e ".[dashboard]"`.
For offline use, populate a wheel cache first and add `--no-index --find-links
PATH/TO/CACHE` to pip. A mock run normally takes less than one minute; real EDA
tool installation requires substantially more disk and time.

To remove the user-local installer directory later, preview first and then run
the confirmed uninstall script:

```bash
bash scripts/uninstall.sh --dry-run
bash scripts/uninstall.sh
```

This removes only `~/.gli-flow` (or `$GLI_FLOW_HOME`); it never removes a
repository checkout, designs, or system packages.

Before any signoff-adjacent conclusion: mock output is simulated and does not
prove synthesis quality, STA closure, DRC cleanliness, LVS equivalence, or
functional correctness. Real readiness requires real tool evidence, required
artifacts, and an explicit signoff checklist.
