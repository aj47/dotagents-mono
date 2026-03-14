import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  getSandboxState,
  saveCurrentAsSlot,
  switchToSlot,
  deleteSlot,
  createSlotFromCurrentState,
  renameSlot,
  sanitizeSlotName,
  restoreBaseline,
} from './sandbox-service'

describe('sandbox-service', () => {
  let testDir: string

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sandbox-test-'))
    // Create a minimal .agents dir structure
    fs.writeFileSync(path.join(testDir, 'dotagents-settings.json'), '{"test": true}')
    fs.writeFileSync(path.join(testDir, 'mcp.json'), '{"servers": {}}')
  })

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true })
  })

  describe('sanitizeSlotName', () => {
    it('lowercases and strips special characters', () => {
      expect(sanitizeSlotName('My Slot!')).toBe('my-slot')
    })

    it('collapses multiple hyphens', () => {
      expect(sanitizeSlotName('foo---bar')).toBe('foo-bar')
    })

    it('returns "slot" for empty string', () => {
      expect(sanitizeSlotName('')).toBe('slot')
    })
  })

  describe('getSandboxState', () => {
    it('returns empty state when no sandboxes exist', () => {
      const state = getSandboxState(testDir)
      expect(state.activeSlot).toBeNull()
      expect(state.slots).toEqual([])
    })

    it('returns slots after saving', () => {
      saveCurrentAsSlot(testDir, 'test-slot')
      const state = getSandboxState(testDir)
      expect(state.slots).toHaveLength(1)
      expect(state.slots[0].name).toBe('test-slot')
    })
  })

  describe('saveCurrentAsSlot', () => {
    it('saves current state as a named slot', () => {
      const result = saveCurrentAsSlot(testDir, 'my-slot')
      expect(result.success).toBe(true)
      expect(result.slot?.name).toBe('my-slot')
    })

    it('marks default slot as isDefault', () => {
      const result = saveCurrentAsSlot(testDir, 'default')
      expect(result.success).toBe(true)
      expect(result.slot?.isDefault).toBe(true)
    })

    it('updates existing slot', () => {
      saveCurrentAsSlot(testDir, 'my-slot')
      const result = saveCurrentAsSlot(testDir, 'my-slot')
      expect(result.success).toBe(true)
    })
  })

  describe('switchToSlot', () => {
    it('fails for non-existent slot', () => {
      const result = switchToSlot(testDir, 'does-not-exist')
      expect(result.success).toBe(false)
      expect(result.error).toContain('does not exist')
    })

    it('succeeds for existing slot', () => {
      saveCurrentAsSlot(testDir, 'slot-a')
      const result = switchToSlot(testDir, 'slot-a')
      expect(result.success).toBe(true)
      expect(result.activeSlot).toBe('slot-a')
    })

    it('no-ops when switching to currently active slot', () => {
      saveCurrentAsSlot(testDir, 'slot-a')
      switchToSlot(testDir, 'slot-a')
      const result = switchToSlot(testDir, 'slot-a')
      expect(result.success).toBe(true)
    })
  })

  describe('deleteSlot', () => {
    it('cannot delete the default slot', () => {
      saveCurrentAsSlot(testDir, 'default')
      const result = deleteSlot(testDir, 'default')
      expect(result.success).toBe(false)
      expect(result.error).toContain('default baseline')
    })

    it('cannot delete non-existent slot', () => {
      const result = deleteSlot(testDir, 'nope')
      expect(result.success).toBe(false)
    })

    it('deletes an existing slot', () => {
      saveCurrentAsSlot(testDir, 'removable')
      const result = deleteSlot(testDir, 'removable')
      expect(result.success).toBe(true)
      const state = getSandboxState(testDir)
      expect(state.slots.find(s => s.name === 'removable')).toBeUndefined()
    })
  })

  describe('createSlotFromCurrentState', () => {
    it('creates baseline before creating slot', () => {
      const result = createSlotFromCurrentState(testDir, 'test-slot')
      expect(result.success).toBe(true)
      const state = getSandboxState(testDir)
      // Should have both default and test-slot
      expect(state.slots.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('renameSlot', () => {
    it('renames an existing slot', () => {
      saveCurrentAsSlot(testDir, 'old-name')
      const result = renameSlot(testDir, 'old-name', 'new-name')
      expect(result.success).toBe(true)
      const state = getSandboxState(testDir)
      expect(state.slots.find(s => s.name === 'new-name')).toBeDefined()
      expect(state.slots.find(s => s.name === 'old-name')).toBeUndefined()
    })

    it('cannot rename to default', () => {
      saveCurrentAsSlot(testDir, 'my-slot')
      const result = renameSlot(testDir, 'my-slot', 'default')
      expect(result.success).toBe(false)
    })
  })
})
