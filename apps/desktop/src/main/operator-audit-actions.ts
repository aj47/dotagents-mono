import { app } from "electron"
import type { FastifyReply, FastifyRequest } from "fastify"
import fs from "fs"
import path from "path"
import {
  createOperatorAuditRecorder,
  createOperatorAuditRouteActions,
  type OperatorAuditActionOptions,
  type OperatorAuditEventOptions,
  type OperatorResponseAuditContext,
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

export type OperatorAuditContext = OperatorResponseAuditContext

export type OperatorAuditActionResult = OperatorRouteActionResult

const operatorAuditActionOptions: OperatorAuditActionOptions = {
  getEntries: () => operatorAuditLogStore.getEntries(),
  diagnostics: diagnosticsService,
}

export const operatorAuditRouteActions = createOperatorAuditRouteActions(operatorAuditActionOptions)

const operatorAuditRecorder = createOperatorAuditRecorder({
  appendEntry: (entry) => operatorAuditLogStore.append(entry),
})

export function recordRejectedOperatorDeviceAttempt(request: FastifyRequest, failureReason: string): void {
  operatorAuditRecorder.recordRejectedDeviceAttempt(request, failureReason)
}

export function recordOperatorAuditEvent(
  request: FastifyRequest,
  options: OperatorAuditEventOptions,
): void {
  operatorAuditRecorder.recordAuditEvent(request, options)
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
  operatorAuditRecorder.recordResponseAuditEvent(request, reply, getOperatorAuditContext(request))
}
