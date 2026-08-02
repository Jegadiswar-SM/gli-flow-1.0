# Execution flow

## Stage order

The current 'FlowOrchestrator.STAGES' list contains these 29 stages, in order:

1. INITIALIZING
2. SYNTHESIS
3. PACKAGING
4. HIERARCHICAL_PARTITIONING
5. BLOCK_SYNTHESIS
6. CLOCK_GATING
7. SCAN_INSERTION
8. FORMAL_VERIFICATION
9. FLOORPLANNING
10. TOP_FLOORPLANNING
11. PLACEMENT
12. CTS
13. ROUTING
14. PRO
15. ANTENNA_CHECK
16. FILL
17. DECAP
18. POWER
19. EM_CHECK
20. DENSITY_CHECK
21. YIELD
22. ATPG
23. D2D_INTERFACE_CHECK
24. QOR_EXTRACTION
25. DRC
26. LVS
27. TIMING_ANALYSIS
28. SI_ANALYSIS
29. SIGN_OFF
Some stages are directly implemented in the OpenROAD adapter and some are
dispatched through optional stage methods. When an adapter lacks an optional
stage, the orchestrator records the skip and continues in normal development
mode; certification mode treats stage errors as blocking.

## Run lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> INITIALIZING
    INITIALIZING --> RUNNING
    RUNNING --> CHECKPOINTED: stage completed
    CHECKPOINTED --> RUNNING: next stage
    RUNNING --> FAILED: exception, timeout, OOM, or required-stage failure
    RUNNING --> DONE: all stages processed
    FAILED --> [*]
    DONE --> [*]
~~~

For each stage the orchestrator records an event in
'stage_execution.jsonl', updates progress in the database, and writes a
checkpoint containing output paths, sizes, and SHA-256 digests. A resumed run
copies the prior run's non-checkpoint evidence, verifies that enough prior
checkpoints exist, and starts at the requested stage.

## Manifest resolution

A run requires a design directory and 'gli_manifest.yaml'. The orchestrator:

1. Loads YAML.
2. Resolves relative RTL, SDC, and constraint paths relative to the manifest
   directory.
3. Auto-discovers RTL files when 'rtl_files' is absent.
4. Uses 'top_module' from the manifest or the detected top module.
5. Selects 'backend' (default 'openroad'), 'pdk' (default 'sky130'), and
   optional 'pdk_variant'.
6. Resolves manifest corners or the PDK's default corners.
7. Applies CLI/environment/config resource values such as threads, memory,
   PDK root, and ORFS root.

The canonical minimal manifest is:

~~~yaml
design_name: counter
rtl_files:
  - counter.v
top_module: counter
backend: openroad
pdk: sky130
pdk_variant: sky130A
clock_port: clk
clock_period_ns: 10.0
constraints:
  - counter.sdc
~~~

Paths in a manifest should be relative to the manifest file. Existing built-in
examples sometimes retain repository-root-relative paths for compatibility; the
normalizer resolves those when they exist.

## Metrics and signoff

The telemetry parser reads reports in the run's reports/ directory and
updates WNS, TNS, hold timing, utilization, cell count, runtime, power, and
DRC/LVS fields when evidence exists. QoR is computed from available timing,
utilization, runtime, cell-count, DRC, LVS, and signoff-completion inputs.

The signoff gate requires evidence for synthesis, final GDS/DEF/netlist,
setup/hold timing, Magic and KLayout DRC, antenna, density, LVS, EM, SI, power,
and formal verification. Missing or NOT_RUN checks are not treated as passes.
A mock run explicitly records execution_mode=mock and
metric_quality=simulated_placeholder; it cannot conclude tapeout readiness.

## Failure handling

The orchestrator classifies failures from metrics and logs, creates Failure
Atlas entries with evidence and detection classification, writes root-cause
information into the run summary, and persists remediation candidates. Common
failure classes include timing violations, routing overflow, DRC/LVS issues,
tool discovery problems, resource exhaustion, and missing artifacts.

Subprocess execution applies timeouts and optional address-space limits. Timeout
and OOM conditions are represented as stage errors rather than silently
reported as successful runs.

## Evidence layout

A typical run directory contains:

~~~text
<run-dir>/
├── artifacts/                 Copied or generated final artifacts
├── checkpoints/               Per-stage JSON checkpoint manifests
├── logs/                      Tool and stage logs
├── reports/                   Parsed and raw reports
├── results/                   Tool results when the backend uses this layout
├── telemetry/                 Local metrics and stage JSON
├── config.json                Resolved run configuration
├── stage_execution.jsonl      Stage start/reuse events
├── artifact_manifest.json     Artifact paths, sizes, and hashes
├── reproducibility.json       Environment and run provenance
└── run_summary.md             Human-readable final summary
~~~

The exact artifact set depends on the backend, installed tools, PDK, and point
at which a run stops.
