# @dotagents/ldi

Live Desktop Integrator — render any URL as a desktop background layer.

## Architecture

Cross-platform design with pluggable backends:

| Platform | Backend | Status |
|----------|---------|--------|
| Linux/X11 | `LinuxX11Backend` | Available |
| macOS | `MacOSBackend` | Planned |
| Windows | `WindowsBackend` | Planned |

The `LdiClient` auto-selects the appropriate backend for the current platform.

## Requirements (Linux/X11)

- One of: `google-chrome`, `chromium-browser`, `chromium`, `brave-browser`
- X11 tools: `wmctrl`, `xprop`, `xdpyinfo`

## Usage

```typescript
import { LdiClient } from "@dotagents/ldi"

const ldi = new LdiClient()

// Check platform support
const check = await ldi.checkPlatform()
if (!check.supported) {
  console.log(check.reason)
}

// Start a backdrop
const result = await ldi.start("http://localhost:5173", {
  slot: "dashboard",
  settle: 4,
})

// Check status
const status = await ldi.status("dashboard")

// List all slots
const slots = await ldi.list()

// Stop
await ldi.stop("dashboard")
```

## Custom Backend

```typescript
import { LdiClient, type LdiBackend } from "@dotagents/ldi"

const customBackend: LdiBackend = { /* ... */ }
const ldi = new LdiClient({ backend: customBackend })
```

## Build

```bash
pnpm build    # Build the package
pnpm dev      # Watch mode
```
