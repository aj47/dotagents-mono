import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./settings-remote-server.tsx", import.meta.url), "utf8")

describe("desktop remote server draft persistence", () => {
  it("keeps port and CORS drafts local, debounces valid saves, and resets invalid port blur values", () => {
    expect(source).toContain('const flushPortSave = useCallback((draft: string) => {')
    expect(source).toContain('const schedulePortSave = useCallback((draft: string) => {')
    expect(source).toContain('resetPortDraftToSavedValue()')
    expect(source).toContain('saveConfig({ remoteServerPort: parsed })')
    expect(source).toContain('const flushCorsOriginsSave = useCallback((draft: string) => {')
    expect(source).toContain('const scheduleCorsOriginsSave = useCallback((draft: string) => {')
    expect(source).toContain('saveConfig({ remoteServerCorsOrigins: origins.length > 0 ? origins : ["*"] })')
  })

  it("keeps named tunnel drafts local and debounces saves by draft key", () => {
    expect(source).toContain('Partial<Record<NamedTunnelDraftKey, ReturnType<typeof setTimeout>>>')
    expect(source).toContain('const flushNamedTunnelSave = useCallback((key: NamedTunnelDraftKey, value: string) => {')
    expect(source).toContain('const scheduleNamedTunnelSave = useCallback((key: NamedTunnelDraftKey, value: string) => {')
    expect(source).toContain('namedTunnelSaveTimeoutsRef.current[key] = setTimeout(() => {')
    expect(source).toContain('setNamedTunnelDrafts((currentDrafts) => ({')
  })

  it("shows visible error toasts for copy failures and tunnel action failures", () => {
    expect(source).toContain('toast.error(getRemoteServerCopyErrorMessage(label, error))')
    expect(source).toContain('toast.error(getTunnelActionErrorMessage("start", result.error))')
    expect(source).toContain('toast.error(getTunnelActionErrorMessage("start", error))')
    expect(source).toContain('toast.error(getTunnelActionErrorMessage("stop", error))')
  })
})
