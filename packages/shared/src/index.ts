/**
 * @dotagents/shared
 *
 * Shared design tokens, types, and utilities for DotAgents apps
 */

export * from './colors';
export * from './types';
export * from './tts-preprocessing';
export * from './voice-text-utils';
export * from './chat-utils';
export * from './providers';
export * from './provider-tool-utils';
export * from './languages';
export * from './session';
export * from './turn-duration';
export * from './shell-parse';
export * from './connection-recovery';
export * from './api-types';
export * from './predefined-prompts';
export * from './bundle-api';
export * from './hub';
export * from './conversation-state';
export * from './legacy-settings-redirect';
export * from './session-presentation';
export * from './session-progress-hydration';
export {
  type SidebarActivityKind,
  type SidebarActivityPresentation,
  type SidebarSessionNesting,
  dedupeTaskEntriesByTitle,
  filterPastSessionsAgainstActiveSessions,
  getLatestAgentResponseTimestamp,
  getLatestUserFacingResponse,
  getSessionIdsWithActiveChildProgress,
  getSidebarActivityPresentation,
  getSidebarProgressTitle,
  getSubagentParentSessionIdMap as getSidebarSubagentParentSessionIdMap,
  getSubagentTitleBySessionIdMap as getSidebarSubagentTitleBySessionIdMap,
  hasUnreadAgentResponse,
  isProgressLiveForSidebar,
  isSidebarSessionCurrentlyViewed,
  isTaskSession,
  nestSubagentSessionEntries,
  orderActiveSessionsByPinnedFirst,
  paginateSidebarEntries,
  partitionPinnedAndUnpinnedTaskEntries,
  partitionTaskAndUserEntries,
} from './sidebar-sessions';
export * from './conversation-progress';
export * from './agent-progress';
export * from './agent-user-response-store';
export * from './delegation-tool-display';
export * from './message-display-utils';
export * from './conversation-media-assets';
export * from './message-queue-utils';
export * from './message-queue-store';
export * from './mobile-app-config';
export * from './stt-models';
export * from './api-key-error-utils';
export * from './error-utils';
export * from './config-save-error';
export * from './audio-input-device-utils';
export * from './resizable-persistence';
export * from './tool-activity-grouping';
export * from './main-agent-selection';
export * from './agent-profile-presets';
export * from './agent-profile-connection';
export * from './agent-selector-options';
export * from './agent-session-candidates';
export * from './repeat-task-utils';
export * from './repeat-task-markdown';
export * from './knowledge-note-grouping';
export * from './knowledge-note-form';
export * from './settings-api-client';
export * from './conversation-sync';
export * from './config-list-input';
export * from './remote-pairing';
export * from './remote-server-api';
export * from './remote-server-controller-contracts';
export * from './remote-server-route-contracts';
export * from './model-presets';
export * from './local-speech-models';
export * from './tts-api';
export * from './tts-voice-picker';
export * from './push-notifications';
export * from './profile-api';
export * from './skills-api';
export * from './runtime-command-utils';
export * from './runtime-tool-utils';
export * from './system-prompt-utils';
export * from './operator-actions';
export * from './operator-audit-store';
export * from './mcp-api';
export * from './mcp-utils';
export * from './oauth-examples';
export * from './frontmatter';
export * from './discord-utils';
export * from './discord-config';
export * from './whatsapp-config';
export * from './observability-config';
export * from './linux-artifacts';
export * from './key-utils';
export * from './agent-run-utils';
export * from './conversation-history-utils';
export * from './conversation-context-builder';
export * from './conversation-id';
export * from './llm-continuation-guards';
export * from './agent-profile-reference-cleanup';
export * from './agent-profile-domain';
export * from './agent-profile-session-snapshot';
export * from './agent-profile-config-validation';
export * from './agent-profile-config-updates';
export * from './agent-profile-import-export';
export * from './agent-profile-queries';
export * from './agent-profile-mutations';
export * from './agent-profile-conversations';
export * from './agent-profile-acpx-migration';
export * from './agent-profile-factories';
export * from './agent-profile-storage';
export * from './agent-profile-legacy-converters';
