#!/usr/bin/env bash
# GLI-FLOW one-command installer for Linux and WSL2.
# Usage: curl -fsSL https://raw.githubusercontent.com/Jegadiswar-SM/gli-flow-asic/main/scripts/install.sh | bash

set -Eeuo pipefail

REPO_URL="https://github.com/Jegadiswar-SM/gli-flow-1.0.git"
GLI_FLOW_HOME="${GLI_FLOW_HOME:-${HOME}/.gli-flow}"
SOURCE_DIR="${GLI_FLOW_HOME}/source"

info() { printf '→ %s\n' "$1"; }
pass() { printf '✓ %s\n' "$1"; }

if [[ -t 1 ]]; then
    RESET=$'\033[0m'
    CYAN=$'\033[96m'
    GREEN=$'\033[92m'
    BLUE=$'\033[94m'
    BOLD=$'\033[1m'
else
    RESET=''
    CYAN=''
    GREEN=''
    BLUE=''
    BOLD=''
fi

print_logo() {
    printf '\n%s╭────────────────────────────────────────────╮%s\n' "$BLUE" "$RESET"
    printf '%s│%s       %sGLI-FLOW%s  %sINSTALLER%s              %s│%s\n' "$BLUE" "$RESET" "$BOLD$CYAN" "$RESET" "$BOLD$GREEN" "$RESET" "$BLUE" "$RESET"
    printf '%s│%s       RTL → GDS  ·  Linux / WSL2         %s│%s\n' "$BLUE" "$RESET" "$BLUE" "$RESET"
    printf '%s╰────────────────────────────────────────────╯%s\n\n' "$BLUE" "$RESET"
}

fail() {
    printf '✗ Installation stopped: %s\n' "$1" >&2
    printf '  Nothing else was changed. Re-run this command after fixing the issue.\n' >&2
    exit 1
}

on_error() {
    local line="$1"
    fail "a command failed near installer line ${line}; read the step above and try again"
}
trap 'on_error "$LINENO"' ERR

print_logo
info "This will create or reuse ${GLI_FLOW_HOME}, a Python virtual environment, and a source checkout."
info "It will install the GLI-FLOW dashboard dependencies and run a mock smoke test."

python_cmd=""
for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then
        python_cmd="$candidate"
        break
    fi
done
[[ -n "$python_cmd" ]] || fail "Python 3.9–3.12 is required; install python3, python3-venv, and python3-pip first"

python_version="$($python_cmd -c 'import sys; print(f"{sys.version_info[0]}.{sys.version_info[1]}")')"
if ! "$python_cmd" -c 'import sys; raise SystemExit(0 if (3, 9) <= sys.version_info[:2] <= (3, 12) else 1)'; then
    fail "Python 3.9–3.12 is required; found ${python_version}"
fi
pass "Python ${python_version}"

mkdir -p "$GLI_FLOW_HOME"

# A local checkout makes `bash scripts/install.sh` work without downloading
# the repository again. A curl-piped invocation gets an atomic temporary clone.
script_root=""
if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]}" ]]; then
    candidate_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    if [[ -f "${candidate_root}/setup.py" ]]; then
        script_root="$candidate_root"
    elif [[ -f "${candidate_root}/gli-flow-asic/setup.py" ]]; then
        script_root="${candidate_root}/gli-flow-asic"
    fi
fi

if [[ -n "$script_root" ]]; then
    SOURCE_DIR="$script_root"
    pass "Using source checkout ${SOURCE_DIR}"
elif [[ -f "${SOURCE_DIR}/setup.py" ]]; then
    pass "Reusing source checkout ${SOURCE_DIR}"
else
    info "Downloading the GLI-FLOW source checkout to ${SOURCE_DIR}..."
    clone_dir="$(mktemp -d "${GLI_FLOW_HOME}/source.tmp.XXXXXX")"
    cleanup_clone() { rm -rf "$clone_dir"; }
    trap cleanup_clone EXIT
    command -v git >/dev/null 2>&1 || fail "git is required for the one-command install; install git and re-run"
    git clone --depth 1 "$REPO_URL" "$clone_dir/repository"
    if [[ -f "$clone_dir/repository/setup.py" ]]; then
        mv "$clone_dir/repository" "$SOURCE_DIR"
    elif [[ -f "$clone_dir/repository/gli-flow-asic/setup.py" ]]; then
        mv "$clone_dir/repository/gli-flow-asic" "$SOURCE_DIR"
    else
        fail "the downloaded repository did not contain setup.py"
    fi
    rm -rf "$clone_dir"
    trap - EXIT
    pass "Source checkout ready"
fi

venv_dir="${SOURCE_DIR}/.venv"
if [[ ! -x "${venv_dir}/bin/python" ]]; then
    info "Creating the virtual environment at ${venv_dir}..."
    "$python_cmd" -m venv "$venv_dir" || fail "could not create the virtual environment; install the python3-venv package"
else
    pass "Reusing virtual environment ${venv_dir}"
fi

info "Installing GLI-FLOW and dashboard dependencies..."
"${venv_dir}/bin/python" -m pip install --upgrade pip setuptools wheel >/dev/null || fail "pip bootstrap failed; check network access and try again"
"${venv_dir}/bin/python" -m pip install -e "${SOURCE_DIR}[dashboard]" || fail "GLI-FLOW installation failed; check the pip output above"
pass "GLI-FLOW installed"

info "Running the mock smoke test..."
"${venv_dir}/bin/gli-flow" smoke-test --non-interactive || fail "smoke-test failed; the installation is not ready"
pass "Mock smoke test passed"

if [[ -n "${WSL_DISTRO_NAME:-}" ]]; then
    printf '\nWSL2 detected. Install the optional system-level EDA prerequisites now? [y/N] '
    answer="n"
    if [[ -r /dev/tty ]]; then
        read -r answer < /dev/tty || answer="n"
    else
        printf '\n'
    fi
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        info "Starting gli-flow install (this may use sudo and download several GB)..."
        "${venv_dir}/bin/gli-flow" install || fail "EDA prerequisite installation failed; re-run `gli-flow install` after reviewing the output"
    else
        info "Skipping EDA prerequisites. You can run `gli-flow install` later."
    fi
fi

printf "\nYou're ready — try \`gli-flow quickstart\`\n"
printf 'Activate the environment first in a new shell:\n  source "%s/bin/activate"\n\n' "$venv_dir"
