from fastapi.testclient import TestClient

from backend import server
from backend.server import app


def test_version_and_workbench_filesystem_api():
    client = TestClient(app)
    version = client.get("/version")
    assert version.status_code == 200
    assert version.json()["version"].startswith("v")
    tree = client.get("/api/fs/tree", params={"path": "examples/counter"})
    assert tree.status_code == 200
    assert any(item["name"] == "counter.v" for item in tree.json()["children"])
    source = client.get("/api/fs/file", params={"path": "examples/counter/counter.v"})
    assert source.status_code == 200
    assert "module" in source.json()["content"]


def test_workbench_write_requires_desktop_token():
    client = TestClient(app)
    response = client.post("/api/fs/file", json={"path": "examples/counter/counter.v", "content": "module counter; endmodule"})
    assert response.status_code == 403


def test_workbench_tool_access_requires_desktop_token():
    client = TestClient(app)
    response = client.post("/api/tools/run", json={"tool": "yosys"})
    assert response.status_code == 403


def test_workbench_file_operations_are_token_gated_and_safe(tmp_path, monkeypatch):
    design_root = tmp_path / "design"
    design_root.mkdir()
    (design_root / "top.v").write_text("module top;\nendmodule\n")
    monkeypatch.setattr(server, "_DESIGN_ROOTS", [design_root.resolve()])
    monkeypatch.setenv("GLI_FLOW_DESKTOP_WRITE_TOKEN", "test-token")
    client = TestClient(app)
    headers = {"X-GLI-FLOW-DESKTOP-TOKEN": "test-token"}

    denied = client.post("/api/fs/create", json={"path": str(design_root / "denied.v"), "type": "file"})
    assert denied.status_code == 403

    created = client.post("/api/fs/create", headers=headers, json={"path": str(design_root / "rtl"), "type": "directory"})
    assert created.status_code == 200
    created_file = client.post("/api/fs/create", headers=headers, json={"path": str(design_root / "rtl" / "child.sv"), "type": "file", "content": "module child; endmodule"})
    assert created_file.status_code == 200
    search = client.get("/api/fs/search", params={"path": str(design_root), "q": "child"})
    assert search.status_code == 200
    assert search.json()["results"][0]["line"] == 1

    renamed = client.post("/api/fs/move", headers=headers, json={"path": str(design_root / "rtl" / "child.sv"), "new_path": str(design_root / "rtl" / "renamed.sv")})
    assert renamed.status_code == 200
    deleted = client.post("/api/fs/delete", headers=headers, json={"path": str(design_root / "rtl" / "renamed.sv")})
    assert deleted.status_code == 200
    assert not (design_root / "rtl" / "renamed.sv").exists()
