import json
import os
import shutil
import subprocess
import tempfile

import pytest

_EDA_TOOLS = ("sv2v", "yosys", "openroad", "magic", "netgen", "netgen-lvs", "klayout")


def pytest_addoption(parser):
    parser.addoption(
        "--all",
        action="store_true",
        default=False,
        help="run environment-gated tests instead of auto-skipping them",
    )


def _have_eda_tools() -> bool:
    return all(shutil.which(tool) is not None for tool in _EDA_TOOLS)


def _have_functional_magic() -> bool:
    """Return whether the Magic paths used by the real-tool tests work."""
    try:
        from gli_flow.core.tool_discovery import (
            discover_magic_binaries,
            validate_magic_candidate,
        )

        for candidate in discover_magic_binaries():
            report = validate_magic_candidate(candidate)
            if report.passed and candidate.path == "/usr/bin/magic":
                return os.path.isfile("/usr/lib/x86_64-linux-gnu/magic/tcl/magicdnull")
    except Exception:
        return False
    return False


def _network_available() -> bool:
    import socket
    try:
        socket.create_connection(("pypi.org", 443), timeout=3).close()
        return True
    except OSError:
        return False


def _home_writable() -> bool:
    return os.access(os.path.expanduser("~"), os.W_OK)


def _can_sudo() -> bool:
    try:
        result = subprocess.run(["sudo", "-n", "true"], capture_output=True, timeout=10)
        return result.returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def _atlas_db_populated() -> bool:
    try:
        import sqlite3
        from gli_flow.database.migrations import _get_db_path
        db = _get_db_path()
        if not os.path.exists(db):
            return False
        conn = sqlite3.connect(db)
        try:
            row = conn.execute(
                "SELECT COUNT(*) FROM failure_atlas_entries "
                "WHERE detection_classification IN ('VERIFIED', 'HEURISTIC')"
            ).fetchone()
            classifications = conn.execute(
                "SELECT DISTINCT detection_classification FROM failure_atlas_entries"
            ).fetchall()
        finally:
            conn.close()
        present = {item[0] for item in classifications}
        return bool(row and row[0] > 0 and {"VERIFIED", "HEURISTIC"}.issubset(present))
    except Exception:
        return False


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_setup(item):
    """Skip environment-gated tests with a visible reason when the sandbox
    cannot satisfy their requirements. Explicit `pytest -m ""` runs still
    collect them; the skip applies only when the environment truly lacks
    support (e.g. missing EDA tools, blocked network, unwritable HOME, no
    passwordless sudo, or an empty failure-atlas database)."""
    if item.config.getoption("--all"):
        return
    if item.get_closest_marker("requires_tools") and not _have_eda_tools():
        pytest.skip("requires real EDA tools (sv2v, yosys, openroad, magic, netgen, klayout)")
    if item.get_closest_marker("requires_functional_magic") and not _have_functional_magic():
        pytest.skip("requires a functional Magic binary at /usr/bin/magic and magicdnull")
    if item.get_closest_marker("requires_network") and not _network_available():
        pytest.skip("requires outbound network access")
    if item.get_closest_marker("requires_writable_home") and not _home_writable():
        pytest.skip("requires a writable $HOME directory")
    if item.get_closest_marker("requires_system_mutation") and not _can_sudo():
        pytest.skip("requires passwordless sudo (runs real system installs via apt/npm)")
    if item.get_closest_marker("requires_db_data") and not _atlas_db_populated():
        pytest.skip("requires a populated failure-atlas database (VERIFIED/HEURISTIC entries)")


@pytest.fixture
def sample_orfs_report():
    return {
        "wns": -0.12,
        "tns": -3.45,
        "utilization": 45.2,
        "cell_count": 4231,
        "runtime_sec": 89.0,
    }


@pytest.fixture
def temp_run_dir():
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
def sample_signatures():
    return [
        {
            "atlas_id": "SYNTH-0001",
            "category": "synthesis",
            "severity": "critical",
            "trigger_conditions": {"log_pattern": "ERROR: Unsupported RTL construct"},
            "observed_signature": "Unsupported RTL construct",
            "confirmed_by_runs": ["run_001"],
            "pdk": "sky130hd",
            "backend": "yosys",
            "remediation": "Use supported Verilog constructs",
            "confidence": 0.95,
            "public": True,
        }
    ]
