import { spawn } from 'child_process'
import { EventEmitter } from 'events'

import { agentProfileService } from '../agent-profile-service'
import { logACP, logApp } from '../debug'
import { mcpService } from '../mcp-service'
import { buildAcpxSpawnEnv } from './acpx-env'
import type {
  AcpxActivePrompt,
  AcpxJsonRpcMessage,
  AcpxPromptResult,
  AcpxRunResult,
  AcpxSessionMetadata,
  AcpxVerifyResult,
} from './acpx-types'
import { MIN_SUPPORTED_ACPX_VERSION } from './acpx-types'

type SessionContentBlock = {
  type: 'text' | 'tool_use' | 'tool_result' | 'image' | 'audio' | 'resource' | 'resource_link'
  text?: string
  name?: string
  input?: unknown
  result?: unknown
}

type ToolCallStatus = 'pending' | 'running' | 'completed' | 'failed'

interface ToolCallUpdate {
  toolCallId: string
  title: string
  status?: ToolCallStatus
  rawInput?: unknown
  rawOutput?: unknown
}

interface SessionOutput {
  sessionId: string
  agentName: string
  contentBlocks: SessionContentBlock[]
  isComplete: boolean
  stopReason?: string
}

interface AgentTarget {
  agentName: string
  commandToken?: string
  agentCommand?: string
  cwd?: string
  displayName?: string
}

/**
 * Map well-known ACP adapter command names to their acpx built-in agent tokens.
 * When a profile has `command: "codex-acp"` but no explicit `agent` field,
 * the adapter can still route through `acpx codex ...` instead of trying
 * to spawn `codex-acp` directly.
 */
const KNOWN_COMMAND_TO_ACPX_TOKEN: Record<string, string> = {
  'codex-acp': 'codex',
  'claude-code-acp': 'claude-code',
  'auggie': 'auggie',
  'opencode': 'opencode',
}

function formatAcpxLaunchError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('ENOENT') || message.includes('command not found')) {
    return [
      'acpx is not installed or not available on PATH.',
      'Install it with `npm install -g acpx@latest` and restart DotAgents.',
    ].join(' ')
  }
  if (message.includes("Cannot find package 'zod'")) {
    return [
      'acpx is installed but missing its runtime dependency `zod`.',
      'DotAgents now attempts to provide that automatically; if this persists, reinstall DotAgents or install `zod` globally.',
    ].join(' ')
  }
  return message
}

function compareSemver(left: string, right: string): number {
  const leftParts = left.split('.').map(part => Number.parseInt(part, 10) || 0)
  const rightParts = right.split('.').map(part => Number.parseInt(part, 10) || 0)
  const len = Math.max(leftParts.length, rightParts.length)
  for (let i = 0; i < len; i += 1) {
    const l = leftParts[i] ?? 0
    const r = rightParts[i] ?? 0
    if (l !== r) return l > r ? 1 : -1
  }
  return 0
}

function buildPromptText(prompt: string, context?: string): string {
  return context?.trim() ? `Context:\n${context.trim()}\n\nTask:\n${prompt}` : prompt
}

function joinAgentCommand(command: string, args?: string[]): string {
  return [command, ...(args ?? [])].join(' ').trim()
}

class ACPXService extends EventEmitter {
  private sessionOutputs = new Map<string, SessionOutput>()
  private metadataBySessionName = new Map<string, AcpxSessionMetadata>()
  private latestMetadataByAgent = new Map<string, AcpxSessionMetadata>()
  private activePrompts = new Map<string, AcpxActivePrompt>()
  private fallbackSessionCounter = 0
  private fallbackToolCallCounter = 0
  private lastVerification: AcpxVerifyResult | null = null

  async initialize(): Promise<void> {
    const verification = await this.verifyBinary().catch(() => null)
    if (verification && !verification.success) {
      logApp(`[ACPX] Binary unavailable during initialize: ${verification.error}`)
    }
  }

  async shutdown(): Promise<void> {
    for (const active of this.activePrompts.values()) {
      active.child.kill('SIGTERM')
    }
    this.activePrompts.clear()
  }

  async verifyBinary(): Promise<AcpxVerifyResult> {
    const resolved = await mcpService.resolveCommandPath('acpx').catch(() => 'acpx')

    return await new Promise<AcpxVerifyResult>((resolve) => {
      const child = spawn(resolved, ['--version'], {
        env: buildAcpxSpawnEnv(process.env as Record<string, string | undefined>) as typeof process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', chunk => {
        stdout += chunk.toString()
      })
      child.stderr.on('data', chunk => {
        stderr += chunk.toString()
      })
      child.on('error', error => {
        const result = { success: false, error: formatAcpxLaunchError(error) }
        this.lastVerification = result
        resolve(result)
      })
      child.on('close', code => {
        if (code !== 0) {
          const result = {
            success: false,
            error: stderr.trim() || stdout.trim() || `acpx exited with code ${code}`,
          }
          this.lastVerification = result
          resolve(result)
          return
        }

        const version = (stdout.trim() || stderr.trim()).replace(/^acpx\s+/i, '')
        if (version && compareSemver(version, MIN_SUPPORTED_ACPX_VERSION) < 0) {
          const result = {
            success: false,
            version,
            error: `acpx ${version} is too old. Minimum supported version is ${MIN_SUPPORTED_ACPX_VERSION}.`,
          }
          this.lastVerification = result
          resolve(result)
          return
        }

        const result = { success: true, version }
        this.lastVerification = result
        resolve(result)
      })
    })
  }

  getAgents(): Array<{ config: { name: string; displayName: string; description?: string; enabled: boolean; connection: { type: string } }; status: string; error?: string }> {
    const verification = this.getCachedVerificationStatus()
    const profiles = agentProfileService.getExternalAgents().filter(profile => profile.connection.type === 'acpx')

    return profiles.map(profile => ({
      config: {
        name: profile.name,
        displayName: profile.displayName,
        description: profile.description,
        enabled: profile.enabled,
        connection: { type: 'acpx' },
      },
      status: verification.success ? 'ready' : 'error',
      error: verification.error,
    }))
  }

  getAgentStatus(agentName: string): { status: 'ready' | 'starting' | 'stopped' | 'error'; error?: string; workingDirectory?: string } | null {
    const target = this.resolveTarget(agentName)
    if (!target) return { status: 'stopped' }
    const verification = this.getCachedVerificationStatus()
    return {
      status: verification.success ? 'ready' : 'error',
      error: verification.error,
      workingDirectory: target.cwd,
    }
  }

  getAgentSessionId(agentName: string): string | undefined {
    return this.latestMetadataByAgent.get(agentName)?.sessionId
  }

  getAgentInstance(agentName: string): { sessionId?: string; sessionInfo?: AcpxSessionMetadata['sessionInfo']; agentInfo?: AcpxSessionMetadata['agentInfo'] } | undefined {
    const metadata = this.latestMetadataByAgent.get(agentName)
    if (!metadata) return undefined
    return {
      sessionId: metadata.sessionId,
      sessionInfo: metadata.sessionInfo,
      agentInfo: metadata.agentInfo,
    }
  }

  getSessionOutput(sessionId: string): SessionOutput | undefined {
    return this.sessionOutputs.get(sessionId)
  }

  clearSessionOutput(sessionId: string): void {
    this.sessionOutputs.delete(sessionId)
  }

  async getOrCreateSession(
    agentName: string,
    forceNew?: boolean,
    workingDirectory?: string,
    _pendingInjectedMcpContext?: { appSessionId: string },
    preferredSessionName?: string,
    onStage?: (stage: 'launching' | 'initializing' | 'creating_session') => void | Promise<void>,
  ): Promise<string> {
    if (forceNew && preferredSessionName) {
      await this.closeSession(agentName, preferredSessionName, workingDirectory).catch(() => undefined)
    }

    await onStage?.('launching')
    await this.verifyOrThrow()
    await onStage?.('initializing')

    const sessionName = preferredSessionName ?? 'dotagents:default'
    await onStage?.('creating_session')
    const metadata = await this.ensureSession(agentName, sessionName, workingDirectory)
    return metadata.sessionId ?? sessionName
  }

  async ensureSession(agentName: string, sessionName: string, workingDirectory?: string): Promise<AcpxSessionMetadata> {
    const { stdout } = await this.runAcpx(agentName, ['sessions', 'ensure', '--name', sessionName], {
      cwd: workingDirectory,
      expectJsonDocument: true,
    })

    const parsed = this.parseJsonDocument(stdout)
    const metadata = this.toSessionMetadata(agentName, sessionName, parsed, workingDirectory)
    this.rememberMetadata(metadata)
    return metadata
  }

  async readSessionMetadata(agentName: string, sessionName: string, workingDirectory?: string): Promise<AcpxSessionMetadata | null> {
    try {
      const { stdout } = await this.runAcpx(agentName, ['sessions', 'show', sessionName], {
        cwd: workingDirectory,
        expectJsonDocument: true,
      })

      const metadata = this.toSessionMetadata(agentName, sessionName, this.parseJsonDocument(stdout), workingDirectory)
      this.rememberMetadata(metadata)
      return metadata
    } catch (error) {
      logApp('[ACPX] readSessionMetadata failed', agentName, error)
      return null
    }
  }

  async runTask(request: {
    agentName: string
    input: string | { messages?: Array<{ content: string }> }
    context?: string
    workingDirectory?: string
    forceNewSession?: boolean
  }): Promise<AcpxRunResult> {
    const inputText = typeof request.input === 'string'
      ? request.input
      : request.input.messages?.map(message => message.content).join('\n') ?? ''

    if (request.forceNewSession) {
      const { stdout } = await this.runAcpx(request.agentName, ['exec', buildPromptText(inputText, request.context)], {
        cwd: request.workingDirectory,
        streamJsonRpc: true,
      })
      return this.collectPromptResult(request.agentName, undefined, stdout)
    }

    const sessionName = `dotagents:task:${Date.now()}`
    await this.ensureSession(request.agentName, sessionName, request.workingDirectory)
    return await this.prompt(request.agentName, sessionName, inputText, request.context, request.workingDirectory)
  }

  async prompt(
    agentName: string,
    sessionName: string,
    prompt: string,
    context?: string,
    workingDirectory?: string,
  ): Promise<AcpxPromptResult> {
    await this.verifyOrThrow()
    await this.ensureSession(agentName, sessionName, workingDirectory)
    return await this.runPrompt(agentName, sessionName, buildPromptText(prompt, context), workingDirectory)
  }

  async sendPrompt(agentName: string, sessionIdOrName: string, prompt: string, context?: string): Promise<AcpxPromptResult> {
    return await this.prompt(agentName, sessionIdOrName, prompt, context)
  }

  async cancelPrompt(agentName: string, sessionIdOrName: string, workingDirectory?: string): Promise<void> {
    await this.cancel(agentName, sessionIdOrName, workingDirectory)
  }

  async cancel(agentName: string, sessionName: string, workingDirectory?: string): Promise<void> {
    await this.runAcpx(agentName, ['cancel', '-s', sessionName], {
      cwd: workingDirectory,
      expectJsonDocument: false,
    }).catch(error => {
      logApp('[ACPX] cancel failed', agentName, error)
    })

    const active = this.activePrompts.get(this.activePromptKey(agentName, sessionName))
    if (active) {
      active.child.kill('SIGTERM')
      this.activePrompts.delete(active.key)
    }
  }

  async stopAgent(_agentName: string): Promise<void> {
    return
  }

  getAgentCapabilities(_agentName: string): { loadSession?: boolean } | undefined {
    return { loadSession: true }
  }

  private getCachedVerificationStatus(): AcpxVerifyResult {
    return this.lastVerification ?? {
      success: false,
      error: 'acpx availability has not been verified yet. Restart DotAgents or try running an acpx agent once.',
    }
  }

  private async verifyOrThrow(): Promise<void> {
    const verification = await this.verifyBinary()
    if (!verification.success) {
      throw new Error(verification.error ?? 'acpx is not available')
    }
  }

  private resolveTarget(agentName: string): AgentTarget | null {
    const profile = agentProfileService.getByName(agentName)
    if (!profile || profile.connection.type !== 'acpx') {
      return null
    }

    const connection = profile.connection as {
      type: 'acpx'
      agent?: string
      command?: string
      args?: string[]
      cwd?: string
    }

    // Resolve the acpx agent token:
    // 1. Explicit `agent` field wins
    // 2. If only `command` is set, check if it maps to a known acpx built-in token
    // 3. Otherwise fall back to using `--agent <command>` for custom adapters
    const resolvedToken = connection.agent
      ?? (connection.command ? KNOWN_COMMAND_TO_ACPX_TOKEN[connection.command] : undefined)

    return {
      agentName,
      commandToken: resolvedToken,
      agentCommand: !resolvedToken && connection.command
        ? joinAgentCommand(connection.command, connection.args)
        : undefined,
      cwd: connection.cwd,
      displayName: profile.displayName,
    }
  }

  private buildBaseArgs(agentName: string, workingDirectory?: string): string[] {
    const target = this.resolveTarget(agentName)
    if (!target) {
      throw new Error(`Agent profile ${agentName} is not configured for acpx`)
    }

    const args: string[] = ['--format', 'json', '--json-strict']
    const cwd = workingDirectory || target.cwd || process.cwd()
    if (cwd) {
      args.push('--cwd', cwd)
    }

    if (target.commandToken) {
      args.push(target.commandToken)
    } else if (target.agentCommand) {
      args.push('--agent', target.agentCommand)
    } else {
      throw new Error(`Agent profile ${agentName} is missing an acpx agent or command`)
    }

    return args
  }

  private async closeSession(agentName: string, sessionName: string, workingDirectory?: string): Promise<void> {
    await this.runAcpx(agentName, ['sessions', 'close', sessionName], {
      cwd: workingDirectory,
      expectJsonDocument: false,
    })
  }

  private async runPrompt(
    agentName: string,
    sessionName: string,
    prompt: string,
    workingDirectory?: string,
  ): Promise<AcpxPromptResult> {
    const { stdout } = await this.runAcpx(agentName, ['prompt', '-s', sessionName, prompt], {
      cwd: workingDirectory,
      streamJsonRpc: true,
      sessionName,
    })

    return this.collectPromptResult(agentName, sessionName, stdout)
  }

  private async runAcpx(
    agentName: string,
    commandArgs: string[],
    options: { cwd?: string; expectJsonDocument?: boolean; streamJsonRpc?: boolean; sessionName?: string },
  ): Promise<{ stdout: string; stderr: string }> {
    const resolved = await mcpService.resolveCommandPath('acpx').catch(() => 'acpx')
    const args = [...this.buildBaseArgs(agentName, options.cwd), ...commandArgs]

    return await new Promise((resolve, reject) => {
      const child = spawn(resolved, args, {
        cwd: options.cwd,
        env: buildAcpxSpawnEnv(process.env as Record<string, string | undefined>) as typeof process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''
      let stdoutBuffer = ''

      const activeKey = options.sessionName ? this.activePromptKey(agentName, options.sessionName) : null
      if (activeKey) {
        this.activePrompts.set(activeKey, { key: activeKey, agentName, sessionName: options.sessionName!, child })
      }

      child.stdout.on('data', chunk => {
        const text = chunk.toString()
        stdout += text
        stdoutBuffer += text

        if (options.streamJsonRpc) {
          let newlineIndex = stdoutBuffer.indexOf('\n')
          while (newlineIndex >= 0) {
            const line = stdoutBuffer.slice(0, newlineIndex).trim()
            stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1)
            if (line) {
              this.consumeJsonRpcLine(agentName, line, options.sessionName)
            }
            newlineIndex = stdoutBuffer.indexOf('\n')
          }
        }
      })

      child.stderr.on('data', chunk => {
        stderr += chunk.toString()
      })

      child.on('error', error => {
        if (activeKey) this.activePrompts.delete(activeKey)
        reject(new Error(formatAcpxLaunchError(error)))
      })

      child.on('close', code => {
        if (activeKey) this.activePrompts.delete(activeKey)
        if (options.streamJsonRpc && stdoutBuffer.trim()) {
          this.consumeJsonRpcLine(agentName, stdoutBuffer.trim(), options.sessionName)
        }

        if (code !== 0) {
          reject(new Error(stderr.trim() || stdout.trim() || `acpx exited with code ${code}`))
          return
        }

        if (options.expectJsonDocument && !stdout.trim()) {
          reject(new Error('acpx returned empty JSON output'))
          return
        }

        resolve({ stdout, stderr })
      })
    })
  }

  private consumeJsonRpcLine(agentName: string, line: string, fallbackSessionName?: string): void {
    let message: AcpxJsonRpcMessage
    try {
      message = JSON.parse(line) as AcpxJsonRpcMessage
    } catch {
      return
    }

    if (message.method === 'session/update') {
      this.handleSessionUpdate(agentName, message.params ?? {}, fallbackSessionName)
      return
    }

    if (message.result && typeof message.result === 'object') {
      const sessionId = typeof message.result.sessionId === 'string'
        ? message.result.sessionId
        : typeof message.result.runtimeSessionId === 'string'
          ? message.result.runtimeSessionId
          : undefined

      if (sessionId && fallbackSessionName) {
        this.rememberMetadata({
          sessionId,
          sessionName: fallbackSessionName,
          agentName,
          raw: message.result,
        })
      }
    }
  }

  private handleSessionUpdate(agentName: string, params: Record<string, unknown>, fallbackSessionName?: string): void {
    const runtimeSessionId = typeof params.sessionId === 'string'
      ? params.sessionId
      : fallbackSessionName

    const sessionId = runtimeSessionId || `${agentName}_fallback_${++this.fallbackSessionCounter}`
    let output = this.sessionOutputs.get(sessionId)
    if (!output) {
      output = { sessionId, agentName, contentBlocks: [], isComplete: false }
      this.sessionOutputs.set(sessionId, output)
    }

    const contentBlocks: SessionContentBlock[] = []
    const appendText = (text: string) => {
      if (text) contentBlocks.push({ type: 'text', text })
    }
    const appendUnknown = (value: unknown): void => {
      if (!value) return
      if (typeof value === 'string') {
        appendText(value)
        return
      }
      if (Array.isArray(value)) {
        value.forEach(item => appendUnknown(item))
        return
      }
      if (typeof value !== 'object') return
      const record = value as Record<string, unknown>
      if (typeof record.type === 'string') {
        if (record.type === 'text' && typeof record.text === 'string') {
          appendText(record.text)
          return
        }
        if (['tool_use', 'tool_result', 'image', 'audio', 'resource', 'resource_link'].includes(record.type)) {
          contentBlocks.push(record as SessionContentBlock)
          return
        }
      }

      if (record.content !== undefined) appendUnknown(record.content)
      if (typeof record.text === 'string') appendText(record.text)
      if (typeof record.delta === 'string') appendText(record.delta)
      if (typeof record.message === 'string') appendText(record.message)
      if (record.message && typeof record.message === 'object') {
        appendUnknown((record.message as Record<string, unknown>).content)
      }
    }

    appendUnknown(params.content)
    appendUnknown((params.update as Record<string, unknown> | undefined)?.content)

    for (const block of contentBlocks) {
      output.contentBlocks.push(block)
    }

    const update = (params.update as Record<string, unknown> | undefined) ?? {}
    const stopReason = typeof params.stopReason === 'string'
      ? params.stopReason
      : typeof update.stopReason === 'string'
        ? update.stopReason
        : undefined

    const rawSessionUpdate = typeof update.sessionUpdate === 'string' ? update.sessionUpdate : undefined
    const isComplete = Boolean(params.isComplete) || rawSessionUpdate === 'turn_complete'
    if (isComplete) {
      output.isComplete = true
      output.stopReason = stopReason
    }

    const toolCall = this.extractToolCall(update)
    if (toolCall) {
      this.emit('toolCallUpdate', {
        agentName,
        sessionId,
        toolCall,
        awaitingPermission: false,
      })
    }

    this.emit('sessionUpdate', {
      agentName,
      sessionId,
      content: contentBlocks.length > 0 ? contentBlocks : undefined,
      toolCall,
      isComplete,
      stopReason,
      totalBlocks: output.contentBlocks.length,
    })
  }

  private extractToolCall(update: Record<string, unknown>): ToolCallUpdate | undefined {
    const rawToolCall = update.toolCall
    if (rawToolCall && typeof rawToolCall === 'object') {
      const record = rawToolCall as Record<string, unknown>
      return {
        toolCallId: typeof record.toolCallId === 'string' ? record.toolCallId : this.generateFallbackToolCallId(),
        title: typeof record.title === 'string' ? record.title : 'Tool call',
        status: typeof record.status === 'string' ? record.status as ToolCallStatus : undefined,
        rawInput: record.rawInput ?? record.input,
        rawOutput: record.rawOutput ?? record.output,
      }
    }

    const sessionUpdate = typeof update.sessionUpdate === 'string' ? update.sessionUpdate : undefined
    if (!sessionUpdate?.startsWith('tool_call')) {
      return undefined
    }

    const status = sessionUpdate.includes('failed')
      ? 'failed'
      : sessionUpdate.includes('completed') || sessionUpdate.includes('complete')
        ? 'completed'
        : sessionUpdate.includes('pending')
          ? 'pending'
          : 'running'

    return {
      toolCallId: typeof update.toolCallId === 'string' ? update.toolCallId : this.generateFallbackToolCallId(),
      title: typeof update.title === 'string'
        ? update.title
        : typeof update.name === 'string'
          ? `Tool: ${update.name}`
          : 'Tool call',
      status,
      rawInput: update.rawInput ?? update.input,
      rawOutput: update.rawOutput ?? update.output,
    }
  }

  private collectPromptResult(agentName: string, sessionName: string | undefined, stdout: string): AcpxPromptResult {
    let stopReason: string | undefined
    let responseText = ''
    let lastSessionId: string | undefined

    for (const rawLine of stdout.split('\n')) {
      const line = rawLine.trim()
      if (!line) continue
      let message: AcpxJsonRpcMessage
      try {
        message = JSON.parse(line) as AcpxJsonRpcMessage
      } catch {
        continue
      }

      if (message.method === 'session/update') {
        const params = message.params ?? {}
        const sessionId = typeof params.sessionId === 'string' ? params.sessionId : undefined
        if (sessionId) {
          lastSessionId = sessionId
        }
      }

      if (message.result) {
        const result = message.result
        if (typeof result.stopReason === 'string') {
          stopReason = result.stopReason
        }
        if (typeof result.sessionId === 'string') {
          lastSessionId = result.sessionId
        }
        if (typeof result.runtimeSessionId === 'string') {
          lastSessionId = result.runtimeSessionId
        }
      }
    }

    const sessionOutput = lastSessionId ? this.sessionOutputs.get(lastSessionId) : undefined
    if (sessionOutput) {
      responseText = sessionOutput.contentBlocks
        .filter(block => block.type === 'text' && typeof block.text === 'string')
        .map(block => block.text)
        .join('\n')
        .trim()
    }

    if (sessionName) {
      this.rememberMetadata({
        sessionId: lastSessionId,
        sessionName,
        agentName,
      })
    }

    return {
      success: true,
      response: responseText || undefined,
      stopReason,
      sessionId: lastSessionId,
    }
  }

  private parseJsonDocument(stdout: string): unknown {
    return JSON.parse(stdout.trim())
  }

  private toSessionMetadata(agentName: string, sessionName: string, raw: unknown, cwd?: string): AcpxSessionMetadata {
    const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const acpxRecord = record.acpx && typeof record.acpx === 'object'
      ? record.acpx as Record<string, unknown>
      : undefined
    return {
      sessionId: typeof record.sessionId === 'string'
        ? record.sessionId
        : typeof record.runtimeSessionId === 'string'
          ? record.runtimeSessionId
          : typeof record.acpxSessionId === 'string'
            ? record.acpxSessionId
            : typeof record.acpSessionId === 'string'
              ? record.acpSessionId
              : typeof record.acpxRecordId === 'string'
                ? record.acpxRecordId
          : undefined,
      sessionName: typeof record.name === 'string' ? record.name : sessionName,
      agentName,
      cwd: typeof record.cwd === 'string' ? record.cwd : cwd,
      closed: typeof record.closed === 'boolean' ? record.closed : undefined,
      agentInfo: {
        name: agentName,
        title: typeof record.agentTitle === 'string' ? record.agentTitle : undefined,
        version: typeof record.agentVersion === 'string' ? record.agentVersion : undefined,
      },
      sessionInfo: {
        currentModeId: typeof record.currentModeId === 'string' ? record.currentModeId : undefined,
        configOptions: Array.isArray(record.configOptions) ? record.configOptions : undefined,
        models: record.models && typeof record.models === 'object' ? record.models as {
          currentModelId?: string
          availableModels?: Array<{ modelId?: string; name?: string; description?: string }>
        } : acpxRecord
          ? {
              currentModelId: typeof acpxRecord.current_model_id === 'string' ? acpxRecord.current_model_id : undefined,
              availableModels: Array.isArray(acpxRecord.available_models)
                ? acpxRecord.available_models.map(model => typeof model === 'string'
                    ? { modelId: model, name: model }
                    : model as { modelId?: string; name?: string; description?: string })
                : undefined,
            }
          : undefined,
        modes: record.modes && typeof record.modes === 'object' ? record.modes as {
          currentModeId?: string
          availableModes?: Array<{ id?: string; name?: string; description?: string }>
        } : undefined,
      },
      raw,
    }
  }

  private rememberMetadata(metadata: AcpxSessionMetadata): void {
    this.metadataBySessionName.set(metadata.sessionName, metadata)
    this.latestMetadataByAgent.set(metadata.agentName, metadata)
  }

  private activePromptKey(agentName: string, sessionName: string): string {
    return `${agentName}:${sessionName}`
  }

  private generateFallbackToolCallId(): string {
    this.fallbackToolCallCounter += 1
    return `acpx-tool-${this.fallbackToolCallCounter}`
  }
}

export const acpxService = new ACPXService()
