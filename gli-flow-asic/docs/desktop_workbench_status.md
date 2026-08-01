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
WorkbenchPage-*.js   2,989,008 bytes
editor.worker-*.js     300,367 bytes
bundle total         4,403,274 bytes
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
dashboard npm run check:bundle PASS (4,403,274 bytes / 4,864,000-byte self-hosted Monaco budget)
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
