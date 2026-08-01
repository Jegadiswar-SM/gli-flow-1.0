#!/bin/sh
cd /home/bolter/tapeitout/gli-flow-v1.0/gli-flow-asic || exit 1
echo "=== tests referencing verdicts ==="
grep -rn -E "FINAL_VERDICT|Readiness|BLOCKED|READY_FOR_MOCK|READY_FOR_REAL_FLOW" --include=*.py tests/ | head -40
echo "=== tests referencing doctor/dashboard health ==="
grep -rn -E "dashboard.*health|_check_dashboard_health|--for dashboard|--for" --include=*.py tests/ | head -20
