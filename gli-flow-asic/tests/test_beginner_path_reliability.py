import logging
import os
import subprocess
import sys

from gli_flow.core import logging as flow_logging
from gli_flow.telemetry.settings import TelemetryMode, get_telemetry_settings


def _reset_logging():
    flow_logging._initialized = False
    flow_logging._warning_emitted = False
    flow_logging._added_run_dirs.clear()
    logging.getLogger().handlers.clear()


def test_help_is_side_effect_free_with_unwritable_home(tmp_path):
    home = tmp_path / "readonly-home"
    home.mkdir()
    home.chmod(0o555)
    result = subprocess.run(
        [sys.executable, "-m", "gli_flow", "--help"],
        env={**os.environ, "HOME": str(home)},
        capture_output=True,
        text=True,
        timeout=10,
    )
    assert result.returncode == 0
    assert "usage: gli-flow" in result.stdout
    assert "Traceback" not in result.stderr


def test_logging_falls_back_for_invalid_log_path(tmp_path, monkeypatch, capsys):
    invalid = tmp_path / "not-a-directory"
    invalid.write_text("occupied")
    monkeypatch.setenv("GLI_FLOW_LOG_DIR", str(invalid / "logs"))
    _reset_logging()
    flow_logging.setup_logging()
    logging.getLogger("test").info("stderr fallback works")
    captured = capsys.readouterr()
    assert "file logging unavailable" in captured.err
    assert "stderr fallback works" in captured.err


def test_default_telemetry_is_local_and_persisted(tmp_path, monkeypatch):
    monkeypatch.setenv("GLI_FLOW_CONFIG_DIR", str(tmp_path))
    settings = get_telemetry_settings()
    assert settings.mode == TelemetryMode.LOCAL
    assert settings.consent_given is False
    assert settings.is_wizard_required() is False
    from gli_flow.telemetry.uploader import TelemetryUploader
    assert TelemetryUploader(db_path=str(tmp_path / "runs.db")).should_upload() is False
    settings.consent_given = True
    settings.save()
    assert get_telemetry_settings().mode == TelemetryMode.LOCAL


def test_local_telemetry_never_calls_http(tmp_path, monkeypatch):
    monkeypatch.setenv("GLI_FLOW_CONFIG_DIR", str(tmp_path / "config"))
    settings = get_telemetry_settings()
    settings.mode = TelemetryMode.LOCAL
    settings.consent_given = True
    settings.save()
    from gli_flow.telemetry.uploader import TelemetryUploader
    called = []
    monkeypatch.setattr("httpx.Client.post", lambda *a, **k: called.append(1))
    TelemetryUploader(db_path=str(tmp_path / "runs.db")).upload_run_telemetry("run-local")
    assert called == []


def test_mock_summary_has_no_signoff_claim():
    from gli_flow.cli.output import print_achievement_summary
    from gli_flow.models.execution_record import ExecutionRecord
    from io import StringIO
    from contextlib import redirect_stdout
    record = ExecutionRecord("run_mock", "counter", "Mock/sky130", "SUCCESS", "DONE", execution_mode="mock")
    output = StringIO()
    with redirect_stdout(output):
        print_achievement_summary(record)
    rendered = output.getvalue()
    assert "SIMULATED/DEMO" in rendered
    assert "Tapeout Ready: YES" not in rendered
    assert "Signoff: PASS" not in rendered


def test_manifest_paths_are_resolved_from_design_directory(tmp_path, monkeypatch):
    design = tmp_path / "design"
    (design / "rtl").mkdir(parents=True)
    (design / "rtl" / "top.sv").write_text("module top; endmodule\n")
    (design / "gli_manifest.yaml").write_text(
        "design_name: top\nrtl_files: [rtl/top.sv]\ntop_module: top\n"
        "backend: openroad\nrun_mode: educational_demo\n"
    )
    other = tmp_path / "other"
    other.mkdir()
    monkeypatch.chdir(other)
    from gli_flow.core.orchestrator import FlowOrchestrator
    orchestrator = FlowOrchestrator.__new__(FlowOrchestrator)
    orchestrator.design_path = design
    manifest = orchestrator._read_manifest()
    assert manifest["rtl_files"] == [str((design / "rtl" / "top.sv").resolve())]
