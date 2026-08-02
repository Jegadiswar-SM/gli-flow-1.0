# Architecture overview

## System boundary

GLI-FLOW is a local-first orchestration application. The Python package owns
command parsing, design/manifest resolution, execution, persistence, artifact
management, telemetry, diagnostics, and signoff classification. The FastAPI
application exposes local data and operations to the dashboard. The React
application renders those APIs; it does not run EDA tools directly.

External systems are optional or environment-dependent:

- EDA executables: Yosys, OpenROAD/ORFS, Magic, Netgen, KLayout, and optional
  LibreLane.
- PDK and flow data: primarily Sky130A; the installer also recognizes GF180MCU.
- Optional database: PostgreSQL through 'DATABASE_URL'.
- Optional AI investigation: the provider implemented under
  'gli_flow.investigation.providers', enabled only when its provider key is
  available.
- Optional cloud artifact storage: S3 or GCS through the 'cloud' extra.

## Component model

~~~mermaid
graph TB
    subgraph Client
        CLI[gli-flow CLI]
        Browser[React/Vite dashboard]
        Electron[Electron desktop shell]
        CI[CI runner / scripts]
    end

    subgraph Python["Python package: gli_flow"]
        Parser[Manifest and RTL parser]
        Config[Config resolution]
        Orch[FlowOrchestrator]
        Adapters[MockEDAAdapter<br/>OpenRoadAdapter<br/>LibreLaneAdapter]
        Runtime[Run directory, artifacts,<br/>heartbeat, telemetry]
        Analysis[QoR, regression, Failure Atlas,<br/>resolution intelligence]
        Signoff[Signoff gate and evidence checks]
        Installer[Installer and tool detector]
    end

    subgraph Service
        API[backend.server FastAPI]
    end

    subgraph Storage
        SQLite[(SQLite)]
        PostgreSQL[(PostgreSQL)]
        Files[(Run files and reports)]
        Knowledge[(Failure Atlas JSON and DB records)]
    end

    CLI --> Config
    CLI --> Orch
    CI --> CLI
    Browser --> API
    Electron --> API
    API --> Runtime
    API --> Analysis
    API --> Storage
    Orch --> Parser
    Orch --> Config
    Orch --> Adapters
    Orch --> Runtime
    Orch --> Analysis
    Orch --> Signoff
    Runtime --> SQLite
    Runtime --> Files
    Analysis --> Knowledge
    SQLite -. selected when configured .-> PostgreSQL
    Installer --> Adapters
~~~

The CLI and backend share the Python implementation and database schema. The
dashboard is a client of the FastAPI service; it does not implement a second
execution engine. The Electron application launches or attaches to that same
backend and serves the built dashboard.

## Responsibilities

### CLI

'gli_flow.cli.main' builds the top-level parser, applies global telemetry and
non-interactive options, dispatches commands, starts the dashboard processes,
and formats user-facing output through Rich. The default top-level help shows
common commands; '--all' or 'commands' exposes the full command surface.

### Orchestrator

'FlowOrchestrator' reads and normalizes the manifest, discovers the PDK,
selects an adapter, creates a run record and protected run directory, executes
the ordered stages, writes checkpoints, parses reports, computes QoR, evaluates
signoff evidence, detects failures, and finalizes the run.

### Adapters

- 'MockEDAAdapter' produces deterministic simulated results and placeholder
  visualization files for development.
- 'OpenRoadAdapter' drives real OpenROAD/ORFS work and parses tool evidence.
- 'LibreLaneAdapter' provides the alternate LibreLane backend.

The adapter boundary keeps the orchestration lifecycle and persistence logic
shared between simulated and real execution.

### Storage

SQLite is the normal local provider. The database schema is migrated on access
by the database provider layer. PostgreSQL is selected for a PostgreSQL
'DATABASE_URL'. Run files remain filesystem artifacts even when a remote
provider is selected.

### Backend

'backend/server.py' creates the FastAPI application, configures CORS, selects
the database provider, validates/migrates the schema, serves run and analytics
endpoints, protects filesystem access with safe path resolution, and mounts
'dashboard/dist' when it exists. The backend is unauthenticated by default
and is intended to bind to loopback for local use.

### Dashboard and desktop

The dashboard polls run, live-run, trend, release, version, and health
endpoints. Its navigation is implemented in 'dashboard/src/App.jsx' and
lazy-loads page components. Electron starts the same backend or attaches to an
existing one; its preload bridge gates Workbench writes with a desktop token.

## Persistence model

A run has two coupled representations:

1. A database record containing identity, status, progress, metrics, signoff
   fields, experiment metadata, failures, and comparison data.
2. A run directory containing logs, reports, results, artifacts, checkpoints,
   telemetry, run_summary.md, reproducibility.json, and an artifact manifest.

The database is the index and query surface. The run directory is the evidence
and reproducibility surface. Do not treat a database status alone as proof of
signoff; inspect the evidence files and signoff gate.

## Data classification

| Data | Local behavior |
|---|---|
| RTL, constraints, netlists, DEF/LEF, GDS | Used by the flow; excluded from sanitized telemetry uploads |
| Metrics and stage outcomes | Written to local run telemetry; upload depends on telemetry mode |
| Logs and reports | Stored under the run directory; support bundles redact common secrets and paths |
| Failure signatures and remediation | Stored in Failure Atlas records and repository data |
| AI prompts/results | Optional experimental investigation path; review before sharing |
| Cloud data | Only used when corresponding provider/configuration is explicitly enabled |

## Architectural constraints

- Real signoff depends on external tools and valid evidence.
- Mock mode and generated layout images are intentionally non-signoff data.
- The backend has no built-in authentication layer; network exposure needs an
  external access-control boundary.
- Several advanced analytics, synthetic-data, community, and migration modules
  are present but require additional configuration and are not part of the
  beginner path.
