import { describe, expect, it } from 'vitest';
import {
  DISCORD_SECRET_MASK,
  getDiscordLifecycleAction,
  getDiscordResolvedDefaultProfileId,
  getDiscordResolvedToken,
  getMaskedDiscordBotToken,
  type DiscordIntegrationConfig,
} from './discord-config';

function assertType<T>(_value: T): void {
  // Compile-time assertion only.
}

describe('discord config helpers', () => {
  it('exposes the persisted Discord integration config contract', () => {
    const config: DiscordIntegrationConfig = {
      discordEnabled: true,
      discordBotToken: 'token',
      discordDmEnabled: true,
      discordRequireMention: false,
      discordAllowUserIds: ['user-1'],
      discordAllowGuildIds: ['guild-1'],
      discordAllowChannelIds: ['channel-1'],
      discordAllowRoleIds: ['role-1'],
      discordDmAllowUserIds: ['user-2'],
      discordOperatorAllowUserIds: ['operator-1'],
      discordOperatorAllowGuildIds: ['guild-2'],
      discordOperatorAllowChannelIds: ['channel-2'],
      discordOperatorAllowRoleIds: ['role-2'],
      discordDefaultProfileId: 'agent-1',
      discordLogMessages: true,
      discordConversationEpochs: {
        discord_dm_1: 2,
      },
    };

    assertType<DiscordIntegrationConfig>(config);
    expect(config.discordConversationEpochs?.discord_dm_1).toBe(2);
  });

  it('resolves token and default profile from config first, then environment', () => {
    expect(getDiscordResolvedToken({ discordBotToken: 'cfg-token' })).toEqual({ token: 'cfg-token', source: 'config' });
    expect(getDiscordResolvedToken({ discordBotToken: '' }, { DOTAGENTS_DISCORD_BOT_TOKEN: 'env-token' })).toEqual({ token: 'env-token', source: 'env' });

    expect(getDiscordResolvedDefaultProfileId({ discordDefaultProfileId: 'profile-1' })).toEqual({ profileId: 'profile-1', source: 'config' });
    expect(getDiscordResolvedDefaultProfileId({ discordDefaultProfileId: '' }, { DOTAGENTS_DISCORD_DEFAULT_PROFILE_ID: 'env-profile' })).toEqual({ profileId: 'env-profile', source: 'env' });
  });

  it('trims blank config and environment values', () => {
    expect(getDiscordResolvedToken(
      { discordBotToken: '   ' },
      { DOTAGENTS_DISCORD_BOT_TOKEN: ' env-token ' },
    )).toEqual({ token: 'env-token', source: 'env' });
    expect(getDiscordResolvedDefaultProfileId(
      { discordDefaultProfileId: '   ' },
      { DOTAGENTS_DISCORD_DEFAULT_PROFILE_ID: ' env-profile ' },
    )).toEqual({ profileId: 'env-profile', source: 'env' });
  });

  it('masks any configured Discord token without exposing the raw value', () => {
    expect(getMaskedDiscordBotToken({ discordBotToken: 'cfg-token' })).toBe(DISCORD_SECRET_MASK);
    expect(getMaskedDiscordBotToken({ discordBotToken: '' }, { DOTAGENTS_DISCORD_BOT_TOKEN: 'env-token' })).toBe(DISCORD_SECRET_MASK);
    expect(getMaskedDiscordBotToken({ discordBotToken: '' }, {})).toBe('');
  });

  it('computes lifecycle actions for enable, disable, restart, and noop changes', () => {
    expect(getDiscordLifecycleAction({ discordEnabled: false, discordBotToken: '' }, { discordEnabled: true, discordBotToken: 'token' })).toBe('start');
    expect(getDiscordLifecycleAction({ discordEnabled: true, discordBotToken: 'old' }, { discordEnabled: true, discordBotToken: 'new' })).toBe('restart');
    expect(getDiscordLifecycleAction({ discordEnabled: true, discordBotToken: 'token' }, { discordEnabled: false, discordBotToken: 'token' })).toBe('stop');
    expect(getDiscordLifecycleAction({ discordEnabled: true, discordBotToken: 'token' }, { discordEnabled: true, discordBotToken: 'token' })).toBe('noop');
  });

  it('treats clearing the bot token while enabled as an implicit stop', () => {
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: 'token' },
        { discordEnabled: true, discordBotToken: '' },
      ),
    ).toBe('stop');
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: 'token' },
        { discordEnabled: true, discordBotToken: '   ' },
      ),
    ).toBe('stop');
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: '' },
        { discordEnabled: true, discordBotToken: '' },
      ),
    ).toBe('noop');
  });

  it('honors env token fallback in lifecycle decisions', () => {
    const envWithToken = { DOTAGENTS_DISCORD_BOT_TOKEN: 'env-token' };

    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: 'config-token' },
        { discordEnabled: true, discordBotToken: '' },
        envWithToken,
      ),
    ).toBe('restart');

    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: '' },
        { discordEnabled: true, discordBotToken: '' },
        envWithToken,
      ),
    ).toBe('noop');

    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: '' },
        { discordEnabled: true, discordBotToken: 'config-token' },
      ),
    ).toBe('restart');

    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: '' },
        { discordEnabled: true, discordBotToken: '' },
        { DOTAGENTS_DISCORD_BOT_TOKEN: '' },
      ),
    ).toBe('noop');
  });
});
