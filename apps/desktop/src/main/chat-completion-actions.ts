import fs from "fs"
import path from "path"
import type { FastifyReply } from "fastify"
import {
  buildChatCompletionDoneSsePayload,
  buildChatCompletionErrorSsePayload,
  buildChatCompletionProgressSsePayload,
  buildChatCompletionPushNotificationPlan,
  buildChatCompletionSseHeaders,
  buildDotAgentsChatCompletionResponse,
  formatServerSentEventData,
  validateChatCompletionRequestBody,
} from "@dotagents/shared/chat-utils"
import type { AgentRunExecutor } from "@dotagents/shared/agent-run-utils"
import { resolveActiveModelId } from "@dotagents/shared/model-presets"
import type { AgentProgressUpdate } from "@dotagents/shared/agent-progress"
import { configStore, recordingsFolder } from "./config"
import { getConversationIdValidationError } from "./conversation-id"
import { diagnosticsService } from "./diagnostics"
import { isPushEnabled, sendMessageNotification } from "./push-notification-service"

export type ChatCompletionRunAgentExecutor = AgentRunExecutor

function recordHistory(transcript: string) {
  try {
    fs.mkdirSync(recordingsFolder, { recursive: true })
    const historyPath = path.join(recordingsFolder, "history.json")
    let history: Array<{ id: string; createdAt: number; duration: number; transcript: string }>
    try {
      history = JSON.parse(fs.readFileSync(historyPath, "utf8"))
    } catch {
      history = []
    }

    const item = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      duration: 0,
      transcript,
    }
    history.push(item)
    fs.writeFileSync(historyPath, JSON.stringify(history))
  } catch (caughtError) {
    diagnosticsService.logWarning(
      "remote-server",
      "Failed to record history item",
      caughtError,
    )
  }
}

function sendCompletionPushNotification(
  shouldSend: boolean,
  prompt: string,
  conversationId: string,
  content: string,
): void {
  const notificationPlan = buildChatCompletionPushNotificationPlan({
    sendPushNotification: shouldSend,
    pushEnabled: shouldSend ? isPushEnabled() : false,
    prompt,
    conversationId,
    content,
  })
  if (!notificationPlan) {
    return
  }

  void sendMessageNotification(
    notificationPlan.conversationId,
    notificationPlan.conversationTitle,
    notificationPlan.content,
  ).catch((caughtError) => {
    diagnosticsService.logWarning("remote-server", "Failed to send push notification", caughtError)
  })
}

export async function handleChatCompletionRequest(
  body: unknown,
  origin: string | string[] | undefined,
  reply: FastifyReply,
  runAgent: ChatCompletionRunAgentExecutor,
) {
  try {
    const validatedRequest = validateChatCompletionRequestBody(body, {
      validateConversationId: getConversationIdValidationError,
    })
    if (validatedRequest.ok === false) {
      return reply.code(validatedRequest.statusCode).send(validatedRequest.body)
    }

    const chatRequest = validatedRequest.request
    const { prompt, conversationId, profileId, stream: isStreaming } = chatRequest

    console.log("[remote-server] Chat request:", { conversationId: conversationId || "new", promptLength: prompt.length, streaming: isStreaming })
    diagnosticsService.logInfo("remote-server", `Handling completion request${conversationId ? ` for conversation ${conversationId}` : ""}${isStreaming ? " (streaming)" : ""}`)

    if (isStreaming) {
      reply.raw.writeHead(200, buildChatCompletionSseHeaders(origin))

      const writeSSE = (data: object) => {
        reply.raw.write(formatServerSentEventData(data))
      }

      const onProgress = (update: AgentProgressUpdate) => {
        writeSSE(buildChatCompletionProgressSsePayload(update))
      }

      try {
        const result = await runAgent({ prompt, conversationId, profileId, onProgress })
        recordHistory(result.content)

        const model = resolveActiveModelId(configStore.get())
        writeSSE(buildChatCompletionDoneSsePayload({
          content: result.content,
          conversationId: result.conversationId,
          conversationHistory: result.conversationHistory,
          model,
        }))

        sendCompletionPushNotification(
          chatRequest.sendPushNotification,
          prompt,
          result.conversationId,
          result.content,
        )
      } catch (caughtError: any) {
        writeSSE(buildChatCompletionErrorSsePayload(caughtError?.message || "Internal Server Error"))
      } finally {
        reply.raw.end()
      }

      return reply
    }

    const result = await runAgent({ prompt, conversationId, profileId })
    recordHistory(result.content)

    const model = resolveActiveModelId(configStore.get())
    const response = buildDotAgentsChatCompletionResponse({
      content: result.content,
      model,
      conversationId: result.conversationId,
      conversationHistory: result.conversationHistory,
    })

    console.log("[remote-server] Chat response:", { conversationId: result.conversationId, responseLength: result.content.length })
    sendCompletionPushNotification(
      chatRequest.sendPushNotification,
      prompt,
      result.conversationId,
      result.content,
    )

    return reply.send(response)
  } catch (caughtError: any) {
    diagnosticsService.logError("remote-server", "Handler error", caughtError)
    return reply.code(500).send({ error: "Internal Server Error" })
  }
}
