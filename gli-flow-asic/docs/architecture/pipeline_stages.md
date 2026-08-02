# Pipeline Stages

The current orchestrator processes 30 ordered stages. The exact list and
resume/checkpoint behavior are maintained in [Execution flow](execution-flow.md).
The major groups are:

1. **Synthesis** (Yosys) — Verilog to gate-level netlist
2. **Floorplanning** — die area, I/O pin placement
3. **Placement** — standard cell placement
4. **CTS** (Clock Tree Synthesis) — build the clock distribution network
5. **Routing** — connect all cells with metal wires
6. **DRC** (Design Rule Check) — verify the layout against foundry rules (Magic + KLayout)
7. **LVS** (Layout vs. Schematic) — verify the layout matches the original design
8. **STA** (Static Timing Analysis) — verify all paths meet timing constraints (OpenSTA)
9. **GDS Export** — final layout file for tapeout

Stages are processed in orchestrator order. Some optional stage methods may be
skipped when the selected adapter does not implement them; certification mode
turns stage errors into blocking failures. Each stage updates the database,
event log, and checkpoint evidence where applicable.
