import { describe, expect, it } from "vitest"
import {
  buildRemoteServerBaseUrl,
  DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
  DEFAULT_REMOTE_SERVER_PORT,
  isConnectableRemoteServerIpv6Address,
  isLoopbackRemoteServerHost,
  isUnconnectableRemoteServerHostForMobilePairing,
  isWildcardRemoteServerHost,
  normalizeRemoteServerHostForComparison,
  REMOTE_SERVER_LAN_BIND_ADDRESS,
  resolveRemoteServerPairingPreview,
} from "./remote-server-url"

describe("remote-server-url", () => {
  it("normalizes hosts and classifies wildcard versus loopback binds", () => {
    expect(normalizeRemoteServerHostForComparison("[FE80::1]")).toBe("fe80::1")
    expect(isWildcardRemoteServerHost(REMOTE_SERVER_LAN_BIND_ADDRESS)).toBe(
      true,
    )
    expect(isWildcardRemoteServerHost("::")).toBe(true)
    expect(isLoopbackRemoteServerHost(DEFAULT_REMOTE_SERVER_BIND_ADDRESS)).toBe(
      true,
    )
    expect(isLoopbackRemoteServerHost("localhost")).toBe(true)
    expect(
      isUnconnectableRemoteServerHostForMobilePairing(
        DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
      ),
    ).toBe(true)
    expect(
      isUnconnectableRemoteServerHostForMobilePairing("192.168.1.25"),
    ).toBe(false)
  })

  it("builds IPv4 and IPv6 remote server base URLs correctly", () => {
    expect(buildRemoteServerBaseUrl("192.168.1.25", 3210)).toBe(
      "http://192.168.1.25:3210/v1",
    )
    expect(buildRemoteServerBaseUrl("2001:db8::10", 3210)).toBe(
      "http://[2001:db8::10]:3210/v1",
    )
  })

  it("rejects IPv6 addresses that are unreliable for mobile pairing", () => {
    expect(isConnectableRemoteServerIpv6Address("2001:db8::10")).toBe(true)
    expect(isConnectableRemoteServerIpv6Address("fe80::1")).toBe(false)
    expect(isConnectableRemoteServerIpv6Address("fe80::1%en0")).toBe(false)
    expect(isConnectableRemoteServerIpv6Address("ff02::1")).toBe(false)
    expect(isConnectableRemoteServerIpv6Address("::1")).toBe(false)
  })

  it("uses the live connectable URL when the running server provides one", () => {
    expect(
      resolveRemoteServerPairingPreview({
        configuredBindAddress: REMOTE_SERVER_LAN_BIND_ADDRESS,
        port: DEFAULT_REMOTE_SERVER_PORT,
        running: true,
        connectableUrl: "http://192.168.1.25:3210/v1",
      }),
    ).toEqual(
      expect.objectContaining({
        baseUrl: "http://192.168.1.25:3210/v1",
        shouldShowConnectabilityWarning: false,
        showConnectableUrlResolutionWarning: false,
        showLoopbackBindWarning: false,
      }),
    )
  })

  it("falls back to the configured direct bind URL even before the server is running", () => {
    expect(
      resolveRemoteServerPairingPreview({
        configuredBindAddress: "192.168.1.25",
        running: false,
      }),
    ).toEqual(
      expect.objectContaining({
        configuredBindAddress: "192.168.1.25",
        port: DEFAULT_REMOTE_SERVER_PORT,
        baseUrl: "http://192.168.1.25:3210/v1",
        shouldShowConnectabilityWarning: false,
      }),
    )
  })

  it("shows the wildcard warning only for running wildcard binds without a LAN URL", () => {
    expect(
      resolveRemoteServerPairingPreview({
        configuredBindAddress: REMOTE_SERVER_LAN_BIND_ADDRESS,
        running: true,
      }),
    ).toEqual(
      expect.objectContaining({
        baseUrl: undefined,
        shouldShowConnectabilityWarning: true,
        showConnectableUrlResolutionWarning: true,
        showLoopbackBindWarning: false,
      }),
    )
  })

  it("shows the loopback warning only for running loopback binds without a LAN URL", () => {
    expect(
      resolveRemoteServerPairingPreview({
        configuredBindAddress: DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
        running: true,
      }),
    ).toEqual(
      expect.objectContaining({
        baseUrl: undefined,
        shouldShowConnectabilityWarning: true,
        showConnectableUrlResolutionWarning: false,
        showLoopbackBindWarning: true,
      }),
    )
  })
})
