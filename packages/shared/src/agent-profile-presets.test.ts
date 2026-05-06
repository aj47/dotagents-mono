import { describe, expect, it } from 'vitest';

import {
  AGENT_PROFILE_PRESETS,
  detectAgentProfilePresetKey,
  getAgentProfilePresetFormFields,
} from './agent-profile-presets';
import { DEFAULT_AGENT_PROFILE_ENABLED } from './agent-profile-mutations';

describe('agent profile presets', () => {
  it('defines the external agent commands shared by desktop and mobile', () => {
    expect(AGENT_PROFILE_PRESETS.auggie).toMatchObject({
      displayName: 'Auggie (Augment Code)',
      connectionType: 'acpx',
      connectionCommand: 'auggie',
      connectionArgs: '--acp',
      enabled: DEFAULT_AGENT_PROFILE_ENABLED,
    });
    expect(AGENT_PROFILE_PRESETS.codex).toMatchObject({
      connectionCommand: 'codex-acp',
      verifyArgs: ['--help'],
    });
    expect(AGENT_PROFILE_PRESETS.opencode).toMatchObject({
      connectionCommand: 'opencode',
      connectionArgs: 'acp',
    });
  });

  it('detects presets from saved connection fields', () => {
    expect(detectAgentProfilePresetKey({
      connectionType: 'acpx',
      connectionCommand: 'auggie',
      connectionArgs: ' --acp ',
    })).toBe('auggie');

    expect(detectAgentProfilePresetKey({
      connectionType: 'acpx',
      connectionCommand: 'claude-code-acp',
    })).toBe('claude-code');

    expect(detectAgentProfilePresetKey({
      connectionType: 'acpx',
      connectionCommand: 'codex-acp',
    })).toBe('codex');

    expect(detectAgentProfilePresetKey({
      connectionType: 'acpx',
      connectionCommand: 'opencode',
      connectionArgs: 'acp',
    })).toBe('opencode');
  });

  it('builds editable preset fields without docs metadata', () => {
    expect(getAgentProfilePresetFormFields('codex')).toEqual({
      displayName: 'Codex',
      description: 'OpenAI Codex via the official ACP adapter',
      connectionType: 'acpx',
      connectionCommand: 'codex-acp',
      connectionArgs: '',
      connectionBaseUrl: '',
      connectionCwd: '',
      enabled: DEFAULT_AGENT_PROFILE_ENABLED,
    });
  });

  it('does not match unrelated or incomplete local agent commands', () => {
    expect(detectAgentProfilePresetKey({
      connectionType: 'remote',
      connectionCommand: 'codex-acp',
    })).toBeUndefined();

    expect(detectAgentProfilePresetKey({
      connectionType: 'acpx',
      connectionCommand: 'opencode',
      connectionArgs: '',
    })).toBeUndefined();
  });
});
