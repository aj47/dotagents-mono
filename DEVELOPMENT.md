# Development Guide

The canonical contributor documentation now lives in the docs site:

- [Development Setup](docs-site/docs/development/setup.md)
- [Apps & Packages](docs-site/docs/development/apps-and-packages.md)
- [Architecture Deep Dive](docs-site/docs/development/architecture.md)
- [Build, Release, Deploy](docs-site/docs/development/build-release-deploy.md)
- [Docs Coverage](docs-site/docs/development/docs-coverage.md)

Quick start:

```bash
git clone https://github.com/aj47/dotagents-mono.git
cd dotagents-mono
nvm use
pnpm install
pnpm build:shared
pnpm --filter @dotagents/desktop build-rs
pnpm dev
```

Core validation:

```bash
pnpm typecheck
pnpm test
pnpm docs:coverage
pnpm --dir docs-site build
```

Important repo rules:

- Use `pnpm` only.
- If you change `packages/shared`, run `pnpm build:shared` before `pnpm dev`.
- Desktop is Electron-first; renderer-only browser checks do not validate main-process behavior.
- Renderer code must not import from `apps/desktop/src/main`.

For Linux release policy and validation details, see:

- [LINUX_SUPPORT_MATRIX.md](LINUX_SUPPORT_MATRIX.md)
- [LINUX_PARITY_CHECKLIST.md](LINUX_PARITY_CHECKLIST.md)
- [LINUX_X64_VALIDATION.md](LINUX_X64_VALIDATION.md)
