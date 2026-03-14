import fs from "fs"
import path from "path"
import { configStore } from "./config"

/**
 * Interface for MCP service dependency injection.
 * Diagnostics only needs tool listing and connection testing from MCP.
 */
export interface DiagnosticsMcpProvider {
  getAvailableTools(): Array<{ name: string }>
  testServerConnection(
    serverName: string,
    serverConfig: unknown,
  ): Promise<{ success: boolean; toolCount?: number }>
}

export interface DiagnosticInfo {
  timestamp: number
  system: {
    platform: string
    nodeVersion: string
    electronVersion: string
  }
  config: {
    mcpServersCount: number
  }
  mcp: {
    availableTools: number
    toolDiscoveryError?: string
    serverStatus: Record<string, { connected: boolean; toolCount: number }>
  }
  errors: Array<{
    timestamp: number
    level: "error" | "warning" | "info"
    component: string
    message: string
    stack?: string
  }>
}

export class DiagnosticsService {
  private errorLog: DiagnosticInfo["errors"] = []
  private maxErrorLogSize = 100
  private mcpProvider: DiagnosticsMcpProvider | null = null

  constructor() {
    // Set up global error handlers
    this.setupErrorHandlers()
  }

  /**
   * Set the MCP provider for diagnostics.
   * Must be called before generateDiagnosticReport or performHealthCheck
   * can include MCP data.
   */
  setMcpProvider(provider: DiagnosticsMcpProvider): void {
    this.mcpProvider = provider
  }

  private setupErrorHandlers(): void {
    // Capture unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      this.logError("system", "Unhandled Promise Rejection", {
        reason: String(reason),
        promise: String(promise),
      })
    })

    // Capture uncaught exceptions
    process.on("uncaughtException", (error) => {
      this.logError("system", "Uncaught Exception", {
        message: error.message,
        stack: error.stack,
      })
    })
  }

  logError(component: string, message: string, details?: any): void {
    const errorEntry = {
      timestamp: Date.now(),
      level: "error" as const,
      component,
      message,
      stack: details?.stack || new Error().stack,
    }

    this.errorLog.push(errorEntry)

    // Keep log size manageable
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLogSize)
    }
  }

  logWarning(component: string, message: string, details?: any): void {
    const warningEntry = {
      timestamp: Date.now(),
      level: "warning" as const,
      component,
      message,
      stack: details?.stack,
    }

    this.errorLog.push(warningEntry)

    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLogSize)
    }
  }

  logInfo(component: string, message: string, _details?: any): void {
    const infoEntry = {
      timestamp: Date.now(),
      level: "info" as const,
      component,
      message,
    }

    this.errorLog.push(infoEntry)

    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLogSize)
    }
  }

  private getAvailableToolsSummary(): {
    availableTools: number
    toolDiscoveryError?: string
  } {
    if (!this.mcpProvider) {
      return { availableTools: 0 }
    }

    try {
      return {
        availableTools: this.mcpProvider.getAvailableTools().length,
      }
    } catch (error) {
      return {
        availableTools: 0,
        toolDiscoveryError: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async generateDiagnosticReport(): Promise<DiagnosticInfo> {
    const config = configStore.get()
    const toolSummary = this.getAvailableToolsSummary()

    return {
      timestamp: Date.now(),
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        electronVersion: process.versions.electron || "unknown",
      },
      config: {
        mcpServersCount: Object.keys(config.mcpConfig?.mcpServers || {}).length,
      },
      mcp: {
        availableTools: toolSummary.availableTools,
        ...(toolSummary.toolDiscoveryError
          ? { toolDiscoveryError: toolSummary.toolDiscoveryError }
          : {}),
        serverStatus: await this.getServerStatus(),
      },
      errors: [...this.errorLog],
    }
  }

  private async getServerStatus(): Promise<
    Record<string, { connected: boolean; toolCount: number }>
  > {
    if (!this.mcpProvider) {
      return {}
    }

    const config = configStore.get()
    const serverStatus: Record<
      string,
      { connected: boolean; toolCount: number }
    > = {}

    for (const [serverName, serverConfig] of Object.entries(
      config.mcpConfig?.mcpServers || {},
    )) {
      try {
        const testResult = await this.mcpProvider.testServerConnection(
          serverName,
          serverConfig,
        )
        serverStatus[serverName] = {
          connected: testResult.success,
          toolCount: testResult.toolCount || 0,
        }
      } catch (error) {
        serverStatus[serverName] = {
          connected: false,
          toolCount: 0,
        }
      }
    }

    return serverStatus
  }

  async saveDiagnosticReport(filePath?: string): Promise<string> {
    const report = await this.generateDiagnosticReport()
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const defaultPath =
      filePath ||
      path.join(process.cwd(), `diagnostic-report-${timestamp}.json`)

    fs.writeFileSync(defaultPath, JSON.stringify(report, null, 2))

    return defaultPath
  }

  getRecentErrors(count: number = 10): DiagnosticInfo["errors"] {
    return this.errorLog.slice(-count)
  }

  clearErrorLog(): void {
    this.errorLog = []
  }

  // Health check method
  async performHealthCheck(): Promise<{
    overall: "healthy" | "warning" | "critical"
    checks: Record<
      string,
      { status: "pass" | "fail" | "warning"; message: string }
    >
  }> {
    const checks: Record<
      string,
      { status: "pass" | "fail" | "warning"; message: string }
    > = {}

    // Check MCP service
    if (this.mcpProvider) {
      try {
        const tools = this.mcpProvider.getAvailableTools()
        checks.mcpService = {
          status: tools.length > 0 ? "pass" : "warning",
          message: `${tools.length} tools available`,
        }
      } catch (error) {
        checks.mcpService = {
          status: "fail",
          message: `MCP service error: ${error}`,
        }
      }
    } else {
      checks.mcpService = {
        status: "warning",
        message: "MCP provider not configured",
      }
    }

    // Check recent errors
    const recentErrors = this.errorLog.filter(
      (e) => e.level === "error" && Date.now() - e.timestamp < 5 * 60 * 1000, // Last 5 minutes
    )

    checks.recentErrors = {
      status:
        recentErrors.length === 0
          ? "pass"
          : recentErrors.length < 5
            ? "warning"
            : "fail",
      message: `${recentErrors.length} errors in last 5 minutes`,
    }

    // Check configuration
    const config = configStore.get()
    const mcpServers = config.mcpConfig?.mcpServers || {}
    checks.configuration = {
      status: Object.keys(mcpServers).length > 0 ? "pass" : "warning",
      message: `${Object.keys(mcpServers).length} MCP servers configured`,
    }

    // Determine overall status
    const failCount = Object.values(checks).filter(
      (c) => c.status === "fail",
    ).length
    const warningCount = Object.values(checks).filter(
      (c) => c.status === "warning",
    ).length

    let overall: "healthy" | "warning" | "critical" = "healthy"
    if (failCount > 0) {
      overall = "critical"
    } else if (warningCount > 0) {
      overall = "warning"
    }

    return { overall, checks }
  }
}

/**
 * Default singleton instance.
 * Callers can import this directly for convenience; the MCP provider
 * is set lazily at startup via `diagnosticsService.setMcpProvider(...)`.
 */
export const diagnosticsService = new DiagnosticsService()
