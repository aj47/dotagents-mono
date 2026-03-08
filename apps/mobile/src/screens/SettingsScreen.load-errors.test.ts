import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = fs.readFileSync(path.resolve(__dirname, 'SettingsScreen.tsx'), 'utf8')

describe('SettingsScreen DotAgents section load errors', () => {
  it('tracks per-section load failures and renders them distinctly from empty states', () => {
    expect(source).toContain("const [skillsLoadError, setSkillsLoadError] = useState<string | null>(null);")
    expect(source).toContain("const [memoriesLoadError, setMemoriesLoadError] = useState<string | null>(null);")
    expect(source).toContain("const [agentProfilesLoadError, setAgentProfilesLoadError] = useState<string | null>(null);")
    expect(source).toContain("const [loopsLoadError, setLoopsLoadError] = useState<string | null>(null);")
    expect(source).toContain('setSkillsLoadError(null);')
    expect(source).toContain('setMemoriesLoadError(null);')
    expect(source).toContain('setAgentProfilesLoadError(null);')
    expect(source).toContain('setLoopsLoadError(null);')
    expect(source).toContain("setSkillsLoadError(getSectionLoadErrorMessage('skills', error));")
    expect(source).toContain("setMemoriesLoadError(getSectionLoadErrorMessage('memories', error));")
    expect(source).toContain("setAgentProfilesLoadError(getSectionLoadErrorMessage('agents', error));")
    expect(source).toContain("setLoopsLoadError(getSectionLoadErrorMessage('agent loops', error));")

    expect(source).toContain('skillsLoadError && skills.length === 0')
    expect(source).toContain('memoriesLoadError && memories.length === 0')
    expect(source).toContain('agentProfilesLoadError && agentProfiles.length === 0')
    expect(source).toContain('loopsLoadError && loops.length === 0')
    expect(source).toContain('styles.errorHelperText')
  })
})