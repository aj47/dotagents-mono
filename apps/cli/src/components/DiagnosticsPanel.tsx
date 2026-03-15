/**
 * DiagnosticsPanel — TUI panel for system diagnostics, Langfuse observability,
 * and error log inspection.
 *
 * Provides:
 * - System info display (platform, node, MCP stats)
 * - Langfuse toggle and configuration
 * - Error log viewer
 * - Health check results
 *
 * Keyboard navigation: Tab to switch sections, ↑/↓ to scroll errors,
 * Enter to toggle/run, Escape to close.
 */

import { useState, useCallback } from 'react';
import { useKeyboard } from '@opentui/react';
import type {
  SystemInfo,
  LangfuseStatus,
  ErrorLogEntry,
  HealthCheckResult,
} from '../hooks/useDiagnostics';
import type { DiagnosticInfo } from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

export type DiagnosticsSection = 'system' | 'langfuse' | 'errors' | 'health';

export interface DiagnosticsPanelProps {
  systemInfo: SystemInfo | null;
  langfuseStatus: LangfuseStatus;
  errorLog: ErrorLogEntry[];
  healthCheck: HealthCheckResult | null;
  diagnosticReport: DiagnosticInfo | null;
  loading: boolean;
  error: string | null;
  onToggleLangfuse: (enabled: boolean) => void;
  onGenerateReport: () => Promise<void>;
  onRunHealthCheck: () => Promise<void>;
  onClearErrors: () => void;
  onClose: () => void;
}

// ============================================================================
// Sub-views
// ============================================================================

/**
 * Section tabs — horizontal navigation at the top.
 */
function SectionTabs({ activeSection }: { activeSection: DiagnosticsSection }) {
  const tabs: Array<{ id: DiagnosticsSection; label: string }> = [
    { id: 'system', label: 'System' },
    { id: 'langfuse', label: 'Langfuse' },
    { id: 'errors', label: 'Errors' },
    { id: 'health', label: 'Health' },
  ];

  return (
    <box flexDirection="row" width="100%" gap={1} paddingX={1}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeSection;
        return (
          <text
            key={tab.id}
            fg={isActive ? '#7aa2f7' : '#565f89'}
          >
            {isActive ? <strong>[{tab.label}]</strong> : ` ${tab.label} `}
          </text>
        );
      })}
    </box>
  );
}

/**
 * System info view.
 */
function SystemInfoView({
  systemInfo,
  diagnosticReport,
}: {
  systemInfo: SystemInfo | null;
  diagnosticReport: DiagnosticInfo | null;
}) {
  if (!systemInfo) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">System information unavailable.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingX={1} gap={0}>
      <text fg="#7aa2f7"><strong>System Information</strong></text>
      <text fg="#c0caf5">  Platform:     <text fg="#9ece6a">{systemInfo.platform}</text></text>
      <text fg="#c0caf5">  Node.js:      <text fg="#9ece6a">{systemInfo.nodeVersion}</text></text>
      <text fg="#c0caf5">  Runtime:      <text fg="#9ece6a">{systemInfo.electronVersion}</text></text>
      <text fg="#c0caf5">  MCP Servers:  <text fg="#9ece6a">{systemInfo.mcpServersCount}</text></text>
      <text fg="#c0caf5">
        MCP Tools:   <text fg="#9ece6a">
          {diagnosticReport ? diagnosticReport.mcp.availableTools : systemInfo.mcpToolsAvailable}
        </text>
      </text>
      {diagnosticReport && (
        <>
          <text fg="#565f89">  ── Report Generated ──</text>
          <text fg="#c0caf5">
            Timestamp: <text fg="#9ece6a">
              {new Date(diagnosticReport.timestamp).toLocaleString()}
            </text>
          </text>
          {Object.entries(diagnosticReport.mcp.serverStatus).map(([name, status]) => (
            <text key={name} fg="#c0caf5">
              {'  '}{status.connected ? '●' : '○'} {name}:{' '}
              <text fg={status.connected ? '#9ece6a' : '#f7768e'}>
                {status.connected ? `connected (${status.toolCount} tools)` : 'disconnected'}
              </text>
            </text>
          ))}
        </>
      )}
      <text fg="#565f89">  Press "g" to generate full report</text>
    </box>
  );
}

/**
 * Langfuse configuration view.
 */
function LangfuseView({
  langfuseStatus,
}: {
  langfuseStatus: LangfuseStatus;
}) {
  return (
    <box flexDirection="column" paddingX={1} gap={0}>
      <text fg="#7aa2f7"><strong>Langfuse Observability</strong></text>
      <text fg="#c0caf5">
        Installed:  <text fg={langfuseStatus.installed ? '#9ece6a' : '#f7768e'}>
          {langfuseStatus.installed ? 'Yes' : 'No (install langfuse package)'}
        </text>
      </text>
      <text fg="#c0caf5">
        Enabled:    <text fg={langfuseStatus.enabled ? '#9ece6a' : '#565f89'}>
          {langfuseStatus.enabled ? 'Yes ✓' : 'No'}
        </text>
        <text fg="#565f89"> (press Enter to toggle)</text>
      </text>
      {langfuseStatus.publicKey && (
        <text fg="#c0caf5">
          Public Key: <text fg="#9ece6a">{langfuseStatus.publicKey}</text>
        </text>
      )}
      <text fg="#c0caf5">
        Base URL:   <text fg="#9ece6a">{langfuseStatus.baseUrl}</text>
      </text>
      <text fg="#565f89">
        {langfuseStatus.enabled
          ? '  Trace IDs will appear after each agent response.'
          : '  Enable to see trace IDs after each response.'}
      </text>
      <text fg="#565f89">  Configure keys in /settings → Providers</text>
    </box>
  );
}

/**
 * Error log view.
 */
function ErrorLogView({
  errorLog,
  selectedIndex,
}: {
  errorLog: ErrorLogEntry[];
  selectedIndex: number;
}) {
  if (errorLog.length === 0) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#9ece6a">✓ No errors recorded.</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7">
        <strong>Error Log</strong>
        <text fg="#565f89"> ({errorLog.length} entries)</text>
      </text>
      {errorLog.slice(0, 20).map((entry, index) => {
        const isSelected = index === selectedIndex;
        const levelColor =
          entry.level === 'error'
            ? '#f7768e'
            : entry.level === 'warning'
              ? '#e0af68'
              : '#565f89';
        const timeStr = new Date(entry.timestamp).toLocaleTimeString();

        return (
          <box key={`err-${index}`} flexDirection="row">
            <text fg={isSelected ? '#7aa2f7' : '#c0caf5'}>
              {isSelected ? '❯ ' : '  '}
              <text fg="#565f89">{timeStr}</text>
              {' '}
              <text fg={levelColor}>[{entry.level.toUpperCase()}]</text>
              {' '}
              <text fg="#565f89">[{entry.component}]</text>
              {' '}
              {entry.message}
            </text>
          </box>
        );
      })}
      {errorLog.length > 20 && (
        <text fg="#565f89">  ... and {errorLog.length - 20} more</text>
      )}
      <text fg="#565f89">  Press "c" to clear log</text>
    </box>
  );
}

/**
 * Health check view.
 */
function HealthCheckView({
  healthCheck,
  loading,
}: {
  healthCheck: HealthCheckResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#7aa2f7">⠋ Running health check...</text>
      </box>
    );
  }

  if (!healthCheck) {
    return (
      <box paddingX={1} paddingY={1}>
        <text fg="#565f89">Press Enter to run health check.</text>
      </box>
    );
  }

  const overallColor =
    healthCheck.overall === 'healthy'
      ? '#9ece6a'
      : healthCheck.overall === 'warning'
        ? '#e0af68'
        : '#f7768e';

  return (
    <box flexDirection="column" paddingX={1}>
      <text fg="#7aa2f7"><strong>Health Check</strong></text>
      <text fg="#c0caf5">
        Overall: <text fg={overallColor}>{healthCheck.overall.toUpperCase()}</text>
      </text>
      {Object.entries(healthCheck.checks).map(([name, check]) => {
        const statusColor =
          check.status === 'pass'
            ? '#9ece6a'
            : check.status === 'warning'
              ? '#e0af68'
              : '#f7768e';
        const statusIcon =
          check.status === 'pass' ? '✓' : check.status === 'warning' ? '⚠' : '✗';

        return (
          <text key={name} fg="#c0caf5">
            {'  '}<text fg={statusColor}>{statusIcon}</text> {name}: {check.message}
          </text>
        );
      })}
      <text fg="#565f89">  Press Enter to re-run</text>
    </box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const SECTIONS: DiagnosticsSection[] = ['system', 'langfuse', 'errors', 'health'];

export function DiagnosticsPanel({
  systemInfo,
  langfuseStatus,
  errorLog,
  healthCheck,
  diagnosticReport,
  loading,
  error,
  onToggleLangfuse,
  onGenerateReport,
  onRunHealthCheck,
  onClearErrors,
  onClose,
}: DiagnosticsPanelProps) {
  const [activeSection, setActiveSection] = useState<DiagnosticsSection>('system');
  const [errorScrollIndex, setErrorScrollIndex] = useState(0);

  useKeyboard((key) => {
    // Tab to switch sections
    if (key.name === 'tab') {
      setActiveSection((prev: DiagnosticsSection) => {
        const idx = SECTIONS.indexOf(prev);
        return SECTIONS[(idx + 1) % SECTIONS.length];
      });
      return;
    }

    // Left/right to switch sections
    if (key.name === 'left') {
      setActiveSection((prev: DiagnosticsSection) => {
        const idx = SECTIONS.indexOf(prev);
        return SECTIONS[(idx - 1 + SECTIONS.length) % SECTIONS.length];
      });
      return;
    }

    if (key.name === 'right') {
      setActiveSection((prev: DiagnosticsSection) => {
        const idx = SECTIONS.indexOf(prev);
        return SECTIONS[(idx + 1) % SECTIONS.length];
      });
      return;
    }

    // Escape to close
    if (key.name === 'escape') {
      onClose();
      return;
    }

    // Section-specific actions
    if (activeSection === 'system') {
      if (key.name === 'g') {
        void onGenerateReport();
      }
    } else if (activeSection === 'langfuse') {
      if (key.name === 'return') {
        onToggleLangfuse(!langfuseStatus.enabled);
      }
    } else if (activeSection === 'errors') {
      if (key.name === 'up') {
        setErrorScrollIndex((i: number) => Math.max(0, i - 1));
      } else if (key.name === 'down') {
        setErrorScrollIndex((i: number) => Math.min(errorLog.length - 1, i + 1));
      } else if (key.name === 'c') {
        onClearErrors();
      }
    } else if (activeSection === 'health') {
      if (key.name === 'return') {
        void onRunHealthCheck();
      }
    }
  });

  return (
    <box flexDirection="column" width="100%" flexGrow={1}>
      {/* Title */}
      <box
        border
        borderStyle="single"
        borderColor="#bb9af7"
        paddingX={1}
        width="100%"
      >
        <text fg="#bb9af7"><strong>Diagnostics</strong></text>
      </box>

      {/* Section tabs */}
      <SectionTabs activeSection={activeSection} />

      {/* Error banner */}
      {error && (
        <box paddingX={1}>
          <text fg="#f7768e">⚠ {error}</text>
        </box>
      )}

      {/* Active section */}
      {activeSection === 'system' && (
        <SystemInfoView systemInfo={systemInfo} diagnosticReport={diagnosticReport} />
      )}

      {activeSection === 'langfuse' && (
        <LangfuseView langfuseStatus={langfuseStatus} />
      )}

      {activeSection === 'errors' && (
        <ErrorLogView errorLog={errorLog} selectedIndex={errorScrollIndex} />
      )}

      {activeSection === 'health' && (
        <HealthCheckView healthCheck={healthCheck} loading={loading} />
      )}

      {/* Status bar */}
      <box paddingX={1}>
        <text fg="#565f89">
          Tab/←/→ switch section • Esc close
          {activeSection === 'system' && ' • g generate report'}
          {activeSection === 'langfuse' && ' • Enter toggle'}
          {activeSection === 'errors' && ' • ↑/↓ scroll • c clear'}
          {activeSection === 'health' && ' • Enter run check'}
        </text>
      </box>
    </box>
  );
}
