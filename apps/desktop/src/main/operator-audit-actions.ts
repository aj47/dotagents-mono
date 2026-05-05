import { app } from "electron"
import type { FastifyReply, FastifyRequest } from "fastify"
import fs from "fs"
import path from "path"
import {
  buildOperatorAuditEventEntry,
  buildOperatorAuditResponse,
  buildOperatorResponseAuditContext,
  buildRejectedOperatorDeviceAuditEntry,
  getOperatorAuditDeviceId,
  getOperatorAuditPath,
  getOperatorAuditSource,
} from "@dotagents/shared/operator-actions"
import {
  DEFAULT_OPERATOR_AUDIT_LOG_LIMIT,
  createOperatorAuditLogStore,
} from "@dotagents/shared/operator-audit-store"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"

const operatorAuditLogPath = path.join(app.getPath("userData"), "operator-audit-log.jsonl")

function ensureOperatorAuditLogDirectory(): void {
  fs.mkdirSync(path.dirname(operatorAuditLogPath), { recursive: true })
}

const operatorAuditLogStore = createOperatorAuditLogStore({
  limit: DEFAULT_OPERATOR_AUDIT_LOG_LIMIT,
  readLog: () => {
    if (!fs.existsSync(operatorAuditLogPath)) return undefined
    return fs.readFileSync(operatorAuditLogPath, "utf8")
  },
  writeLog: (content) => {
    ensureOperatorAuditLogDirectory()
    fs.writeFileSync(operatorAuditLogPath, content, "utf8")
  },
  appendLog: (content) => {
    ensureOperatorAuditLogDirectory()
    fs.appendFileSync(operatorAuditLogPath, content, "utf8")
  },
  onError: (operation, error) => {
    diagnosticsService.logError("operator-audit-actions", `Failed to ${operation} operator audit log`, error)
  },
})

export interface OperatorAuditContext {
  action?: string
  success?: boolean
  details?: Record<string, unknown>
  failureReason?: string
}

export type OperatorAuditActionResult = OperatorRouteActionResult

function ok(body: unknown): OperatorAuditActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function error(statusCode: number, message: string): OperatorAuditActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export function recordRejectedOperatorDeviceAttempt(request: FastifyRequest, failureReason: string): void {
  operatorAuditLogStore.append(buildRejectedOperatorDeviceAuditEntry({
    path: getOperatorAuditPath(request),
    deviceId: getOperatorAuditDeviceId(request),
    source: getOperatorAuditSource(request),
    failureReason,
  }))
}

export function recordOperatorAuditEvent(
  request: FastifyRequest,
  options: {
    action: string
    path?: string
    success: boolean
    details?: Record<string, unknown>
    failureReason?: string
  },
): void {
  const deviceId = getOperatorAuditDeviceId(request)
  const source = getOperatorAuditSource(request)

  operatorAuditLogStore.append(buildOperatorAuditEventEntry({
    action: options.action,
    path: options.path ?? getOperatorAuditPath(request),
    success: options.success,
    deviceId,
    source,
    details: options.details,
    failureReason: options.failureReason,
  }))
}

export function getOperatorAuditContext(request: FastifyRequest): OperatorAuditContext {
  const rawRequest = request.raw as typeof request.raw & { operatorAuditContext?: OperatorAuditContext }
  if (!rawRequest.operatorAuditContext) {
    rawRequest.operatorAuditContext = {}
  }

  return rawRequest.operatorAuditContext
}

export function setOperatorAuditContext(request: FastifyRequest, context: Partial<OperatorAuditContext>): void {
  Object.assign(getOperatorAuditContext(request), context)
}

export function recordOperatorResponseAuditEvent(request: FastifyRequest, reply: FastifyReply): void {
  const auditContext = buildOperatorResponseAuditContext(request, reply, getOperatorAuditContext(request))
  if (auditContext) {
    recordOperatorAuditEvent(request, auditContext)
  }
}

export function getOperatorAudit(count: string | number | undefined): OperatorAuditActionResult {
  try {
    return ok(buildOperatorAuditResponse(operatorAuditLogStore.getEntries(), count))
  } catch (caughtError) {
    diagnosticsService.logError("operator-audit-actions", "Failed to build operator audit response", caughtError)
    return error(500, "Failed to build operator audit response")
  }
}
