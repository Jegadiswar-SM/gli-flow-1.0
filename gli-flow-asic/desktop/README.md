# GLI-FLOW Desktop

The desktop shell is a thin Electron host around the existing FastAPI-served
dashboard. It does not duplicate the React app or the flow engine.

## Development

Build the browser dashboard first, then either attach to an existing backend:

```bash
cd dashboard && npm ci && npm run build
cd ../desktop && npm ci && npm run start -- --attach-only
```

Or start the desktop app without `--attach-only`; it spawns
`python -m uvicorn backend.server:app` from the project root, waits for
`GET /health`, and loads the same `http://127.0.0.1:8000/` UI. Set
`GLI_FLOW_PROJECT_ROOT` when launching from another directory and
`GLI_FLOW_PYTHON` when a specific Python environment is required.

The shell requires a pre-existing GLI-FLOW Python installation for now. A
bundled Python runtime is deliberately deferred as a separate packaging task.
The Electron-spawned backend receives a per-launch write token; an attached
backend remains read-only from the Workbench.

## Linux packaging

From the repository root:

```bash
npm run desktop:build
```

This hard-builds `dashboard/dist` before running electron-builder and produces
Linux AppImage and deb artifacts. The dashboard remains independently
browser-servable with its existing Vite commands.

## Workbench

The RTL Workbench is a new Dockview page. It provides an RTL-filtered file
tree, Monaco editing with a lightweight Verilog/SystemVerilog tokenizer, run
status/log output, and metrics. Browser mode is read-only; Electron mode can
save `.v`, `.sv`, `.vh`, and `.svh` files through the token-gated backend.
