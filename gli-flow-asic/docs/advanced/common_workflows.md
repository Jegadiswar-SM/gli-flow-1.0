# Common Workflows

## First-Time Setup
```bash
curl -fsSL https://raw.githubusercontent.com/Jegadiswar-SM/gli-flow-1.0/main/gli-flow-asic/scripts/install.sh | bash
# Activate the environment using the command printed by the installer.
gli-flow quickstart
gli-flow run --example counter --mock --non-interactive
```

## Run a Custom Design
```bash
mkdir my_design
# Add RTL files and gli_manifest.yaml
gli-flow run my_design --mock      # Validate first
gli-flow run my_design              # Real run
```

## Investigate a Failure
```bash
gli-flow history                    # Find the run ID
gli-flow diagnose <run_id>          # Automated analysis
gli-flow dashboard                  # Visual investigation
```

## Reset Database
```bash
gli-flow reset-runs                 # Clear all run data
```
