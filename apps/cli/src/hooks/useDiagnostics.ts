/**
 * useDiagnostics — React hook for system diagnostics, Langfuse observability,
 * and error log inspection in CLI.
 *
 * Provides:
 * - System diagnostics display (platform, node, MCP stats)
 * - Langfuse toggle with trace ID display after responses
 * - Error log inspection (recent errors/warnings)
 * - Health check status
 *
 * Uses @dotagents/core diagnosticsService, langfuse-service, configStore.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  diagnosticsService,
  isLangfuseEnabled,
  isLangfuseInstalled,
  reinitializeLangfuse,
  configStore,
} from '@dotagents/core';
import type { DiagnosticInfo } from '@dotagents/core';

// ============================================================================
// Types
// ============================================================================

/** System information summary */
export interface SystemInfo {
  platform: string;
  nodeVersion: string;
  electronVersion: string;
  mcpServersCount: number;
  mcpToolsAvailable: number;
}

/** Langfuse status */
export interface LangfuseStatus {
  installed: boolean;
  enabled: boolean;
  publicKey?: string;
  baseUrl?: string;
}

/** Error log entry */
export interface ErrorLogEntry {
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  component: string;
  message: string;
  stack?: string;
}

/** Health check result */
export interface HealthCheckResult {
  overall: 'healthy' | 'warning' | 'critical';
  checks: Record<string, { status: 'pass' | 'fail' | 'warning'; message: string }>;
}

export interface UseDiagnosticsReturn {
  /** System info summary */
  systemInfo: SystemInfo | null;
  /** Langfuse observability status */
  langfuseStatus: LangfuseStatus;
  /** Recent error log entries */
  errorLog: ErrorLogEntry[];
  /** Health check result */
  healthCheck: HealthCheckResult | null;
  /** Full diagnostic report */
  diagnosticReport: DiagnosticInfo | null;
  /** Loading state for async operations */
  loading: boolean;
  /** Last error */
  error: string | null;
  /** Generate full diagnostic report */
  generateReport: () => Promise<void>;
  /** Perform health check */
  runHealthCheck: () => Promise<void>;
  /** Toggle Langfuse on/off */
  toggleLangfuse: (enabled: boolean) => void;
  /** Update Langfuse configuration */
  updateLangfuseConfig: (config: { publicKey?: string; secretKey?: string; baseUrl?: string }) => void;
  /** Get recent errors */
  getRecentErrors: (count?: number) => ErrorLogEntry[];
  /** Clear error log */
  clearErrors: () => void;
  /** Refresh all diagnostics */
  refresh: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useDiagnostics(): UseDiagnosticsReturn {
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticInfo | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRefreshCounter((c: number) => c + 1);
  }, []);

  /**
   * Compute system info from diagnostics service and config.
   */
  const systemInfo = useMemo((): SystemInfo | null => {
    void refreshCounter;

    try {
      const config = configStore.get();
      const mcpServers = config.mcpConfig?.mcpServers || {};

      return {
        platform: process.platform,
        nodeVersion: process.version,
        electronVersion: process.versions.electron || 'N/A (CLI)',
        mcpServersCount: Object.keys(mcpServers).length,
        mcpToolsAvailable: 0, // Updated when report is generated
      };
    } catch {
      return null;
    }
  }, [refreshCounter]);

  /**
   * Compute Langfuse status.
   */
  const langfuseStatus = useMemo((): LangfuseStatus => {
    void refreshCounter;

    const config = configStore.get();
    return {
      installed: isLangfuseInstalled(),
      enabled: isLangfuseEnabled(),
      publicKey: config.langfusePublicKey ? `${config.langfusePublicKey.slice(0, 8)}...` : undefined,
      baseUrl: config.langfuseBaseUrl || 'https://cloud.langfuse.com',
    };
  }, [refreshCounter]);

  /**
   * Get recent errors from diagnostics service.
   */
  const errorLog = useMemo((): ErrorLogEntry[] => {
    void refreshCounter;
    return diagnosticsService.getRecentErrors(50);
  }, [refreshCounter]);

  /**
   * Generate a full diagnostic report.
   */
  const generateReport = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const report = await diagnosticsService.generateDiagnosticReport();
      setDiagnosticReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate diagnostic report');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Perform a health check.
   */
  const runHealthCheck = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await diagnosticsService.performHealthCheck();
      setHealthCheck(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run health check');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle Langfuse enabled/disabled.
   */
  const toggleLangfuse = useCallback(
    (enabled: boolean): void => {
      try {
        const config = configStore.get();
        configStore.save({ ...config, langfuseEnabled: enabled });
        reinitializeLangfuse();
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to toggle Langfuse');
      }
    },
    [refresh],
  );

  /**
   * Update Langfuse configuration keys.
   */
  const updateLangfuseConfig = useCallback(
    (langfuseConfig: { publicKey?: string; secretKey?: string; baseUrl?: string }): void => {
      try {
        const config = configStore.get();
        const updates: Record<string, unknown> = {};

        if (langfuseConfig.publicKey !== undefined) {
          updates.langfusePublicKey = langfuseConfig.publicKey;
        }
        if (langfuseConfig.secretKey !== undefined) {
          updates.langfuseSecretKey = langfuseConfig.secretKey;
        }
        if (langfuseConfig.baseUrl !== undefined) {
          updates.langfuseBaseUrl = langfuseConfig.baseUrl;
        }

        configStore.save({ ...config, ...updates });
        reinitializeLangfuse();
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update Langfuse config');
      }
    },
    [refresh],
  );

  /**
   * Get recent errors with optional count.
   */
  const getRecentErrors = useCallback(
    (count: number = 10): ErrorLogEntry[] => {
      return diagnosticsService.getRecentErrors(count);
    },
    [],
  );

  /**
   * Clear the error log.
   */
  const clearErrors = useCallback((): void => {
    diagnosticsService.clearErrorLog();
    refresh();
  }, [refresh]);

  return {
    systemInfo,
    langfuseStatus,
    errorLog,
    healthCheck,
    diagnosticReport,
    loading,
    error,
    generateReport,
    runHealthCheck,
    toggleLangfuse,
    updateLangfuseConfig,
    getRecentErrors,
    clearErrors,
    refresh,
  };
}
