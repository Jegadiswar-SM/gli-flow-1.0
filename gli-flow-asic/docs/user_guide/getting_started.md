# Getting Started

Clone to dashboard. Mock mode requires no EDA tools.

**Prerequisites:** Python 3.9–3.12, Linux (Ubuntu 22.04+ / Debian 12+ / WSL2), git

---

## 1. Clone and Install

For Linux or WSL2, the recommended path is the hosted installer:

```bash
curl -fsSL https://raw.githubusercontent.com/Jegadiswar-SM/gli-flow-1.0/main/gli-flow-asic/scripts/install.sh | bash
```

Activate the environment using the command it prints, then run
`gli-flow quickstart`. The manual path below is useful when you want to see
and control each installation step.

```bash
git clone https://github.com/Jegadiswar-SM/gli-flow-1.0.git
cd gli-flow-1.0/gli-flow-asic
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e "[dashboard]"
gli-flow smoke-test --non-interactive
gli-flow run --example counter --mock --non-interactive
```

`gli-flow install` is the optional real-tool/PDK installation path. EDA tools
(Yosys, OpenROAD, Magic, Netgen, KLayout) must be pre-installed or installed
— see `gli-flow doctor` to check. On Ubuntu: `apt install yosys openroad magic netgen klayout`.

## 2. Verify

```bash
gli-flow doctor --for mock --non-interactive
gli-flow smoke-test --non-interactive
```

Checks Python version, EDA tools, database schema, telemetry config, and the example
design. All checks pass when GLI-FLOW is ready.

For detailed environment info: `gli-flow doctor`

## 3. Run Your First Design

```bash
gli-flow run --example counter --mock --non-interactive
```

This runs the full pipeline in mock mode — no EDA tools needed. Expect:

```
  Metric        Value
─────────────────────
  QoR Score     0.6
  WNS           0.05
  TNS           0.0
  Utilization   65.0%
  Cell Count    100
  Runtime       42.0s

SIMULATED/DEMO OUTPUT — flow path exercised successfully.
Synthetic metrics are placeholders; design quality and signoff are not evaluated.
Mock workflow complete — no tapeout conclusion available.
```

## 4. Open the Dashboard

```bash
gli-flow dashboard
```

Opens at `http://127.0.0.1:5173`. Browse run results, timing, area, DRC/LVS, and
telemetry. Use `gli-flow dashboard --backend-only` for the API server only at
`http://127.0.0.1:8000`.

---

**RTL/IP never collected:** GLI-FLOW's telemetry explicitly excludes RTL source code,
GDS, netlists, and constraints. The default mode is local-only and sends nothing.
Choose an upload mode explicitly with `gli-flow telemetry mode full` or
`gli-flow telemetry mode atlas`; use `gli-flow telemetry mode disabled` for no
collection. See [Telemetry & Privacy](../privacy/telemetry_and_privacy.md).

## Beta Scope

**Included:** Open-source ASIC implementation flow (Yosys + OpenROAD + Magic + KLayout),
mock mode, web dashboard, Failure Atlas, and opt-in telemetry.

**Not included:** Commercial EDA tools, tapeout certification, guaranteed tapeout
outcomes, production signoff guarantees, enterprise features, multi-user platform.

## What's Next?

- [User Manual](user_manual.md) — install, run, diagnose, telemetry
- [Dashboard Guide](dashboard.md) — dashboard pages and features
- [CLI Reference](../reference/cli_reference.md) — every command
- [Troubleshooting](../reference/troubleshooting.md) — common issues
