import tempfile
import json
from pathlib import Path

from gli_flow.provenance.manifest import generate_reproducibility_manifest


def test_manifest_generates_json():
    with tempfile.TemporaryDirectory() as tmp:
        run_dir = Path(tmp) / "run_001"
        result = generate_reproducibility_manifest(
            run_id="test-run",
            design_name="test",
            metrics={"wns": -0.1, "tns": -1.0, "utilization": 50},
            manifest_data={
                "rtl_files": [],
                "constraints": [],
                "pdk": "sky130hd",
            },
            run_dir=str(run_dir),
        )
        assert result.endswith("reproducibility.json")
        output = Path(result)
        assert output.exists()


def test_manifest_contains_expected_fields():
    with tempfile.TemporaryDirectory() as tmp:
        run_dir = Path(tmp) / "run_002"
        result_path = generate_reproducibility_manifest(
            run_id="test-002",
            design_name="systolic_array",
            metrics={"wns": 0.0},
            manifest_data={
                "rtl_files": [],
                "constraints": [],
                "pdk": "sky130hd",
                "config_path": None,
            },
            run_dir=str(run_dir),
        )
        import json
        with open(result_path) as f:
            manifest = json.load(f)
        assert manifest["manifest_version"] == "2.0"
        assert manifest["design_name"] == "systolic_array"
        assert manifest["run_id"] == "test-002"


def test_mock_run_persists_provenance_and_rejects_real_display(tmp_path, monkeypatch):
    from gli_flow.core.orchestrator import FlowOrchestrator
    from gli_flow.provenance.manifest import real_result_display_allowed

    monkeypatch.chdir(tmp_path)
    design = Path(__file__).resolve().parents[1] / "examples" / "tiny_or"
    orchestrator = FlowOrchestrator(
        design_path=str(design), mock=True, db_path=str(tmp_path / "runs.db")
    )
    record = orchestrator.run()

    manifest = json.loads((orchestrator.run_dir / "reproducibility.json").read_text())
    fingerprint = json.loads((orchestrator.run_dir / "run_environment.json").read_text())
    provenance = manifest["provenance"]
    execution = manifest["execution"]

    assert manifest["run_id"] == record.run_id
    assert provenance["tool_commands"]["python"] == ["python3", "--version"]
    assert "commit" in provenance["pdk"]
    assert provenance["artifact_hashes"]
    assert len(fingerprint["fingerprint_id"]) == 64
    assert execution["mode"] == "mock"
    assert execution["metric_source"] == "mock_adapter"
    assert real_result_display_allowed(str(orchestrator.run_dir)) is False
