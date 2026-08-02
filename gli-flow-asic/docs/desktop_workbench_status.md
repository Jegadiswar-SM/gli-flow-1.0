# Desktop shell and RTL Workbench status

Implemented in the desktop feature track:

- Electron shell with native File/Edit/View/Window/Help menus, secure
  `contextIsolation`, disabled Node integration, backend attach/spawn mode,
  health/UI readiness checks, and child-process cleanup.
- Native directory/file picker API exposed only through the preload bridge.
- `/version` is sourced from `gli_flow/version.py`, and the dashboard fetches
  it at load time.
- Dockview RTL Workbench with file tree, Monaco editor, Verilog/SystemVerilog
  tokenizer, multi-file tabs, run action, live status polling, and metrics
  panel.
- Backend filesystem tree/read endpoints restricted to configured project
  roots. Save is limited to Electron sessions with a per-launch token; the
  browser dashboard is read-only.
- Linux electron-builder targets: AppImage and deb.

## Self-hosted Monaco and offline verification

The original Workbench used `@monaco-editor/react` without configuring its
loader. Before this fix, opening `examples/counter/counter.v` produced
requests to `https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/...`
for the loader, editor, contributions, CSS, and workers. The same trace also
showed Google Fonts requests from both `index.html` and the App stylesheet
import. It rendered only because this network was available.

The fix adds `monaco-editor@^0.56.0` as a direct dependency and calls
`loader.config({ monaco })` with Monaco's local editor API. Vite aliases the
package's ESM API and bundles the editor worker locally; the Workbench's
existing custom Monarch Verilog tokenizer remains the only language support
loaded. The dashboard no longer imports Google Fonts at runtime. Its existing
font-family names now fall back to system sans, serif, and monospace fonts,
which is appropriate for offline/air-gapped installations.

The bundle budget was rebaselined from 650 KiB per asset / 1,500 KiB total to
3,200 KiB per asset / 4,750 KiB total. The post-fix measured build is:

```text
WorkbenchPage-*.js   3,006,176 bytes
editor.worker-*.js     300,367 bytes
bundle total         4,425,677 bytes
budget               4,864,000 bytes
```

This increase reflects real self-hosted Monaco weight, not an arbitrary
rounding of the old budget. The Workbench remains a lazy route: the initial
dashboard load did not fetch its Workbench chunk, and the chunk was fetched
only after selecting RTL Workbench.

Network verification:

- Before: Chromium trace showed multiple jsDelivr Monaco requests and Google
  Fonts requests while opening the file.
- After, normal network: the editor rendered real source and line numbers;
  no jsDelivr or Google Fonts requests were observed.
- After, blocked network: Playwright aborted every request matching
  `cdn.jsdelivr.net`, `fonts.googleapis.com`, or `fonts.gstatic.com`. The
  Workbench still rendered non-empty Monaco text containing `module`, showed
  12 line-number elements, had no page errors, and had no failed requests.
  No Monaco worker was requested by this custom-tokenizer-only path; the
  locally emitted editor worker is available and configured for core worker
  use.

The final checks pass: `npm run lint` (zero warnings), `npm run build`,
`npm run check:bundle`, and `npm audit` (zero vulnerabilities).

## Dockview data-flow fix

The original Workbench renderer map used inline closures such as
`files: () => <FileTreePanel tree={tree} ... />`. Dockview creates those
panels once, so later React state changes were not delivered to the existing
panel instances. The backend tree request returned `200`, but the panel kept
the initial `null` tree; the same structural defect affected the editor,
live logs, and metrics panels.

Commit `10b5d45` fixes this by making every renderer read from `props.params`.
The initial `addPanel` call supplies a complete parameter object, panel
handles are retained, and a Workbench effect calls
`panel.api.updateParameters(...)` when tree/file/dirty/run/log state or any
callback changes. Renderer identities stay stable while callbacks are
refreshed through the same update path.

Before/after evidence:

- Before: the historical pre-fix source closed over `tree` and added panels
  without `params`; its reproduced `GET /api/fs/tree?path=...` returned `200`,
  while the observed panel remained “Choose a design folder to browse RTL.”
  The old build was not relaunched after this fix; this is the recorded
  pre-fix reproduction, not a claim that the old code remains checked out.
- After: headless Chromium against the built dashboard loaded
  `examples/counter`, observed `counter.v` in the Design Files DOM, opened it,
  and observed non-empty Monaco `.view-lines` containing `module`. Starting a
  mock run replaced the log placeholder with live stage text and kept the
  Metrics panel rendered. The browser run reported no console errors.

## Post-fix checklist

1. Tree → file → Monaco: PASS. The real `counter.v` walkthrough rendered
   source in Monaco. The current hand-written Monarch tokenizer is an
   intentional interim implementation rather than the originally proposed
   TextMate port. Its rules cover `module`, `endmodule`, `always`, `assign`,
   line/block comments, Verilog base-number literals, and strings; the
   `mini_mac` RTL fixtures exercise these constructs. Theme rules map
   keywords to gold, comments to muted gray, numbers to green, and strings to
   blue.
2. Edit/save: backend PASS; graphical Electron walkthrough remains deferred
   to a desktop session. A token-bearing Electron-style request wrote a
   temporary `.v` file and read back byte-identical content (`200`); the
   unauthenticated request remained `403`. The preload bridge still binds the
   Save button and Ctrl/Cmd+S action to that endpoint. This headless session
   has no display for an actual Electron keybinding session.
3. Unauthenticated save: PASS. `POST /api/fs/file` without
   `X-GLI-FLOW-DESKTOP-TOKEN` returned `403` after the refactor.
4. Workbench run/log/metrics: PASS in headless Chromium. `POST /api/run`
   returned a run ID; after polling, the browser saw stage output beyond the
   placeholder and the Metrics panel. Direct backend verification completed
   the mock run with `SUCCESS`, `DONE`, `100%`, WNS `0.05`, utilization
   `65.0`, and QoR `0.81` (simulated values, not signoff results).
5. Plain-browser regression: PASS. `npm run lint` reports `0 errors, 0
   warnings`, `npm run build` passes, `npm run check:bundle` passes, and
   `npm test` reports zero failing tests. The Workbench remains read-only in
   browser mode and the existing SPA/nav structure was not rewritten.

Verification performed:

```text
dashboard npm run lint       PASS (0 errors, 0 warnings)
dashboard npm run build      PASS
dashboard npm run check:bundle PASS (4,425,677 bytes / 4,864,000-byte self-hosted Monaco budget)
dashboard npm audit          PASS (0 vulnerabilities)
backend version/tree/read    PASS
backend unauthenticated save 403 (expected)
backend token save/readback   PASS (200, byte-identical)
headless Chromium Workbench  PASS (tree, Monaco content, live logs, metrics; no console errors)
dashboard npm test            PASS (0 tests failed)
desktop npm audit            PASS (0 vulnerabilities)
electron-builder --dir      Linux unpacked artifact produced
```

The plain browser dashboard remains the same SPA and keeps its existing page
switching/nav pattern. The Workbench is additive. Full interactive Electron
verification requires a graphical Linux session; the headless environment can
still validate JavaScript syntax, packaging configuration, backend APIs, and
the browser build. Bundling Python is deferred; the packaged app requires an
existing GLI-FLOW Python installation.

## VS Code-style Workbench implementation

The earlier status description that implied tabs was inaccurate for the
single-file implementation being replaced. The current Workbench has the
following completed tiers.

### Tier 1 — foundational editing

1. **Multi-file tabs:** open files are keyed by path, duplicate opens select
   the existing tab, and every tab shows its own dirty dot. Closing a dirty tab
   offers save-before-close or discard; `beforeunload` warns when any tab is
   dirty. Dockview state continues through `props.params` and
   `panel.api.updateParameters(...)`.
2. **Monaco editing:** the minimap is enabled by default and can be toggled;
   multi-cursor editing, bracket-pair coloring, current-line highlighting,
   comment toggle, duplicate/move line, find, replace, and save are explicitly
   configured. Ctrl/Cmd+Shift+P opens the application palette.
3. **Tree operations:** Electron exposes context menus and visible overflow
   buttons for New File, New Folder, Rename, and Delete, including root-level
   creation. Browser mode hides these controls and remains read-only. The new
   backend create/move/delete endpoints reuse configured-root path safety and
   the per-launch `X-GLI-FLOW-DESKTOP-TOKEN` gate used by save. The tree
   refreshes in place.
4. **Breadcrumbs:** the active tab path appears above the editor; each segment
   focuses and expands the corresponding tree path.

### Tier 2 — complete editor workflow

5. **Command palette:** fuzzy filtering covers Save, Save All, Close Tab, Close
   All Tabs, Run This Design, New File, New Folder, Toggle Minimap, and Search
   in Files.
6. **Global search:** `GET /api/fs/search` searches the loaded design root,
   skips hidden/generated directories, returns file/line matches, and opens
   and reveals the selected result. Replace-all is intentionally not included.
7. **Status bar:** the editor shows live line/column, `Verilog` language mode,
   and `UTF-8` encoding.

### Tier 3 — RTL outline

The lightweight outline recognizes module, always, and assign declarations
using the same vocabulary as the hand-written Monarch Verilog tokenizer. It
lists source lines and jumps to the selected line. This is not a language
server or semantic symbol table.

## Verification evidence for this implementation

```text
dashboard: npm run lint                         PASS (0 errors, 0 warnings)
dashboard: npm run build                        PASS (3,045 modules)
dashboard: npm run check:bundle                 PASS (4,425,677 / 4,864,000 bytes)
dashboard Workbench chunk                      3,006,176 bytes
python3 -m py_compile backend/server.py         PASS
node --check desktop/main.js                    PASS
node --check desktop/preload.js                 PASS
git diff --check                                PASS
```

The focused backend test file covers token-gated create/search/rename/delete
and unauthenticated denial. In this headless environment its TestClient run
entered the existing application startup/database path and hung during the
first request after the existing missing `BHARATCODE_API_KEY` notice; it did
not produce a test assertion result. Normal CI should run
`pytest -q tests/test_desktop_workbench_backend.py --timeout=60`.

The production build verifies browser compatibility at compile time: CRUD
controls are gated by `isElectron`, while read/tree/open/search remain
available in a plain browser. A graphical Electron walkthrough of multiple
dirty tabs and right-click CRUD was not available in this headless session and
remains a release-validation step.

## Explicitly deferred

- Real Verilog/SystemVerilog language-server features: semantic completion,
  go-to-definition, references, and diagnostics.
- Split or side-by-side editors.
- An extension/plugin system.
- Git integration UI; a git-backed student workflow is not established.
- Multi-file replace-all; safe atomic replacement needs a separate design.

## EDA tool access from the Workbench

The Electron Workbench now includes an **EDA Tools** panel with one-click
checks for Yosys, OpenROAD, and KLayout. Each action runs the tool's version
probe and displays the exact command and captured output in the panel. This is
intended as the simplest way for a beginner to confirm that the installed
toolchain is usable without leaving the editor.

The implementation is intentionally constrained: the browser cannot execute
tools, the Electron preload exposes only the named `runTool` action, and the
backend accepts only the three allowlisted tools through the existing
per-launch desktop token. It is not an arbitrary shell or terminal. Full
interactive tool consoles and custom scripts remain future work; normal
design runs already invoke the tools through GLI-FLOW and continue to show
their logs and reports in the Workbench.
