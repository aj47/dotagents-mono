---
sidebar_position: 3
sidebar_label: "Contributing"
---

# Contributing

We welcome contributions to DotAgents. Here's how to get involved.

---

## Getting Started

1. **Fork** the [repository](https://github.com/aj47/dotagents-mono)
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dotagents-mono.git
   cd dotagents-mono
   ```
3. **Set up** the development environment:
   ```bash
   nvm use
   pnpm install
   pnpm build-rs
   pnpm dev
   ```
4. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Before You Start

- Check [GitHub Issues](https://github.com/aj47/dotagents-mono/issues) for existing work
- For large features, open an issue first to discuss the approach
- Read the [Architecture Deep Dive](architecture) to understand the codebase

### Making Changes

1. Write your code following existing patterns
2. Add tests for new functionality
3. Run the test suite: `pnpm test`
4. Run type checking: `pnpm typecheck`
5. Run linting: `pnpm lint`

### Submitting

1. Commit with clear, descriptive messages
2. Push to your fork
3. Open a Pull Request against `main`
4. Describe what you changed and why

## Code Style

- **TypeScript** — Strict mode, explicit types
- **React** — Functional components with hooks
- **Naming** — camelCase for variables/functions, PascalCase for components/types
- **Files** — kebab-case for file names
- **Tests** — Co-located as `*.test.ts` / `*.test.tsx`

## Project Structure Rules

- **Main process** code goes in `apps/desktop/src/main/`
- **Renderer** code goes in `apps/desktop/src/renderer/src/`
- **Shared types** between processes go in `apps/desktop/src/shared/`
- **Cross-platform types** go in `packages/shared/`
- **Tool definitions** must be dependency-free (no service imports)
- **Services** use the singleton pattern

## Testing

```bash
pnpm test           # Watch mode
pnpm test:run       # Single run (CI)
pnpm test:coverage  # With coverage
```

Tests use **Vitest**. Write tests for:
- Service logic
- Utility functions
- Component behavior
- Protocol parsing (frontmatter, skill files, memory files)

## Areas for Contribution

| Area | Description |
|------|-------------|
| **MCP Servers** | New tool integrations |
| **Agent Skills** | New bundled skills |
| **Platform Support** | Windows/Linux improvements |
| **Mobile Features** | Mobile app enhancements |
| **Documentation** | Improvements and new guides |
| **Bug Fixes** | Issue resolution |
| **Performance** | Optimization opportunities |

## Community

- **[Discord](https://discord.gg/cK9WeQ7jPq)** — Chat with the community
- **[GitHub Issues](https://github.com/aj47/dotagents-mono/issues)** — Report bugs and request features
- **[Website](https://dotagents.app)** — Project homepage

---

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 License](https://github.com/aj47/dotagents-mono/blob/main/LICENSE).
