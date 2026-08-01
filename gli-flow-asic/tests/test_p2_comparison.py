import json
from pathlib import Path

from backend.server import _comparison_record


def test_comparison_record_preserves_simulated_metric_label(tmp_path):
    run_dir = tmp_path / "run"
    run_dir.mkdir()
    (run_dir / "reproducibility.json").write_text(json.dumps({"mode": "mock", "metric_quality": "simulated_placeholder"}))
    result = _comparison_record({"run_id": "mock-1", "design_name": "counter", "run_dir": str(run_dir), "wns": 0.0, "utilization": 25, "runtime_sec": 1.2})
    assert result["mode"] == "mock"
    assert result["metric_quality"] == "simulated_placeholder"
    assert result["values"]["timing_slack"] == 0.0


def test_comparison_record_does_not_invent_signoff_metrics():
    result = _comparison_record({"run_id": "mock-2", "design_name": "counter", "run_dir": "", "wns": None})
    assert result["values"]["power"] is None
    assert result["values"]["drc"] is None
