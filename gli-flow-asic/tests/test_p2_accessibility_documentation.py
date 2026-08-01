from pathlib import Path


def test_p2_accessibility_manual_covers_required_surfaces():
    text = Path("docs/audit/p2_accessibility_manual.md").read_text()
    for term in ("Home", "Learning Path", "Compare Runs", "Keyboard/focus", "Responsive", "Contrast", "Empty/action states", "Icon labels"):
        assert term in text
