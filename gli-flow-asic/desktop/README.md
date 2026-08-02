# GLI-FLOW Desktop

The desktop shell is a thin Electron host around the existing FastAPI-served
dashboard. It does not duplicate the React app or the flow engine.

## One-command installation

On Linux or WSL2, install Node.js 24.18.0 first, then run the hosted desktop
installer from any directory:

```bash
curl -fsSL https://raw.githubusercontent.com/Jegadiswar-SM/gli-flow-1.0/main/gli-flow-asic/scripts/install.sh | bash -s -- --desktop
```

This creates the Python environment, installs GLI-FLOW, builds the local
Monaco dashboard, installs Electron, and prints the launch command. It does
not bundle Python or automatically install system EDA tools.

## Development prerequisites

From the repository root, create/use the supported Python environment and
install the backend before launching Electron:

```bash
cd /path/to/gli-flow-asic
python3 -m venv .venv
.venv/bin/python -m pip install -e ".[dashboard]"
cd dashboard
npm ci
npm run build
cd ..
```

The desktop shell does not bundle Python. It must be given an installed
GLI-FLOW environment; the examples below use an absolute interpreter path.
Relative `GLI_FLOW_PYTHON` values can produce `spawn ... ENOENT` because the
Electron child process resolves the executable before applying its backend
working directory.

## Development

To let Electron spawn and clean up its own backend:

```bash
cd /path/to/gli-flow-asic
npm --prefix desktop ci
GLI_FLOW_PROJECT_ROOT="$PWD" \
GLI_FLOW_PYTHON="$PWD/.venv/bin/python" \
npm --prefix desktop run start
```

The shell starts `python -m uvicorn backend.server:app` from the project root,
waits for `GET /health`, verifies that the built dashboard is served at `/`,
and loads `http://127.0.0.1:8000/`. Override the port with
`GLI_FLOW_BACKEND_PORT` if needed.

To attach to an existing backend without starting a second one:

```bash
cd /path/to/gli-flow-asic
source .venv/bin/activate
gli-flow dashboard --backend-only
```

In a second terminal:

```bash
cd /path/to/gli-flow-asic
GLI_FLOW_PROJECT_ROOT="$PWD" \
npm --prefix desktop run start -- --attach-only
```

`--attach-only` fails clearly if nothing is listening on the configured port.

The Electron-spawned backend receives a per-launch write token, enabling
Workbench saves. An attached backend remains read-only from the Workbench.

## Linux packaging

From the repository root:

```bash
npm run desktop:build
```

This hard-builds `dashboard/dist` before running electron-builder and produces
Linux AppImage and deb artifacts. The dashboard remains independently
browser-servable with its existing Vite commands.

The packaged app still requires a pre-existing GLI-FLOW Python installation.
When launching an unpacked or packaged app from a shell, set
`GLI_FLOW_PYTHON=/absolute/path/to/python`; bundling Python is intentionally
deferred.

## Workbench

The RTL Workbench is a new Dockview page. It provides an RTL-filtered file
tree, locally bundled Monaco editing with a lightweight
Verilog/SystemVerilog tokenizer, multi-file tabs, command palette, global
search, breadcrumbs, outline navigation, run status/log output, metrics, and
one-click Yosys/OpenROAD/KLayout checks. Browser mode is read-only; Electron
mode can save and manage `.v`, `.sv`, `.vh`, and `.svh` files through the
token-gated backend. Monaco and the application fonts do not require runtime
CDN access, so the Workbench also works in offline/air-gapped environments.
