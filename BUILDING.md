# Building DotAgents

The canonical build, release, signing, and deployment documentation now lives in the docs site:

- [Build, Release, Deploy](docs-site/docs/development/build-release-deploy.md)
- [Development Setup](docs-site/docs/development/setup.md)
- [Apps & Packages](docs-site/docs/development/apps-and-packages.md)

Common commands:

```bash
pnpm install
pnpm build:shared
pnpm --filter @dotagents/desktop build-rs
pnpm --filter @dotagents/desktop build
```

Desktop release entry point:

```bash
cd apps/desktop
pnpm release
```

For macOS signing, Linux package targets, Windows packaging, GitHub Actions artifacts, docs builds, web deployment, and release credential env files, use the canonical docs page above.
