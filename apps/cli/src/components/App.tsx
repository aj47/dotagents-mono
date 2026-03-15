import { useKeyboard, useTerminalDimensions } from '@opentui/react';
import { useState, useCallback } from 'react';
import { ChatView } from './ChatView';
import { ConversationListView } from './ConversationListView';
import { SettingsPanel } from './SettingsPanel';
import { AgentProfilePanel } from './AgentProfilePanel';
import { McpManagementPanel } from './McpManagementPanel';
import { SkillsPanel } from './SkillsPanel';
import { MemoriesPanel } from './MemoriesPanel';
import { LoopsPanel } from './LoopsPanel';
import { VoicePanel } from './VoicePanel';
import { HubPanel } from './HubPanel';
import { RemoteServerPanel } from './RemoteServerPanel';
import { AcpPanel } from './AcpPanel';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { useChat } from '../hooks/useChat';
import { useConversationManager } from '../hooks/useConversationManager';
import { useMcpService } from '../hooks/useMcpService';
import { useMcpManagement } from '../hooks/useMcpManagement';
import { useSettings } from '../hooks/useSettings';
import { useAgentProfiles } from '../hooks/useAgentProfiles';
import { useSkills } from '../hooks/useSkills';
import { useMemories } from '../hooks/useMemories';
import { useLoops } from '../hooks/useLoops';
import { useVoice } from '../hooks/useVoice';
import { useHub } from '../hooks/useHub';
import { useRemoteServer } from '../hooks/useRemoteServer';
import { useOAuth } from '../hooks/useOAuth';
import { useAcp } from '../hooks/useAcp';
import { useDiagnostics } from '../hooks/useDiagnostics';
import { parseInput, getHelpText } from '../utils/command-parser';
import type { ChatMessage } from '../types/chat';

/**
 * Root App component for the DotAgents CLI.
 *
 * Renders the main TUI frame with a header, the chat interface,
 * and a status bar at the bottom. Integrates conversation management
 * commands (/new, /list, /switch) with the chat interface.
 *
 * Initializes MCP servers at startup and provides tools to the chat hook.
 */
export function App() {
  const { width } = useTerminalDimensions();
  const [exiting, setExiting] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  // Initialize MCP service — loads servers from .agents config
  const mcp = useMcpService();

  // Settings panel state
  const settings = useSettings();

  // Agent profiles state
  const agentProfiles = useAgentProfiles();
  const [showProfiles, setShowProfiles] = useState(false);

  // MCP management panel state
  const mcpManagement = useMcpManagement();
  const [showMcp, setShowMcp] = useState(false);

  // Skills panel state
  const skillsHook = useSkills();
  const [showSkills, setShowSkills] = useState(false);

  // Memories panel state
  const memoriesHook = useMemories();
  const [showMemories, setShowMemories] = useState(false);

  // Loops panel state
  const loopsHook = useLoops();
  const [showLoops, setShowLoops] = useState(false);

  // Voice panel state
  const voice = useVoice();
  const [showVoice, setShowVoice] = useState(false);

  // Hub panel state
  const hub = useHub();
  const [showHub, setShowHub] = useState(false);

  // Remote server panel state
  const remoteServer = useRemoteServer();
  const oauth = useOAuth();
  const [showServer, setShowServer] = useState(false);

  // ACP panel state
  const acp = useAcp();
  const [showAcp, setShowAcp] = useState(false);

  // Diagnostics panel state
  const diagnostics = useDiagnostics();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const conversationManager = useConversationManager();
  const {
    messages,
    status,
    error,
    pendingApproval,
    sendMessage,
    setMessages,
    approveToolCall,
    denyToolCall,
    cancelStreaming,
  } = useChat({
    onMessageSaved: conversationManager.saveMessage,
    tools: mcp.tools,
  });

  /**
   * Handle user input: either a slash command or a chat message.
   */
  const handleInput = useCallback(
    async (input: string) => {
      const parsed = parseInput(input);

      if (parsed.type === 'message') {
        // Dismiss conversation list if showing
        conversationManager.dismissConversationList();
        setSystemMessage(null);
        sendMessage(parsed.content);
        return;
      }

      // Handle commands
      switch (parsed.name) {
        case 'new': {
          await conversationManager.createNewConversation();
          setMessages([]);
          setSystemMessage('✓ New conversation started.');
          break;
        }

        case 'list':
        case 'conversations': {
          await conversationManager.listConversations();
          setSystemMessage(null);
          break;
        }

        case 'switch': {
          if (parsed.args.length === 0) {
            setSystemMessage('⚠ Usage: /switch <id> or /switch <number>');
            break;
          }
          try {
            const loadedMessages = await conversationManager.switchConversation(
              parsed.args[0],
            );
            setMessages(loadedMessages);
            setSystemMessage(
              `✓ Switched to conversation: ${conversationManager.currentConversationTitle ?? conversationManager.currentConversationId}`,
            );
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to switch conversation';
            setSystemMessage(`⚠ ${errMsg}`);
          }
          break;
        }

        case 'settings': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          setShowProfiles(false);
          setShowMcp(false);
          setShowSkills(false);
          setShowMemories(false);
          setShowLoops(false);
          setShowVoice(false);
          setShowHub(false);
          setShowServer(false);
          setShowAcp(false);
          setShowDiagnostics(false);
          settings.open();
          break;
        }

        case 'profiles': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowMcp(false);
          setShowSkills(false);
          setShowMemories(false);
          setShowLoops(false);
          setShowVoice(false);
          setShowHub(false);
          setShowServer(false);
          setShowAcp(false);
          setShowDiagnostics(false);
          setShowProfiles(true);
          break;
        }

        case 'mcp': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowProfiles(false);
          setShowSkills(false);
          setShowMemories(false);
          setShowLoops(false);
          setShowVoice(false);
          setShowHub(false);
          setShowServer(false);
          setShowAcp(false);
          setShowDiagnostics(false);
          setShowMcp(true);
          mcpManagement.refresh();
          break;
        }

        case 'skills': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowProfiles(false);
          setShowMcp(false);
          setShowMemories(false);
          setShowLoops(false);
          setShowVoice(false);
          setShowHub(false);
          setShowServer(false);
          setShowAcp(false);
          setShowDiagnostics(false);
          setShowSkills(true);
          skillsHook.reload();
          break;
        }

        case 'memories': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowProfiles(false);
          setShowMcp(false);
          setShowSkills(false);
          setShowLoops(false);
          setShowVoice(false);
          setShowHub(false);
          setShowServer(false);
          setShowAcp(false);
          setShowDiagnostics(false);
          setShowMemories(true);
          void memoriesHook.reload();
          break;
        }

        case 'loops': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowProfiles(false);
          setShowMcp(false);
          setShowSkills(false);
          setShowMemories(false);
          setShowVoice(false);
          setShowHub(false);
          setShowServer(false);
          setShowAcp(false);
          setShowDiagnostics(false);
          setShowLoops(true);
          loopsHook.reload();
          break;
        }

        case 'voice': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowProfiles(false);
          setShowMcp(false);
          setShowSkills(false);
          setShowMemories(false);
          setShowLoops(false);
          setShowHub(false);
          setShowServer(false);
          setShowAcp(false);
          setShowDiagnostics(false);
          setShowVoice(true);
          break;
        }

        case 'hub': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowProfiles(false);
          setShowMcp(false);
          setShowSkills(false);
          setShowMemories(false);
          setShowLoops(false);
          setShowVoice(false);
          setShowHub(true);
          setShowServer(false);
          setShowAcp(false);
          setShowDiagnostics(false);
          break;
        }

        case 'server': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowProfiles(false);
          setShowMcp(false);
          setShowSkills(false);
          setShowMemories(false);
          setShowLoops(false);
          setShowVoice(false);
          setShowHub(false);
          setShowAcp(false);
          setShowDiagnostics(false);
          setShowServer(true);
          remoteServer.refreshStatus();
          break;
        }

        case 'acp': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowProfiles(false);
          setShowMcp(false);
          setShowSkills(false);
          setShowMemories(false);
          setShowLoops(false);
          setShowVoice(false);
          setShowHub(false);
          setShowServer(false);
          setShowDiagnostics(false);
          setShowAcp(true);
          acp.refresh();
          break;
        }

        case 'diagnostics': {
          conversationManager.dismissConversationList();
          setSystemMessage(null);
          settings.close();
          setShowProfiles(false);
          setShowMcp(false);
          setShowSkills(false);
          setShowMemories(false);
          setShowLoops(false);
          setShowVoice(false);
          setShowHub(false);
          setShowServer(false);
          setShowAcp(false);
          setShowDiagnostics(true);
          diagnostics.refresh();
          break;
        }

        case 'help': {
          setSystemMessage(getHelpText());
          conversationManager.dismissConversationList();
          break;
        }

        case 'quit': {
          setExiting(true);
          setTimeout(() => process.exit(0), 100);
          break;
        }
      }
    },
    [sendMessage, setMessages, conversationManager, settings],
  );

  useKeyboard((key) => {
    if (key.ctrl && key.name === 'c') {
      // If currently streaming, cancel the stream first
      if (status === 'streaming' || status === 'awaiting_approval') {
        cancelStreaming();
        return;
      }
      // Otherwise, exit
      setExiting(true);
      // Allow a brief moment for cleanup then exit
      setTimeout(() => process.exit(0), 100);
    }
  });

  if (exiting) {
    return (
      <box flexDirection="column" width={width}>
        <text fg="#999">Exiting DotAgents CLI...</text>
      </box>
    );
  }

  // Build title with current conversation info
  const titleSuffix = conversationManager.currentConversationTitle
    ? ` — ${conversationManager.currentConversationTitle}`
    : ' — Your AI team, one command away';

  // Build MCP status indicator
  const mcpStatusText =
    mcp.status === 'initializing'
      ? ' ⠋ Loading MCP servers...'
      : mcp.status === 'ready' && mcp.tools.length > 0
        ? ` [${mcp.tools.length} tools]`
        : '';

  return (
    <box flexDirection="column" width={width} flexGrow={1}>
      {/* Header */}
      <box
        border
        borderStyle="single"
        borderColor="#7aa2f7"
        paddingX={1}
        width="100%"
      >
        <text fg="#7aa2f7">
          <strong>DotAgents CLI</strong>
        </text>
        <text fg="#666">{titleSuffix}</text>
        <text fg="#565f89">{mcpStatusText}</text>
      </box>

      {/* MCP warnings */}
      {mcp.warnings.length > 0 && (
        <box width="100%" paddingX={1}>
          {mcp.warnings.map((w, i) => (
            <text key={`mcp-warn-${i}`} fg="#e0af68">⚠ MCP: {w}</text>
          ))}
        </box>
      )}

      {/* System message (command feedback) */}
      {systemMessage && (
        <box width="100%" paddingX={1}>
          <text fg="#9ece6a">{systemMessage}</text>
        </box>
      )}

      {/* Conversation list overlay */}
      {conversationManager.showingConversationList && !settings.isOpen && (
        <ConversationListView
          conversations={conversationManager.conversations}
          currentConversationId={conversationManager.currentConversationId}
        />
      )}

      {/* Settings panel overlay */}
      {settings.isOpen && !showProfiles && (
        <SettingsPanel
          activeCategory={settings.activeCategory}
          onCategoryChange={settings.setActiveCategory}
          onNextCategory={settings.nextCategory}
          onPrevCategory={settings.prevCategory}
          onClose={settings.close}
          presets={settings.presets}
          onSetApiKey={settings.setProviderApiKey}
          onClearApiKey={settings.clearProviderApiKey}
          currentPresetId={settings.currentPresetId}
          onSelectPreset={settings.selectPreset}
          ttsConfig={settings.ttsConfig}
          onUpdateTts={settings.updateTtsConfig}
          sttConfig={settings.sttConfig}
          onUpdateStt={settings.updateSttConfig}
          systemPrompt={settings.systemPrompt}
          onSetSystemPrompt={settings.setSystemPrompt}
        />
      )}

      {/* Agent profiles panel overlay */}
      {showProfiles && (
        <AgentProfilePanel
          profiles={agentProfiles.profiles}
          activeProfile={agentProfiles.activeProfile}
          error={agentProfiles.error}
          onClose={() => setShowProfiles(false)}
          onCreateProfile={agentProfiles.createProfile}
          onUpdateProfile={agentProfiles.updateProfile}
          onDeleteProfile={agentProfiles.deleteProfile}
          onSwitchProfile={agentProfiles.switchProfile}
        />
      )}

      {/* MCP management panel overlay */}
      {showMcp && (
        <McpManagementPanel
          servers={mcpManagement.servers}
          allTools={mcpManagement.allTools}
          error={null}
          onClose={() => {
            setShowMcp(false);
            // Refresh MCP tools after potential changes
            mcp.reinitialize();
          }}
          onAddServer={mcpManagement.addServer}
          onRemoveServer={mcpManagement.removeServer}
          onReconnectServer={mcpManagement.reconnectServer}
          onRefresh={mcpManagement.refresh}
        />
      )}

      {/* Skills management panel overlay */}
      {showSkills && (
        <SkillsPanel
          skills={skillsHook.skills}
          enabledSkillIds={skillsHook.enabledSkillIds}
          error={skillsHook.error}
          onClose={() => setShowSkills(false)}
          onCreateSkill={skillsHook.createSkill}
          onUpdateSkill={skillsHook.updateSkill}
          onDeleteSkill={skillsHook.deleteSkill}
          onEnableSkill={skillsHook.enableSkill}
          onDisableSkill={skillsHook.disableSkill}
          onInstallFromGitHub={skillsHook.installFromGitHub}
        />
      )}

      {/* Memories management panel overlay */}
      {showMemories && (
        <MemoriesPanel
          memories={memoriesHook.memories}
          autoExtractionEnabled={memoriesHook.autoExtractionEnabled}
          error={memoriesHook.error}
          onClose={() => setShowMemories(false)}
          onCreateMemory={memoriesHook.createMemory}
          onUpdateMemory={memoriesHook.updateMemory}
          onDeleteMemory={memoriesHook.deleteMemory}
        />
      )}

      {/* Loops (repeat tasks) management panel overlay */}
      {showLoops && (
        <LoopsPanel
          loops={loopsHook.loops}
          statuses={loopsHook.statuses}
          error={loopsHook.error}
          onClose={() => setShowLoops(false)}
          onCreateLoop={loopsHook.createLoop}
          onUpdateLoop={loopsHook.updateLoop}
          onDeleteLoop={loopsHook.deleteLoop}
          onEnableLoop={loopsHook.enableLoop}
          onDisableLoop={loopsHook.disableLoop}
          onTriggerLoop={loopsHook.triggerLoop}
        />
      )}

      {/* Voice panel overlay */}
      {showVoice && (
        <VoicePanel
          voiceState={voice.state}
          onStartRecording={voice.startRecording}
          onStopRecording={voice.stopRecording}
          onSpeak={voice.speak}
          onStopPlayback={voice.stopPlayback}
          onStartContinuousMode={voice.startContinuousMode}
          onStopContinuousMode={voice.stopContinuousMode}
          onClose={() => {
            voice.stopContinuousMode();
            setShowVoice(false);
          }}
          onSendTranscript={(text) => {
            sendMessage(text);
          }}
          lastAssistantMessage={
            messages
              .filter((m: ChatMessage) => m.role === 'assistant')
              .pop()?.content
          }
        />
      )}

      {/* Hub panel overlay */}
      {showHub && (
        <HubPanel
          catalog={hub.catalog}
          onBrowseCatalog={hub.browseCatalog}
          onInstallBundle={hub.installBundle}
          installLoading={hub.installLoading}
          installError={hub.installError}
          installResult={hub.installResult}
          importState={hub.importState}
          onSetImportFilePath={hub.setImportFilePath}
          onPreviewImport={hub.previewImport}
          onExecuteImport={hub.executeImport}
          onResetImport={hub.resetImport}
          exportState={hub.exportState}
          onLoadExportableItems={hub.loadExportableItems}
          onSetExportName={hub.setExportName}
          onSetExportDescription={hub.setExportDescription}
          onSetExportPath={hub.setExportPath}
          onExecuteExport={hub.executeExport}
          onResetExport={hub.resetExport}
          publishState={hub.publishState}
          onSetPublishName={hub.setPublishName}
          onSetPublishSummary={hub.setPublishSummary}
          onSetPublishAuthorName={hub.setPublishAuthorName}
          onSetPublishTags={hub.setPublishTags}
          onExecutePublish={hub.executePublish}
          onResetPublish={hub.resetPublish}
          onClose={() => setShowHub(false)}
        />
      )}

      {/* Remote server panel overlay */}
      {showServer && (
        <RemoteServerPanel
          serverStatus={remoteServer.status}
          loading={remoteServer.loading}
          error={remoteServer.error}
          onStartServer={remoteServer.startServer}
          onStopServer={remoteServer.stopServer}
          onShowQRCode={remoteServer.showQRCode}
          onSetPort={remoteServer.setPort}
          onSetBindAddress={remoteServer.setBindAddress}
          oauthStatus={oauth.status}
          oauthError={oauth.error}
          onStartOAuth={async (url) => { await oauth.startOAuth(url); }}
          onClose={() => setShowServer(false)}
        />
      )}

      {/* ACP panel overlay */}
      {showAcp && (
        <AcpPanel
          agents={acp.agents}
          onClose={() => setShowAcp(false)}
          onStartAgent={acp.startAgent}
          onStopAgent={acp.stopAgent}
          onAddAgent={acp.addAgent}
          onRemoveAgent={acp.removeAgent}
          onRefresh={acp.refresh}
          delegations={acp.getDelegations(conversationManager.currentConversationId || '')}
        />
      )}

      {/* Diagnostics panel overlay */}
      {showDiagnostics && (
        <DiagnosticsPanel
          systemInfo={diagnostics.systemInfo}
          langfuseStatus={diagnostics.langfuseStatus}
          errorLog={diagnostics.errorLog}
          healthCheck={diagnostics.healthCheck}
          diagnosticReport={diagnostics.diagnosticReport}
          loading={diagnostics.loading}
          error={diagnostics.error}
          onToggleLangfuse={diagnostics.toggleLangfuse}
          onGenerateReport={diagnostics.generateReport}
          onRunHealthCheck={diagnostics.runHealthCheck}
          onClearErrors={diagnostics.clearErrors}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* Chat interface (hidden when any panel is open) */}
      {!settings.isOpen && !showProfiles && !showMcp && !showSkills && !showMemories && !showLoops && !showVoice && !showHub && !showServer && !showAcp && !showDiagnostics && (
        <ChatView
          messages={messages}
          status={status}
          error={error}
          pendingApproval={pendingApproval}
          onSendMessage={handleInput}
          onApprove={approveToolCall}
          onDeny={denyToolCall}
        />
      )}

      {/* Status bar */}
      <box width="100%" paddingX={1}>
        <text fg="#565f89">
          {showDiagnostics
            ? 'Diagnostics • Tab switch section • g report • Enter toggle/run • c clear • Esc close'
            : showAcp
            ? 'ACP Agents • ↑/↓ navigate • s start • x stop • a add • d delete • v delegations • Esc close'
            : showServer
            ? 'Server • ↑/↓ navigate • Enter select • Esc back/close'
            : showHub
            ? 'Hub • ↑/↓ navigate • Enter select • Esc back/close'
            : showVoice
            ? 'Voice • Enter record • s speak last • c continuous mode • x stop • Esc close'
            : showSkills
              ? 'Skills • Escape to close • ↑/↓ navigate • Enter toggle • c/e/d/g actions'
              : showMemories
                ? 'Memories • Escape to close • ↑/↓ navigate • c/e/d actions'
                : showLoops
                  ? 'Repeat Tasks • Escape to close • ↑/↓ navigate • Enter toggle • c/e/d/t actions'
                  : showMcp
                    ? 'MCP Servers • Escape to close • Tab switch view • a/r/d actions'
                    : showProfiles
                      ? 'Profiles • Escape to close • ↑/↓ navigate • Enter switch • c/e/d actions'
                      : settings.isOpen
                        ? 'Settings • Escape to close • Tab/←/→ to switch categories'
                        : (
                      <>
                        {agentProfiles.activeProfile
                          ? `[${agentProfiles.activeProfile.displayName}] `
                          : ''}
                        {conversationManager.currentConversationId
                          ? `(${conversationManager.currentConversationId}) `
                          : ''}
                        {status === 'streaming'
                          ? 'Ctrl+C to cancel • '
                          : ''}
                        Press Ctrl+C or /quit to exit • /help for commands
                      </>
                    )}
        </text>
      </box>
    </box>
  );
}
