import yaml

from pathlib import Path


REQUIRED_FIELDS = [
    "design_name",
    "rtl_files",
    "top_module",
    "backend",
]

SUPPORTED_BACKENDS = ["openroad", "librelane"]
SUPPORTED_PDKS = ["sky130", "gf180mcu", "sky130A", "sky130B"]


def validate_manifest(manifest_path):
    manifest_path = Path(manifest_path)

    if not manifest_path.exists():
        return (False, f"Manifest not found: {manifest_path}")

    try:
        with open(manifest_path) as f:
            manifest = yaml.safe_load(f)
    except Exception as e:
        return (False, f"Failed to parse YAML: {e}")

    if not isinstance(manifest, dict):
        return (False, "Manifest must be a YAML dictionary.")

    missing_fields = []
    for field in REQUIRED_FIELDS:
        if field not in manifest:
            missing_fields.append(field)

    if missing_fields:
        return (False, "Missing required fields: " + ", ".join(missing_fields))

    run_mode = manifest.get("run_mode", "")
    has_sdc = "sdc_file" in manifest or "constraints" in manifest
    if not has_sdc and run_mode != "educational_demo":
        return (
            False,
            "No SDC constraints file specified. "
            "Tapeout runs require explicit timing constraints. "
            "Add 'sdc_file: path/to/constraints.sdc' or "
            "'constraints: [path/to/constraints.sdc]' to gli_manifest.yaml. "
            "If you are running an educational demo, add 'run_mode: educational_demo' "
            "to suppress this error."
        )

    backend = manifest["backend"]
    if backend not in SUPPORTED_BACKENDS:
        return (False, f"Unsupported backend: {backend}. Supported: {', '.join(SUPPORTED_BACKENDS)}")

    rtl_files = manifest["rtl_files"]
    if not isinstance(rtl_files, list):
        return (False, "rtl_files must be a list.")

    manifest_dir = manifest_path.parent
    for rtl in rtl_files:
        # Manifest paths are intentionally anchored to the manifest directory;
        # validation must be independent of the caller's working directory.
        rtl_path = manifest_dir / rtl
        # Older bundled manifests used project-root-relative examples/... paths.
        # Resolve that legacy form from the repository root inferred from the
        # manifest, never from the process CWD.
        legacy_prefix = Path("examples") / manifest_dir.name
        if not rtl_path.exists() and Path(rtl).parts[:2] == legacy_prefix.parts:
            rtl_path = manifest_dir.parents[1] / rtl
        if not rtl_path.exists():
            return (False, f"RTL file not found: {rtl}")

    constraint_values = manifest.get("sdc_file") or manifest.get("constraints") or []
    if isinstance(constraint_values, str):
        constraint_values = [constraint_values]
    for constraint in constraint_values:
        constraint_path = manifest_dir / constraint
        legacy_constraint = Path("examples") / manifest_dir.name
        if not constraint_path.exists() and Path(constraint).parts[:2] == legacy_constraint.parts:
            constraint_path = manifest_dir.parents[1] / constraint
        if not constraint_path.exists():
            return (False, f"Constraints file not found: {constraint}")

    pdk = manifest.get("pdk", "sky130")
    if pdk not in SUPPORTED_PDKS and not pdk.startswith("gf"):
        return (False, f"Unknown PDK: {pdk}. Supported: {', '.join(SUPPORTED_PDKS)}")

    corners = manifest.get("corners")
    if corners is not None:
        if not isinstance(corners, list):
            return (False, "corners must be a list")
        for c in corners:
            if not isinstance(c, dict):
                return (False, f"Each corner must be a dict, got {type(c).__name__}")
            if "name" not in c:
                return (False, "Each corner must have a 'name' field")

    return (True, "Manifest validation successful.")
