import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const capabilitiesPageSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-capabilities.tsx'),
  'utf8',
)

const skillsPageSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-skills.tsx'),
  'utf8',
)

test('desktop capabilities tab keeps the Skills label in the shared tab bar', () => {
  assert.match(capabilitiesPageSource, /\{ id: "skills", label: "Skills", icon: "i-mingcute-sparkles-line" \}/)
  assert.match(capabilitiesPageSource, /\{activeTab === "skills" && <SkillsPage \/>\}/)
})

test('desktop skills page avoids a redundant Agent Skills hero header above the actions', () => {
  assert.doesNotMatch(skillsPageSource, /<h2 className="text-lg font-semibold">Agent Skills<\/h2>/)
  assert.match(skillsPageSource, /<div className="flex flex-wrap justify-end gap-2">[\s\S]*?Open Folder[\s\S]*?Scan Folder[\s\S]*?New Skill/)
  assert.doesNotMatch(skillsPageSource, /Skills are specialized instructions that improve AI performance on specific tasks\./)
  assert.match(skillsPageSource, /<p className="text-xs text-muted-foreground">\s*Enabled skills add their instructions to the system prompt\./)
})

test('desktop skills loading, error, and empty states stay compact and text-first', () => {
  assert.doesNotMatch(skillsPageSource, /text-center py-8 text-muted-foreground/)
  assert.doesNotMatch(skillsPageSource, /text-center py-8 text-destructive/)
  assert.doesNotMatch(skillsPageSource, /Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50"/)
  assert.match(skillsPageSource, /rounded-lg border border-dashed bg-muted\/20 px-4 py-5 text-center text-sm text-muted-foreground/)
  assert.match(skillsPageSource, /Loading skills\.\.\./)
  assert.match(skillsPageSource, /rounded-lg border border-dashed border-destructive\/30 bg-destructive\/5 px-4 py-5 text-center/)
  assert.match(skillsPageSource, /Failed to load skills\./)
  assert.match(skillsPageSource, /No skills yet\./)
  assert.match(skillsPageSource, /Create your first skill or import one\./)
})

test('desktop skills populated rows keep actions in one compact menu instead of a four-button rail', () => {
  assert.doesNotMatch(
    skillsPageSource,
    /<div className="flex gap-1 ml-2 shrink-0">[\s\S]*?<Pencil className="h-3 w-3" \/>[\s\S]*?<FileText className="h-3 w-3" \/>[\s\S]*?<Download className="h-3 w-3" \/>[\s\S]*?<Trash2 className="h-3 w-3" \/>/,
  )
  assert.match(skillsPageSource, /aria-label=\{`Actions for \$\{skill\.name\}`\}/)
  assert.match(skillsPageSource, /<MoreHorizontal className="h-3\.5 w-3\.5" \/>[\s\S]*?<span>Actions<\/span>/)
  assert.match(skillsPageSource, /<DropdownMenuItem onClick=\{\(\) => handleEditSkill\(skill\)\}>[\s\S]*?Edit/)
  assert.match(skillsPageSource, /<DropdownMenuItem onClick=\{\(\) => openSkillFileMutation\.mutate\(skill\.id\)\}>[\s\S]*?Reveal File/)
  assert.match(skillsPageSource, /<DropdownMenuItem onClick=\{\(\) => exportSkillMutation\.mutate\(skill\.id\)\}>[\s\S]*?Export/)
  assert.match(skillsPageSource, /<DropdownMenuItem[\s\S]*?onClick=\{\(\) => handleDeleteSkill\(skill\)\}[\s\S]*?Delete/)
})
