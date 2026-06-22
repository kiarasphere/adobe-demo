# AGENTS.md

## Cursor Cloud specific instructions

This is the Adobe **React Spectrum** monorepo (React Aria / React Stately / React Spectrum). General contributor setup, test, lint, and run commands are documented in `CONTRIBUTING.md`; the notes below only cover non-obvious, environment-specific caveats.

### Node version caveat (important)
- The project requires **Node 24** (see `.nvmrc` / `CONTRIBUTING.md`). The sandbox ships a system Node 22 at `/exec-daemon/node` that takes precedence on `PATH`. Node 24 (installed via nvm) is prepended to `PATH` in `~/.bashrc`, so interactive/login shells get the right version.
- If `node --version` ever reports v22 in a shell, run: `export PATH="$HOME/.nvm/versions/node/v24.17.0/bin:$PATH"` before using `yarn`. Do not edit or remove `/exec-daemon/node`.
- `yarn` (v4.2.2) is provided via `corepack` against Node 24; the repo pins it with `yarnPath` in `.yarnrc.yml`.

### Services
- **Storybook** is the primary dev experience: `yarn start` serves it at http://localhost:9003 (Parcel-based; the preview finishes its first build ~10-15s after the manager starts). This is what to run to develop/manually test components.
- `yarn start:docs` runs the docs site at http://localhost:1234 (optional).

### Tests / lint / types
- Focused unit tests: `yarn jest <path-to-test>` (test files match `packages/**/*.test.[tj]s?(x)`). The full `yarn jest` suite is large.
- `yarn check-types` uses the fast `tsgo` type checker. `yarn lint` is heavier (runs `check-types` + `eslint packages` + package lint + yarn constraints).
- `yarn install` runs a `postinstall` that builds SVG icons; the generated icon files are gitignored, so a clean `git status` after install is expected.
