import time
import urllib.request


def test_dashboard_health_failure_explains_alive_backend(monkeypatch):
    """An alive server plus unreachable localhost is a sandbox block, not a startup failure."""
    from gli_flow.cli import smoke_test

    class AliveProcess:
        def poll(self):
            return None

        def terminate(self):
            pass

        def wait(self, timeout=None):
            pass

    process = AliveProcess()
    monkeypatch.setattr(smoke_test.subprocess, "Popen", lambda *args, **kwargs: process)
    monkeypatch.setattr(urllib.request, "urlopen", lambda *args, **kwargs: (_ for _ in ()).throw(OSError("blocked")))
    monkeypatch.setattr(time, "sleep", lambda _: None)

    ok, detail = smoke_test._check_dashboard_health()

    assert not ok
    assert "network-restricted sandbox" in detail
    assert "backend process is still alive" in detail


def test_dashboard_health_failure_explains_process_exit(monkeypatch):
    from gli_flow.cli import smoke_test

    class ExitedProcess:
        def poll(self):
            return 1

        def communicate(self, timeout=None):
            return "", "ModuleNotFoundError: backend"

        def terminate(self):
            pass

    process = ExitedProcess()
    monkeypatch.setattr(smoke_test.subprocess, "Popen", lambda *args, **kwargs: process)
    monkeypatch.setattr(urllib.request, "urlopen", lambda *args, **kwargs: (_ for _ in ()).throw(OSError("refused")))

    ok, detail = smoke_test._check_dashboard_health()

    assert not ok
    assert "Backend failed to start" in detail
    assert "ModuleNotFoundError" in detail
