#!/usr/bin/env bash
# Remove only GLI-FLOW's user-owned installation directory.
set -Eeuo pipefail

GLI_FLOW_HOME="${GLI_FLOW_HOME:-${HOME}/.gli-flow}"
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
elif [[ "${1:-}" != "" ]]; then
    printf 'Usage: %s [--dry-run]\n' "$0" >&2
    exit 2
fi

case "$GLI_FLOW_HOME" in
    ""|"/"|"$HOME"|"$HOME/"|"/home"|"/tmp")
        printf 'Refusing unsafe uninstall target: %s\n' "$GLI_FLOW_HOME" >&2
        exit 2
        ;;
esac

if [[ ! -e "$GLI_FLOW_HOME" ]]; then
    printf 'GLI-FLOW user installation not found: %s\n' "$GLI_FLOW_HOME"
    exit 0
fi

printf 'This removes only the GLI-FLOW user directory:\n  %s\n' "$GLI_FLOW_HOME"
if [[ "$DRY_RUN" == true ]]; then
    printf 'Dry run: nothing was removed.\n'
    exit 0
fi

answer="n"
if [[ -r /dev/tty ]]; then
    read -r -p 'Continue? [y/N] ' answer < /dev/tty || answer="n"
fi
if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    printf 'Cancelled.\n'
    exit 0
fi

rm -rf -- "$GLI_FLOW_HOME"
printf 'Removed %s. Repository checkouts and project designs were not touched.\n' "$GLI_FLOW_HOME"
