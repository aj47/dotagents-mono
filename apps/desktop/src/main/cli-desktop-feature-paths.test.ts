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
const agentCapabilitiesSidebarSource = readFileSync(
  new URL("../renderer/src/components/agent-capabilities-sidebar.tsx", import.meta.url),
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
    expect(remoteServerSource).toContain("sanitizeConversationSessionState(")
    expect(mobileSessionsSource).toContain("sanitizeConversationSessionState(")
    expect(mobileSessionsSource).toContain(
      "setConversationSessionStateMembership(",
    )
  })

  it("shares conversation management across CLI, desktop, and runtime tool surfaces", () => {
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
    expect(headlessCliSource).toContain(
      "renameConversationTitleAndSyncSession(",
    )
    expect(headlessCliSource).toContain(
      "deleteConversationAndSyncSessionState(",
    )
    expect(headlessCliSource).toContain(
      "deleteAllConversationsAndSyncSessionState()",
    )
    expect(tipcSource).toContain(
      "return renameConversationTitleAndSyncSession(",
    )
    expect(tipcSource).toContain(
      "await deleteConversationAndSyncSessionState(input.conversationId)",
    )
    expect(tipcSource).toContain(
      "await deleteAllConversationsAndSyncSessionState()",
    )
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
    expect(headlessCliSource).toContain('case "/agents":')
    expect(headlessCliSource).toContain('case "/agent":')
    expect(headlessCliSource).toContain("activateAgentProfile(selectedAgent)")
    expect(tipcSource).toContain(
      "const profile = activateAgentProfileById(input.id)",
    )
    expect(tipcSource).toContain("activateAgentProfile(profile)")
    expect(remoteServerSource).toContain(
      "const profile = activateAgentProfileById(profileId)",
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
    expect(headlessCliSource).toContain("resolveAgentProfileSelection(")
    expect(headlessCliSource).toContain("sortAgentProfilesByPriority(")
    expect(headlessCliSource).toContain("getAgentProfileDisplayName(")
    expect(headlessCliSource).toContain("getAgentProfileCatalogDescription(")
    expect(headlessCliSource).toContain("getAgentProfileCatalogSummaryItems(")
    expect(headlessCliSource).toContain("getAgentProfileStatusLabels(")
    expect(agentSelectorSource).toContain("getEnabledAgentProfiles(")
    expect(agentSelectorSource).toContain("sortAgentProfilesByPriority(")
    expect(agentSelectorSource).toContain("getDefaultAgentProfile(")
    expect(agentSelectorSource).toContain("getAgentProfileDisplayName(")
    expect(applySelectedAgentSource).toContain("getEnabledAgentProfiles(")
    expect(applySelectedAgentSource).toContain("getDefaultAgentProfile(")
    expect(settingsAgentsSource).toContain("getAgentProfileCatalogDescription(")
    expect(settingsAgentsSource).toContain("getAgentProfileCatalogSummaryItems(")
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
    expect(headlessCliSource).toContain('case "/skills":')
    expect(headlessCliSource).toContain('case "/skill":')
    expect(headlessCliSource).toContain("getEnabledSkillIdsForAgentProfile(")
    expect(headlessCliSource).toContain("isSkillEnabledForAgentProfile(")
    expect(settingsAgentsSource).toContain("toggleSkillForAgentProfile(")
    expect(settingsAgentsSource).toContain("isSkillEnabledForAgentProfile(")
    expect(agentCapabilitiesSidebarSource).toContain(
      "toggleSkillForAgentProfile(",
    )
    expect(agentCapabilitiesSidebarSource).toContain(
      "getEnabledSkillIdsForAgentProfile(",
    )
    expect(remoteServerSource).toContain("getEnabledSkillIdsForAgentProfile(")
    expect(remoteServerSource).toContain("isSkillEnabledForAgentProfile(")
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
    expect(tipcSource).toContain("await syncConfiguredRemoteAccess({")
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
    expect(remoteServerSource).toContain("resolveSttProviderId")
    expect(remoteServerSource).toContain("resolveSttModelSelection")
    expect(remoteServerSource).toContain("resolveTtsProviderId")
    expect(remoteServerSource).toContain("resolveTtsSelection")
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
    expect(headlessCliSource).toContain("resolveMcpServerRuntimeState(")
    expect(headlessCliSource).toContain("countConnectedMcpServers(")
    expect(remoteServerSource).toContain("listMcpServerStatusSummaries(")
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
    expect(remoteServerSource).toContain("resolveModelPresetId(")
    expect(remoteServerSource).toContain("resolveModelPresets(")
    expect(summarizationServiceSource).toContain("resolveModelPreset(")
    expect(settingsModelsSource).toContain("resolveModelPresets(")
    expect(modelPresetManagerSource).toContain("resolveModelPresetId(")
    expect(modelPresetManagerSource).toContain("resolveModelPresets(")
    expect(modelSelectorSource).toContain("resolveModelPresetId(")
  })

  it("shares repeat-task summaries and runtime controls across CLI, desktop, and remote surfaces", () => {
    expect(loopSummariesSource).toContain("export function summarizeLoop")
    expect(loopSummariesSource).toContain("export function summarizeLoops")
    expect(loopManagementSource).toContain("export function getManagedLoopSummary")
    expect(loopManagementSource).toContain("export function getManagedLoopSummaries")
    expect(loopManagementSource).toContain(
      "export function resolveManagedLoopSelection",
    )
    expect(loopManagementSource).toContain("export function saveManagedLoop")
    expect(loopManagementSource).toContain(
      "export function toggleManagedLoopEnabled",
    )
    expect(loopManagementSource).toContain("export async function triggerManagedLoop")
    expect(loopManagementSource).toContain("export function deleteManagedLoop")
    expect(headlessCliSource).toContain("getManagedLoopSummaries(loopService)")
    expect(headlessCliSource).toContain("resolveManagedLoopSelection(")
    expect(headlessCliSource).toContain("toggleManagedLoopEnabled(loopService,")
    expect(headlessCliSource).toContain("triggerManagedLoop(loopService,")
    expect(tipcSource).toContain("getLoopSummaries: t.procedure.action")
    expect(tipcSource).toContain("return getManagedLoopSummaries(loopService)")
    expect(remoteServerSource).toContain('from "./loop-summaries"')
    expect(remoteServerSource).toContain('from "./loop-management"')
    expect(remoteServerSource).toContain(
      "return getManagedLoopSummary(loopService, loop)",
    )
    expect(remoteServerSource).toContain("loops: getManagedLoopSummaries(loopService)")
    expect(remoteServerSource).toContain(
      "const result = toggleManagedLoopEnabled(loopService, params.id)",
    )
    expect(remoteServerSource).toContain(
      "const result = await triggerManagedLoop(loopService, params.id)",
    )
    expect(remoteServerSource).toContain(
      "const result = saveManagedLoop(loopService, newLoop)",
    )
    expect(remoteServerSource).toContain(
      "const result = saveManagedLoop(loopService, updated, {",
    )
    expect(remoteServerSource).toContain(
      "const result = deleteManagedLoop(loopService, params.id)",
    )
    expect(settingsLoopsSource).toContain("tipcClient.getLoopSummaries()")
    expect(settingsLoopsSource).toContain('queryKey: ["loop-summaries"]')
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
    expect(docsSource).toContain("Shared agent selector profiles")
    expect(docsSource).toContain("Shared ACP main-agent options")
    expect(docsSource).toContain("Shared profile skill gating")
    expect(docsSource).toContain("Shared chat model selection")
    expect(docsSource).toContain("Shared speech provider defaults")
    expect(docsSource).toContain("Shared OpenAI-compatible preset resolution")
    expect(docsSource).toContain("Shared repeat task summaries")
    expect(docsSource).toContain("Shared repeat task management")
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
    expect(docsSource).toContain("Desktop GUI shutdown")
    expect(docsSource).toContain("Headless non-GUI shutdown")
    expect(docsSource).toContain("Headless CLI conversation resume selection")
    expect(docsSource).toContain("Headless CLI session pin/archive controls")
    expect(docsSource).toContain("Headless CLI conversation management")
    expect(docsSource).toContain("Headless CLI agent selection")
    expect(docsSource).toContain("Headless CLI repeat-task controls")
    expect(docsSource).toContain("Headless CLI and desktop agent picker")
    expect(docsSource).toContain("Desktop and mobile ACP main-agent pickers")
    expect(docsSource).toContain("Headless CLI skill toggles")
    expect(docsSource).toContain(
      "Desktop/mobile per-profile skill enablement",
    )
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
    expect(docsSource).toContain("Preset-aware CLI labels + preset surfaces")
    expect(docsSource).toContain(
      "Desktop repeat task settings + remote loop API",
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
