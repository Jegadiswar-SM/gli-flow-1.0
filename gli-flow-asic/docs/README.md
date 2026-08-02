# GLI-FLOW documentation

This index is the maintained entry point for the repository documentation. The
implementation is authoritative when a document and the code disagree; report
documentation drift with the same context as a code issue.

## Start here

| Audience | Document |
|---|---|
| New Linux/WSL2 user | [Installation](INSTALL.md) and [Getting started](user_guide/getting_started.md) |
| Windows beginner | [Windows + WSL2 setup](WINDOWS_WSL2_SETUP.md) |
| Contributor | [Development guide](development.md), [Testing guide](testing.md), and [Contributing](../CONTRIBUTING.md) |
| Architecture reader | [Architecture overview](architecture/overview.md) and [Execution flow](architecture/execution-flow.md) |
| CLI user | [CLI reference](reference/cli_reference.md) |
| API/dashboard integrator | [API reference](reference/api_reference.md) and [Dashboard guide](user_guide/dashboard.md) |
| Deployment operator | [Installation](INSTALL.md), [Compatibility](COMPATIBILITY.md), and [Release readiness](release/BETA_RELEASE_READINESS.md) |

## Product guides

- [User manual](user_guide/user_manual.md)
- [Dashboard guide](user_guide/dashboard.md)
- [Known limitations](user_guide/KNOWN_LIMITATIONS.md)
- [Troubleshooting](reference/troubleshooting.md)
- [Telemetry and privacy](privacy/telemetry_and_privacy.md)
- [Desktop Workbench status](desktop_workbench_status.md)

## Engineering references

- [Configuration reference](reference/configuration.md)
- [Architecture overview](architecture/overview.md)
- [Pipeline stages](architecture/pipeline_stages.md)
- [Execution flow](architecture/execution-flow.md)
- [CLI reference](reference/cli_reference.md)
- [API reference](reference/api_reference.md)
- [Benchmark protocol](GLI_FLOW_Benchmark_Test_Protocol.md)
- [Technical specification](GLI_FLOW_Technical_Specification.md)
- [Compatibility matrix](COMPATIBILITY.md)

## Operations and governance

- [Testing guide](testing.md)
- [Security policy](../SECURITY.md)
- [Contributing](../CONTRIBUTING.md)
- [Changelog](../CHANGELOG.md)
- [Beta release readiness](release/BETA_RELEASE_READINESS.md)
- [Corrections completion record](audit/corrections_completion.md)
- [Legal terms](legal/TERMS_OF_SERVICE.md)

## Documentation organization

- architecture/ — implementation-derived system and pipeline design.
- reference/ — commands, API endpoints, configuration, and troubleshooting.
- user_guide/ — beginner and operator workflows.
- privacy/ — telemetry and data handling.
- deployment/ — hosting and migration notes.
- release/ — release gates and readiness records.
- audit/ — verification and historical engineering audits.
- archive/ — historical documents retained for traceability; they may describe
  behavior that no longer matches the current implementation.

When adding a feature, update the relevant user guide and reference page, then
add a link here. Avoid duplicating command syntax across multiple pages unless
the page is explicitly a quick-start guide.

