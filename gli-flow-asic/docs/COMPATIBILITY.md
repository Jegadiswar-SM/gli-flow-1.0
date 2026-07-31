# Compatibility matrix

| Component | Supported baseline |
|---|---|
| GLI-FLOW | `v1.1.0-beta` (from `gli_flow/version.py`) |
| Python | 3.9–3.12 |
| Ubuntu/WSL2 | Ubuntu 22.04 or 24.04; WSL2 recommended on Windows |
| Node/npm | Node 24.18.0 / npm 11.16.0 (`dashboard/.nvmrc`) |
| Dashboard Python | See `constraints/dashboard-py312.txt` |
| PDK | sky130 baseline; pin the exact Volare/PDK commit in a project manifest for real runs |
| EDA tools | OpenROAD, Yosys, Magic, Netgen, KLayout; versions are reported by `gli-flow doctor` |

The mock path does not require EDA tools and cannot establish signoff. Real
tool completion is not the same as signoff; required artifacts, parsed evidence,
functional verification, and an explicit checklist are required for any ready claim.
