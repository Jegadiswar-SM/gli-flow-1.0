# GLI-FLOW

Open-source RTL-to-GDS digital design flow — one command from Verilog to GDSII.

GLI-FLOW orchestrates Yosys, OpenROAD, Magic, Netgen, and KLayout through synthesis,
floorplanning, placement, CTS, routing, DRC/LVS, STA, and GDS export. Mock mode
validates your design config in seconds without any EDA tools installed.

## Why GLI-FLOW?

- **One command.** `gli-flow run <design>` runs the complete flow end-to-end.
- **Mock mode.** Develop and validate manifests without the EDA toolchain.
- **Built-in diagnostics.** Automated failure detection, root-cause analysis, and support bundles.
- **Dashboard.** Web UI for run history, timing/area/power, DRC/LVS, and telemetry.
- **Desktop shell.** Optional Electron app with native file access and the RTL Workbench.
- **Transparent telemetry.** Default is local-only collection; nothing leaves your machine until you explicitly choose sanitized uploads. RTL, IP, netlists, and GDS are never collected. Change the mode with `gli-flow telemetry mode ...` or `--telemetry local`/`--telemetry disabled`.

## Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/Jegadiswar-SM/gli-flow-1.0/main/gli-flow-asic/scripts/install.sh | bash
```

Then activate the environment using the command the installer prints and try
`gli-flow quickstart`. For a visible, manual setup, clone the repository and
follow [docs/INSTALL.md](docs/INSTALL.md).

Python 3.9–3.12. Linux (Ubuntu 22.04+ / Debian 12+ / WSL2).

Windows beginners: follow the [Windows + WSL2 setup guide](docs/WINDOWS_WSL2_SETUP.md).

## Quick Start

```bash
# Verify mock readiness
gli-flow doctor --for mock
gli-flow smoke-test --non-interactive

# First run (mock mode, no EDA tools required)
gli-flow run --example counter --mock --non-interactive

# Start a new design after the example
gli-flow init my_design

# Launch dashboard
gli-flow dashboard
```

## Electron desktop dashboard

After installing the Python environment and building the dashboard, launch
the native shell from the repository root with an absolute Python path:

```bash
GLI_FLOW_PROJECT_ROOT="$PWD" \
GLI_FLOW_PYTHON="$PWD/.venv/bin/python" \
npm --prefix desktop run start
```

Electron spawns the same FastAPI backend, waits for `/health`, and opens the
backend-served dashboard. To attach to a backend started by the CLI instead:

```bash
source .venv/bin/activate
gli-flow dashboard --backend-only
# In another terminal, from the repository root:
npm --prefix desktop run start -- --attach-only
```

See [Desktop and Workbench](desktop/README.md) for setup, packaging, native
file access, offline Monaco behavior, and troubleshooting.

## Dashboard

```bash
gli-flow dashboard
```

Opens at `http://127.0.0.1:5173`. The backend starts automatically.
Use `--backend-only` for API at `http://127.0.0.1:8000`.

## Features

- Full RTL-to-GDS pipeline — synthesis, placement, routing, DRC, LVS, STA
- Mock mode — validate config without tools
- Web dashboard — run history, metrics, telemetry
- Automated failure detection with fix recommendations
- AI-assisted investigation (experimental — requires external API key)
- CI mode with JUnit/Markdown output
- Support bundles for issue reports

## Documentation

| Link | Contents |
|------|----------|
| [Getting Started](docs/user_guide/getting_started.md) | Clone to dashboard step-by-step |
| [User Manual](docs/user_guide/user_manual.md) | Install, run, diagnose, telemetry |
| [Dashboard Guide](docs/user_guide/dashboard.md) | Dashboard pages reference |
| [Desktop and Workbench](desktop/README.md) | Electron shell, RTL editor, and offline setup |
| [CLI Reference](docs/reference/cli_reference.md) | Every command and flag |
| [Troubleshooting](docs/reference/troubleshooting.md) | Common issues |
| [Telemetry & Privacy](docs/privacy/telemetry_and_privacy.md) | Data handling and consent |

## Current Beta Scope

**Included:**
- Open-source ASIC implementation flow (Yosys + OpenROAD + Magic + KLayout)
- Mock mode for config validation
- Execution observability and Failure Atlas
- Local-only telemetry by default; explicitly opt in to sanitized uploads with `gli-flow telemetry mode full`
- Web dashboard

**Not included:**
- Commercial EDA tools (Synopsys, Cadence, Siemens)
- Tapeout certification or guaranteed tapeout outcomes
- Production signoff guarantees
- Enterprise collaboration features
- Multi-user cloud platform

GLI-FLOW is v1.1.0-beta. Report issues at https://github.com/Jegadiswar-SM/gli-flow-1.0/issues.

## License

Apache 2.0 — see [LICENSE](LICENSE).
