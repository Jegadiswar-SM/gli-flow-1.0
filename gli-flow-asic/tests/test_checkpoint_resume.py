import json
from pathlib import Path


def test_mock_resume_reuses_prior_stage_outputs_and_skips_earlier_stages(tmp_path, monkeypatch):
    from gli_flow.core.orchestrator import FlowOrchestrator, STAGES

    monkeypatch.chdir(tmp_path)
    design = Path(__file__).resolve().parents[1] / "examples" / "tiny_or"
    db_path = tmp_path / "runs.db"

    original = FlowOrchestrator(design_path=str(design), mock=True, db_path=str(db_path))
    original_record = original.run()
    source_artifact = original.run_dir / "reports" / "partition_log.txt"
    source_bytes = source_artifact.read_bytes()

    resumed = FlowOrchestrator(
        design_path=str(design),
        mock=True,
        db_path=str(db_path),
        resumed_from=original_record.run_id,
        resume_stage="CLOCK_GATING",
        resume_source_dir=str(original.run_dir),
    )
    resumed_record = resumed.run()

    assert resumed_record.status == "SUCCESS"
    assert (resumed.run_dir / "reports" / "partition_log.txt").read_bytes() == source_bytes
    events = [json.loads(line) for line in (resumed.run_dir / "stage_execution.jsonl").read_text().splitlines()]
    assert [e["stage"] for e in events[:5]] == STAGES[:5]
    assert all(e["action"] == "reused_checkpoint" for e in events[:5])
    assert events[5]["stage"] == "CLOCK_GATING"
    assert events[5]["action"] == "executed"
    assert all(e["action"] == "executed" for e in events[5:])
    checkpoints = list((resumed.run_dir / "checkpoints").glob("*.json"))
    assert len(checkpoints) == len(STAGES) - 5
