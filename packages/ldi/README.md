# @dotagents/ldi

Live Desktop Integrator — render any URL as a desktop background layer.

## Requirements

- **Linux with X11** (Wayland not yet supported)
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

## API

| Method | Description |
|--------|-------------|
| `checkPlatform()` | Check if the current system supports LDI |
| `verifyScript()` | Verify the bundled bash script is accessible |
| `start(url, options?)` | Launch a URL as a desktop background |
| `stop(slot?)` | Stop a running backdrop |
| `status(slot?)` | Get status of a slot |
| `list()` | List all configured slots |
| `restart(url, options?)` | Stop and restart a backdrop |

## Build

```bash
pnpm build    # Build the package
pnpm dev      # Watch mode
```
