import type { AgentSkill } from "@shared/types"

const normalizeSkillSlashToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const getSkillSlashTokens = (skill: AgentSkill) =>
  [skill.id, skill.name]
    .map(normalizeSkillSlashToken)
    .filter(Boolean)

export function getSlashCommandState(text: string, skills: AgentSkill[]) {
  const trimmedStartText = text.replace(/^\s+/, "")
  if (!trimmedStartText.startsWith("/")) {
    return null
  }

  const commandMatch = trimmedStartText.match(/^\/([^\s\n]*)/)
  if (!commandMatch) {
    return null
  }

  const query = commandMatch[1] ?? ""
  const normalizedQuery = normalizeSkillSlashToken(query)
  const exactSkill = normalizedQuery
    ? skills.find((skill) => getSkillSlashTokens(skill).includes(normalizedQuery)) ?? null
    : null
  const suggestions = skills
    .filter((skill) => {
      if (!normalizedQuery) {
        return true
      }

      return getSkillSlashTokens(skill).some((token) => token.includes(normalizedQuery))
    })
    .slice(0, 6)
  const nextCharacter = trimmedStartText.slice(commandMatch[0].length, commandMatch[0].length + 1)

  return {
    query,
    exactSkill,
    suggestions,
    shouldShowSuggestions: nextCharacter === "",
  }
}

export function expandSlashCommandText(text: string, exactSkill: AgentSkill | null) {
  if (!exactSkill) {
    return text
  }

  const trimmedStartText = text.replace(/^\s+/, "")
  const commandMatch = trimmedStartText.match(/^\/([^\s\n]+)([\s\S]*)$/)
  if (!commandMatch) {
    return text
  }

  const trailingText = commandMatch[2].trim()
  if (!trailingText) {
    return exactSkill.instructions.trim()
  }

  return `${exactSkill.instructions.trim()}\n\nUser request:\n${trailingText}`
}

export function replaceSlashCommandSelection(text: string, skill: AgentSkill) {
  const commandMatch = text.match(/^(\s*)\/([^\s\n]*)/)
  if (!commandMatch) {
    return text
  }

  const leadingWhitespace = commandMatch[1] ?? ""
  const remainder = text.slice(commandMatch[0].length)
  const spacer = remainder.length === 0 ? " " : ""
  return `${leadingWhitespace}/${skill.id}${spacer}${remainder}`
}