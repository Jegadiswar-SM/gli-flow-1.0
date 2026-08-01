# GLI-FLOW Dashboard

## Verification budgets

The documented Python-side verification environment is installed in one
command from the repository root:

```bash
python3 -m pip install -e ".[dashboard]"
```

That extra includes `pytest` and `pytest-timeout` for the dashboard-backed
test commands, as well as the FastAPI/HTTP test dependencies.

The production build is route-split with `React.lazy`/`Suspense`. Run
`npm run build && npm run check:bundle` after a build. The current budgets are
650 KiB for the largest JavaScript/CSS asset and 1,500 KiB for the combined
asset set. The Monaco/Dockview Workbench is lazy-loaded; its editor assets are
included in the combined budget while the shared entry remains about 602 KiB.

`npm run lint` must exit successfully with zero errors and zero warnings.
Unused imports, empty catches, and lint errors are rejected, and the React
Hooks dependency arrays are kept exhaustive.

The former 11 hook warnings were reviewed individually in commit `c0439a7`:
derived text lines and filtered artifacts use `useMemo`; artifact fetch,
navigation handlers, engineering/feedback/atlas fetchers, and AI fetchers use
`useCallback`; effects include the values they read; and the atlas interval
uses a ref so changing search-only filters does not restart the timer. These
dependencies are safe because they describe the request or render state each
effect must observe; no dependency was suppressed.

`npm audit` requires registry access. The original verification attempt in
this sandbox failed with `getaddrinfo EAI_AGAIN registry.npmjs.org`, so that
result was recorded as unverified rather than using `--force`. Run the exact
command below in an environment with registry access:

```bash
npm audit
```

The current CI acceptance job includes `npm audit --audit-level=high` in the
dashboard job and therefore gates merges on high/critical findings. The
dependency graph was refreshed with non-force `npm audit fix`; current direct
versions include `axios 1.19.0`, `postcss 8.5.25`, and `vite 8.2.0`, and
`npm audit` now reports zero vulnerabilities.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
