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
650 KiB for the largest JavaScript/CSS asset and 1,000 KiB for the combined
asset set. The shared entry is currently about 602 KiB and is below budget.

`npm run lint` must exit successfully with zero errors and zero warnings.
Unused imports, empty catches, and lint errors are rejected, and the React
Hooks dependency arrays are kept exhaustive.

`npm audit` requires registry access. In the verification sandbox the npm
registry could not be reached, so the audit was deferred there and recorded
as an environment limitation rather than using `--force`. The audit is gated
in CI (`.github/workflows/ci.yml`, `dashboard` job), where GitHub-hosted
runners have registry access and fail the build on any `high` or
`critical` vulnerability.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
