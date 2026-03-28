import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const headlessCliSource = readFileSync(
  new URL("./headless-cli.ts", import.meta.url),
  "utf8",
)
const remoteServerSource = readFileSync(
  new URL("./remote-server.ts", import.meta.url),
  "utf8",
)
const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const loopServiceSource = readFileSync(
  new URL("./loop-service.ts", import.meta.url),
  "utf8",
)
const acpBackgroundNotifierSource = readFileSync(
  new URL("./acp/acp-background-notifier.ts", import.meta.url),
  "utf8",
)
const agentModeRunnerSource = readFileSync(
  new URL("./agent-mode-runner.ts", import.meta.url),
  "utf8",
)
const conversationHistorySelectionSource = readFileSync(
  new URL("./conversation-history-selection.ts", import.meta.url),
  "utf8",
)
const conversationManagementSource = readFileSync(
  new URL("./conversation-management.ts", import.meta.url),
  "utf8",
)
const agentProfileActivationSource = readFileSync(
  new URL("./agent-profile-activation.ts", import.meta.url),
  "utf8",
)
const agentProfileManagementSource = readFileSync(
  new URL("./agent-profile-management.ts", import.meta.url),
  "utf8",
)
const agentProfileServiceSource = readFileSync(
  new URL("./agent-profile-service.ts", import.meta.url),
  "utf8",
)
const appRuntimeSource = readFileSync(
  new URL("./app-runtime.ts", import.meta.url),
  "utf8",
)
const remoteAccessRuntimeSource = readFileSync(
  new URL("./remote-access-runtime.ts", import.meta.url),
  "utf8",
)
const cloudflareRuntimeSource = readFileSync(
  new URL("./cloudflare-runtime.ts", import.meta.url),
  "utf8",
)
const remoteServerQrSource = readFileSync(
  new URL("./remote-server-qr.ts", import.meta.url),
  "utf8",
)
const remoteServerUrlSource = readFileSync(
  new URL("../shared/remote-server-url.ts", import.meta.url),
  "utf8",
)
const mcpServerStatusSource = readFileSync(
  new URL("../shared/mcp-server-status.ts", import.meta.url),
  "utf8",
)
const mcpManagementSource = readFileSync(
  new URL("./mcp-management.ts", import.meta.url),
  "utf8",
)
const knowledgeNoteManagementSource = readFileSync(
  new URL("./knowledge-note-management.ts", import.meta.url),
  "utf8",
)
const profileSkillManagementSource = readFileSync(
  new URL("./profile-skill-management.ts", import.meta.url),
  "utf8",
)
const skillManagementSource = readFileSync(
  new URL("./skill-management.ts", import.meta.url),
  "utf8",
)
const bundleManagementSource = readFileSync(
  new URL("./bundle-management.ts", import.meta.url),
  "utf8",
)
const sandboxManagementSource = readFileSync(
  new URL("./sandbox-management.ts", import.meta.url),
  "utf8",
)
const localProviderManagementSource = readFileSync(
  new URL("./local-provider-management.ts", import.meta.url),
  "utf8",
)
const sharedProvidersSource = readFileSync(
  new URL("../../../../packages/shared/src/providers.ts", import.meta.url),
  "utf8",
)
const sharedConversationHistorySource = readFileSync(
  new URL(
    "../../../../packages/shared/src/conversation-history.ts",
    import.meta.url,
  ),
  "utf8",
)
const sharedSessionSource = readFileSync(
  new URL("../../../../packages/shared/src/session.ts", import.meta.url),
  "utf8",
)
const agentSessionManagementSource = readFileSync(
  new URL("./agent-session-management.ts", import.meta.url),
  "utf8",
)
const messageQueueManagementSource = readFileSync(
  new URL("./message-queue-management.ts", import.meta.url),
  "utf8",
)
const sharedAgentProfilesSource = readFileSync(
  new URL("../../../../packages/shared/src/agent-profiles.ts", import.meta.url),
  "utf8",
)
const sharedSttModelsSource = readFileSync(
  new URL("../../../../packages/shared/src/stt-models.ts", import.meta.url),
  "utf8",
)
const headlessRuntimeSource = readFileSync(
  new URL("./headless-runtime.ts", import.meta.url),
  "utf8",
)
const loopSummariesSource = readFileSync(
  new URL("./loop-summaries.ts", import.meta.url),
  "utf8",
)
const loopManagementSource = readFileSync(
  new URL("./loop-management.ts", import.meta.url),
  "utf8",
)
const settingsRemoteServerSource = readFileSync(
  new URL("../renderer/src/pages/settings-remote-server.tsx", import.meta.url),
  "utf8",
)
const settingsLoopsSource = readFileSync(
  new URL("../renderer/src/pages/settings-loops.tsx", import.meta.url),
  "utf8",
)
const knowledgePageSource = readFileSync(
  new URL("../renderer/src/pages/knowledge.tsx", import.meta.url),
  "utf8",
)
const settingsModelsSource = readFileSync(
  new URL("../renderer/src/pages/settings-models.tsx", import.meta.url),
  "utf8",
)
const settingsGeneralMainAgentOptionsSource = readFileSync(
  new URL(
    "../renderer/src/pages/settings-general-main-agent-options.ts",
    import.meta.url,
  ),
  "utf8",
)
const modelPresetManagerSource = readFileSync(
  new URL(
    "../renderer/src/components/model-preset-manager.tsx",
    import.meta.url,
  ),
  "utf8",
)
const modelSelectorSource = readFileSync(
  new URL("../renderer/src/components/model-selector.tsx", import.meta.url),
  "utf8",
)
const agentSelectorSource = readFileSync(
  new URL("../renderer/src/components/agent-selector.tsx", import.meta.url),
  "utf8",
)
const settingsProvidersSource = readFileSync(
  new URL("../renderer/src/pages/settings-providers.tsx", import.meta.url),
  "utf8",
)
const settingsGeneralSource = readFileSync(
  new URL("../renderer/src/pages/settings-general.tsx", import.meta.url),
  "utf8",
)
const onboardingSource = readFileSync(
  new URL("../renderer/src/pages/onboarding.tsx", import.meta.url),
  "utf8",
)
const settingsAgentsSource = readFileSync(
  new URL("../renderer/src/pages/settings-agents.tsx", import.meta.url),
  "utf8",
)
const settingsSkillsSource = readFileSync(
  new URL("../renderer/src/pages/settings-skills.tsx", import.meta.url),
  "utf8",
)
const agentCapabilitiesSidebarSource = readFileSync(
  new URL(
    "../renderer/src/components/agent-capabilities-sidebar.tsx",
    import.meta.url,
  ),
  "utf8",
)
const agentStoreSource = readFileSync(
  new URL("../renderer/src/stores/agent-store.ts", import.meta.url),
  "utf8",
)
const mcpConfigManagerSource = readFileSync(
  new URL("../renderer/src/components/mcp-config-manager.tsx", import.meta.url),
  "utf8",
)
const sandboxSlotSwitcherSource = readFileSync(
  new URL(
    "../renderer/src/components/sandbox-slot-switcher.tsx",
    import.meta.url,
  ),
  "utf8",
)
const pinnedSessionHistorySource = readFileSync(
  new URL("../renderer/src/lib/pinned-session-history.ts", import.meta.url),
  "utf8",
)
const sidebarSessionsSource = readFileSync(
  new URL("../renderer/src/lib/sidebar-sessions.ts", import.meta.url),
  "utf8",
)
const useStoreSyncSource = readFileSync(
  new URL("../renderer/src/hooks/use-store-sync.ts", import.meta.url),
  "utf8",
)
const mobileSessionsSource = readFileSync(
  new URL("../../../mobile/src/store/sessions.ts", import.meta.url),
  "utf8",
)
const mobileAgentSelectorOptionsSource = readFileSync(
  new URL("../../../mobile/src/ui/agentSelectorOptions.ts", import.meta.url),
  "utf8",
)
const mobileMainAgentOptionsSource = readFileSync(
  new URL("../../../mobile/src/lib/mainAgentOptions.ts", import.meta.url),
  "utf8",
)
const aiSdkProviderSource = readFileSync(
  new URL("./ai-sdk-provider.ts", import.meta.url),
  "utf8",
)
const contextBudgetSource = readFileSync(
  new URL("./context-budget.ts", import.meta.url),
  "utf8",
)
const llmSource = readFileSync(new URL("./llm.ts", import.meta.url), "utf8")
const mcpSamplingSource = readFileSync(
  new URL("./mcp-sampling.ts", import.meta.url),
  "utf8",
)
const ttsLlmPreprocessingSource = readFileSync(
  new URL("./tts-llm-preprocessing.ts", import.meta.url),
  "utf8",
)
const summarizationServiceSource = readFileSync(
  new URL("./summarization-service.ts", import.meta.url),
  "utf8",
)
const runtimeToolsSource = readFileSync(
  new URL("./runtime-tools.ts", import.meta.url),
  "utf8",
)
const settingsManagementSource = readFileSync(
  new URL("./settings-management.ts", import.meta.url),
  "utf8",
)
const whatsappManagementSource = readFileSync(
  new URL("./whatsapp-management.ts", import.meta.url),
  "utf8",
)
const remoteAccessManagementSource = readFileSync(
  new URL("./remote-access-management.ts", import.meta.url),
  "utf8",
)
const mainAgentSelectionSource = readFileSync(
  new URL("./main-agent-selection.ts", import.meta.url),
  "utf8",
)
const applySelectedAgentSource = readFileSync(
  new URL("../renderer/src/lib/apply-selected-agent.ts", import.meta.url),
  "utf8",
)
const indexSource = readFileSync(new URL("./index.ts", import.meta.url), "utf8")
const docsSource = readFileSync(
  new URL("../../CLI_DESKTOP_FEATURE_PATHS.md", import.meta.url),
  "utf8",
)

describe("CLI and desktop feature paths", () => {
  it("routes fresh prompt entrypoints through the shared launcher and conversation/session bootstrap", () => {
    expect(agentModeRunnerSource).toContain(
      "export async function startSharedPromptRun",
    )
    expect(agentModeRunnerSource).toContain(
      "export async function startSharedResumeRun",
    )
    expect(agentModeRunnerSource).toContain(
      "export function ensureAgentSessionForConversation",
    )
    expect(agentModeRunnerSource).toContain(
      "export async function preparePromptExecutionContext",
    )
    expect(agentModeRunnerSource).toContain(
      "export async function prepareResumeExecutionContext",
    )
    expect(headlessCliSource).toContain("startSharedPromptRun({")
    expect(remoteServerSource).toContain("startSharedPromptRun({")
    expect(remoteServerSource).toContain(
      "preserveActiveSessionSnoozeState: true",
    )
    expect(tipcSource).toContain("return startSharedPromptRun({")
    expect(tipcSource).toContain("ensureAgentSessionForConversation({")
    expect(loopServiceSource).toContain("await startSharedPromptRun({")
  })

  it("routes the headless CLI through the shared launcher and runner", () => {
    expect(headlessCliSource).toContain(
      "toolApprovalManager.registerSessionApprovalHandler(",
    )
    expect(headlessCliSource).toContain("onPreparedContext:")
    expect(headlessCliSource).toContain("const agentResult = await runPromise")
  })

  it("shares CLI conversation selection through one helper before continuing a prior conversation", () => {
    expect(conversationHistorySelectionSource).toContain(
      "export function resolveConversationHistorySelection",
    )
    expect(headlessCliSource).toContain("resolveConversationHistorySelection(")
    expect(headlessCliSource).toContain('case "/use":')
    expect(headlessCliSource).toContain('case "/show":')
    expect(headlessCliSource).toContain(
      "requestedConversationId: currentConversationId",
    )
  })

  it("shares session pin/archive helpers across CLI, desktop, and remote surfaces", () => {
    expect(sharedSessionSource).toContain(
      "export function orderItemsByPinnedFirst",
    )
    expect(sharedSessionSource).toContain(
      "export function sanitizeConversationSessionState",
    )
    expect(sharedSessionSource).toContain(
      "export function setConversationSessionStateMembership",
    )
    expect(sharedSessionSource).toContain(
      "export function removeSessionIdFromConversationSessionState",
    )
    expect(sharedSessionSource).toContain(
      "export function sanitizeSessionIdList",
    )
    expect(sharedSessionSource).toContain(
      "export function setSessionIdMembership",
    )
    expect(headlessCliSource).toContain('case "/pin":')
    expect(headlessCliSource).toContain('case "/archive":')
    expect(headlessCliSource).toContain("orderItemsByPinnedFirst(")
    expect(headlessCliSource).toContain("sanitizeConversationSessionState(")
    expect(headlessCliSource).toContain(
      "setConversationSessionStateMembership(",
    )
    expect(conversationManagementSource).toContain(
      "removeSessionIdFromConversationSessionState(",
    )
    expect(agentStoreSource).toContain("setSessionIdMembership(")
    expect(pinnedSessionHistorySource).toContain("orderItemsByPinnedFirst(")
    expect(sidebarSessionsSource).toContain("orderItemsByPinnedFirst(")
    expect(useStoreSyncSource).toContain("sanitizeConversationSessionState(")
    expect(settingsManagementSource).toContain(
      "sanitizeConversationSessionState(",
    )
    expect(mobileSessionsSource).toContain("sanitizeConversationSessionState(")
    expect(mobileSessionsSource).toContain(
      "setConversationSessionStateMembership(",
    )
  })

  it("shares tracked agent-session snapshots and stop/clear actions across CLI and desktop surfaces", () => {
    expect(agentSessionManagementSource).toContain(
      "export function getManagedAgentSessions(",
    )
    expect(agentSessionManagementSource).toContain(
      "export function clearManagedInactiveAgentSessions(",
    )
    expect(agentSessionManagementSource).toContain(
      "export async function stopManagedAgentSession(",
    )
    expect(agentSessionManagementSource).toContain(
      "export function resolveManagedAgentSessionSelection",
    )
    expect(headlessCliSource).toContain("getManagedAgentSessions()")
    expect(headlessCliSource).toContain('case "/sessions":')
    expect(headlessCliSource).toContain('case "/session-stop":')
    expect(headlessCliSource).toContain('case "/sessions-clear":')
    expect(headlessCliSource).toContain("resolveManagedAgentSessionSelection(")
    expect(headlessCliSource).toContain("await stopManagedAgentSession(")
    expect(headlessCliSource).toContain("clearManagedInactiveAgentSessions()")
    expect(tipcSource).toContain(
      "const { clearedCount } = clearManagedInactiveAgentSessions()",
    )
    expect(tipcSource).toContain("return getManagedAgentSessions()")
    expect(tipcSource).toContain(
      "await stopManagedAgentSession(input.sessionId)",
    )
    expect(docsSource).toContain("## Shared agent session management")
    expect(docsSource).toContain("`/sessions`")
    expect(docsSource).toContain("`/session-stop`")
    expect(docsSource).toContain("`/sessions-clear`")
  })

  it("shares conversation browsing and management across CLI, desktop, remote, and runtime tool surfaces", () => {
    expect(conversationManagementSource).toContain(
      "export async function getManagedConversationHistory",
    )
    expect(conversationManagementSource).toContain(
      "export async function getManagedConversation(",
    )
    expect(conversationManagementSource).toContain(
      "export async function saveManagedConversation(",
    )
    expect(conversationManagementSource).toContain(
      "export async function createManagedConversation(",
    )
    expect(conversationManagementSource).toContain(
      "export async function addManagedMessageToConversation(",
    )
    expect(conversationManagementSource).toContain(
      "export async function renameConversationTitleAndSyncSession",
    )
    expect(conversationManagementSource).toContain(
      "export async function deleteConversationAndSyncSessionState",
    )
    expect(conversationManagementSource).toContain(
      "export async function deleteAllConversationsAndSyncSessionState",
    )
    expect(headlessCliSource).toContain('case "/rename":')
    expect(headlessCliSource).toContain('case "/delete":')
    expect(headlessCliSource).toContain('case "/delete-all":')
    expect(headlessCliSource).toContain("getManagedConversationHistory()")
    expect(headlessCliSource).toContain("getManagedConversation(")
    expect(headlessCliSource).toContain(
      "renameConversationTitleAndSyncSession(",
    )
    expect(headlessCliSource).toContain(
      "deleteConversationAndSyncSessionState(",
    )
    expect(headlessCliSource).toContain(
      "deleteAllConversationsAndSyncSessionState()",
    )
    expect(tipcSource).toContain("return getManagedConversationHistory()")
    expect(tipcSource).toContain("return getManagedConversation(")
    expect(tipcSource).toContain("await saveManagedConversation(")
    expect(tipcSource).toContain("return createManagedConversation(")
    expect(tipcSource).toContain("return addManagedMessageToConversation(")
    expect(tipcSource).toContain(
      "return renameConversationTitleAndSyncSession(",
    )
    expect(tipcSource).toContain(
      "await deleteConversationAndSyncSessionState(input.conversationId)",
    )
    expect(tipcSource).toContain(
      "await deleteAllConversationsAndSyncSessionState()",
    )
    expect(remoteServerSource).toContain(
      "const conversations = await getManagedConversationHistory()",
    )
    expect(remoteServerSource).toContain(
      "const conversation = await getManagedConversation(conversationId)",
    )
    expect(remoteServerSource).toContain("await saveManagedConversation(")
    expect(runtimeToolsSource).toContain(
      "renameConversationTitleAndSyncSession(",
    )
  })

  it("shares agent profile activation across CLI, desktop, and remote surfaces", () => {
    expect(agentProfileActivationSource).toContain(
      "export function buildConfigForActivatedProfile",
    )
    expect(agentProfileActivationSource).toContain(
      "export function activateAgentProfile(",
    )
    expect(agentProfileActivationSource).toContain(
      "export function activateAgentProfileById(",
    )
    expect(agentProfileManagementSource).toContain(
      "export function setManagedCurrentAgentProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "activateAgentProfileById(normalizedProfileId)",
    )
    expect(headlessCliSource).toContain('case "/agents":')
    expect(headlessCliSource).toContain('case "/agent":')
    expect(headlessCliSource).toContain(
      "const result = setManagedCurrentAgentProfile(selectedAgent.id)",
    )
    expect(tipcSource).toContain(
      "const result = setManagedCurrentAgentProfile(input.id)",
    )
    expect(remoteServerSource).toContain(
      "const result = setManagedCurrentAgentProfile(profileId)",
    )
  })

  it("shares current agent profile catalog reads across CLI, desktop, and remote surfaces", () => {
    expect(agentProfileManagementSource).toContain(
      "export function getManagedUserAgentProfiles",
    )
    expect(agentProfileManagementSource).toContain(
      "export function getManagedAgentTargets",
    )
    expect(agentProfileManagementSource).toContain(
      "export function getManagedEnabledAgentTargets",
    )
    expect(agentProfileManagementSource).toContain(
      "export function getManagedExternalAgents",
    )
    expect(agentProfileManagementSource).toContain(
      "export function getManagedCurrentAgentProfile",
    )
    expect(headlessCliSource).toContain("getManagedCurrentAgentProfile()")
    expect(tipcSource).toContain("return getManagedUserAgentProfiles()")
    expect(tipcSource).toContain("return getManagedAgentTargets()")
    expect(tipcSource).toContain("return getManagedEnabledAgentTargets()")
    expect(tipcSource).toContain("return getManagedCurrentAgentProfile()")
    expect(tipcSource).toContain("return getManagedExternalAgents()")
    expect(remoteServerSource).toContain("getManagedUserAgentProfiles()")
    expect(remoteServerSource).toContain("getManagedCurrentAgentProfile()")
  })

  it("shares agent profile management across CLI, desktop, and remote surfaces", () => {
    expect(agentProfileManagementSource).toContain(
      "export function getManagedAgentProfiles",
    )
    expect(agentProfileManagementSource).toContain(
      "export function getManagedAgentProfile(",
    )
    expect(agentProfileManagementSource).toContain(
      "export function resolveManagedAgentProfileSelection",
    )
    expect(agentProfileManagementSource).toContain(
      "export function createManagedAgentProfile(",
    )
    expect(agentProfileManagementSource).toContain(
      "export function updateManagedAgentProfile(",
    )
    expect(agentProfileManagementSource).toContain(
      "export function toggleManagedAgentProfileEnabled(",
    )
    expect(agentProfileManagementSource).toContain(
      "export function deleteManagedAgentProfile(",
    )
    expect(headlessCliSource).toContain('case "/agent-profiles":')
    expect(headlessCliSource).toContain('case "/agent-show":')
    expect(headlessCliSource).toContain('case "/agent-new":')
    expect(headlessCliSource).toContain('case "/agent-edit":')
    expect(headlessCliSource).toContain('case "/agent-toggle":')
    expect(headlessCliSource).toContain('case "/agent-delete":')
    expect(headlessCliSource).toContain("getManagedAgentProfiles(), {")
    expect(headlessCliSource).toContain("printAgentProfiles()")
    expect(headlessCliSource).toContain("resolveManagedAgentProfileSelection(")
    expect(headlessCliSource).toContain("createManagedAgentProfile(payload)")
    expect(headlessCliSource).toContain(
      "updateManagedAgentProfile(profile.id, parsedCommand.payload)",
    )
    expect(headlessCliSource).toContain(
      "toggleManagedAgentProfileEnabled(profile.id)",
    )
    expect(headlessCliSource).toContain("deleteManagedAgentProfile(profile.id)")
    expect(tipcSource).toContain("return getManagedAgentProfiles()")
    expect(tipcSource).toContain("return getManagedAgentProfile(input.id)")
    expect(tipcSource).toContain(
      "const result = createManagedAgentProfile(input.profile)",
    )
    expect(tipcSource).toContain(
      "const result = updateManagedAgentProfile(input.id, input.updates)",
    )
    expect(tipcSource).toContain(
      "const result = deleteManagedAgentProfile(input.id)",
    )
    expect(tipcSource).toContain(
      "return getManagedAgentProfiles({ role: input.role })",
    )
    expect(remoteServerSource).toContain(
      "getManagedAgentProfiles({ role: query.role })",
    )
    expect(remoteServerSource).toContain("getManagedAgentProfile(params.id)")
    expect(remoteServerSource).toContain(
      "toggleManagedAgentProfileEnabled(params.id)",
    )
    expect(remoteServerSource).toContain("createManagedAgentProfile(body)")
    expect(remoteServerSource).toContain(
      "updateManagedAgentProfile(params.id, body)",
    )
    expect(remoteServerSource).toContain("deleteManagedAgentProfile(params.id)")
  })

  it("shares agent profile import/export across headless, desktop, and remote surfaces", () => {
    expect(agentProfileManagementSource).toContain(
      "export function exportManagedAgentProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "export function importManagedAgentProfile",
    )
    expect(headlessCliSource).toContain('case "/agent-export":')
    expect(headlessCliSource).toContain('case "/agent-export-file":')
    expect(headlessCliSource).toContain('case "/agent-import":')
    expect(headlessCliSource).toContain('case "/agent-import-file":')
    expect(headlessCliSource).toContain("exportManagedAgentProfile(profile.id)")
    expect(headlessCliSource).toContain(
      "importManagedAgentProfile(profileJson)",
    )
    expect(tipcSource).toContain(
      "const result = exportManagedAgentProfile(input.id)",
    )
    expect(tipcSource).toContain(
      "const result = importManagedAgentProfile(input.profileJson)",
    )
    expect(tipcSource).toContain(
      "const exportResult = exportManagedAgentProfile(input.id)",
    )
    expect(tipcSource).toContain(
      "const importResult = importManagedAgentProfile(profileJson)",
    )
    expect(remoteServerSource).toContain(
      "const result = exportManagedAgentProfile(params.id)",
    )
    expect(remoteServerSource).toContain(
      "const result = importManagedAgentProfile(profileJson)",
    )
  })

  it("shares agent selector profile helpers across CLI, desktop, mobile, and ACP selection surfaces", () => {
    expect(sharedAgentProfilesSource).toContain(
      "export function getAgentProfileDisplayName",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function getEnabledAgentProfiles",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function sortAgentProfilesByPriority",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function getDefaultAgentProfile",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function resolveAgentProfileSelection",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function getAcpCapableAgentProfiles",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function getSelectableMainAcpAgents",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function getAgentProfileCatalogDescription",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function getAgentProfileCatalogSummaryItems",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function getAgentProfileStatusLabels",
    )
    expect(headlessCliSource).toContain("sortAgentProfilesByPriority(")
    expect(headlessCliSource).toContain("getAgentProfileDisplayName(")
    expect(headlessCliSource).toContain("getAgentProfileCatalogDescription(")
    expect(headlessCliSource).toContain("getAgentProfileCatalogSummaryItems(")
    expect(headlessCliSource).toContain("getAgentProfileStatusLabels(")
    expect(agentProfileManagementSource).toContain(
      "resolveAgentProfileSelection(profiles, query)",
    )
    expect(agentSelectorSource).toContain("getEnabledAgentProfiles(")
    expect(agentSelectorSource).toContain("sortAgentProfilesByPriority(")
    expect(agentSelectorSource).toContain("getDefaultAgentProfile(")
    expect(agentSelectorSource).toContain("getAgentProfileDisplayName(")
    expect(applySelectedAgentSource).toContain("getEnabledAgentProfiles(")
    expect(applySelectedAgentSource).toContain("getDefaultAgentProfile(")
    expect(settingsAgentsSource).toContain("getAgentProfileCatalogDescription(")
    expect(settingsAgentsSource).toContain(
      "getAgentProfileCatalogSummaryItems(",
    )
    expect(settingsAgentsSource).toContain("getAgentProfileDisplayName(")
    expect(settingsAgentsSource).toContain("getAgentProfileStatusLabels(")
    expect(mobileAgentSelectorOptionsSource).toContain(
      "getAgentProfileDisplayName(",
    )
    expect(mobileAgentSelectorOptionsSource).toContain(
      "getAgentProfileSummary(",
    )
    expect(settingsGeneralMainAgentOptionsSource).toContain(
      "getSharedSelectableMainAcpAgents(",
    )
    expect(mobileMainAgentOptionsSource).toContain(
      "getSelectableMainAcpAgents(",
    )
    expect(mainAgentSelectionSource).toContain("getSelectableMainAcpAgents(")
    expect(mainAgentSelectionSource).toContain("resolveAgentProfileSelection(")
    expect(mainAgentSelectionSource).toContain("isAcpCapableAgentProfile(")
  })

  it("shares profile skill gating across CLI, desktop, and remote/mobile surfaces", () => {
    expect(sharedAgentProfilesSource).toContain(
      "export function areAllSkillsEnabledForAgentProfile",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function isSkillEnabledForAgentProfile",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function getEnabledSkillIdsForAgentProfile",
    )
    expect(sharedAgentProfilesSource).toContain(
      "export function toggleSkillForAgentProfile",
    )
    expect(agentProfileServiceSource).toContain("toggleSkillForAgentProfile(")
    expect(agentProfileServiceSource).toContain(
      "isSkillEnabledForAgentProfile(",
    )
    expect(profileSkillManagementSource).toContain(
      "getEnabledSkillIdsForAgentProfile(",
    )
    expect(profileSkillManagementSource).toContain(
      "isSkillEnabledForAgentProfile(",
    )
    expect(headlessCliSource).toContain('case "/skills":')
    expect(headlessCliSource).toContain('case "/skill":')
    expect(settingsAgentsSource).toContain("toggleSkillForAgentProfile(")
    expect(settingsAgentsSource).toContain("isSkillEnabledForAgentProfile(")
    expect(agentCapabilitiesSidebarSource).toContain(
      "toggleSkillForAgentProfile(",
    )
    expect(agentCapabilitiesSidebarSource).toContain(
      "getEnabledSkillIdsForAgentProfile(",
    )
  })

  it("shares agent profile management across headless, desktop, and remote surfaces", () => {
    expect(agentProfileManagementSource).toContain(
      "export function getManagedAgentProfiles",
    )
    expect(agentProfileManagementSource).toContain(
      "export function getManagedAgentProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "export function resolveManagedAgentProfileSelection",
    )
    expect(agentProfileManagementSource).toContain(
      "export function createManagedAgentProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "export function updateManagedAgentProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "export function toggleManagedAgentProfileEnabled",
    )
    expect(agentProfileManagementSource).toContain(
      "export function deleteManagedAgentProfile",
    )
    expect(headlessCliSource).toContain('case "/agent-profiles":')
    expect(headlessCliSource).toContain('case "/agent-show":')
    expect(headlessCliSource).toContain('case "/agent-new":')
    expect(headlessCliSource).toContain('case "/agent-edit":')
    expect(headlessCliSource).toContain('case "/agent-toggle":')
    expect(headlessCliSource).toContain('case "/agent-delete":')
    expect(headlessCliSource).toContain("getManagedAgentProfiles()")
    expect(headlessCliSource).toContain("resolveManagedAgentProfileSelection(")
    expect(headlessCliSource).toContain("createManagedAgentProfile(payload)")
    expect(headlessCliSource).toContain(
      "updateManagedAgentProfile(profile.id, parsedCommand.payload)",
    )
    expect(headlessCliSource).toContain(
      "toggleManagedAgentProfileEnabled(profile.id)",
    )
    expect(headlessCliSource).toContain("deleteManagedAgentProfile(profile.id)")
    expect(tipcSource).toContain("return getManagedAgentProfiles()")
    expect(tipcSource).toContain("return getManagedAgentProfile(input.id)")
    expect(tipcSource).toContain("createManagedAgentProfile(input.profile)")
    expect(tipcSource).toContain(
      "updateManagedAgentProfile(input.id, input.updates)",
    )
    expect(tipcSource).toContain("deleteManagedAgentProfile(input.id)")
    expect(tipcSource).toContain(
      "return getManagedAgentProfiles({ role: input.role })",
    )
    expect(remoteServerSource).toContain(
      "profiles: profiles.map(serializeManagedAgentProfileSummary)",
    )
    expect(remoteServerSource).toContain(
      "toggleManagedAgentProfileEnabled(params.id)",
    )
    expect(remoteServerSource).toContain("getManagedAgentProfile(params.id)")
    expect(remoteServerSource).toContain("createManagedAgentProfile(body)")
    expect(remoteServerSource).toContain(
      "updateManagedAgentProfile(params.id, body)",
    )
    expect(remoteServerSource).toContain("deleteManagedAgentProfile(params.id)")
    expect(settingsAgentsSource).toContain("tipcClient.createAgentProfile(")
    expect(settingsAgentsSource).toContain("tipcClient.updateAgentProfile(")
    expect(settingsAgentsSource).toContain("tipcClient.deleteAgentProfile(")
  })

  it("shares legacy desktop profile adapters through the managed agent profile path", () => {
    expect(agentProfileManagementSource).toContain(
      "export function getManagedLegacyProfiles",
    )
    expect(agentProfileManagementSource).toContain(
      "export function getManagedLegacyProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "export function getManagedCurrentLegacyProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "export function createManagedLegacyProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "export function updateManagedLegacyProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "export function deleteManagedLegacyProfile",
    )
    expect(agentProfileManagementSource).toContain(
      "export function setManagedCurrentLegacyProfile",
    )
    expect(tipcSource).toContain("return getManagedLegacyProfiles()")
    expect(tipcSource).toContain("return getManagedLegacyProfile(input.id)")
    expect(tipcSource).toContain("return getManagedCurrentLegacyProfile()")
    expect(tipcSource).toContain(
      "const result = createManagedLegacyProfile(input)",
    )
    expect(tipcSource).toContain("const result = updateManagedLegacyProfile(")
    expect(tipcSource).toContain("return deleteManagedLegacyProfile(input.id)")
    expect(tipcSource).toContain(
      "const result = setManagedCurrentLegacyProfile(input.id)",
    )
  })

  it("shares profile skill management across headless, desktop, and remote surfaces", () => {
    expect(profileSkillManagementSource).toContain(
      "export function getManagedSkillsCatalog",
    )
    expect(profileSkillManagementSource).toContain(
      "export function getManagedCurrentProfileSkills",
    )
    expect(profileSkillManagementSource).toContain(
      "export function toggleManagedSkillForCurrentProfile",
    )
    expect(profileSkillManagementSource).toContain(
      "export function toggleManagedSkillForProfile",
    )
    expect(headlessCliSource).toContain("getManagedSkillsCatalog(")
    expect(headlessCliSource).toContain("getManagedCurrentProfileSkills(")
    expect(headlessCliSource).toContain("toggleManagedSkillForCurrentProfile(")
    expect(remoteServerSource).toContain("getManagedCurrentProfileSkills(")
    expect(remoteServerSource).toContain("toggleManagedSkillForCurrentProfile(")
    expect(tipcSource).toContain("toggleManagedSkillForProfile(")
  })

  it("shares skill catalog CRUD/import/export across headless and desktop surfaces", () => {
    expect(skillManagementSource).toContain(
      "export function resolveManagedSkillSelection",
    )
    expect(skillManagementSource).toContain(
      "export function createManagedSkill(",
    )
    expect(skillManagementSource).toContain(
      "export function updateManagedSkill(",
    )
    expect(skillManagementSource).toContain(
      "export async function deleteManagedSkill(",
    )
    expect(skillManagementSource).toContain(
      "export async function deleteManagedSkills(",
    )
    expect(skillManagementSource).toContain(
      "export async function cleanupManagedStaleSkillReferences",
    )
    expect(skillManagementSource).toContain(
      "export function importManagedSkillFromMarkdown(",
    )
    expect(skillManagementSource).toContain(
      "export function importManagedSkillFromFile(",
    )
    expect(skillManagementSource).toContain(
      "export function importManagedSkillFromFolder(",
    )
    expect(skillManagementSource).toContain(
      "export function importManagedSkillsFromParentFolder(",
    )
    expect(skillManagementSource).toContain(
      "export function exportManagedSkillToMarkdown(",
    )
    expect(skillManagementSource).toContain(
      "export function ensureManagedSkillFile(",
    )
    expect(skillManagementSource).toContain(
      "export function scanManagedSkillsFolder(",
    )
    expect(skillManagementSource).toContain(
      "export async function importManagedSkillFromGitHub(",
    )
    expect(headlessCliSource).toContain('case "/skill-show":')
    expect(headlessCliSource).toContain('case "/skill-new":')
    expect(headlessCliSource).toContain('case "/skill-edit":')
    expect(headlessCliSource).toContain('case "/skill-delete":')
    expect(headlessCliSource).toContain('case "/skill-delete-many":')
    expect(headlessCliSource).toContain('case "/skill-export":')
    expect(headlessCliSource).toContain('case "/skill-path":')
    expect(headlessCliSource).toContain('case "/skill-import-file":')
    expect(headlessCliSource).toContain('case "/skill-import-folder":')
    expect(headlessCliSource).toContain('case "/skill-import-parent":')
    expect(headlessCliSource).toContain('case "/skill-import-github":')
    expect(headlessCliSource).toContain('case "/skill-scan":')
    expect(headlessCliSource).toContain('case "/skill-cleanup":')
    expect(headlessCliSource).toContain("resolveManagedSkillSelection(")
    expect(headlessCliSource).toContain("createManagedSkill(")
    expect(headlessCliSource).toContain("updateManagedSkill(")
    expect(headlessCliSource).toContain("await deleteManagedSkill(")
    expect(headlessCliSource).toContain("await deleteManagedSkills(")
    expect(headlessCliSource).toContain("exportManagedSkillToMarkdown(")
    expect(headlessCliSource).toContain("getManagedSkillCanonicalFilePath(")
    expect(headlessCliSource).toContain("importManagedSkillFromFile(")
    expect(headlessCliSource).toContain("importManagedSkillFromFolder(")
    expect(headlessCliSource).toContain("importManagedSkillsFromParentFolder(")
    expect(headlessCliSource).toContain("importManagedSkillFromGitHub(")
    expect(headlessCliSource).toContain("scanManagedSkillsFolder()")
    expect(headlessCliSource).toContain("cleanupManagedStaleSkillReferences()")
    expect(tipcSource).toContain("return getManagedSkillsCatalog()")
    expect(tipcSource).toContain("return createManagedSkill(input)")
    expect(tipcSource).toContain("return updateManagedSkill(id, updates)")
    expect(tipcSource).toContain("const result = await deleteManagedSkill(")
    expect(tipcSource).toContain("const result = await deleteManagedSkills(")
    expect(tipcSource).toContain("return cleanupManagedStaleSkillReferences()")
    expect(tipcSource).toContain("return importManagedSkillFromMarkdown(")
    expect(tipcSource).toContain("return exportManagedSkillToMarkdown(")
    expect(tipcSource).toContain("return importManagedSkillFromFile(")
    expect(tipcSource).toContain("return importManagedSkillFromFolder(")
    expect(tipcSource).toContain("return importManagedSkillsFromParentFolder(")
    expect(tipcSource).toContain("const skill = getManagedSkill(input.id)")
    expect(tipcSource).toContain("const ensuredFile = ensureManagedSkillFile(")
    expect(tipcSource).toContain("return scanManagedSkillsFolder()")
    expect(tipcSource).toContain("return importManagedSkillFromGitHub(")
    expect(settingsSkillsSource).toContain("tipcClient.createSkill(")
    expect(settingsSkillsSource).toContain("tipcClient.updateSkill(")
    expect(settingsSkillsSource).toContain("tipcClient.deleteSkill(")
    expect(settingsSkillsSource).toContain("tipcClient.deleteSkills(")
    expect(settingsSkillsSource).toContain("tipcClient.saveSkillFile(")
    expect(settingsSkillsSource).toContain("tipcClient.openSkillFile(")
    expect(settingsSkillsSource).toContain("tipcClient.scanSkillsFolder(")
    expect(settingsSkillsSource).toContain("tipcClient.importSkillFromGitHub(")
  })

  it("shares bundle export/import/publish flows across headless and desktop surfaces", () => {
    expect(bundleManagementSource).toContain(
      "export function getManagedBundleExportableItems",
    )
    expect(bundleManagementSource).toContain(
      "export async function exportManagedBundle(",
    )
    expect(bundleManagementSource).toContain(
      "export async function exportManagedBundleToFile(",
    )
    expect(bundleManagementSource).toContain(
      "export function previewManagedBundleWithConflicts(",
    )
    expect(bundleManagementSource).toContain(
      "export async function importManagedBundle(",
    )
    expect(bundleManagementSource).toContain(
      "export async function generateManagedBundlePublishPayload(",
    )
    expect(bundleManagementSource).toContain(
      "export async function refreshRuntimeAfterManagedBundleImport",
    )
    expect(headlessCliSource).toContain('case "/bundle-items":')
    expect(headlessCliSource).toContain('case "/bundle-export":')
    expect(headlessCliSource).toContain('case "/bundle-preview":')
    expect(headlessCliSource).toContain('case "/bundle-import":')
    expect(headlessCliSource).toContain('case "/bundle-publish-payload":')
    expect(headlessCliSource).toContain("getManagedBundleExportableItems()")
    expect(headlessCliSource).toContain("await exportManagedBundle(")
    expect(headlessCliSource).toContain("previewManagedBundleWithConflicts(")
    expect(headlessCliSource).toContain("await importManagedBundle(")
    expect(headlessCliSource).toContain(
      "await generateManagedBundlePublishPayload(",
    )
    expect(tipcSource).toContain("return getManagedBundleExportableItems()")
    expect(tipcSource).toContain("return exportManagedBundleToFile(")
    expect(tipcSource).toContain("return generateManagedBundlePublishPayload(")
    expect(tipcSource).toContain(
      "return previewManagedBundleWithConflicts(input.filePath)",
    )
    expect(tipcSource).toContain("return importManagedBundle(input.filePath, {")
    expect(tipcSource).toContain(
      "await refreshRuntimeAfterManagedBundleImport()",
    )
  })

  it("shares sandbox slot management across headless and desktop surfaces", () => {
    expect(sandboxManagementSource).toContain(
      "export function getManagedSandboxState()",
    )
    expect(sandboxManagementSource).toContain(
      "export function resolveManagedSandboxSlotSelection",
    )
    expect(sandboxManagementSource).toContain(
      "export function saveManagedSandboxBaseline()",
    )
    expect(sandboxManagementSource).toContain(
      "export function saveManagedCurrentSandboxSlot(",
    )
    expect(sandboxManagementSource).toContain(
      "export async function switchManagedSandboxSlot(",
    )
    expect(sandboxManagementSource).toContain(
      "export async function restoreManagedSandboxBaseline()",
    )
    expect(sandboxManagementSource).toContain(
      "export function deleteManagedSandboxSlot(",
    )
    expect(sandboxManagementSource).toContain(
      "export function renameManagedSandboxSlot(",
    )
    expect(sandboxManagementSource).toContain(
      "export async function importManagedBundleToSandbox(",
    )
    expect(headlessCliSource).toContain('case "/sandboxes":')
    expect(headlessCliSource).toContain('case "/sandbox-baseline-save":')
    expect(headlessCliSource).toContain('case "/sandbox-baseline-restore":')
    expect(headlessCliSource).toContain('case "/sandbox-slot-save":')
    expect(headlessCliSource).toContain('case "/sandbox-slot-switch":')
    expect(headlessCliSource).toContain('case "/sandbox-slot-delete":')
    expect(headlessCliSource).toContain('case "/sandbox-slot-rename":')
    expect(headlessCliSource).toContain('case "/sandbox-bundle-import":')
    expect(headlessCliSource).toContain("getManagedSandboxState()")
    expect(headlessCliSource).toContain("resolveManagedSandboxSlotSelection(")
    expect(headlessCliSource).toContain("saveManagedSandboxBaseline()")
    expect(headlessCliSource).toContain("saveManagedCurrentSandboxSlot(")
    expect(headlessCliSource).toContain("await switchManagedSandboxSlot(")
    expect(headlessCliSource).toContain("await restoreManagedSandboxBaseline()")
    expect(headlessCliSource).toContain("deleteManagedSandboxSlot(")
    expect(headlessCliSource).toContain("renameManagedSandboxSlot(")
    expect(headlessCliSource).toContain("await importManagedBundleToSandbox(")
    expect(tipcSource).toContain('from "./sandbox-management"')
    expect(tipcSource).toContain("return getManagedSandboxState()")
    expect(tipcSource).toContain("return saveManagedSandboxBaseline()")
    expect(tipcSource).toContain("return saveManagedCurrentSandboxSlot(")
    expect(tipcSource).toContain("return switchManagedSandboxSlot(input.name)")
    expect(tipcSource).toContain("return restoreManagedSandboxBaseline()")
    expect(tipcSource).toContain("return deleteManagedSandboxSlot(input.name)")
    expect(tipcSource).toContain(
      "return renameManagedSandboxSlot(input.oldName, input.newName)",
    )
    expect(tipcSource).toContain("return importManagedBundleToSandbox({")
    expect(sandboxSlotSwitcherSource).toContain("tipcClient.getSandboxState()")
    expect(sandboxSlotSwitcherSource).toContain("tipcClient.saveBaseline()")
    expect(sandboxSlotSwitcherSource).toContain("tipcClient.saveCurrentAsSlot(")
    expect(sandboxSlotSwitcherSource).toContain("tipcClient.switchToSlot(")
    expect(sandboxSlotSwitcherSource).toContain("tipcClient.restoreBaseline()")
    expect(sandboxSlotSwitcherSource).toContain("tipcClient.deleteSlot(")
    expect(sandboxSlotSwitcherSource).toContain("tipcClient.renameSlot(")
    expect(docsSource).toContain("## Shared sandbox slot management")
    expect(docsSource).toContain("`/sandboxes`")
    expect(docsSource).toContain("`/sandbox-baseline-save`")
    expect(docsSource).toContain("`/sandbox-baseline-restore`")
    expect(docsSource).toContain("`/sandbox-slot-save`")
    expect(docsSource).toContain("`/sandbox-slot-switch`")
    expect(docsSource).toContain("`/sandbox-slot-delete`")
    expect(docsSource).toContain("`/sandbox-slot-rename`")
    expect(docsSource).toContain("`/sandbox-bundle-import`")
  })

  it("shares WhatsApp connection management across headless and desktop surfaces", () => {
    expect(whatsappManagementSource).toContain(
      "export async function getManagedWhatsappStatus()",
    )
    expect(whatsappManagementSource).toContain(
      "export async function connectManagedWhatsapp()",
    )
    expect(whatsappManagementSource).toContain(
      "export async function disconnectManagedWhatsapp()",
    )
    expect(whatsappManagementSource).toContain(
      "export async function logoutManagedWhatsapp()",
    )
    expect(headlessCliSource).toContain('case "/whatsapp-status":')
    expect(headlessCliSource).toContain('case "/whatsapp-connect":')
    expect(headlessCliSource).toContain('case "/whatsapp-disconnect":')
    expect(headlessCliSource).toContain('case "/whatsapp-logout":')
    expect(headlessCliSource).toContain("await getManagedWhatsappStatus()")
    expect(headlessCliSource).toContain("await connectManagedWhatsapp()")
    expect(headlessCliSource).toContain("await disconnectManagedWhatsapp()")
    expect(headlessCliSource).toContain("await logoutManagedWhatsapp()")
    expect(tipcSource).toContain("return connectManagedWhatsapp()")
    expect(tipcSource).toContain("return getManagedWhatsappStatus()")
    expect(tipcSource).toContain("return disconnectManagedWhatsapp()")
    expect(tipcSource).toContain("return logoutManagedWhatsapp()")
    expect(docsSource).toContain("## Shared WhatsApp management")
    expect(docsSource).toContain("`/whatsapp-status`")
    expect(docsSource).toContain("`/whatsapp-connect`")
    expect(docsSource).toContain("`/whatsapp-disconnect`")
    expect(docsSource).toContain("`/whatsapp-logout`")
  })

  it("shares local provider model management across headless and desktop surfaces", () => {
    expect(localProviderManagementSource).toContain(
      "export async function getManagedParakeetModelStatus()",
    )
    expect(localProviderManagementSource).toContain(
      "export async function downloadManagedParakeetModel(",
    )
    expect(localProviderManagementSource).toContain(
      "export async function getManagedKittenModelStatus()",
    )
    expect(localProviderManagementSource).toContain(
      "export async function downloadManagedKittenModel(",
    )
    expect(localProviderManagementSource).toContain(
      "export async function getManagedSupertonicModelStatus()",
    )
    expect(localProviderManagementSource).toContain(
      "export async function downloadManagedSupertonicModel(",
    )
    expect(headlessCliSource).toContain('case "/parakeet-status":')
    expect(headlessCliSource).toContain('case "/parakeet-download":')
    expect(headlessCliSource).toContain('case "/kitten-status":')
    expect(headlessCliSource).toContain('case "/kitten-download":')
    expect(headlessCliSource).toContain('case "/supertonic-status":')
    expect(headlessCliSource).toContain('case "/supertonic-download":')
    expect(headlessCliSource).toContain("getManagedParakeetModelStatus")
    expect(headlessCliSource).toContain("downloadManagedParakeetModel")
    expect(headlessCliSource).toContain("getManagedKittenModelStatus")
    expect(headlessCliSource).toContain("downloadManagedKittenModel")
    expect(headlessCliSource).toContain("getManagedSupertonicModelStatus")
    expect(headlessCliSource).toContain("downloadManagedSupertonicModel")
    expect(tipcSource).toContain("return getManagedParakeetModelStatus()")
    expect(tipcSource).toContain("return downloadManagedParakeetModel()")
    expect(tipcSource).toContain("return getManagedKittenModelStatus()")
    expect(tipcSource).toContain("return downloadManagedKittenModel(")
    expect(tipcSource).toContain("return getManagedSupertonicModelStatus()")
    expect(tipcSource).toContain("return downloadManagedSupertonicModel(")
    expect(settingsProvidersSource).toContain(
      'invoke("getParakeetModelStatus")',
    )
    expect(settingsProvidersSource).toContain('invoke("downloadParakeetModel")')
    expect(settingsProvidersSource).toContain('invoke("getKittenModelStatus")')
    expect(settingsProvidersSource).toContain('invoke("downloadKittenModel")')
    expect(settingsProvidersSource).toContain(
      'invoke("getSupertonicModelStatus")',
    )
    expect(settingsProvidersSource).toContain(
      'invoke("downloadSupertonicModel")',
    )
    expect(docsSource).toContain("## Shared local provider model management")
    expect(docsSource).toContain("`/parakeet-status`")
    expect(docsSource).toContain("`/parakeet-download`")
    expect(docsSource).toContain("`/kitten-status`")
    expect(docsSource).toContain("`/kitten-download`")
    expect(docsSource).toContain("`/supertonic-status`")
    expect(docsSource).toContain("`/supertonic-download`")
  })

  it("shares remote-access management across headless and desktop surfaces", () => {
    expect(remoteAccessManagementSource).toContain(
      "export function getManagedRemoteServerStatus()",
    )
    expect(remoteAccessManagementSource).toContain(
      "export async function printManagedRemoteServerQrCode(",
    )
    expect(remoteAccessManagementSource).toContain(
      "export async function checkManagedCloudflaredInstalled()",
    )
    expect(remoteAccessManagementSource).toContain(
      "export async function checkManagedCloudflaredLoggedIn()",
    )
    expect(remoteAccessManagementSource).toContain(
      "export function getManagedCloudflareTunnelStatus()",
    )
    expect(remoteAccessManagementSource).toContain(
      "export async function listManagedCloudflareTunnels()",
    )
    expect(remoteAccessManagementSource).toContain(
      "export async function startManagedConfiguredCloudflareTunnel()",
    )
    expect(remoteAccessManagementSource).toContain(
      "export async function stopManagedCloudflareTunnel()",
    )
    expect(headlessCliSource).toContain('case "/remote-status":')
    expect(headlessCliSource).toContain('case "/remote-qr":')
    expect(headlessCliSource).toContain('case "/cloudflare-status":')
    expect(headlessCliSource).toContain('case "/cloudflare-start":')
    expect(headlessCliSource).toContain('case "/cloudflare-stop":')
    expect(headlessCliSource).toContain('case "/cloudflare-list":')
    expect(headlessCliSource).toContain("getManagedRemoteServerStatus()")
    expect(headlessCliSource).toContain(
      "await printManagedRemoteServerQrCode()",
    )
    expect(headlessCliSource).toContain(
      "await startManagedConfiguredCloudflareTunnel()",
    )
    expect(headlessCliSource).toContain("await stopManagedCloudflareTunnel()")
    expect(headlessCliSource).toContain("await listManagedCloudflareTunnels()")
    expect(headlessCliSource).toContain(
      "await checkManagedCloudflaredInstalled()",
    )
    expect(headlessCliSource).toContain(
      "await checkManagedCloudflaredLoggedIn()",
    )
    expect(tipcSource).toContain("return checkManagedCloudflaredInstalled()")
    expect(tipcSource).toContain("return startManagedCloudflareQuickTunnel()")
    expect(tipcSource).toContain(
      "return startManagedCloudflareNamedTunnel(input)",
    )
    expect(tipcSource).toContain("return stopManagedCloudflareTunnel()")
    expect(tipcSource).toContain("return getManagedCloudflareTunnelStatus()")
    expect(tipcSource).toContain("return listManagedCloudflareTunnels()")
    expect(tipcSource).toContain("return checkManagedCloudflaredLoggedIn()")
    expect(tipcSource).toContain("return getManagedRemoteServerStatus()")
    expect(tipcSource).toContain("return printManagedRemoteServerQrCode()")
    expect(docsSource).toContain("## Shared remote access management")
    expect(docsSource).toContain("`/remote-status`")
    expect(docsSource).toContain("`/remote-qr`")
    expect(docsSource).toContain("`/cloudflare-status`")
    expect(docsSource).toContain("`/cloudflare-start`")
    expect(docsSource).toContain("`/cloudflare-stop`")
    expect(docsSource).toContain("`/cloudflare-list`")
  })

  it("routes the remote server through the shared launcher and runner", () => {
    expect(remoteServerSource).toContain('approvalMode: "dialog"')
    expect(remoteServerSource).toContain("const agentResult = await runPromise")
    expect(remoteServerSource).not.toContain("state.isAgentModeActive = true")
    expect(remoteServerSource).not.toContain("state.shouldStopAgent = false")
    expect(remoteServerSource).not.toContain("state.agentIterationCount = 0")
  })

  it("keeps desktop UI and loop entry points on the shared runner", () => {
    expect(tipcSource).toContain("async function startDesktopPromptRun(")
    expect(tipcSource).toContain("async function startDesktopResumeRun(")
    expect(tipcSource).toContain("maxIterationsOverride?: number")
    expect(loopServiceSource).toContain(
      "maxIterationsOverride: loop.maxIterations",
    )
  })

  it("shares message-queue inspection and recovery controls across CLI and desktop surfaces", () => {
    expect(messageQueueManagementSource).toContain(
      "export function getManagedMessageQueue(",
    )
    expect(messageQueueManagementSource).toContain(
      "export function getManagedMessageQueues(",
    )
    expect(messageQueueManagementSource).toContain(
      "export function resolveManagedQueuedMessageSelection<",
    )
    expect(messageQueueManagementSource).toContain(
      "export function updateManagedQueuedMessageText(",
    )
    expect(messageQueueManagementSource).toContain(
      "export function retryManagedQueuedMessage(",
    )
    expect(messageQueueManagementSource).toContain(
      "export function resumeManagedMessageQueue(",
    )
    expect(messageQueueManagementSource).toContain(
      "export async function processManagedQueuedMessages(",
    )
    expect(headlessCliSource).toContain('case "/queues":')
    expect(headlessCliSource).toContain('case "/queue":')
    expect(headlessCliSource).toContain('case "/queue-edit":')
    expect(headlessCliSource).toContain('case "/queue-remove":')
    expect(headlessCliSource).toContain('case "/queue-retry":')
    expect(headlessCliSource).toContain('case "/queue-clear":')
    expect(headlessCliSource).toContain('case "/queue-pause":')
    expect(headlessCliSource).toContain('case "/queue-resume":')
    expect(headlessCliSource).toContain("getManagedMessageQueues()")
    expect(headlessCliSource).toContain("getManagedMessageQueue(")
    expect(headlessCliSource).toContain("resolveManagedQueuedMessageSelection(")
    expect(headlessCliSource).toContain("await processManagedQueuedMessages({")
    expect(headlessCliSource).toContain(
      "startResumeRun: (options) => startCliResumeRun(options)",
    )
    expect(tipcSource).toContain("return getManagedMessageQueues()")
    expect(tipcSource).toContain(
      "return getManagedMessageQueue(input.conversationId).messages",
    )
    expect(tipcSource).toContain(
      "const result = updateManagedQueuedMessageText(",
    )
    expect(tipcSource).toContain("const result = retryManagedQueuedMessage(")
    expect(tipcSource).toContain(
      "const result = resumeManagedMessageQueue(input.conversationId)",
    )
    expect(tipcSource).toContain("await processManagedQueuedMessages({")
    expect(docsSource).toContain("## Shared message queue management")
  })

  it("keeps queued prompts and internal resume nudges on the resume-only runner path", () => {
    expect(tipcSource).toContain("} = await startDesktopResumeRun({")
    expect(tipcSource).toContain(
      "candidateSessionIds: existingSessionId ? [existingSessionId] : [],",
    )
    expect(acpBackgroundNotifierSource).toContain("await runAgentLoopSession(")
  })

  it("shares GUI, headless CLI, and QR startup through the same bootstrap helpers", () => {
    expect(appRuntimeSource).toContain(
      "export function registerSharedMainProcessInfrastructure",
    )
    expect(appRuntimeSource).toContain(
      "export async function initializeSharedRuntimeServices",
    )
    expect(appRuntimeSource).toContain(
      "export async function shutdownSharedRuntimeServices",
    )
    expect(cloudflareRuntimeSource).toContain(
      "export async function startConfiguredCloudflareTunnel",
    )
    expect(remoteAccessRuntimeSource).toContain(
      "export async function startSharedRemoteAccessRuntime",
    )
    expect(remoteAccessRuntimeSource).toContain(
      "export async function syncConfiguredRemoteAccess",
    )
    expect(headlessRuntimeSource).toContain(
      "export async function startSharedHeadlessRuntime",
    )
    expect(headlessRuntimeSource).toContain(
      "export async function launchSharedHeadlessMode",
    )
    expect(headlessRuntimeSource).toContain(
      "export function registerSharedHeadlessTerminationHandlers",
    )
    expect(headlessRuntimeSource).toContain("cloudflareTunnelActivation")
    expect(headlessRuntimeSource).toContain("startSharedRemoteAccessRuntime({")
    expect(remoteAccessRuntimeSource).toContain(
      "startConfiguredCloudflareTunnel",
    )
    expect(remoteServerQrSource).toContain(
      "export async function printSharedRemoteServerQrCode",
    )
    expect(remoteAccessRuntimeSource).toContain("startRemoteServerForced({")
    expect(remoteAccessRuntimeSource).toContain("return startRemoteServer()")
    expect(remoteServerSource).toContain("printSharedRemoteServerQrCode({")
    expect(remoteServerSource).toContain('mode: "auto"')
    expect(remoteServerSource).toContain('mode: "manual"')
    expect(headlessRuntimeSource).toContain("shutdownSharedRuntimeServices({")
    expect(indexSource).toContain("registerSharedMainProcessInfrastructure()")
    expect(indexSource).toContain("syncConfiguredRemoteAccess({")
    expect(indexSource).toContain("launchSharedHeadlessMode({")
    expect(indexSource).toContain("shutdownSharedRuntimeServices({")
    expect(indexSource).toContain('cloudflareTunnelActivation: "auto"')
    expect(indexSource).toContain('cloudflareTunnelActivation: "force"')
    expect(settingsManagementSource).toContain("syncConfiguredRemoteAccess({")
    expect(indexSource).toContain('terminationSignals: ["SIGTERM"]')
    expect(indexSource).toContain('label: "headless-runtime"')
    expect(indexSource).toContain('label: "qr-runtime"')
    expect(indexSource).toContain('label: "desktop-runtime"')
    expect(indexSource).toContain("initializeSharedRuntimeServices({")
  })

  it("shares remote server pairing URL rules between main and renderer surfaces", () => {
    expect(remoteServerUrlSource).toContain(
      "export function buildRemoteServerBaseUrl",
    )
    expect(remoteServerUrlSource).toContain(
      "export function resolveRemoteServerPairingPreview",
    )
    expect(remoteServerSource).toContain("../shared/remote-server-url")
    expect(remoteServerQrSource).toContain("../shared/remote-server-url")
    expect(headlessRuntimeSource).toContain("../shared/remote-server-url")
    expect(settingsRemoteServerSource).toContain("@shared/remote-server-url")
    expect(settingsRemoteServerSource).toContain(
      "resolveRemoteServerPairingPreview({",
    )
    expect(settingsRemoteServerSource).toContain(
      "REMOTE_SERVER_LAN_BIND_ADDRESS",
    )
  })

  it("shares settings snapshots and persistence across CLI, desktop, and remote surfaces", () => {
    expect(settingsManagementSource).toContain(
      "export function getManagedSettingsSnapshot",
    )
    expect(settingsManagementSource).toContain(
      "export function getManagedSettingsUpdates",
    )
    expect(settingsManagementSource).toContain(
      "export async function saveManagedConfig",
    )
    expect(settingsManagementSource).toContain("getSelectableMainAcpAgents(")
    expect(settingsManagementSource).toContain("syncConfiguredRemoteAccess({")
    expect(headlessCliSource).toContain('case "/settings":')
    expect(headlessCliSource).toContain('case "/settings-edit":')
    expect(headlessCliSource).toContain("getManagedSettingsSnapshot()")
    expect(headlessCliSource).toContain("getManagedSettingsUpdates(payload)")
    expect(headlessCliSource).toContain("await saveManagedConfig(updates, {")
    expect(remoteServerSource).toContain(
      "return reply.send(getManagedSettingsSnapshot())",
    )
    expect(remoteServerSource).toContain(
      "const updates = getManagedSettingsUpdates(body)",
    )
    expect(remoteServerSource).toContain("await saveManagedConfig(updates, {")
    expect(tipcSource).toContain("await saveManagedConfig(input.config, {")
  })

  it("shares active chat provider/model resolution across CLI, desktop, and renderer surfaces", () => {
    expect(sharedProvidersSource).toContain(
      "export function resolveChatModelSelection",
    )
    expect(sharedProvidersSource).toContain(
      "export function resolveChatModelDisplayInfo",
    )
    expect(sharedProvidersSource).toContain(
      "export function resolveChatProviderId",
    )
    expect(aiSdkProviderSource).toContain("resolveChatModelSelection")
    expect(aiSdkProviderSource).toContain("resolveChatProviderId")
    expect(headlessCliSource).toContain("resolveChatModelDisplayInfo(")
    expect(remoteServerSource).toContain("resolveChatModelSelection(")
    expect(contextBudgetSource).toContain("return resolveChatModelSelection(")
    expect(llmSource).toContain("resolveChatModelDisplayInfo(")
    expect(mcpSamplingSource).toContain("resolveChatModelSelection(config)")
    expect(settingsModelsSource).toContain("resolveChatProviderId(")
    expect(settingsModelsSource).toContain("resolveChatModelSelection(")
  })

  it("shares speech provider and fallback selection across runtime and renderer surfaces", () => {
    expect(sharedSttModelsSource).toContain(
      "export function resolveSttProviderId",
    )
    expect(sharedSttModelsSource).toContain(
      "export function resolveSttModelSelection",
    )
    expect(sharedProvidersSource).toContain(
      "export function resolveTtsProviderId",
    )
    expect(sharedProvidersSource).toContain(
      "export function resolveTtsSelection",
    )
    expect(settingsManagementSource).toContain("resolveSttProviderId")
    expect(settingsManagementSource).toContain("resolveSttModelSelection")
    expect(settingsManagementSource).toContain("resolveTtsProviderId")
    expect(settingsManagementSource).toContain("resolveTtsSelection")
    expect(tipcSource).toContain("resolveSttModelSelection")
    expect(tipcSource).toContain("resolveTtsProviderId")
    expect(tipcSource).toContain("resolveTtsSelection")
    expect(ttsLlmPreprocessingSource).toContain("resolveChatProviderId")
    expect(settingsModelsSource).toContain("resolveSttProviderId")
    expect(settingsModelsSource).toContain("resolveSttModelSelection")
    expect(settingsModelsSource).toContain("resolveTtsProviderId")
    expect(settingsModelsSource).toContain("resolveTtsSelection")
    expect(settingsProvidersSource).toContain("resolveSttProviderId")
    expect(settingsProvidersSource).toContain("resolveTtsSelection")
    expect(settingsGeneralSource).toContain("resolveSttProviderId")
    expect(onboardingSource).toContain("resolveSttProviderId")
  })

  it("shares MCP server runtime status classification across CLI, desktop, and remote surfaces", () => {
    expect(mcpServerStatusSource).toContain(
      "export function resolveMcpServerRuntimeState",
    )
    expect(mcpServerStatusSource).toContain(
      "export function countConnectedMcpServers",
    )
    expect(mcpServerStatusSource).toContain(
      "export function listMcpServerStatusSummaries",
    )
    expect(mcpManagementSource).toContain("listMcpServerStatusSummaries({")
    expect(headlessCliSource).toContain("resolveMcpServerRuntimeState(")
    expect(headlessCliSource).toContain("countConnectedMcpServers(")
    expect(settingsAgentsSource).toContain("resolveMcpServerRuntimeState(")
    expect(mcpConfigManagerSource).toContain("resolveMcpServerRuntimeState(")
  })

  it("shares OpenAI-compatible preset resolution across CLI, runtime, and renderer surfaces", () => {
    expect(sharedProvidersSource).toContain(
      "export function resolveModelPresetId",
    )
    expect(sharedProvidersSource).toContain(
      "export function resolveModelPresets",
    )
    expect(sharedProvidersSource).toContain(
      "export function resolveModelPreset",
    )
    expect(headlessCliSource).toContain("resolveChatModelDisplayInfo(")
    expect(llmSource).toContain("resolveChatModelDisplayInfo(")
    expect(settingsManagementSource).toContain("resolveModelPresetId(")
    expect(settingsManagementSource).toContain("resolveModelPresets(")
    expect(summarizationServiceSource).toContain("resolveModelPreset(")
    expect(settingsModelsSource).toContain("resolveModelPresets(")
    expect(modelPresetManagerSource).toContain("resolveModelPresetId(")
    expect(modelPresetManagerSource).toContain("resolveModelPresets(")
    expect(modelSelectorSource).toContain("resolveModelPresetId(")
  })

  it("shares repeat-task summaries and runtime controls across CLI, desktop, and remote surfaces", () => {
    expect(loopSummariesSource).toContain("export function summarizeLoop")
    expect(loopSummariesSource).toContain("export function summarizeLoops")
    expect(loopManagementSource).toContain(
      "export function getManagedLoopSummary",
    )
    expect(loopManagementSource).toContain(
      "export function getManagedLoopSummaries",
    )
    expect(loopManagementSource).toContain(
      "export function resolveManagedLoopSelection",
    )
    expect(loopManagementSource).toContain("export function saveManagedLoop")
    expect(loopManagementSource).toContain("export function createManagedLoop")
    expect(loopManagementSource).toContain("export function updateManagedLoop")
    expect(loopManagementSource).toContain(
      "export function toggleManagedLoopEnabled",
    )
    expect(loopManagementSource).toContain(
      "export async function triggerManagedLoop",
    )
    expect(loopManagementSource).toContain("export function deleteManagedLoop")
    expect(headlessCliSource).toContain("getManagedLoopSummaries(loopService)")
    expect(headlessCliSource).toContain("resolveManagedLoopSelection(")
    expect(headlessCliSource).toContain(
      "createManagedLoop(loopService, payload)",
    )
    expect(headlessCliSource).toContain(
      "updateManagedLoop(loopService, selectedLoop.id, parsed.payload)",
    )
    expect(headlessCliSource).toContain(
      "deleteManagedLoop(loopService, selectedLoop.id)",
    )
    expect(headlessCliSource).toContain("toggleManagedLoopEnabled(loopService,")
    expect(headlessCliSource).toContain("triggerManagedLoop(loopService,")
    expect(tipcSource).toContain("getLoopSummaries: t.procedure.action")
    expect(tipcSource).toContain("return getManagedLoopSummaries(loopService)")
    expect(remoteServerSource).toContain('from "./loop-summaries"')
    expect(remoteServerSource).toContain('from "./loop-management"')
    expect(remoteServerSource).toContain(
      "return getManagedLoopSummary(loopService, loop)",
    )
    expect(remoteServerSource).toContain(
      "loops: getManagedLoopSummaries(loopService)",
    )
    expect(remoteServerSource).toContain(
      "const result = toggleManagedLoopEnabled(loopService, params.id)",
    )
    expect(remoteServerSource).toContain(
      "const result = await triggerManagedLoop(loopService, params.id)",
    )
    expect(remoteServerSource).toContain(
      "const result = createManagedLoop(loopService, body)",
    )
    expect(remoteServerSource).toContain(
      "const result = updateManagedLoop(loopService, params.id, body)",
    )
    expect(remoteServerSource).toContain(
      "const result = deleteManagedLoop(loopService, params.id)",
    )
    expect(settingsLoopsSource).toContain("tipcClient.getLoopSummaries()")
    expect(settingsLoopsSource).toContain('queryKey: ["loop-summaries"]')
  })

  it("shares MCP server management across CLI, desktop, and remote surfaces", () => {
    expect(mcpManagementSource).toContain(
      "export function getManagedMcpServerSummaries",
    )
    expect(mcpManagementSource).toContain(
      "export function getManagedMcpServerSummary",
    )
    expect(mcpManagementSource).toContain(
      "export function resolveManagedMcpServerSelection",
    )
    expect(mcpManagementSource).toContain(
      "export function setManagedMcpServerRuntimeEnabled",
    )
    expect(mcpManagementSource).toContain(
      "export async function restartManagedMcpServer",
    )
    expect(mcpManagementSource).toContain(
      "export async function stopManagedMcpServer",
    )
    expect(mcpManagementSource).toContain(
      "export function getManagedMcpServerLogs",
    )
    expect(headlessCliSource).toContain("getManagedMcpServerSummaries(")
    expect(headlessCliSource).toContain("resolveManagedMcpServerSelection(")
    expect(headlessCliSource).toContain("getManagedMcpServerSummary(")
    expect(headlessCliSource).toContain("setManagedMcpServerRuntimeEnabled(")
    expect(headlessCliSource).toContain("restartManagedMcpServer(")
    expect(headlessCliSource).toContain("stopManagedMcpServer(")
    expect(headlessCliSource).toContain("getManagedMcpServerLogs(")
    expect(tipcSource).toContain('from "./mcp-management"')
    expect(tipcSource).toContain('from "./mcp-management-store"')
    expect(tipcSource).toContain("setManagedMcpServerRuntimeEnabled(")
    expect(tipcSource).toContain("restartManagedMcpServer(")
    expect(tipcSource).toContain("stopManagedMcpServer(")
    expect(tipcSource).toContain("getManagedMcpServerLogs(")
    expect(remoteServerSource).toContain('from "./mcp-management"')
    expect(remoteServerSource).toContain('from "./mcp-management-store"')
    expect(remoteServerSource).toContain("getManagedMcpServerSummaries(")
    expect(remoteServerSource).toContain("setManagedMcpServerRuntimeEnabled(")
    expect(mcpConfigManagerSource).toContain(
      "tipcClient.restartMcpServer({ serverName })",
    )
    expect(mcpConfigManagerSource).toContain(
      "tipcClient.stopMcpServer({ serverName })",
    )
  })

  it("shares knowledge note management across CLI, desktop, and remote surfaces", () => {
    expect(knowledgeNoteManagementSource).toContain(
      "export async function getManagedKnowledgeNotes",
    )
    expect(knowledgeNoteManagementSource).toContain(
      "export async function getManagedKnowledgeNote",
    )
    expect(knowledgeNoteManagementSource).toContain(
      "export async function searchManagedKnowledgeNotes",
    )
    expect(knowledgeNoteManagementSource).toContain(
      "export async function saveManagedKnowledgeNoteFromSummary",
    )
    expect(knowledgeNoteManagementSource).toContain(
      "export async function createManagedKnowledgeNote",
    )
    expect(knowledgeNoteManagementSource).toContain(
      "export async function updateManagedKnowledgeNote",
    )
    expect(knowledgeNoteManagementSource).toContain(
      "export async function deleteManagedKnowledgeNote",
    )
    expect(knowledgeNoteManagementSource).toContain(
      "export async function deleteMultipleManagedKnowledgeNotes",
    )
    expect(knowledgeNoteManagementSource).toContain(
      "export async function deleteAllManagedKnowledgeNotes",
    )
    expect(headlessCliSource).toContain("getManagedKnowledgeNotes(")
    expect(headlessCliSource).toContain("getManagedKnowledgeNote(")
    expect(headlessCliSource).toContain("searchManagedKnowledgeNotes(")
    expect(headlessCliSource).toContain("createManagedKnowledgeNote(")
    expect(headlessCliSource).toContain("updateManagedKnowledgeNote(")
    expect(headlessCliSource).toContain("deleteManagedKnowledgeNote(")
    expect(headlessCliSource).toContain("deleteMultipleManagedKnowledgeNotes(")
    expect(headlessCliSource).toContain("deleteAllManagedKnowledgeNotes(")
    expect(headlessCliSource).toContain('case "/notes":')
    expect(headlessCliSource).toContain('case "/note-new":')
    expect(headlessCliSource).toContain('case "/note-edit":')
    expect(headlessCliSource).toContain('case "/note-delete-many":')
    expect(headlessCliSource).toContain('case "/note-delete-all":')
    expect(tipcSource).toContain('from "./knowledge-note-management"')
    expect(tipcSource).toContain("getManagedKnowledgeNotes()")
    expect(tipcSource).toContain("saveManagedKnowledgeNoteFromSummary(input)")
    expect(tipcSource).toContain("saveManagedKnowledgeNote(input.note)")
    expect(tipcSource).toContain(
      "updateManagedKnowledgeNote(input.id, input.updates)",
    )
    expect(tipcSource).toContain("deleteManagedKnowledgeNote(input.id)")
    expect(tipcSource).toContain(
      "deleteMultipleManagedKnowledgeNotes(input.ids)",
    )
    expect(tipcSource).toContain("deleteAllManagedKnowledgeNotes()")
    expect(tipcSource).toContain("searchManagedKnowledgeNotes(input.query)")
    expect(remoteServerSource).toContain('from "./knowledge-note-management"')
    expect(remoteServerSource).toContain("getManagedKnowledgeNotes()")
    expect(remoteServerSource).toContain("getManagedKnowledgeNote(params.id)")
    expect(remoteServerSource).toContain("createManagedKnowledgeNote(body)")
    expect(remoteServerSource).toContain(
      "updateManagedKnowledgeNote(params.id, body)",
    )
    expect(remoteServerSource).toContain(
      "deleteManagedKnowledgeNote(params.id)",
    )
    expect(knowledgePageSource).toContain("tipcClient.getAllKnowledgeNotes()")
    expect(knowledgePageSource).toContain("tipcClient.searchKnowledgeNotes(")
    expect(knowledgePageSource).toContain("tipcClient.updateKnowledgeNote(")
    expect(knowledgePageSource).toContain("tipcClient.deleteKnowledgeNote(")
    expect(knowledgePageSource).toContain(
      "tipcClient.deleteMultipleKnowledgeNotes(",
    )
    expect(knowledgePageSource).toContain(
      "tipcClient.deleteAllKnowledgeNotes()",
    )
  })

  it("shares conversation-history serialization across runtime and remote surfaces", () => {
    expect(sharedConversationHistorySource).toContain(
      "export function formatConversationHistoryMessages",
    )
    expect(sharedConversationHistorySource).toContain(
      "export function formatConversationToolCalls",
    )
    expect(sharedConversationHistorySource).toContain(
      "export function formatConversationToolResults",
    )
    expect(llmSource).toContain("formatConversationHistoryMessages(")
    expect(llmSource).toContain("formatConversationToolCalls(toolCalls)")
    expect(llmSource).toContain("formatConversationToolResults(toolResults)")
    expect(remoteServerSource).toContain("formatConversationHistoryMessages(")
    expect(remoteServerSource).not.toContain(
      "function formatConversationHistoryForApi(",
    )
  })

  it("documents every shared feature path explicitly", () => {
    expect(docsSource).toContain("Shared prompt launcher")
    expect(docsSource).toContain("Shared resume runner")
    expect(docsSource).toContain("Shared conversation history selection")
    expect(docsSource).toContain("Shared prompt session bootstrap")
    expect(docsSource).toContain("Shared remote access bootstrap")
    expect(docsSource).toContain(
      "Shared configured remote access reconciliation",
    )
    expect(docsSource).toContain("Shared non-GUI mode launcher")
    expect(docsSource).toContain("Shared Cloudflare tunnel bootstrap")
    expect(docsSource).toContain("Shared remote server QR printing")
    expect(docsSource).toContain("Shared remote server URL rules")
    expect(docsSource).toContain("Shared MCP server status classification")
    expect(docsSource).toContain("Shared session history state")
    expect(docsSource).toContain("Shared conversation management")
    expect(docsSource).toContain("Shared agent profile activation")
    expect(docsSource).toContain("Shared agent profile management")
    expect(docsSource).toContain("Shared legacy desktop profile adapters")
    expect(docsSource).toContain("Shared agent selector profiles")
    expect(docsSource).toContain("Shared ACP main-agent options")
    expect(docsSource).toContain("Shared profile skill gating")
    expect(docsSource).toContain("Shared profile skill management")
    expect(docsSource).toContain("Shared skill catalog management")
    expect(docsSource).toContain("Shared bundle management")
    expect(docsSource).toContain("Shared remote access management")
    expect(docsSource).toContain("Shared sandbox slot management")
    expect(docsSource).toContain("Shared chat model selection")
    expect(docsSource).toContain("Shared speech provider defaults")
    expect(docsSource).toContain("Shared OpenAI-compatible preset resolution")
    expect(docsSource).toContain("Shared settings management")
    expect(docsSource).toContain("Shared repeat task summaries")
    expect(docsSource).toContain("Shared repeat task management")
    expect(docsSource).toContain("Shared MCP server management")
    expect(docsSource).toContain("Shared knowledge note management")
    expect(docsSource).toContain("Shared conversation history serialization")
    expect(docsSource).toContain("Shared runtime shutdown")
    expect(docsSource).toContain("Desktop text input")
    expect(docsSource).toContain("Desktop voice MCP mode")
    expect(docsSource).toContain("Headless CLI prompt")
    expect(docsSource).toContain("Remote server prompt")
    expect(docsSource).toContain("Repeat tasks / loops")
    expect(docsSource).toContain(
      "Queued desktop follow-ups / ACP parent resume",
    )
    expect(docsSource).toContain("Desktop GUI startup")
    expect(docsSource).toContain("Headless CLI startup")
    expect(docsSource).toContain("QR headless pairing startup")
    expect(docsSource).toContain("Desktop remote access startup")
    expect(docsSource).toContain("Desktop remote access reconfiguration")
    expect(docsSource).toContain("Headless CLI settings inspection and edits")
    expect(docsSource).toContain(
      "Desktop config saves + remote/mobile settings updates",
    )
    expect(docsSource).toContain("Desktop GUI shutdown")
    expect(docsSource).toContain("Headless non-GUI shutdown")
    expect(docsSource).toContain("Headless CLI conversation resume selection")
    expect(docsSource).toContain("Headless CLI session pin/archive controls")
    expect(docsSource).toContain("Headless CLI conversation management")
    expect(docsSource).toContain("Headless CLI + desktop conversation browsing")
    expect(docsSource).toContain("Remote conversation history + recovery API")
    expect(docsSource).toContain("Headless CLI agent selection")
    expect(docsSource).toContain("Headless CLI agent profile management")
    expect(docsSource).toContain("Headless CLI agent profile import/export")
    expect(docsSource).toContain("Headless CLI repeat-task controls")
    expect(docsSource).toContain("Headless CLI knowledge note controls")
    expect(docsSource).toContain("Headless CLI and desktop agent picker")
    expect(docsSource).toContain("Desktop and mobile ACP main-agent pickers")
    expect(docsSource).toContain("Headless CLI skill toggles")
    expect(docsSource).toContain("Desktop/mobile per-profile skill enablement")
    expect(docsSource).toContain("Headless CLI skill catalog controls")
    expect(docsSource).toContain(
      "Desktop skill settings + CLI skill catalog controls",
    )
    expect(docsSource).toContain("Headless CLI bundle management")
    expect(docsSource).toContain("Headless CLI remote access controls")
    expect(docsSource).toContain("Headless CLI sandbox slot management")
    expect(docsSource).toContain("Desktop/manual remote server QR print")
    expect(docsSource).toContain("Remote server startup QR auto-print")
    expect(docsSource).toContain("Desktop remote settings pairing preview")
    expect(docsSource).toContain(
      "Remote server status + headless pairing defaults",
    )
    expect(docsSource).toContain("Shared active model selection")
    expect(docsSource).toContain("Desktop speech settings + onboarding")
    expect(docsSource).toContain(
      "Runtime speech generation + remote settings payload",
    )
    expect(docsSource).toContain("CLI/desktop MCP server status surfaces")
    expect(docsSource).toContain("Headless CLI MCP server controls")
    expect(docsSource).toContain("Preset-aware CLI labels + preset surfaces")
    expect(docsSource).toContain(
      "Desktop repeat task settings + remote loop API",
    )
    expect(docsSource).toContain(
      "Desktop knowledge workspace + CLI note controls",
    )
    expect(docsSource).toContain(
      "Desktop progress history + remote API conversation payloads",
    )
    expect(docsSource).toContain(
      "Desktop history management + runtime session-title sync",
    )
    expect(docsSource).toContain(
      "Desktop agent selection + remote/mobile profile switching",
    )
  })
})
