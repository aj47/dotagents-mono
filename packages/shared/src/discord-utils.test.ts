import { describe, expect, it } from 'vitest';
import {
  canUseMutatingSlashCommand,
  canUseReadOnlySlashCommand,
  getDiscordConversationId,
  getDiscordConversationKey,
  getDiscordMessageRejectionReason,
  getDiscordOperatorAccessRejectionReason,
  isBotNameMentioned,
  splitDiscordMessageContent,
} from './discord-utils';

describe('discord utils', () => {
  it('builds deterministic conversation ids for DMs, channels, and threads', () => {
    expect(getDiscordConversationId({ channelId: 'dm-1', isDirectMessage: true })).toBe('discord_dm_dm-1');
    expect(getDiscordConversationId({ channelId: 'chan-1', guildId: 'guild-1', isDirectMessage: false })).toBe('discord_gguild-1_cchan-1');
    expect(getDiscordConversationId({ channelId: 'chan-1', guildId: 'guild-1', threadId: 'thread-1', isDirectMessage: false })).toBe('discord_gguild-1_cchan-1_tthread-1');
  });

  it('forks into a new conversation id when a session epoch greater than zero is supplied', () => {
    expect(getDiscordConversationId({ channelId: 'dm-1', isDirectMessage: true, epoch: 0 })).toBe('discord_dm_dm-1');
    expect(getDiscordConversationId({ channelId: 'dm-1', isDirectMessage: true, epoch: undefined })).toBe('discord_dm_dm-1');
    expect(getDiscordConversationId({ channelId: 'dm-1', isDirectMessage: true, epoch: 1 })).toBe('discord_dm_dm-1_s1');
    expect(getDiscordConversationId({ channelId: 'dm-1', isDirectMessage: true, epoch: 42 })).toBe('discord_dm_dm-1_s42');
    expect(getDiscordConversationId({ channelId: 'chan-1', guildId: 'guild-1', isDirectMessage: false, epoch: 2 })).toBe('discord_gguild-1_cchan-1_s2');
    expect(getDiscordConversationId({ channelId: 'chan-1', guildId: 'guild-1', threadId: 'thread-1', isDirectMessage: false, epoch: 3 })).toBe('discord_gguild-1_cchan-1_tthread-1_s3');
    expect(getDiscordConversationId({ channelId: 'dm-1', isDirectMessage: true, epoch: -1 })).toBe('discord_dm_dm-1');
  });

  it('derives stable per-location keys used for session epochs', () => {
    expect(getDiscordConversationKey({ channelId: 'dm-1', isDirectMessage: true })).toBe('discord_dm_dm-1');
    expect(getDiscordConversationKey({ channelId: 'chan-1', guildId: 'guild-1', isDirectMessage: false })).toBe('discord_gguild-1_cchan-1');
    expect(getDiscordConversationKey({ channelId: 'chan-1', guildId: 'guild-1', threadId: 'thread-1', isDirectMessage: false })).toBe('discord_gguild-1_cchan-1_tthread-1');
    expect(getDiscordConversationKey({ channelId: 'same-id', isDirectMessage: true }))
      .not.toBe(getDiscordConversationKey({ channelId: 'same-id', guildId: 'guild-1', isDirectMessage: false }));
    expect(getDiscordConversationKey({ channelId: 'chan-1', guildId: 'guild-1', threadId: 'thread-1', isDirectMessage: false }))
      .not.toBe(getDiscordConversationKey({ channelId: 'chan-1', guildId: 'guild-1', isDirectMessage: false }));
  });

  it('detects bot name mentions without requiring a Discord mention tag', () => {
    expect(isBotNameMentioned('hey dotagents can you help?', 'dotagents')).toBe(true);
    expect(isBotNameMentioned('hello Dot Agents', 'dotagents', 'Dot Agents')).toBe(true);
    expect(isBotNameMentioned('notdotagents suffix should not match', 'dotagents')).toBe(false);
    expect(isBotNameMentioned('x', 'x')).toBe(false);
  });

  it('rejects messages that fail DM, mention, or allowlist rules', () => {
    expect(getDiscordMessageRejectionReason({
      authorId: 'user-1',
      channelId: 'dm-1',
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: false,
    })).toBe('direct messages are disabled');

    expect(getDiscordMessageRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
      isDirectMessage: false,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
    })).toBe('bot mention required');

    expect(getDiscordMessageRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
      isDirectMessage: false,
      mentioned: true,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
      allowGuildIds: ['guild-2'],
    })).toBe('guild not allowlisted');

    expect(getDiscordMessageRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
      isDirectMessage: false,
      mentioned: true,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
      allowRoleIds: ['role-2'],
      authorRoleIds: ['role-1'],
    })).toBe('user does not have an allowlisted role');
  });

  it('allows messages that satisfy allowlist rules', () => {
    expect(getDiscordMessageRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
      isDirectMessage: false,
      mentioned: false,
      nameMentioned: true,
      requireMention: true,
      dmEnabled: true,
      allowUserIds: [' user-1 '],
      allowGuildIds: ['guild-1'],
      allowChannelIds: ['chan-1'],
      allowRoleIds: ['role-2'],
      authorRoleIds: ['role-1', ' role-2 '],
    })).toBeNull();
  });

  it('exempts Discord application owners from the DM allowlist bootstrap check only', () => {
    expect(getDiscordMessageRejectionReason({
      authorId: 'owner-1',
      channelId: 'dm-1',
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
      dmAllowUserIds: ['other-user'],
    })).toBe('user not in DM allowlist');

    expect(getDiscordMessageRejectionReason({
      authorId: 'owner-1',
      channelId: 'dm-1',
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
      dmAllowUserIds: ['other-user'],
      applicationOwnerIds: new Set(['owner-1', 'team-member-2']),
    })).toBeNull();

    expect(getDiscordMessageRejectionReason({
      authorId: 'owner-1',
      channelId: 'dm-1',
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: false,
      dmAllowUserIds: ['other-user'],
      applicationOwnerIds: new Set(['owner-1']),
    })).toBe('direct messages are disabled');

    expect(getDiscordMessageRejectionReason({
      authorId: 'stranger',
      channelId: 'dm-1',
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
      dmAllowUserIds: ['other-user'],
      applicationOwnerIds: new Set(['owner-1']),
    })).toBe('user not in DM allowlist');
  });

  it('chunks long Discord replies without exceeding the limit', () => {
    const chunks = splitDiscordMessageContent(`${'a'.repeat(1200)}\n${'b'.repeat(1200)}`, 1900);
    expect(chunks.length).toBe(2);
    expect(chunks.every((chunk) => chunk.length <= 1900)).toBe(true);
  });

  it('restricts slash command mutations to Discord application owners only', () => {
    const ownerIds = new Set(['owner-1', 'team-member-2']);
    const dmAllowUserIds = ['user-a', 'user-b'];

    expect(canUseReadOnlySlashCommand({ userId: 'owner-1', applicationOwnerIds: ownerIds, dmAllowUserIds })).toBe(true);
    expect(canUseMutatingSlashCommand({ userId: 'owner-1', applicationOwnerIds: ownerIds })).toBe(true);
    expect(canUseReadOnlySlashCommand({ userId: 'team-member-2', applicationOwnerIds: ownerIds, dmAllowUserIds })).toBe(true);
    expect(canUseMutatingSlashCommand({ userId: 'team-member-2', applicationOwnerIds: ownerIds })).toBe(true);
    expect(canUseReadOnlySlashCommand({ userId: 'user-a', applicationOwnerIds: ownerIds, dmAllowUserIds })).toBe(true);
    expect(canUseMutatingSlashCommand({ userId: 'user-a', applicationOwnerIds: ownerIds })).toBe(false);
    expect(canUseReadOnlySlashCommand({ userId: 'randomer', applicationOwnerIds: ownerIds, dmAllowUserIds })).toBe(false);
    expect(canUseMutatingSlashCommand({ userId: 'randomer', applicationOwnerIds: ownerIds })).toBe(false);
    expect(canUseReadOnlySlashCommand({ userId: 'anyone', applicationOwnerIds: new Set(), dmAllowUserIds: [] })).toBe(false);
    expect(canUseMutatingSlashCommand({ userId: 'anyone', applicationOwnerIds: new Set() })).toBe(false);
    expect(canUseReadOnlySlashCommand({
      userId: 'user-a',
      applicationOwnerIds: new Set(),
      dmAllowUserIds: ['  ', '', 'user-a '],
    })).toBe(true);
    expect(canUseReadOnlySlashCommand({
      userId: 'nobody',
      applicationOwnerIds: new Set(),
      dmAllowUserIds: ['  ', ''],
    })).toBe(false);
  });

  it('fails Discord operator access closed until an operator allowlist is configured', () => {
    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
    })).toBe('Discord operator commands are disabled. Configure discordOperatorAllowUserIds (or guild/channel/role) to enable them.');
  });

  it('allows Discord operator access by user, role, guild, or channel', () => {
    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
      allowUserIds: [' user-1 '],
    })).toBeNull();

    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-2',
      channelId: 'chan-1',
      guildId: 'guild-1',
      authorRoleIds: ['role-1', ' role-2 '],
      allowRoleIds: ['role-2'],
    })).toBeNull();

    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-3',
      channelId: 'chan-1',
      guildId: 'guild-1',
      allowGuildIds: ['guild-1'],
    })).toBeNull();

    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-4',
      channelId: 'chan-1',
      guildId: 'guild-1',
      allowChannelIds: ['chan-1'],
    })).toBeNull();
  });

  it('applies Discord operator channel allowlists to parent channels for threads', () => {
    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-1',
      channelId: 'thread-1',
      parentChannelId: 'chan-1',
      guildId: 'guild-1',
      isThread: true,
      allowGuildIds: ['guild-1'],
      allowChannelIds: ['chan-1'],
    })).toBeNull();

    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-1',
      channelId: 'thread-1',
      parentChannelId: 'chan-1',
      guildId: 'guild-1',
      isThread: true,
      allowGuildIds: ['guild-1'],
      allowChannelIds: ['chan-2'],
    })).toBe('channel is not in the Discord operator allowlist');
  });

  it('reports the first configured Discord operator allowlist that the caller misses', () => {
    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
      authorRoleIds: ['role-1'],
      allowRoleIds: ['role-2'],
      allowUserIds: ['user-2'],
      allowGuildIds: ['guild-2'],
    })).toBe('user does not have an operator-allowlisted role');

    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
      allowUserIds: ['user-2'],
      allowGuildIds: ['guild-2'],
    })).toBe('user is not in the Discord operator allowlist');

    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
      allowGuildIds: ['guild-2'],
    })).toBe('guild is not in the Discord operator allowlist');

    expect(getDiscordOperatorAccessRejectionReason({
      authorId: 'user-1',
      channelId: 'chan-1',
      guildId: 'guild-1',
      allowChannelIds: ['chan-2'],
    })).toBe('channel is not in the Discord operator allowlist');
  });
});
