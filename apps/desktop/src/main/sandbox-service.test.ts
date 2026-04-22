import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import os from "os"
import {
  getSandboxState,
  saveBaseline,
  saveCurrentAsSlot,
  switchToSlot,
  restoreBaseline,
  deleteSlot,
  createSlotFromCurrentState,
  renameSlot,
} from "./sandbox-service"

let tmpDir: string
let agentsDir: string

function seedAgentsDir() {
  fs.mkdirSync(agentsDir, { recursive: true })
  fs.writeFileSync(
    path.join(agentsDir, "dotagents-settings.json"),
    JSON.stringify({ theme: "dark" }),
  )
  fs.writeFileSync(
    path.join(agentsDir, "mcp.json"),
    JSON.stringify({ mcpConfig: { mcpServers: {} } }),
  )
}

function readSettingsJson(): Record<string, unknown> {
  const content = fs.readFileSync(
    path.join(agentsDir, "dotagents-settings.json"),
    "utf-8",
  )
  return JSON.parse(content)
}

function writeSettingsJson(data: Record<string, unknown>) {
  fs.writeFileSync(
    path.join(agentsDir, "dotagents-settings.json"),
    JSON.stringify(data),
  )
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sandbox-test-"))
  agentsDir = path.join(tmpDir, ".agents")
  seedAgentsDir()
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe("sandbox-service", () => {
  describe("getSandboxState", () => {
    it("returns empty state when no sandboxes exist", () => {
      const state = getSandboxState(agentsDir)
      expect(state.activeSlot).toBeNull()
      expect(state.slots).toHaveLength(0)
    })

    it("returns slots after saving baseline", () => {
      saveBaseline(agentsDir)
      const state = getSandboxState(agentsDir)
      expect(state.slots).toHaveLength(1)
      expect(state.slots[0].name).toBe("default")
      expect(state.slots[0].isDefault).toBe(true)
    })
  })

  describe("saveBaseline", () => {
    it("saves current config as default slot", () => {
      const result = saveBaseline(agentsDir)
      expect(result.success).toBe(true)
      expect(result.slot?.name).toBe("default")
      expect(result.slot?.isDefault).toBe(true)
    })

    it("snapshots config files into slot directory", () => {
      saveBaseline(agentsDir)
      const slotSettingsPath = path.join(
        agentsDir,
        ".sandboxes",
        "default",
        "dotagents-settings.json",
      )
      expect(fs.existsSync(slotSettingsPath)).toBe(true)
      const content = JSON.parse(fs.readFileSync(slotSettingsPath, "utf-8"))
      expect(content.theme).toBe("dark")
    })

    it("does not copy local secret store files into sandbox snapshots", () => {
      fs.writeFileSync(
        path.join(agentsDir, "secrets.local.json"),
        JSON.stringify({ secrets: { apiKey: "sk-secret" } }),
      )
      fs.writeFileSync(path.join(agentsDir, "secrets.local.json.tmp-123"), "sk-secret")
      fs.writeFileSync(path.join(agentsDir, "secrets.local.json~"), "sk-secret")

      const nestedSkillDir = path.join(agentsDir, "skills", "local-secret-test")
      fs.mkdirSync(nestedSkillDir, { recursive: true })
      fs.writeFileSync(path.join(nestedSkillDir, "skill.md"), "# Test")
      fs.writeFileSync(path.join(nestedSkillDir, "secrets.local.json"), "sk-nested")

      saveBaseline(agentsDir)

      const slotDir = path.join(agentsDir, ".sandboxes", "default")
      expect(fs.existsSync(path.join(slotDir, "secrets.local.json"))).toBe(false)
      expect(fs.existsSync(path.join(slotDir, "secrets.local.json.tmp-123"))).toBe(false)
      expect(fs.existsSync(path.join(slotDir, "secrets.local.json~"))).toBe(false)
      expect(fs.existsSync(path.join(slotDir, "skills", "local-secret-test", "skill.md"))).toBe(true)
      expect(
        fs.existsSync(path.join(slotDir, "skills", "local-secret-test", "secrets.local.json")),
      ).toBe(false)
    })
  })

  describe("saveCurrentAsSlot", () => {
    it("creates a named slot", () => {
      const result = saveCurrentAsSlot(agentsDir, "test-slot")
      expect(result.success).toBe(true)
      expect(result.slot?.name).toBe("test-slot")
      expect(result.slot?.isDefault).toBe(false)
    })

    it("stores source bundle name", () => {
      const result = saveCurrentAsSlot(agentsDir, "from-bundle", {
        sourceBundleName: "My Cool Bundle",
      })
      expect(result.success).toBe(true)
      expect(result.slot?.sourceBundleName).toBe("My Cool Bundle")
    })

    it("sanitizes slot names", () => {
      const result = saveCurrentAsSlot(agentsDir, "  My Slot!@# 123  ")
      expect(result.success).toBe(true)
      expect(result.slot?.name).toBe("my-slot-123")
    })
  })

  describe("switchToSlot", () => {
    it("switches between slots preserving state", () => {
      // Save baseline with theme: dark
      saveBaseline(agentsDir)

      // Modify current config
      writeSettingsJson({ theme: "light", newSetting: true })

      // Save as a different slot
      saveCurrentAsSlot(agentsDir, "light-theme")

      // Switch to baseline
      const result = switchToSlot(agentsDir, "default")
      expect(result.success).toBe(true)
      expect(result.activeSlot).toBe("default")

      // Verify config is restored to baseline
      const settings = readSettingsJson()
      expect(settings.theme).toBe("dark")
      expect(settings).not.toHaveProperty("newSetting")
    })

    it("auto-saves current state before switching", () => {
      saveBaseline(agentsDir)
      saveCurrentAsSlot(agentsDir, "slot-a")

      // Switch to slot-a first to set an active slot
      switchToSlot(agentsDir, "slot-a")

      // Modify config while on slot-a
      writeSettingsJson({ theme: "modified" })

      // Switch to default (should auto-save modified state into slot-a)
      switchToSlot(agentsDir, "default")

      // Switch back to slot-a
      switchToSlot(agentsDir, "slot-a")

      // The "modified" state should have been auto-saved to slot-a
      const settings = readSettingsJson()
      expect(settings.theme).toBe("modified")
    })

    it("returns error for non-existent slot", () => {
      const result = switchToSlot(agentsDir, "nonexistent")
      expect(result.success).toBe(false)
      expect(result.error).toContain("does not exist")
    })

    it("no-ops when switching to already active slot", () => {
      saveBaseline(agentsDir)
      switchToSlot(agentsDir, "default")
      const result = switchToSlot(agentsDir, "default")
      expect(result.success).toBe(true)
      expect(result.previousSlot).toBe("default")
    })
  })

  describe("restoreBaseline", () => {
    it("restores to default slot", () => {
      saveBaseline(agentsDir)

      // Modify and save as different slot
      writeSettingsJson({ theme: "experimental" })
      saveCurrentAsSlot(agentsDir, "experimental")
      switchToSlot(agentsDir, "experimental")

      // Restore baseline
      const result = restoreBaseline(agentsDir)
      expect(result.success).toBe(true)
      expect(result.activeSlot).toBe("default")

      const settings = readSettingsJson()
      expect(settings.theme).toBe("dark")
    })
  })

  describe("deleteSlot", () => {
    it("deletes a non-default slot", () => {
      saveCurrentAsSlot(agentsDir, "to-delete")
      const result = deleteSlot(agentsDir, "to-delete")
      expect(result.success).toBe(true)

      const state = getSandboxState(agentsDir)
      expect(state.slots.find((s) => s.name === "to-delete")).toBeUndefined()
    })

    it("refuses to delete the default slot", () => {
      saveBaseline(agentsDir)
      const result = deleteSlot(agentsDir, "default")
      expect(result.success).toBe(false)
      expect(result.error).toContain("default baseline")
    })

    it("refuses to delete the active slot", () => {
      saveBaseline(agentsDir)
      saveCurrentAsSlot(agentsDir, "active-slot")
      switchToSlot(agentsDir, "active-slot")

      const result = deleteSlot(agentsDir, "active-slot")
      expect(result.success).toBe(false)
      expect(result.error).toContain("currently active")
    })
  })

  describe("createSlotFromCurrentState", () => {
    it("ensures baseline is saved before creating a new slot", () => {
      const result = createSlotFromCurrentState(agentsDir, "new-slot")
      expect(result.success).toBe(true)

      const state = getSandboxState(agentsDir)
      expect(state.slots.some((s) => s.isDefault)).toBe(true)
      expect(state.slots.some((s) => s.name === "new-slot")).toBe(true)
    })
  })

  describe("renameSlot", () => {
    it("renames a slot", () => {
      saveCurrentAsSlot(agentsDir, "old-name")
      const result = renameSlot(agentsDir, "old-name", "new-name")
      expect(result.success).toBe(true)

      const state = getSandboxState(agentsDir)
      expect(state.slots.find((s) => s.name === "old-name")).toBeUndefined()
      expect(state.slots.find((s) => s.name === "new-name")).toBeDefined()
    })

    it("refuses to rename the default slot", () => {
      saveBaseline(agentsDir)
      const result = renameSlot(agentsDir, "default", "new-default")
      expect(result.success).toBe(false)
      expect(result.error).toContain("default baseline")
    })

    it("refuses to rename a slot to 'default'", () => {
      saveCurrentAsSlot(agentsDir, "my-slot")
      const result = renameSlot(agentsDir, "my-slot", "default")
      expect(result.success).toBe(false)
      expect(result.error).toContain("reserved")
    })

    it("updates active slot reference when renaming the active slot", () => {
      saveBaseline(agentsDir)
      saveCurrentAsSlot(agentsDir, "my-slot")
      switchToSlot(agentsDir, "my-slot")

      renameSlot(agentsDir, "my-slot", "renamed-slot")

      const state = getSandboxState(agentsDir)
      expect(state.activeSlot).toBe("renamed-slot")
    })
  })
})
