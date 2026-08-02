"""Fail when current user-facing version declarations drift apart."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
version_text = (ROOT / "gli_flow" / "version.py").read_text()
match = re.search(r'VERSION\s*=\s*["\']([^"\']+)', version_text)
if not match:
    raise SystemExit("Could not read gli_flow/version.py")
version = match.group(1)
needles = {
    "README.md": version,
    "Dockerfile": version,
    "docs/COMPATIBILITY.md": version,
    "docs/release/BETA_RELEASE_READINESS.md": version,
}
errors = []
for relative, expected in needles.items():
    path = ROOT / relative
    if expected not in path.read_text():
        errors.append(f"{relative} does not mention {expected}")
if errors:
    print("Version consistency check failed:")
    print("\n".join(f"- {error}" for error in errors))
    sys.exit(1)
print(f"Version consistency passed: {version}")
