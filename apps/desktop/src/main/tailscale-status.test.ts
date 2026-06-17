import { afterEach, describe, expect, it, vi } from "vitest"
import { parseTailscaleStatusJson } from "./tailscale-status"

afterEach(() => {
  vi.doUnmock("node:child_process")
  vi.resetModules()
})

describe("parseTailscaleStatusJson", () => {
  it("uses the Tailscale IPv4 address when MagicDNS is available", () => {
    const status = parseTailscaleStatusJson(JSON.stringify({
      BackendState: "Running",
      Self: {
        HostName: "Aj's MacBook Pro",
        DNSName: "ajs-macbook-pro.tail67358c.ts.net.",
        TailscaleIPs: ["100.122.255.96", "fd7a:115c:a1e0::a401:ffa1"],
      },
      CurrentTailnet: {
        MagicDNSEnabled: true,
      },
    }), 3210)

    expect(status).toEqual({
      available: true,
      running: true,
      hostName: "Aj's MacBook Pro",
      dnsName: "ajs-macbook-pro.tail67358c.ts.net",
      ipv4: "100.122.255.96",
      baseUrl: "http://100.122.255.96:3210/v1",
    })
  })

  it("falls back to Tailscale IPv4 when MagicDNS is disabled", () => {
    const status = parseTailscaleStatusJson(JSON.stringify({
      BackendState: "Running",
      TailscaleIPs: ["100.122.255.96"],
      Self: {
        DNSName: "ajs-macbook-pro.tail67358c.ts.net.",
      },
      CurrentTailnet: {
        MagicDNSEnabled: false,
      },
    }), 3210)

    expect(status.baseUrl).toBe("http://100.122.255.96:3210/v1")
    expect(status.ipv4).toBe("100.122.255.96")
  })

  it("returns a stopped state when the backend is not running", () => {
    const status = parseTailscaleStatusJson(JSON.stringify({
      BackendState: "Stopped",
    }), 3210)

    expect(status).toEqual({
      available: true,
      running: false,
      error: "Tailscale is stopped",
    })
  })

  it("returns a nonfatal error for malformed JSON", () => {
    const status = parseTailscaleStatusJson("{", 3210)

    expect(status).toEqual({
      available: true,
      running: false,
      error: "Tailscale returned invalid status JSON",
    })
  })

  it("requires a usable IPv4 address for binding", () => {
    const status = parseTailscaleStatusJson(JSON.stringify({
      BackendState: "Running",
      Self: {
        DNSName: "ajs-macbook-pro.tail67358c.ts.net.",
        TailscaleIPs: ["fd7a:115c:a1e0::a401:ffa1"],
      },
      CurrentTailnet: {
        MagicDNSEnabled: true,
      },
    }), 3210)

    expect(status).toMatchObject({
      available: true,
      running: true,
      dnsName: "ajs-macbook-pro.tail67358c.ts.net",
      error: "Tailscale is running, but no usable IPv4 address was found",
    })
    expect(status.baseUrl).toBeUndefined()
  })
})

describe("getTailscalePairingStatus", () => {
  it("returns unavailable when the Tailscale CLI is missing", async () => {
    vi.resetModules()
    vi.doMock("node:child_process", () => ({
      execFileSync: vi.fn(() => {
        const error = new Error("spawn tailscale ENOENT")
        ;(error as NodeJS.ErrnoException).code = "ENOENT"
        throw error
      }),
    }))

    const { getTailscalePairingStatus } = await import("./tailscale-status")

    expect(getTailscalePairingStatus(3210)).toEqual({
      available: false,
      running: false,
      error: "Tailscale CLI is not installed",
    })
  })
})
