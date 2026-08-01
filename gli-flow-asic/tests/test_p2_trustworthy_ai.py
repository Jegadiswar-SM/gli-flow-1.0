from gli_flow.investigation.context_builder import InvestigationContextBuilder
from gli_flow.investigation.investigator import InvestigationLayer


def test_failure_atlas_context_is_local_and_sanitized(tmp_path, monkeypatch):
    (tmp_path / "reports").mkdir()
    (tmp_path / "reports" / "metrics.csv").write_text("wns,runtime_sec\n-0.1,2\n")
    (tmp_path / "rtl.v").write_text("module secret_ip; endmodule")
    monkeypatch.setattr("socket.create_connection", lambda *args, **kwargs: (_ for _ in ()).throw(OSError("network disabled")))
    context, payload = InvestigationContextBuilder(str(tmp_path)).build_for_api()
    assert "WNS" in payload
    assert "secret_ip" not in payload
    assert context["run_id"] == tmp_path.name


def test_ai_preview_contains_exact_sanitized_payload_and_provider(tmp_path):
    layer = InvestigationLayer(str(tmp_path), "run-preview")
    preview = layer.preview_payload()
    assert preview["sanitized"] is True
    assert preview["provider"]
    assert preview["payload"]["context"] == preview["payload"]["context"]
