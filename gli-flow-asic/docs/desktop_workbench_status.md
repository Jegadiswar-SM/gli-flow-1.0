# Desktop shell and RTL Workbench status

Implemented in the desktop feature track:

- Electron shell with native File/Edit/View/Window/Help menus, secure
  `contextIsolation`, disabled Node integration, backend attach/spawn mode,
  health/UI readiness checks, and child-process cleanup.
- Native directory/file picker API exposed only through the preload bridge.
- `/version` is sourced from `gli_flow/version.py`, and the dashboard fetches
  it at load time.
- Dockview RTL Workbench with file tree, Monaco editor, Verilog/SystemVerilog
  tokenizer, run action, live status polling, and metrics panel.
- Backend filesystem tree/read endpoints restricted to configured project
  roots. Save is limited to Electron sessions with a per-launch token; the
  browser dashboard is read-only.
- Linux electron-builder targets: AppImage and deb.

Verification performed:

```text
dashboard npm run lint       PASS (0 errors, 0 warnings)
dashboard npm run build      PASS
backend version/tree/read    PASS
backend unauthenticated save 403 (expected)
```

The plain browser dashboard remains the same SPA and keeps its existing page
switching/nav pattern. The Workbench is additive. Full interactive Electron
verification requires a graphical Linux session; the headless environment can
still validate JavaScript syntax, packaging configuration, backend APIs, and
the browser build. Bundling Python is deferred; the packaged app requires an
existing GLI-FLOW Python installation.
