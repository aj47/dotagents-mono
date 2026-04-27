import fs from 'fs'
import path from 'path'

import { logApp } from '../debug'
import { dataFolder } from '../config'

const STATE_DIR = dataFolder
const NEW_STATE_FILE = path.join(STATE_DIR, 'acpx-session-state.json')
const LEGACY_STATE_FILE = path.join(STATE_DIR, 'acp-session-state.json')

export interface ACPXConversationSessionInfo {
  sessionId?: string
  sessionName?: string
  agentName: string
  createdAt: number
  lastUsedAt: number
}

interface PersistedState {
  conversations: Record<string, ACPXConversationSessionInfo>
  sessionToAppSession: Record<string, string>
  sessionToRunId: Record<string, string | number>
  sessionToClientSessionToken: Record<string, string>
  pendingClientSessionTokenToAppSession: Record<string, string>
  knownAppSessions: string[]
}

const conversationSessions = new Map<string, ACPXConversationSessionInfo>()
const acpxToAppSession = new Map<string, string>()
const acpxToRunId = new Map<string, string | number>()
const acpxToClientSessionToken = new Map<string, string>()
const pendingClientSessionTokenToAppSession = new Map<string, string>()
const acpxSessionTitleOverrides = new Map<string, string>()
const knownAppSessionIds = new Set<string>()

function ensureStateDir(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true })
  }
}

function readPersistedState(): PersistedState | null {
  for (const candidate of [NEW_STATE_FILE, LEGACY_STATE_FILE]) {
    if (!fs.existsSync(candidate)) continue
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8')) as Partial<PersistedState>
      const legacyConversationEntries = Array.isArray((parsed as { conversationSessions?: unknown }).conversationSessions)
        ? ((parsed as { conversationSessions?: unknown[] }).conversationSessions as unknown[])
        : []

      const conversationsFromLegacy = Object.fromEntries(
        legacyConversationEntries.flatMap((entry) => {
          if (!Array.isArray(entry) || entry.length !== 2) return []
          const [conversationId, info] = entry
          if (typeof conversationId !== 'string' || !info || typeof info !== 'object') return []
          const record = info as Record<string, unknown>
          if (typeof record.agentName !== 'string' || typeof record.createdAt !== 'number' || typeof record.lastUsedAt !== 'number') {
            return []
          }
          return [[conversationId, {
            sessionId: typeof record.sessionId === 'string' ? record.sessionId : undefined,
            sessionName: typeof record.sessionName === 'string' ? record.sessionName : undefined,
            agentName: record.agentName as string,
            createdAt: record.createdAt as number,
            lastUsedAt: record.lastUsedAt as number,
          } satisfies ACPXConversationSessionInfo]]
        }),
      )

      return {
        conversations: parsed.conversations ?? conversationsFromLegacy,
        sessionToAppSession: parsed.sessionToAppSession ?? {},
        sessionToRunId: parsed.sessionToRunId ?? {},
        sessionToClientSessionToken: parsed.sessionToClientSessionToken ?? {},
        pendingClientSessionTokenToAppSession: parsed.pendingClientSessionTokenToAppSession ?? {},
        knownAppSessions: Array.isArray(parsed.knownAppSessions)
          ? parsed.knownAppSessions.filter((value): value is string => typeof value === "string")
          : [],
      }
    } catch (error) {
      logApp('[ACPX Session State] Failed to read persisted state:', error)
    }
  }

  return null
}

function saveState(): void {
  ensureStateDir()
  const state: PersistedState = {
    conversations: Object.fromEntries(conversationSessions.entries()),
    sessionToAppSession: Object.fromEntries(acpxToAppSession.entries()),
    sessionToRunId: Object.fromEntries(acpxToRunId.entries()),
    sessionToClientSessionToken: Object.fromEntries(acpxToClientSessionToken.entries()),
    pendingClientSessionTokenToAppSession: Object.fromEntries(pendingClientSessionTokenToAppSession.entries()),
    knownAppSessions: Array.from(knownAppSessionIds),
  }

  try {
    fs.writeFileSync(NEW_STATE_FILE, JSON.stringify(state, null, 2), 'utf8')
    fs.writeFileSync(LEGACY_STATE_FILE, JSON.stringify({
      version: 1,
      conversationSessions: Array.from(conversationSessions.entries()),
    }, null, 2), 'utf8')
  } catch (error) {
    logApp('[ACPX Session State] Failed to persist state:', error)
  }
}

function loadState(): void {
  const state = readPersistedState()
  if (!state) return

  conversationSessions.clear()
  acpxToAppSession.clear()
  acpxToRunId.clear()
  acpxToClientSessionToken.clear()
  pendingClientSessionTokenToAppSession.clear()
  knownAppSessionIds.clear()

  for (const [conversationId, info] of Object.entries(state.conversations)) {
    conversationSessions.set(conversationId, info)
  }
  for (const [sessionId, appSessionId] of Object.entries(state.sessionToAppSession)) {
    acpxToAppSession.set(sessionId, appSessionId)
  }
  for (const [sessionId, runId] of Object.entries(state.sessionToRunId)) {
    acpxToRunId.set(sessionId, runId)
  }
  for (const [sessionId, token] of Object.entries(state.sessionToClientSessionToken)) {
    acpxToClientSessionToken.set(sessionId, token)
  }
  for (const [token, appSessionId] of Object.entries(state.pendingClientSessionTokenToAppSession)) {
    pendingClientSessionTokenToAppSession.set(token, appSessionId)
  }
  for (const sessionId of state.knownAppSessions) {
    knownAppSessionIds.add(sessionId)
  }
}

loadState()

export function getMainAcpxSessionName(conversationId: string): string {
  return `dotagents:main:${conversationId}`
}

export function getDelegationAcpxSessionName(parentSessionId: string, runId: string): string {
  return `dotagents:delegation:${parentSessionId}:${runId}`
}

export function getSessionForConversation(conversationId: string): ACPXConversationSessionInfo | undefined {
  return conversationSessions.get(conversationId)
}

export function setSessionForConversation(
  conversationId: string,
  sessionId: string | undefined,
  agentName: string,
  sessionName?: string,
): void {
  const existing = conversationSessions.get(conversationId)
  conversationSessions.set(conversationId, {
    sessionId: sessionId ?? existing?.sessionId,
    sessionName: sessionName ?? existing?.sessionName ?? getMainAcpxSessionName(conversationId),
    agentName,
    createdAt: existing?.createdAt ?? Date.now(),
    lastUsedAt: Date.now(),
  })
  saveState()
}

export function updateConversationRuntimeSessionId(conversationId: string, sessionId: string): void {
  const existing = conversationSessions.get(conversationId)
  if (!existing) return
  conversationSessions.set(conversationId, {
    ...existing,
    sessionId,
    lastUsedAt: Date.now(),
  })
  saveState()
}

export function clearSessionForConversation(conversationId: string): void {
  conversationSessions.delete(conversationId)
  saveState()
}

export function setAcpToAppSessionMapping(acpxSessionId: string, appSessionId: string, runId?: string | number): void {
  acpxToAppSession.set(acpxSessionId, appSessionId)
  if (runId) {
    acpxToRunId.set(acpxSessionId, runId)
  }
  saveState()
}

function registerKnownAppSessionIdInternal(appSessionId: string, options?: { persist?: boolean }): void {
  const normalizedSessionId = appSessionId.trim()
  if (!normalizedSessionId) return
  knownAppSessionIds.add(normalizedSessionId)
  if (options?.persist !== false) {
    saveState()
  }
}

export function registerKnownAppSessionId(appSessionId: string): void {
  registerKnownAppSessionIdInternal(appSessionId, { persist: true })
}

export function getAppSessionForAcpSession(acpxSessionId: string): string | undefined {
  return acpxToAppSession.get(acpxSessionId)
}

function isKnownAcpSessionId(sessionId: string): boolean {
  if (acpxToAppSession.has(sessionId)) return true
  if (acpxToRunId.has(sessionId)) return true
  if (acpxToClientSessionToken.has(sessionId)) return true
  if (acpxSessionTitleOverrides.has(sessionId)) return true

  for (const session of conversationSessions.values()) {
    if (session.sessionId === sessionId) return true
  }

  return false
}

export function getRootAppSessionForAcpSession(acpxSessionId: string): string | undefined {
  let currentSessionId = acpxSessionId
  const visitedSessionIds = new Set<string>()

  while (!visitedSessionIds.has(currentSessionId)) {
    visitedSessionIds.add(currentSessionId)
    const mappedSessionId = acpxToAppSession.get(currentSessionId)
    if (!mappedSessionId) {
      if (currentSessionId === acpxSessionId) return undefined
      if (isKnownAcpSessionId(currentSessionId)) return undefined
      return knownAppSessionIds.has(currentSessionId) ? currentSessionId : undefined
    }
    currentSessionId = mappedSessionId
  }

  return undefined
}

export function setAcpSessionTitleOverride(acpxSessionId: string, title: string): void {
  const normalizedTitle = title.trim()
  if (!normalizedTitle) {
    acpxSessionTitleOverrides.delete(acpxSessionId)
    return
  }

  acpxSessionTitleOverrides.set(acpxSessionId, normalizedTitle)
}

export function getAcpSessionTitleOverride(acpxSessionId: string): string | undefined {
  return acpxSessionTitleOverrides.get(acpxSessionId)
}

export function clearAcpToAppSessionMapping(acpxSessionId: string): void {
  acpxToAppSession.delete(acpxSessionId)
  acpxToRunId.delete(acpxSessionId)
  acpxToClientSessionToken.delete(acpxSessionId)
  acpxSessionTitleOverrides.delete(acpxSessionId)
  saveState()
}

export function setAcpToAppRunIdMapping(acpxSessionId: string, runId: string | number): void {
  acpxToRunId.set(acpxSessionId, runId)
  saveState()
}

export function getAppRunIdForAcpSession(acpxSessionId: string): string | number | undefined {
  return acpxToRunId.get(acpxSessionId)
}

export function clearAcpToAppRunIdMapping(acpxSessionId: string): void {
  acpxToRunId.delete(acpxSessionId)
  saveState()
}

export function setAcpClientSessionTokenMapping(clientSessionToken: string, acpxSessionId: string): void {
  acpxToClientSessionToken.set(acpxSessionId, clientSessionToken)
  pendingClientSessionTokenToAppSession.delete(clientSessionToken)
  saveState()
}

export function setPendingAcpClientSessionTokenMapping(clientSessionToken: string, appSessionId: string): void {
  pendingClientSessionTokenToAppSession.set(clientSessionToken, appSessionId)
  registerKnownAppSessionIdInternal(appSessionId, { persist: false })
  saveState()
}

export function getPendingAppSessionForClientSessionToken(clientSessionToken: string): string | undefined {
  return pendingClientSessionTokenToAppSession.get(clientSessionToken)
}

export function getAcpSessionForClientSessionToken(clientSessionToken: string): string | undefined {
  for (const [sessionId, token] of acpxToClientSessionToken.entries()) {
    if (token === clientSessionToken) return sessionId
  }
  return undefined
}

export function getAcpClientSessionTokenForSession(acpxSessionId: string): string | undefined {
  return acpxToClientSessionToken.get(acpxSessionId)
}

export function clearAcpClientSessionTokenMapping(clientSessionToken: string): void {
  pendingClientSessionTokenToAppSession.delete(clientSessionToken)
  for (const [sessionId, token] of acpxToClientSessionToken.entries()) {
    if (token === clientSessionToken) {
      acpxToClientSessionToken.delete(sessionId)
    }
  }
  saveState()
}

export function touchSession(conversationId: string): void {
  const existing = conversationSessions.get(conversationId)
  if (!existing) return
  existing.lastUsedAt = Date.now()
  conversationSessions.set(conversationId, existing)
  saveState()
}

export function getAllSessions(): Map<string, ACPXConversationSessionInfo> {
  return new Map(conversationSessions)
}

export function __resetAcpxSessionStateForTests(): void {
  conversationSessions.clear()
  acpxToAppSession.clear()
  acpxToRunId.clear()
  acpxToClientSessionToken.clear()
  pendingClientSessionTokenToAppSession.clear()
  acpxSessionTitleOverrides.clear()
  knownAppSessionIds.clear()
}
