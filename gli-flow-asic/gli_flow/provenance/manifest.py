import hashlib
import json
import logging
import os
import platform
import subprocess
import time

from pathlib import Path

from gli_flow.core.subprocess_env import safe_env


def _hash_file(filepath):
    try:
        with open(filepath, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except (FileNotFoundError, OSError):
        return None


def _get_tool_versions(tools):
    versions = {}
    for name, cmd in tools.items():
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=10,
                env=safe_env(),
            )
            versions[name] = result.stdout.strip() or result.stderr.strip()
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
            versions[name] = None
    return versions


def _hash_run_artifacts(run_dir):
    hashes = {}
    root = Path(run_dir)
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root)
        if path.is_file() and relative.name not in {"reproducibility.json", "run_environment.json"}:
            digest = _hash_file(path)
            if digest:
                hashes[str(relative)] = digest
    return hashes


def _pdk_commit(pdk_root):
    if not pdk_root:
        return ""
    try:
        result = subprocess.run(
            ["git", "-C", pdk_root, "rev-parse", "HEAD"],
            capture_output=True, text=True, timeout=10, env=safe_env(),
        )
        return result.stdout.strip() if result.returncode == 0 else ""
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return ""


def generate_reproducibility_manifest(
    run_id,
    design_name,
    metrics,
    manifest_data,
    run_dir,
    execution_mode="real",
    metric_quality="real_evidence",
    environment_fingerprint=None,
):
    rtl_hashes = {}
    for rtl_file in manifest_data.get("rtl_files", []):
        h = _hash_file(rtl_file)
        if h:
            rtl_hashes[rtl_file] = h

    config_path = manifest_data.get("config_path")
    config_hash = _hash_file(config_path) if config_path else None

    constraints_hashes = {}
    for constraint in manifest_data.get("constraints", []):
        h = _hash_file(constraint)
        if h:
            constraints_hashes[constraint] = h

    pdk_name = manifest_data.get("pdk", "unknown")
    pdk_root = os.environ.get("PDK_ROOT", "")
    tool_commands = {
        "librelane": ["librelane", "--version"],
        "python": ["python3", "--version"],
        "yosys": ["yosys", "-V"],
        "openroad": ["openroad", "-version"],
    }

    tool_versions = _get_tool_versions(tool_commands)
    mock_execution = execution_mode == "mock"
    source_prefix = "mock_adapter" if mock_execution else "TelemetryParser"
    result_evidence = {
        metric: {
            "parser": source_prefix,
            "source_artifacts": [] if mock_execution else artifacts,
        }
        for metric, artifacts in {
            "DRC": ["drc_lvs_summary.json", "reports/magic_drc.rpt", "reports/klayout_drc.rpt"],
            "LVS": ["drc_lvs_summary.json", "reports/lvs_report.txt"],
            "STA": ["reports/timing.rpt", "reports/signoff_typical_setup.rpt"],
        }.items()
    }

    manifest = {
        "manifest_version": "2.0",
        "run_id": run_id,
        "design_name": design_name,
        "execution_id": run_id,
        "generated_at": time.time(),
        "timestamp_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "system": {
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "hostname": platform.node(),
            "os_info": f"{platform.system()} {platform.release()}",
        },
        "toolchain": tool_versions,
        "provenance": {
            "rtl_hashes": rtl_hashes,
            "constraints_hashes": constraints_hashes,
            "config_hash": config_hash,
            "pdk": {
                "name": pdk_name,
                "root": pdk_root,
                "commit": _pdk_commit(pdk_root),
            },
            "tool_commands": tool_commands,
            "artifact_hashes": _hash_run_artifacts(run_dir),
            "environment_fingerprint": environment_fingerprint or {},
        },
        "execution": {
            "reproducibility_mode": True,
            "environment_validated": True,
            "mode": execution_mode,
            "metric_quality": metric_quality,
            "metric_source": "mock_adapter" if mock_execution else "tool_output_parser",
            "real_result_display_allowed": not mock_execution,
            "reproduction_command": f"gli-flow run {design_name}",
        },
        "result_evidence": result_evidence,
        "metrics": metrics,
    }

    output_dir = Path(run_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / "reproducibility.json"
    try:
        with open(output_path, "w") as f:
            json.dump(manifest, f, indent=2)
    except OSError as e:
        logging.error("Failed to write reproducibility manifest: %s", e)

    return str(output_path)


def real_result_display_allowed(run_dir: str, metric_name: str | None = None) -> bool:
    """Return true only for this run's own parsed real-tool evidence."""
    path = Path(run_dir) / "reproducibility.json"
    try:
        manifest = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError, TypeError):
        return False
    execution = manifest.get("execution", {})
    provenance = manifest.get("provenance", {})
    if execution.get("mode") != "real":
        return False
    if execution.get("metric_quality") != "real_evidence":
        return False
    if execution.get("metric_source") != "tool_output_parser":
        return False
    if not provenance.get("artifact_hashes"):
        return False
    if metric_name:
        evidence = manifest.get("result_evidence", {}).get(metric_name.upper(), {})
        sources = evidence.get("source_artifacts", [])
        return bool(
            evidence.get("parser")
            and sources
            and any((Path(run_dir) / source).is_file() for source in sources)
        )
    return True
