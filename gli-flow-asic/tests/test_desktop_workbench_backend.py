from fastapi.testclient import TestClient

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
