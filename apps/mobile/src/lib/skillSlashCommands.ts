import type { Skill, SkillDetail } from './settingsApi';

const trimLeadingWhitespace = (value: string) => value.replace(/^\s+/, '');

const trimWhitespace = (value: string) => value.replace(/^\s+|\s+$/g, '');

const normalizeSkillSlashToken = (value: string) => trimWhitespace(value).toLowerCase();

const getSkillSlashTokens = (skill: Pick<Skill, 'id' | 'name'>) => {
  const normalizedId = normalizeSkillSlashToken(skill.id);
  const normalizedName = normalizeSkillSlashToken(skill.name).replace(/^\//, '');
  if (normalizedId && normalizedName && normalizedId !== normalizedName) {
    return [normalizedId, normalizedName];
  }
  return normalizedId ? [normalizedId] : normalizedName ? [normalizedName] : [];
};

export const getSlashCommandState = (text: string, skills: Skill[]) => {
  const trimmed = trimLeadingWhitespace(text);
  if (trimmed.charAt(0) !== '/') {
    return null;
  }

  const slashBody = trimmed.slice(1);
  const spaceIndex = slashBody.indexOf(' ');
  const query = normalizeSkillSlashToken(spaceIndex === -1 ? slashBody : slashBody.slice(0, spaceIndex));
  let exactSkill: Skill | null = null;
  const suggestions: Skill[] = [];

  for (const skill of skills) {
    const tokens = getSkillSlashTokens(skill);
    let matchesQuery = !query;

    for (const token of tokens) {
      if (token === query) {
        exactSkill = skill;
      }
      if (!query || token.indexOf(query) === 0) {
        matchesQuery = true;
      }
    }

    if (matchesQuery) {
      suggestions.push(skill);
    }
  }

  return {
    exactSkill,
    query,
    suggestions,
    shouldShowSuggestions: spaceIndex === -1,
  };
};

export const replaceSlashCommandSelection = (text: string, skill: Pick<Skill, 'id'>) => {
  const trimmed = trimLeadingWhitespace(text);
  const slashBody = trimmed.slice(1);
  const spaceIndex = slashBody.indexOf(' ');
  const remainder = spaceIndex === -1 ? '' : trimLeadingWhitespace(slashBody.slice(spaceIndex + 1));
  return remainder ? `/${skill.id} ${remainder}` : `/${skill.id} `;
};

export const expandSlashCommandText = (text: string, skill: SkillDetail | null) => {
  if (!skill) {
    return text;
  }

  const trimmed = trimLeadingWhitespace(text);
  const slashBody = trimmed.slice(1);
  const spaceIndex = slashBody.indexOf(' ');
  const remainder = spaceIndex === -1 ? '' : trimWhitespace(slashBody.slice(spaceIndex + 1));

  if (!remainder) {
    return skill.instructions;
  }

  return `${skill.instructions}\n\nUser request: ${remainder}`;
};