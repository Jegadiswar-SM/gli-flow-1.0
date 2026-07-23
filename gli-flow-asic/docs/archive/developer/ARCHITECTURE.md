# GLI-FLOW Architecture

## Overview

GLI-FLOW orchestrates RTL-to-GDS digital design flows using open-source EDA tools. It provides execution intelligence, failure analysis, telemetry, and a web dashboard.

## System Architecture

```
CLI (argparse) → FlowOrchestrator → OpenRoadAdapter → subprocess(make) → ORFS
                                                          |
                                                Reports (GDS, DEF, .rpt)
                                                          |
                                                TelemetryParser → metrics.csv
                                                          |
                                                QoR scoring → SQLite → FastAPI → React Dashboard
```

## Key Components

### CLI (`gli_flow/cli/main.py`)
- 25+ commands organized by stability category (production / experimental)
- Uses `argparse` with custom help formatter

### Orchestrator (`gli_flow/core/orchestrator.py`)
- `FlowOrchestrator.run()` — validates manifest, discovers tools, executes pipeline stages
- `manifest` validation via `config_validator.py`
- Stage execution via OpenROAD adapter

### Execution Intelligence
- **Failure Atlas** — pattern matching and root cause analysis for known failures
- **Resolution Intelligence** — trust-scored resolution suggestions
- **Regression Detection** — QoR comparison against historical runs
- **Telemetry** — anonymized execution metrics, privacy-gated upload

### Database
- SQLite (`~/.gli-flow/gli_flow.db`)
- Migrations via `MigrationEngine` in `gli_flow/database/migrations.py`
- Tables: `runs`, `failure_atlas_entries`, `community_telemetry`, `resolution_patterns`, `community_escalations`, `community_unknown_dataset`

### Dashboard
- FastAPI backend (port 8000)
- React frontend (port 5173 dev)

## License Isolation

GPL-licensed EDA tools (Yosys, OpenROAD, KLayout, Magic, Netgen) are invoked exclusively via `subprocess`. No GPL code is imported into the Python process. See `docs/compliance/gpl_compliance_report.md`.

## Tool Discovery

Three-layer tool discovery:
1. PATH search for all candidates
2. Functional validation (each candidate is tested)
3. Evidence-based ranking (never chooses broken candidate by PATH order)
