# Configuration reference

GLI-FLOW has two related configuration mechanisms:

1. The general configuration module resolves built-in defaults, user config,
   project config, and GLI_FLOW_* environment overrides.
2. The CLI/installer and telemetry helpers maintain operational files under the
   user configuration directories.

When behavior appears inconsistent, inspect the effective values with the
relevant command and check both the project manifest and user configuration.

## Precedence

For general configuration, later sources override earlier sources:

1. Built-in values in 'gli_flow/config/defaults.py'.
2. User config: '~/.gli-flow/config.yaml' or the legacy
   '~/.gli-flow/config.json'.
3. Project config: '.gli-flow/config.yaml' or 'gli_manifest.yaml' in the
   selected project directory.
4. Environment variables listed below.
5. Explicit CLI flags override the corresponding runtime value.

The installer workspace also writes a user config under '~/.gli-flow'. Keep
machine-specific paths out of source-controlled manifests.

## General configuration keys

| Key | Default | Environment override | Meaning |
|---|---|---|---|
| pdk_root | '~/.gli-flow/pdk' | GLI_FLOW_PDK_ROOT or PDK_ROOT | PDK installation root |
| pdk | sky130A | project manifest | PDK identity |
| workspace | '~/gli-flow-workspace' | GLI_FLOW_WORKSPACE | Workspace convention |
| db_path | '~/.gli-flow/gli_flow.db' | GLI_FLOW_DB_PATH or GLI_FLOW_DB | Local database path |
| telemetry | on | GLI_FLOW_TELEMETRY | Local telemetry collection setting |
| orfs_root | '~/.gli-flow/orfs' | GLI_FLOW_ORFS_ROOT or ORFS_ROOT | OpenROAD-flow-scripts root |
| log_level | INFO | GLI_FLOW_LOG_LEVEL | Logging threshold |
| log_dir | '~/.gli-flow/logs' | GLI_FLOW_LOG_DIR | Log directory |
| backend_port | 8000 | GLI_FLOW_BACKEND_PORT | Backend listen port |
| max_threads | CPU count | manifest/CLI | Resource default |
| memory_limit_mb | 8192 | CLI/manifest | Optional stage memory limit |
| timeout_seconds | 7200 | CLI/manifest | Stage timeout convention |

The actual flow also accepts direct PDK and ORFS variables because the adapters
and provenance code use them directly. If both a direct variable and a config
value exist, the direct environment variable is preferred by the relevant
component.

## Runtime and manifest fields

A design manifest is YAML. Common fields are:

- 'design_name'
- 'rtl_files'
- 'top_module'
- 'backend' — 'openroad' or the alternate LibreLane path
- 'pdk' and optional 'pdk_variant'
- 'clock_port' and 'clock_period_ns'
- 'constraints' or 'sdc_file'
- 'threads' and 'memory_mb'
- 'corners'
- optional design-specific 'parameters'

See the manifests under 'examples/*/gli_manifest.yaml' and
[Execution flow](../architecture/execution-flow.md). Relative paths should be
relative to the manifest file.

## Database provider selection

'gli_flow.database.factory.create_provider' selects providers in this order:

- If 'DATABASE_URL' starts with 'postgresql', use PostgreSQL. Install a
  compatible psycopg package separately; it is not a default package dependency.
- If no explicit database path is passed and both 'SUPABASE_API_TOKEN' and
  'SUPABASE_PROJECT_REF' are set, use the Supabase API provider.
- Otherwise use SQLite.

For local development, do not set remote provider variables unless you are
intentionally testing that integration. Supabase is not required by the core
flow.

## Telemetry settings

Telemetry settings are stored in
'GLI_FLOW_CONFIG_DIR/telemetry_settings.json' when GLI_FLOW_CONFIG_DIR is
set, otherwise under '$XDG_CONFIG_HOME/gli-flow/telemetry_settings.json' or
'~/.config/gli-flow/telemetry_settings.json'.

Modes are:

| Mode | Local collection | Upload |
|---|---:|---:|
| full | yes | yes, after explicit consent |
| atlas | failure events | yes, after explicit consent |
| local | yes | no |
| disabled | no | no |

Fresh settings default to local. Use:

~~~bash
gli-flow telemetry status
gli-flow telemetry mode local
gli-flow telemetry mode full
gli-flow telemetry mode atlas
gli-flow telemetry mode disabled
gli-flow telemetry preview
~~~

Review [Telemetry and privacy](../privacy/telemetry_and_privacy.md) before
enabling an upload mode.

## Backend and dashboard variables

| Variable | Used by | Meaning |
|---|---|---|
| GLI_FLOW_BACKEND_PORT | CLI dashboard | Backend port; default 8000 |
| GLI_FLOW_DASHBOARD_PORT | CLI dashboard | Vite port; default 5173 |
| CORS_ORIGINS | FastAPI | Comma-separated allowed origins |
| GLI_FLOW_DESIGN_ROOTS | FastAPI | OS-separated roots allowed for filesystem browsing |
| GLI_FLOW_DB | Backend and CLI | Explicit database path |
| GLI_FLOW_DB_PATH | Config/dashboard settings | Database path |
| GLI_FLOW_LOG_DIR | CLI/support bundles | Additional log directory |
| GLI_FLOW_CONFIG_DIR | Telemetry and CLI config | Configuration directory override |
| VITE_API_URL | React build/runtime | API base URL; empty means same origin |
| VITE_POLL_INTERVAL | React | Poll interval in milliseconds; default 2000 |

The backend binds to 127.0.0.1 when started by the CLI. It is not an
authenticated public API.

## AI and cloud variables

- 'BHARATCODE_API_KEY' — optional key for the experimental investigation
  provider. Placeholder values are rejected.
- 'GLI_SERVER_URL' and 'GLI_API_KEY' — optional Failure Atlas/telemetry service
  settings.
- 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', region, bucket configuration —
  used by the optional S3 cloud provider.
- Google Cloud credentials — used by the optional GCS provider.
- 'GLI_ENCRYPTION_SECRET' and 'GLI_KMS_KEY_ID' — security integration variables
  used by file protection/cloud paths.

Do not put secrets in manifests, support bundles, or committed config files.

## Desktop variables

| Variable | Meaning |
|---|---|
| GLI_FLOW_PROJECT_ROOT | Electron backend working directory |
| GLI_FLOW_PYTHON | Python interpreter Electron should spawn |
| GLI_FLOW_BACKEND_PORT | Backend port |
| GLI_FLOW_DESKTOP_WRITE_TOKEN | Token used by the Electron Workbench write bridge |
| PYTHON | Fallback interpreter if GLI_FLOW_PYTHON is absent |

Use an absolute GLI_FLOW_PYTHON path. Relative interpreter paths can fail when
Electron spawns the backend.

