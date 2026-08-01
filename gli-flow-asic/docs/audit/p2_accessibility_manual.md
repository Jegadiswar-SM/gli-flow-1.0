# P2 accessibility and information-architecture pass

This repository uses a documented manual pass rather than adding a browser-only
axe dependency to the production bundle. The checked surfaces are:

| Surface | Keyboard/focus | Responsive | Contrast | Empty/action states | Icon labels |
| --- | --- | --- | --- | --- | --- |
| Home | checked | checked | checked | checked | checked |
| Learning Path | checked | checked | checked | checked | checked |
| Compare Runs | checked | checked | checked | checked | checked |
| Run Design / Monitor | checked | checked | checked | checked | checked |
| Runs / Artifacts / Failure Atlas | checked | checked | checked | checked | checked |
| Provenance / Validation / Infrastructure | checked | checked | checked | checked | checked |
| Telemetry / Settings / Help | checked | checked | checked | checked | checked |

The global stylesheet provides visible `:focus-visible` outlines and a narrow
viewport rule. New list and chart surfaces provide a working next action when
empty. The home page exposes next action, environment readiness, and recent
change, while the learning and comparison pages are in the primary execution
navigation. Remaining advanced capabilities stay in their existing secondary
groups.
