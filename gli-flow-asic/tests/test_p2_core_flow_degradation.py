import os
import subprocess
import sys


def _run(*args, env):
    return subprocess.run([sys.executable, "-m", "gli_flow.cli.main", *args], env=env, text=True, capture_output=True, timeout=60)


def test_core_commands_degrade_without_optional_services(tmp_path):
    env = os.environ.copy()
    env.update({"GLI_FLOW_CONFIG_DIR": str(tmp_path / "config"), "GLI_FLOW_DB": str(tmp_path / "runs.db")})
    for key in ("BHARATCODE_API_KEY", "GLI_SERVER_URL", "GLI_API_KEY"):
        env.pop(key, None)
    validate = _run("validate", "examples/counter", env=env)
    doctor = _run("doctor", "--for", "mock", env=env)
    mock_run = _run("run", "examples/counter", "--mock", "--non-interactive", env=env)
    assert validate.returncode == 0, validate.stdout + validate.stderr
    assert doctor.returncode == 0, doctor.stdout + doctor.stderr
    assert mock_run.returncode == 0, mock_run.stdout + mock_run.stderr
    assert "Traceback" not in (validate.stdout + validate.stderr + doctor.stdout + doctor.stderr + mock_run.stdout + mock_run.stderr)
