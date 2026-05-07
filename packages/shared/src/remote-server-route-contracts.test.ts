import { describe, expect, it, vi } from 'vitest';
import {
  buildMobileApiActionError,
  buildMobileApiActionResult,
  createMobileApiRouteActions,
  type MobileApiRouteActions,
} from './remote-server-route-contracts';

type TestRequest = { requestId: string };
type TestReply = { replyId: string };
type TestMobileApiRouteActions = MobileApiRouteActions<TestRequest, TestReply>;

const actionKeys = [
  'handleChatCompletionRequest',
  'getModels',
  'getProviderModels',
  'getProfiles',
  'getCurrentProfile',
  'setCurrentProfile',
  'exportProfile',
  'importProfile',
  'getBundleExportableItems',
  'exportBundle',
  'previewBundleImport',
  'importBundle',
  'getMcpServers',
  'toggleMcpServer',
  'exportMcpServerConfigs',
  'importMcpServerConfigs',
  'upsertMcpServerConfig',
  'deleteMcpServerConfig',
  'getSettings',
  'updateSettings',
  'getAgentSessionCandidates',
  'recordOperatorAuditEvent',
  'getConversation',
  'getConversationVideoAsset',
  'synthesizeSpeech',
  'registerPushToken',
  'unregisterPushToken',
  'getPushStatus',
  'clearPushBadge',
  'getConversations',
  'createConversation',
  'updateConversation',
  'triggerEmergencyStop',
  'getSkills',
  'getSkill',
  'createSkill',
  'importSkillFromMarkdown',
  'importSkillFromGitHub',
  'exportSkillToMarkdown',
  'updateSkill',
  'deleteSkill',
  'toggleProfileSkill',
  'getKnowledgeNotes',
  'getKnowledgeNote',
  'searchKnowledgeNotes',
  'deleteKnowledgeNote',
  'deleteMultipleKnowledgeNotes',
  'deleteAllKnowledgeNotes',
  'getAgentProfiles',
  'verifyExternalAgentCommand',
  'reloadAgentProfiles',
  'toggleAgentProfile',
  'getAgentProfile',
  'createAgentProfile',
  'updateAgentProfile',
  'deleteAgentProfile',
  'getRepeatTasks',
  'getRepeatTaskStatuses',
  'toggleRepeatTask',
  'runRepeatTask',
  'startRepeatTask',
  'stopRepeatTask',
  'importRepeatTaskFromMarkdown',
  'exportRepeatTaskToMarkdown',
  'createKnowledgeNote',
  'updateKnowledgeNote',
  'createRepeatTask',
  'updateRepeatTask',
  'deleteRepeatTask',
] as const satisfies ReadonlyArray<keyof TestMobileApiRouteActions>;

describe('remote server route contracts', () => {
  it('builds mobile api action results with default success status', () => {
    expect(buildMobileApiActionResult({ ok: true })).toEqual({
      statusCode: 200,
      body: { ok: true },
    });
  });

  it('includes mobile api action result status and headers when provided', () => {
    expect(buildMobileApiActionResult('stream-body', 206, { 'content-range': 'bytes 0-4/10' })).toEqual({
      statusCode: 206,
      body: 'stream-body',
      headers: { 'content-range': 'bytes 0-4/10' },
    });
  });

  it('builds mobile api action errors with the shared error response shape', () => {
    expect(buildMobileApiActionError(404, 'Video asset not found', { 'cache-control': 'no-store' })).toEqual({
      statusCode: 404,
      body: { error: 'Video asset not found' },
      headers: { 'cache-control': 'no-store' },
    });
  });

  it('builds a complete mobile API action facade from route action groups', () => {
    const actions = Object.fromEntries(actionKeys.map((key) => [key, vi.fn()])) as TestMobileApiRouteActions;
    const pick = <K extends keyof TestMobileApiRouteActions>(...keys: K[]): Pick<TestMobileApiRouteActions, K> =>
      Object.fromEntries(keys.map((key) => [key, actions[key]])) as Pick<TestMobileApiRouteActions, K>;

    const routeActions = createMobileApiRouteActions<TestRequest, TestReply>({
      chatCompletion: pick('handleChatCompletionRequest'),
      models: pick('getModels', 'getProviderModels'),
      profiles: pick('getProfiles', 'getCurrentProfile', 'setCurrentProfile', 'exportProfile', 'importProfile'),
      bundle: pick('getBundleExportableItems', 'exportBundle', 'previewBundleImport', 'importBundle'),
      mcp: pick(
        'getMcpServers',
        'toggleMcpServer',
        'exportMcpServerConfigs',
        'importMcpServerConfigs',
        'upsertMcpServerConfig',
        'deleteMcpServerConfig',
      ),
      settings: pick('getSettings', 'updateSettings'),
      agentSessionCandidates: pick('getAgentSessionCandidates'),
      audit: pick('recordOperatorAuditEvent'),
      conversations: pick('getConversation', 'getConversations', 'createConversation', 'updateConversation'),
      conversationVideoAssets: pick('getConversationVideoAsset'),
      tts: pick('synthesizeSpeech'),
      push: pick('registerPushToken', 'unregisterPushToken', 'getPushStatus', 'clearPushBadge'),
      emergencyStop: pick('triggerEmergencyStop'),
      skills: pick(
        'getSkills',
        'getSkill',
        'createSkill',
        'importSkillFromMarkdown',
        'importSkillFromGitHub',
        'exportSkillToMarkdown',
        'updateSkill',
        'deleteSkill',
        'toggleProfileSkill',
      ),
      knowledgeNotes: pick(
        'getKnowledgeNotes',
        'getKnowledgeNote',
        'searchKnowledgeNotes',
        'deleteKnowledgeNote',
        'deleteMultipleKnowledgeNotes',
        'deleteAllKnowledgeNotes',
        'createKnowledgeNote',
        'updateKnowledgeNote',
      ),
      agentProfiles: pick(
        'getAgentProfiles',
        'verifyExternalAgentCommand',
        'reloadAgentProfiles',
        'toggleAgentProfile',
        'getAgentProfile',
        'createAgentProfile',
        'updateAgentProfile',
        'deleteAgentProfile',
      ),
      repeatTasks: pick(
        'getRepeatTasks',
        'getRepeatTaskStatuses',
        'toggleRepeatTask',
        'runRepeatTask',
        'startRepeatTask',
        'stopRepeatTask',
        'importRepeatTaskFromMarkdown',
        'exportRepeatTaskToMarkdown',
        'createRepeatTask',
        'updateRepeatTask',
        'deleteRepeatTask',
      ),
    });

    expect(Object.keys(routeActions).sort()).toEqual([...actionKeys].sort());
    expect(routeActions).toEqual(actions);
  });
});
