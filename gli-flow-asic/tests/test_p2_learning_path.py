from gli_flow.core.orchestrator import FlowOrchestrator
from gli_flow.database.sqlite import DatabaseManager


def test_learning_path_mock_sequence_creates_isolated_labeled_runs(tmp_path):
    db_path = tmp_path / "learning.db"
    steps = ("counter", "gcd", "uart", "user_rtl")
    examples = ("counter", "gcd", "uart", "tiny_or")
    run_ids = []
    for step, design in zip(steps, examples):
        record = FlowOrchestrator(
            f"examples/{design}", mock=True, db_path=str(db_path),
            is_experiment=True, experiment_metadata={"learning_step": step},
        ).run()
        run_ids.append(record.run_id)
    assert len(set(run_ids)) == 4
    db = DatabaseManager(str(db_path))
    rows = db._provider.fetchall("SELECT run_id, is_experiment, experiment_metadata FROM runs")
    assert {row["run_id"] for row in rows} == set(run_ids)
    assert all(row["is_experiment"] == 1 for row in rows)
    assert {row["experiment_metadata"][0:1] for row in rows} == {"{"}
    db.close()
