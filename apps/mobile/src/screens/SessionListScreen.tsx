import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  Image,
  GestureResponderEvent,
  TextInput,
  useWindowDimensions,
  Modal,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { EventEmitter } from "expo-modules-core"
import { Ionicons } from "@expo/vector-icons"
import {
  mergeVoiceText,
  normalizeVoiceText,
} from "@dotagents/shared/voice-text-utils"
import { useTheme } from "../ui/ThemeProvider"
import { spacing, radius, Theme } from "../ui/theme"
import { useConfigContext } from "../store/config"
import { useSessionContext, SessionStore } from "../store/sessions"
import { useConnectionManager } from "../store/connectionManager"
import { useTunnelConnection } from "../store/tunnelConnection"
import { useProfile } from "../store/profile"
import { ConnectionStatusIndicator } from "../ui/ConnectionStatusIndicator"
import { AgentSelectorSheet } from "../ui/AgentSelectorSheet"
import type { AgentProgressUpdate } from "@dotagents/shared/agent-progress"
import type { ChatMessage } from "../lib/openaiClient"
import { SettingsApiClient } from "../lib/settingsApi"
import {
  isStubSession,
  normalizeConversationTitleText,
  type SessionListItem,
} from "@dotagents/shared/session"
import {
  createButtonAccessibilityLabel,
  createMinimumTouchTargetStyle,
  createTextInputAccessibilityLabel,
} from "@dotagents/shared/accessibility-utils"
import { getErrorMessage } from "@dotagents/shared/error-utils"
import {
  filterSessionSearchResults,
  filterSessionsByArchiveMode,
  type SessionArchiveMode,
  type SessionSearchResult,
} from "@dotagents/shared/session"
import {
  APP_CONVERSATION_LIST_COPY,
  getConversationArchiveFilterLabel,
  getConversationListArchiveActionPresentation,
  getConversationListDeleteActionPresentation,
  getConversationListEmptyState,
  getConversationListItemAccessibilityLabel,
  getConversationListMessageCountLabel,
  getConversationListMobileSurfaceColors,
  getConversationListMobileSurfaceState,
  getConversationListPinActionPresentation,
  normalizeConversationListPreviewText,
  type ConversationListMobileSurfaceColors,
} from "@dotagents/shared/conversation-list-presentation"
import {
  APP_SHELL_HEADER_ACTIONS,
  APP_SHELL_MOBILE_ROUTE_TITLES,
  getAppShellHeaderActionMobileIconColors,
  getAppShellHeaderActionMobileIconState,
} from "@dotagents/shared/app-shell"
import {
  formatChatRuntimeAgentSelectorAccessibilityLabel,
  getChatRuntimeAgentSelectorMobileColors,
  getChatRuntimeCopyState,
  getChatRuntimeAgentSelectorMobileIconState,
  getChatRuntimeHeaderMobileSurfaceState,
  type ChatRuntimeAgentSelectorMobileColors,
} from "@dotagents/shared/session-presentation"

const chatRuntimeCopy = getChatRuntimeCopyState()
const mobileHeaderSurface = getChatRuntimeHeaderMobileSurfaceState()
const headerAgentSelectorIcon = getChatRuntimeAgentSelectorMobileIconState()
const openSplitViewIcon =
  getAppShellHeaderActionMobileIconState("openSplitView")
const openSettingsIcon = getAppShellHeaderActionMobileIconState("openSettings")
const conversationListSurface = getConversationListMobileSurfaceState()

const darkSpinner = require("../../assets/loading-spinner.gif")
const lightSpinner = require("../../assets/light-spinner.gif")

interface Props {
  navigation: any
}

export default function SessionListScreen({ navigation }: Props) {
  const { theme, isDark } = useTheme()
  const { height: screenHeight } = useWindowDimensions()
  const conversationListColors = useMemo(
    () => getConversationListMobileSurfaceColors(theme.colors),
    [theme.colors],
  )
  const headerAgentSelectorColors = useMemo(
    () => getChatRuntimeAgentSelectorMobileColors(theme.colors),
    [theme.colors],
  )
  const headerActionIconColors = useMemo(
    () => ({
      openSplitView: getAppShellHeaderActionMobileIconColors(
        theme.colors,
        "openSplitView",
      ),
      openSettings: getAppShellHeaderActionMobileIconColors(
        theme.colors,
        "openSettings",
      ),
    }),
    [theme.colors],
  )
  const styles = useMemo(
    () =>
      createStyles(
        theme,
        screenHeight,
        conversationListColors,
        headerAgentSelectorColors,
      ),
    [theme, screenHeight, conversationListColors, headerAgentSelectorColors],
  )
  const { config } = useConfigContext()
  const connectionManager = useConnectionManager()
  const { connectionInfo, isInitialized } = useTunnelConnection()
  const { currentProfile } = useProfile()
  const currentAgentLabel =
    currentProfile?.name || chatRuntimeCopy.header.defaultAgentLabel
  const [agentSelectorVisible, setAgentSelectorVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sessionListMode, setSessionListMode] =
    useState<SessionArchiveMode>("active")
  const [renameSession, setRenameSession] = useState<SessionListItem | null>(
    null,
  )
  const [renameTitleDraft, setRenameTitleDraft] = useState("")
  const [isRenameSaving, setIsRenameSaving] = useState(false)

  // ── Rapid Fire voice state ─────────────────────────────────────────────────
  const [rfListening, setRfListening] = useState(false)
  const [rfTranscript, setRfTranscript] = useState("")
  const [rfStatus, setRfStatus] = useState<
    | "idle"
    | "listening"
    | "sending"
    | "sent"
    | "empty"
    | "permissionDenied"
    | "unavailable"
    | "error"
  >("idle")
  const rfListeningRef = useRef(false)
  const rfStartingRef = useRef(false)
  const rfStoppingRef = useRef(false)
  const rfFinalRef = useRef("")
  const rfLiveRef = useRef("")
  const rfSrEmitterRef = useRef<any>(null)
  const rfSrSubsRef = useRef<any[]>([])
  const rfGrantTimeRef = useRef(0)
  const rfUserReleasedRef = useRef(false)
  const rfWebRecRef = useRef<any>(null)
  const rfButtonRef = useRef<View>(null)
  const rfPressInSeenRef = useRef(false)
  const rfStopAndFireRef = useRef<(() => Promise<void>) | null>(null)
  const rfInFlightSessionIdsRef = useRef<Set<string>>(new Set())
  const rfMinHoldMs = 200
  const sessionStoreRef = useRef<SessionStore | null>(null)
  const rfStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const rfLog = useCallback((msg: string, extra?: any) => {
    if (!__DEV__) return
    if (typeof extra !== "undefined")
      console.log(`[RapidFireDebug] ${msg}`, extra)
    else console.log(`[RapidFireDebug] ${msg}`)
  }, [])

  const rfBuildMessagesFromHistory = useCallback(
    (history: any[]): ChatMessage[] => {
      if (!history || history.length === 0) return []

      let currentTurnStartIndex = 0
      for (let i = 0; i < history.length; i++) {
        if (history[i]?.role === "user") {
          currentTurnStartIndex = i
        }
      }

      const messages: ChatMessage[] = []
      for (let i = currentTurnStartIndex + 1; i < history.length; i++) {
        const historyMsg = history[i]
        if (!historyMsg) continue

        // Merge tool results into the preceding assistant message, matching ChatScreen behavior.
        if (historyMsg.role === "tool" && messages.length > 0) {
          const lastMessage = messages[messages.length - 1]
          if (
            lastMessage.role === "assistant" &&
            lastMessage.toolCalls &&
            lastMessage.toolCalls.length > 0
          ) {
            const hasToolResults =
              historyMsg.toolResults && historyMsg.toolResults.length > 0
            if (hasToolResults) {
              lastMessage.toolResults = [
                ...(lastMessage.toolResults || []),
                ...(historyMsg.toolResults || []),
              ]
              continue
            }
          }
        }

        messages.push({
          role: historyMsg.role === "tool" ? "assistant" : historyMsg.role,
          content: historyMsg.content || "",
          toolCalls: historyMsg.toolCalls,
          toolResults: historyMsg.toolResults,
        })
      }

      return messages
    },
    [],
  )

  const rfRunBackgroundSend = useCallback(
    async (sessionId: string, userText: string) => {
      const initialMessages: ChatMessage[] = [
        { role: "user", content: userText },
      ]
      const ss = sessionStoreRef.current
      if (!ss) return

      const requestId = Date.now()

      rfInFlightSessionIdsRef.current.add(sessionId)
      connectionManager.setLatestRequestId(sessionId, requestId)
      connectionManager.incrementActiveRequests(sessionId)

      let streamingText = ""
      let persistTimer: ReturnType<typeof setTimeout> | null = null
      let pendingMessages: ChatMessage[] | null = null
      let finalized = false

      const isLatestForSession = () =>
        connectionManager.getLatestRequestId(sessionId) === requestId

      const schedulePersist = (messages: ChatMessage[]) => {
        pendingMessages = messages
        if (persistTimer) return
        persistTimer = setTimeout(() => {
          persistTimer = null
          const toPersist = pendingMessages
          pendingMessages = null
          if (!toPersist || !isLatestForSession()) return
          const latestStore = sessionStoreRef.current
          if (!latestStore) return
          void latestStore.setMessagesForSession(sessionId, toPersist)
        }, 180)
      }

      const flushPersist = async () => {
        if (persistTimer) {
          clearTimeout(persistTimer)
          persistTimer = null
        }
        const toPersist = pendingMessages
        pendingMessages = null
        if (!toPersist || !isLatestForSession()) return
        const latestStore = sessionStoreRef.current
        if (!latestStore) return
        await latestStore.setMessagesForSession(sessionId, toPersist)
      }

      const onToken = (tok: string) => {
        if (finalized) return
        if (!isLatestForSession()) return
        if (
          tok.startsWith(streamingText) &&
          tok.length >= streamingText.length
        ) {
          streamingText = tok
        } else {
          streamingText += tok
        }
        schedulePersist([
          ...initialMessages,
          { role: "assistant", content: streamingText },
        ])
      }

      const onProgress = (update: AgentProgressUpdate) => {
        if (finalized) return
        if (!isLatestForSession()) return
        if (
          update.conversationHistory &&
          update.conversationHistory.length > 0
        ) {
          const assistantMessages = rfBuildMessagesFromHistory(
            update.conversationHistory as any[],
          )
          schedulePersist([...initialMessages, ...assistantMessages])
          return
        }
        const fullText = update.streamingContent?.text
        if (fullText) {
          streamingText = fullText
          schedulePersist([
            ...initialMessages,
            { role: "assistant", content: streamingText },
          ])
        }
      }

      try {
        const connection = connectionManager.getOrCreateConnection(sessionId)
        const client = connection.client
        rfLog("backgroundSend:start", { sessionId, requestId })
        const response = await client.chat(
          initialMessages,
          onToken,
          onProgress,
          undefined,
        )
        if (!isLatestForSession()) return
        finalized = true

        if (response.conversationId) {
          await ss.setServerConversationIdForSession(
            sessionId,
            response.conversationId,
          )
        }

        let finalMessages: ChatMessage[]
        if (
          response.conversationHistory &&
          response.conversationHistory.length > 0
        ) {
          finalMessages = [
            ...initialMessages,
            ...rfBuildMessagesFromHistory(
              response.conversationHistory as any[],
            ),
          ]
        } else {
          const finalText = (response.content || streamingText).trim()
          finalMessages = finalText
            ? [...initialMessages, { role: "assistant", content: finalText }]
            : initialMessages
        }

        const authoritativeFinalText = (
          response.content || streamingText
        ).trim()
        if (authoritativeFinalText) {
          let lastAssistantIndex = -1
          for (let i = finalMessages.length - 1; i >= 0; i--) {
            if (finalMessages[i].role === "assistant") {
              lastAssistantIndex = i
              break
            }
          }
          if (lastAssistantIndex >= 0) {
            finalMessages[lastAssistantIndex] = {
              ...finalMessages[lastAssistantIndex],
              content: authoritativeFinalText,
            }
          } else {
            finalMessages = [
              ...finalMessages,
              { role: "assistant", content: authoritativeFinalText },
            ]
          }
        }

        pendingMessages = finalMessages
        await flushPersist()
        rfLog("backgroundSend:done", {
          sessionId,
          requestId,
          messageCount: finalMessages.length,
        })
      } catch (err) {
        finalized = true
        rfLog("backgroundSend:error", {
          sessionId,
          requestId,
          error: (err as any)?.message || String(err),
        })
        const errorContent = (err as any)?.message
          ? `Error: ${(err as any).message}`
          : "Error: Failed to get response."
        pendingMessages = [
          ...initialMessages,
          { role: "assistant", content: errorContent },
        ]
        await flushPersist()
      } finally {
        if (persistTimer) {
          clearTimeout(persistTimer)
        }
        rfInFlightSessionIdsRef.current.delete(sessionId)
        connectionManager.decrementActiveRequests(sessionId)
      }
    },
    [connectionManager, rfBuildMessagesFromHistory, rfLog],
  )

  const rfSetListening = useCallback((v: boolean) => {
    rfListeningRef.current = v
    setRfListening(v)
  }, [])

  const rfCleanupSubs = useCallback(() => {
    for (const sub of rfSrSubsRef.current) {
      try {
        sub.remove()
      } catch {}
    }
    rfSrSubsRef.current = []
  }, [])

  const rfSetTransientStatus = useCallback(
    (
      status: "sent" | "empty" | "permissionDenied" | "unavailable" | "error",
      clearAfterMs = 2500,
    ) => {
      if (rfStatusTimeoutRef.current) {
        clearTimeout(rfStatusTimeoutRef.current)
        rfStatusTimeoutRef.current = null
      }
      setRfStatus(status)
      rfStatusTimeoutRef.current = setTimeout(() => {
        setRfStatus("idle")
        rfStatusTimeoutRef.current = null
      }, clearAfterMs)
    },
    [],
  )

  // On web, capture raw DOM release events in case RN Pressable misses onPressOut on long-press.
  useEffect(() => {
    if (Platform.OS !== "web" || !rfButtonRef.current) return

    // @ts-ignore - React Native Web ref resolves to a DOM element at runtime
    const domNode = rfButtonRef.current as any
    if (!domNode || typeof domNode.addEventListener !== "function") return

    const summarizeDomEvent = (e: any) => ({
      type: e?.type,
      cancelable: !!e?.cancelable,
      defaultPrevented: !!e?.defaultPrevented,
      touches:
        typeof e?.touches?.length === "number" ? e.touches.length : undefined,
      changedTouches:
        typeof e?.changedTouches?.length === "number"
          ? e.changedTouches.length
          : undefined,
      pointerType: e?.pointerType,
      targetTag: e?.target?.tagName,
    })

    const stopFromDomFallback = (source: string, e: any) => {
      const details = summarizeDomEvent(e)
      if (
        !rfPressInSeenRef.current ||
        !rfListeningRef.current ||
        rfUserReleasedRef.current
      ) {
        rfLog(`web:dom:${source} (no-op)`, {
          ...details,
          pressInSeen: rfPressInSeenRef.current,
          listening: rfListeningRef.current,
          userReleased: rfUserReleasedRef.current,
        })
        return
      }
      const dt = Date.now() - rfGrantTimeRef.current
      const delay = Math.max(0, rfMinHoldMs - dt)
      rfLog(`web:dom:${source} -> fallback stop`, { ...details, dt, delay })
      const maybeStop = () => {
        if (!rfListeningRef.current || rfUserReleasedRef.current) return
        rfPressInSeenRef.current = false
        void rfStopAndFireRef.current?.()
      }
      if (delay > 0) setTimeout(maybeStop, delay)
      else maybeStop()
    }

    const handleTouchStart = (e: any) => {
      rfLog("web:dom:touchstart", summarizeDomEvent(e))
      if (e.cancelable) e.preventDefault()
    }
    const handleTouchEnd = (e: any) => stopFromDomFallback("touchend", e)
    const handleTouchCancel = (e: any) => stopFromDomFallback("touchcancel", e)
    const handlePointerUp = (e: any) => stopFromDomFallback("pointerup", e)
    const handlePointerCancel = (e: any) =>
      stopFromDomFallback("pointercancel", e)
    const handleContextMenu = (e: any) => {
      rfLog("web:dom:contextmenu", summarizeDomEvent(e))
      e.preventDefault()
    }

    rfLog("web:dom listeners attached", { nodeTag: domNode?.tagName })
    domNode.addEventListener("touchstart", handleTouchStart, { passive: false })
    domNode.addEventListener("touchend", handleTouchEnd, { passive: false })
    domNode.addEventListener("touchcancel", handleTouchCancel, {
      passive: false,
    })
    domNode.addEventListener("pointerup", handlePointerUp, { passive: true })
    domNode.addEventListener("pointercancel", handlePointerCancel, {
      passive: true,
    })
    domNode.addEventListener("contextmenu", handleContextMenu, {
      passive: false,
    })
    document.addEventListener("touchend", handleTouchEnd, { passive: false })
    document.addEventListener("touchcancel", handleTouchCancel, {
      passive: false,
    })
    document.addEventListener("pointerup", handlePointerUp, { passive: true })
    document.addEventListener("pointercancel", handlePointerCancel, {
      passive: true,
    })

    return () => {
      rfLog("web:dom listeners removed")
      domNode.removeEventListener("touchstart", handleTouchStart)
      domNode.removeEventListener("touchend", handleTouchEnd)
      domNode.removeEventListener("touchcancel", handleTouchCancel)
      domNode.removeEventListener("pointerup", handlePointerUp)
      domNode.removeEventListener("pointercancel", handlePointerCancel)
      domNode.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("touchend", handleTouchEnd)
      document.removeEventListener("touchcancel", handleTouchCancel)
      document.removeEventListener("pointerup", handlePointerUp)
      document.removeEventListener("pointercancel", handlePointerCancel)
    }
  }, [rfLog])

  const rfStartRecording = useCallback(
    async (e?: GestureResponderEvent) => {
      rfLog("startRecording called", {
        starting: rfStartingRef.current,
        listening: rfListeningRef.current,
        pageX: e?.nativeEvent?.pageX,
        pageY: e?.nativeEvent?.pageY,
      })
      if (rfStartingRef.current || rfListeningRef.current) return
      rfStartingRef.current = true
      rfStoppingRef.current = false
      rfUserReleasedRef.current = false
      rfFinalRef.current = ""
      rfLiveRef.current = ""
      setRfTranscript("")
      setRfStatus("listening")
      rfGrantTimeRef.current = Date.now()
      rfSetListening(true)
      try {
        if (Platform.OS !== "web") {
          const SR: any = await import("expo-speech-recognition")
          if (SR?.ExpoSpeechRecognitionModule?.start) {
            if (!rfSrEmitterRef.current) {
              rfSrEmitterRef.current = new EventEmitter(
                SR.ExpoSpeechRecognitionModule,
              )
            }
            rfCleanupSubs()
            const subResult = rfSrEmitterRef.current.addListener(
              "result",
              (event: any) => {
                const t =
                  event?.results?.[0]?.transcript ??
                  event?.text ??
                  event?.transcript ??
                  ""
                if (event?.isFinal && t) {
                  rfFinalRef.current = mergeVoiceText(rfFinalRef.current, t)
                }
                const preview = mergeVoiceText(
                  rfFinalRef.current,
                  event?.isFinal ? "" : t,
                )
                rfLiveRef.current = preview
                setRfTranscript(preview)
                rfLog("native:onresult", {
                  isFinal: !!event?.isFinal,
                  chunk: normalizeVoiceText(t),
                  preview,
                })
              },
            )
            const subError = rfSrEmitterRef.current.addListener(
              "error",
              (event: any) => {
                console.error("[RapidFire] SR error:", JSON.stringify(event))
                rfSetTransientStatus("error")
              },
            )
            const subEnd = rfSrEmitterRef.current.addListener(
              "end",
              async () => {
                // If user hasn't released, SR ended spuriously – try to restart
                if (!rfUserReleasedRef.current && !rfStoppingRef.current) {
                  try {
                    const SRInner: any = await import("expo-speech-recognition")
                    if (SRInner?.ExpoSpeechRecognitionModule?.start) {
                      SRInner.ExpoSpeechRecognitionModule.start({
                        lang: "en-US",
                        interimResults: true,
                        continuous: true,
                        volumeChangeEventOptions: {
                          enabled: false,
                          intervalMillis: 250,
                        },
                      })
                      return // restarted – stay in listening state
                    }
                  } catch {}
                }
                rfSetListening(false)
              },
            )
            rfSrSubsRef.current.push(subResult, subError, subEnd)
            try {
              const perm =
                await SR.ExpoSpeechRecognitionModule.getPermissionsAsync()
              if (!perm?.granted) {
                const req =
                  await SR.ExpoSpeechRecognitionModule.requestPermissionsAsync()
                if (!req?.granted) {
                  rfSetListening(false)
                  rfStartingRef.current = false
                  rfSetTransientStatus("permissionDenied", 4000)
                  Alert.alert(
                    "Microphone Permission Required",
                    "Rapid Fire needs microphone permission. Enable it in system settings and try again.",
                    [{ text: "OK" }],
                  )
                  return
                }
              }
            } catch {}
            SR.ExpoSpeechRecognitionModule.start({
              lang: "en-US",
              interimResults: true,
              continuous: true,
              volumeChangeEventOptions: { enabled: false, intervalMillis: 250 },
            })
            rfStartingRef.current = false
            return
          }
        }
        // Web fallback – use Web Speech API
        if (Platform.OS === "web") {
          const SRClass =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition
          if (SRClass) {
            const rec = new SRClass()
            rec.lang = "en-US"
            rec.interimResults = true
            rec.continuous = true
            rec.onresult = (ev: any) => {
              let interim = ""
              let finalText = ""
              for (let i = ev.resultIndex; i < ev.results.length; i++) {
                const res = ev.results[i]
                const txt = res[0]?.transcript || ""
                if (res.isFinal) finalText += txt
                else interim += txt
              }
              if (finalText) {
                rfFinalRef.current = mergeVoiceText(
                  rfFinalRef.current,
                  finalText,
                )
              }
              const preview = mergeVoiceText(rfFinalRef.current, interim)
              rfLiveRef.current = preview
              setRfTranscript(preview)
              rfLog("web:onresult", {
                interim: normalizeVoiceText(interim),
                finalChunk: normalizeVoiceText(finalText),
                preview,
              })
            }
            rec.onerror = (ev: any) => {
              console.error("[RapidFire] Web SR error:", ev?.error || ev)
              rfLog("web:onerror", ev?.error || ev)
              rfSetTransientStatus("error")
            }
            rec.onend = () => {
              rfLog("web:onend", {
                userReleased: rfUserReleasedRef.current,
                stopping: rfStoppingRef.current,
                hasRec: !!rfWebRecRef.current,
                final: rfFinalRef.current,
                live: rfLiveRef.current,
              })
              // If user hasn't released, SR ended spuriously – try to restart
              if (
                !rfUserReleasedRef.current &&
                !rfStoppingRef.current &&
                rfWebRecRef.current
              ) {
                try {
                  rfWebRecRef.current.start()
                  return
                } catch {}
              }
              rfSetListening(false)
            }
            rfWebRecRef.current = rec
            rec.start()
            rfStartingRef.current = false
            return
          }
        }
      } catch (err) {
        console.warn(
          "[RapidFire] SR unavailable:",
          (err as any)?.message || err,
        )
        rfSetTransientStatus("unavailable", 4000)
      }
      rfSetListening(false)
      rfStartingRef.current = false
    },
    [
      mergeVoiceText,
      normalizeVoiceText,
      rfCleanupSubs,
      rfLog,
      rfSetListening,
      rfSetTransientStatus,
    ],
  )

  const rfStopAndFire = useCallback(async () => {
    rfLog("stopAndFire called", {
      stopping: rfStoppingRef.current,
      listening: rfListeningRef.current,
      final: rfFinalRef.current,
      live: rfLiveRef.current,
    })
    if (rfStoppingRef.current) return
    rfStoppingRef.current = true
    rfUserReleasedRef.current = true
    rfPressInSeenRef.current = false
    try {
      if (Platform.OS !== "web") {
        const SR: any = await import("expo-speech-recognition")
        if (SR?.ExpoSpeechRecognitionModule?.stop)
          SR.ExpoSpeechRecognitionModule.stop()
      }
      if (Platform.OS === "web" && rfWebRecRef.current) {
        try {
          rfWebRecRef.current.stop()
        } catch {}
        rfWebRecRef.current = null
      }
    } catch {}
    rfCleanupSubs()
    rfSetListening(false)
    setRfStatus("sending")
    const finalText = mergeVoiceText(
      rfFinalRef.current,
      rfLiveRef.current,
    ).trim()
    rfFinalRef.current = ""
    rfLiveRef.current = ""
    setRfTranscript("")
    if (finalText) {
      // Create a new session and persist transcript, but keep user on Sessions screen.
      const ss = sessionStoreRef.current
      if (ss) {
        try {
          // Save previous currentSessionId — createNewSession() will switch it,
          // but we need to restore it so the (possibly mounted) ChatScreen doesn't
          // race-load the new session while it still has 0 messages.
          const prevSessionId = ss.currentSessionId
          const newSession = ss.createNewSession()
          // Restore immediately so ChatScreen's useEffect doesn't prematurely load
          // the new empty session. When the user later taps the session,
          // setCurrentSession(newId) will properly trigger the load with messages.
          ss.setCurrentSession(prevSessionId)
          await ss.setMessagesForSession(newSession.id, [
            { role: "user", content: finalText },
          ])
          setRfTranscript(finalText)
          // Fire the agent request in the background so the Sessions list updates live.
          void rfRunBackgroundSend(newSession.id, finalText)
          rfSetTransientStatus("sent")
        } catch (err) {
          console.error("[RapidFire] Failed to persist transcript:", err)
          rfSetTransientStatus("error")
        }
      } else {
        rfSetTransientStatus("error")
      }
    } else {
      rfSetTransientStatus("empty")
    }
    rfStoppingRef.current = false
  }, [
    mergeVoiceText,
    rfCleanupSubs,
    rfLog,
    rfRunBackgroundSend,
    rfSetListening,
    rfSetTransientStatus,
  ])

  rfStopAndFireRef.current = rfStopAndFire
  // ── end Rapid Fire ─────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    return () => {
      rfCleanupSubs()
      if (rfWebRecRef.current) {
        try {
          rfWebRecRef.current.stop()
        } catch {}
        rfWebRecRef.current = null
      }
      if (rfStatusTimeoutRef.current) {
        clearTimeout(rfStatusTimeoutRef.current)
      }
    }
  }, [rfCleanupSubs])
  const insets = useSafeAreaInsets()
  const sessionStore = useSessionContext()
  sessionStoreRef.current = sessionStore
  const isConnected = connectionInfo.state === "connected"
  const hasConfiguredConnection = Boolean(config.baseUrl && config.apiKey)
  const hasActiveSearch = searchQuery.trim().length > 0

  const handleCreateSession = useCallback(() => {
    sessionStore.createNewSession()
    navigation.navigate("Chat")
  }, [navigation, sessionStore])

  const handleOpenSettings = useCallback(() => {
    navigation.navigate("Settings")
  }, [navigation])

  const handleOpenSplitView = useCallback(() => {
    navigation.navigate("SplitChat")
  }, [navigation])

  const handleOpenConnectionSettings = useCallback(
    (openScanner = false) => {
      if (openScanner) {
        navigation.navigate("ConnectionSettings", { openScanner: true })
        return
      }

      navigation.navigate("ConnectionSettings")
    },
    [navigation],
  )

  // Create a settings client for syncing destructive and pin/archive state to the server.
  const settingsClient = useMemo(() => {
    if (config.baseUrl && config.apiKey) {
      return new SettingsApiClient(config.baseUrl, config.apiKey)
    }
    return undefined
  }, [config.baseUrl, config.apiKey])

  useLayoutEffect(() => {
    navigation?.setOptions?.({
      headerTitle: () => (
        <TouchableOpacity
          style={styles.headerTitleAgentSelectorButton}
          onPress={() => setAgentSelectorVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={formatChatRuntimeAgentSelectorAccessibilityLabel(
            currentAgentLabel,
          )}
          accessibilityHint={
            chatRuntimeCopy.header.agentSelectorAccessibilityHint
          }
        >
          <Text style={styles.headerTitleText}>
            {APP_SHELL_MOBILE_ROUTE_TITLES.Sessions}
          </Text>
          <View style={styles.headerAgentSelectorChip}>
            <Text
              style={styles.headerAgentSelectorText}
              numberOfLines={
                mobileHeaderSurface.agentSelectorText.numberOfLines
              }
            >
              {currentAgentLabel}
            </Text>
            <Ionicons
              name={headerAgentSelectorIcon.name}
              size={headerAgentSelectorIcon.size}
              color={headerAgentSelectorColors.icon.color}
            />
          </View>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerActionsRow}>
          <ConnectionStatusIndicator
            state={connectionInfo.state}
            retryCount={connectionInfo.retryCount}
            compact
          />
          <TouchableOpacity
            onPress={handleOpenSplitView}
            style={styles.headerSettingsButton}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel(
              APP_SHELL_HEADER_ACTIONS.openSplitView.label,
            )}
            accessibilityHint={APP_SHELL_HEADER_ACTIONS.openSplitView.hint}
          >
            <Ionicons
              name={openSplitViewIcon.name}
              size={openSplitViewIcon.size}
              color={headerActionIconColors.openSplitView.color}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreateSession}
            style={styles.headerNewChatButton}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel(
              APP_SHELL_HEADER_ACTIONS.newChat.label,
            )}
            accessibilityHint={APP_SHELL_HEADER_ACTIONS.newChat.hint}
          >
            <Text style={styles.headerNewChatButtonText}>
              {APP_SHELL_HEADER_ACTIONS.newChat.displayLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenSettings}
            style={styles.headerSettingsButton}
            accessibilityRole="button"
            accessibilityLabel={createButtonAccessibilityLabel(
              APP_SHELL_HEADER_ACTIONS.openSettings.label,
            )}
            accessibilityHint={APP_SHELL_HEADER_ACTIONS.openSettings.hint}
          >
            <Ionicons
              name={openSettingsIcon.name}
              size={openSettingsIcon.size}
              color={headerActionIconColors.openSettings.color}
            />
          </TouchableOpacity>
        </View>
      ),
    })
  }, [
    navigation,
    styles,
    headerActionIconColors,
    headerAgentSelectorColors,
    connectionInfo.state,
    connectionInfo.retryCount,
    currentAgentLabel,
    setAgentSelectorVisible,
    handleCreateSession,
    handleOpenSettings,
    handleOpenSplitView,
  ])

  if (!sessionStore.ready || !isInitialized) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Image
          source={isDark ? darkSpinner : lightSpinner}
          style={styles.spinner}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>
          {APP_CONVERSATION_LIST_COPY.loadingLabel}
        </Text>
      </View>
    )
  }

  const handleSelectSession = async (sessionId: string) => {
    const selectedSession =
      sessionStore.sessions.find((s) => s.id === sessionId) || null
    const rfBackgroundInFlight = rfInFlightSessionIdsRef.current.has(sessionId)
    const pendingUserOnlyText =
      selectedSession &&
      selectedSession.messages.length === 1 &&
      selectedSession.messages[0].role === "user" &&
      !selectedSession.serverConversationId &&
      !rfBackgroundInFlight
        ? (selectedSession.messages[0].content || "").trim()
        : ""

    // Fallback only: if a user-only stub exists and no background rapid-fire request
    // is running, auto-send when opening chat.
    if (pendingUserOnlyText) {
      rfLog("selectSession -> pending user-only session detected", {
        sessionId,
        pendingUserOnlyText,
      })
      try {
        await sessionStore.setMessagesForSession(sessionId, [])
      } catch (err) {
        console.warn(
          "[RapidFire] Failed to clear pending user-only session before auto-send:",
          err,
        )
      }
      sessionStore.setCurrentSession(sessionId)
      navigation.navigate("Chat", { initialMessage: pendingUserOnlyText })
      return
    }

    sessionStore.setCurrentSession(sessionId)
    navigation.navigate("Chat")
  }

  const handleDeleteSession = useCallback(
    (session: SessionListItem) => {
      const deleteAction = getConversationListDeleteActionPresentation({
        title: session.title,
      })

      const doDelete = async () => {
        try {
          const serverConversationId = sessionStore.sessions.find(
            (item) => item.id === session.id,
          )?.serverConversationId
          if (settingsClient && serverConversationId) {
            await settingsClient.deleteConversation(serverConversationId)
          }
          connectionManager.removeConnection(session.id)
          await sessionStore.deleteSession(session.id)
        } catch (error) {
          Alert.alert(deleteAction.failureTitle, getErrorMessage(error))
        }
      }

      if (Platform.OS === "web") {
        if (window.confirm(deleteAction.webConfirmationMessage)) {
          void doDelete()
        }
      } else {
        Alert.alert(
          deleteAction.confirmationTitle,
          deleteAction.confirmationMessage,
          [
            { text: deleteAction.cancelLabel, style: "cancel" },
            {
              text: deleteAction.actionLabel,
              style: "destructive",
              onPress: () => {
                void doDelete()
              },
            },
          ],
        )
      }
    },
    [connectionManager, sessionStore, settingsClient],
  )

  const handleToggleSessionPinned = useCallback(
    async (sessionId: string) => {
      await sessionStore.toggleSessionPinned(sessionId, settingsClient)
    },
    [sessionStore, settingsClient],
  )

  const handleToggleSessionArchived = useCallback(
    async (sessionId: string) => {
      await sessionStore.toggleSessionArchived(sessionId, settingsClient)
    },
    [sessionStore, settingsClient],
  )

  const openRenameSession = useCallback((session: SessionListItem) => {
    setRenameSession(session)
    setRenameTitleDraft(session.title)
  }, [])

  const closeRenameSession = useCallback(() => {
    if (isRenameSaving) return
    setRenameSession(null)
    setRenameTitleDraft("")
  }, [isRenameSaving])

  const handleRenameSession = useCallback(async () => {
    if (!renameSession) return

    const nextTitle = normalizeConversationTitleText(renameTitleDraft, {
      maxChars: 80,
    })
    const previousTitle = normalizeConversationTitleText(renameSession.title, {
      maxChars: 80,
    })
    if (!nextTitle || nextTitle === previousTitle) {
      closeRenameSession()
      return
    }

    setIsRenameSaving(true)
    try {
      const serverConversationId = sessionStore.sessions.find(
        (item) => item.id === renameSession.id,
      )?.serverConversationId
      let updatedTitle = nextTitle
      if (settingsClient && serverConversationId) {
        const updatedConversation = await settingsClient.updateConversation(
          serverConversationId,
          { title: nextTitle },
        )
        updatedTitle = updatedConversation.title || nextTitle
      }

      await sessionStore.renameSessionTitle(renameSession.id, updatedTitle)
      setRenameSession(null)
      setRenameTitleDraft("")
    } catch (error) {
      Alert.alert(
        conversationListSurface.renameDialog.failureTitle,
        getErrorMessage(error),
      )
    } finally {
      setIsRenameSaving(false)
    }
  }, [
    closeRenameSession,
    renameSession,
    renameTitleDraft,
    sessionStore,
    settingsClient,
  ])

  const handleSessionLongPress = useCallback(
    (session: SessionListItem) => {
      const pinAction = getConversationListPinActionPresentation({
        title: session.title,
        isPinned: session.isPinned,
      })
      const archiveAction = getConversationListArchiveActionPresentation({
        title: session.title,
        isArchived: session.isArchived,
      })
      const deleteAction = getConversationListDeleteActionPresentation({
        title: session.title,
      })

      if (Platform.OS === "web") {
        // On web, fall back to a simple confirm for delete
        const action = window.prompt(
          `Choose action for "${session.title}":\n1. ${conversationListSurface.renameDialog.actionLabel}\n2. ${pinAction.actionLabel}\n3. ${archiveAction.actionLabel}\n4. ${deleteAction.actionLabel}\n\nEnter 1, 2, 3, or 4:`,
        )
        if (action === "1") openRenameSession(session)
        else if (action === "2") void handleToggleSessionPinned(session.id)
        else if (action === "3") void handleToggleSessionArchived(session.id)
        else if (action === "4") handleDeleteSession(session)
      } else {
        Alert.alert(session.title, undefined, [
          {
            text: conversationListSurface.renameDialog.actionLabel,
            onPress: () => openRenameSession(session),
          },
          {
            text: pinAction.actionLabel,
            onPress: () => void handleToggleSessionPinned(session.id),
          },
          {
            text: archiveAction.actionLabel,
            onPress: () => void handleToggleSessionArchived(session.id),
          },
          {
            text: deleteAction.actionLabel,
            style: "destructive",
            onPress: () => handleDeleteSession(session),
          },
          { text: deleteAction.cancelLabel, style: "cancel" },
        ])
      }
    },
    [
      handleToggleSessionPinned,
      handleToggleSessionArchived,
      handleDeleteSession,
      openRenameSession,
    ],
  )

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const disconnectedTitle =
    connectionInfo.state === "connecting" ||
    connectionInfo.state === "reconnecting"
      ? "Connecting to your desktop"
      : connectionInfo.state === "failed"
        ? "Reconnect to DotAgents"
        : hasConfiguredConnection
          ? "Reconnect to your chats"
          : "Connect DotAgents to get started"

  const disconnectedSubtitle =
    connectionInfo.state === "connecting" ||
    connectionInfo.state === "reconnecting"
      ? "We are pairing with your desktop. Your conversation history will appear here as soon as the connection is ready."
      : connectionInfo.state === "failed"
        ? "Open connection settings or scan a fresh QR code to restore syncing and get back into your conversations."
        : hasConfiguredConnection
          ? "Your mobile app is set up, but it is not currently connected. Reconnect to load your recent conversations."
          : "Scan the QR code from the desktop app to pair this device and bring your conversations into mobile."

  // Build a set of stub session IDs for display purposes
  const stubSessionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of sessionStore.sessions) {
      if (isStubSession(s)) ids.add(s.id)
    }
    return ids
  }, [sessionStore.sessions])

  const filteredSessions = useMemo(() => {
    const results = filterSessionSearchResults(
      sessionStore.sessions,
      searchQuery,
    )
    return filterSessionsByArchiveMode(results, sessionListMode)
  }, [sessionStore.sessions, searchQuery, sessionListMode])

  const sessionArchiveCount = useMemo(
    () =>
      sessionStore.sessions.filter((session) => !!session.isArchived).length,
    [sessionStore.sessions],
  )

  const renderSession = ({ item }: { item: SessionSearchResult }) => {
    const isActive = item.id === sessionStore.currentSessionId
    const isStub = stubSessionIds.has(item.id)
    const sessionPreviewText = normalizeConversationListPreviewText(
      item.searchPreview ?? item.preview,
    )
    const sessionMetaLabel = getConversationListMessageCountLabel(
      item.messageCount,
      {
        sourceLabel: isStub
          ? APP_CONVERSATION_LIST_COPY.desktopSourceLabel
          : null,
      },
    )
    const pinAction = getConversationListPinActionPresentation({
      title: item.title,
      isPinned: item.isPinned,
    })
    const archiveAction = getConversationListArchiveActionPresentation({
      title: item.title,
      isArchived: item.isArchived,
    })

    return (
      <Pressable
        style={({ pressed }) => [
          styles.sessionItem,
          isActive && styles.sessionItemActive,
          pressed && styles.sessionItemPressed,
        ]}
        onPress={() => handleSelectSession(item.id)}
        onLongPress={() => handleSessionLongPress(item)}
        accessibilityRole="button"
        accessibilityLabel={getConversationListItemAccessibilityLabel({
          title: item.title,
          isPinned: item.isPinned,
          isArchived: item.isArchived,
          messageCount: item.messageCount,
        })}
        accessibilityHint="Opens this chat. Long press for rename, pin, archive, and delete actions."
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleRow}>
            <Text
              style={styles.sessionTitle}
              numberOfLines={
                conversationListSurface.sessionRow.title.numberOfLines
              }
            >
              {item.title}
            </Text>
          </View>
          <View style={styles.sessionHeaderMeta}>
            <Text style={styles.sessionDate}>{formatDate(item.updatedAt)}</Text>
            {item.isArchived ? (
              <Pressable
                style={[
                  styles.sessionPinButton,
                  styles.sessionArchiveButtonActive,
                ]}
                onPress={(event: GestureResponderEvent) => {
                  event.stopPropagation()
                  void handleToggleSessionArchived(item.id)
                }}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(
                  archiveAction.accessibilityLabel,
                )}
                accessibilityHint={archiveAction.accessibilityHint}
              >
                <Text
                  style={[
                    styles.sessionPinButtonText,
                    styles.sessionArchiveButtonTextActive,
                  ]}
                >
                  {archiveAction.displayLabel}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.sessionPinButton,
                  item.isPinned && styles.sessionPinButtonActive,
                ]}
                onPress={(event: GestureResponderEvent) => {
                  event.stopPropagation()
                  void handleToggleSessionPinned(item.id)
                }}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(
                  pinAction.accessibilityLabel,
                )}
                accessibilityHint={pinAction.accessibilityHint}
              >
                <Text
                  style={[
                    styles.sessionPinButtonText,
                    item.isPinned && styles.sessionPinButtonTextActive,
                  ]}
                >
                  {pinAction.displayLabel}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        <Text
          style={styles.sessionPreview}
          numberOfLines={
            conversationListSurface.sessionRow.preview.numberOfLines
          }
        >
          <Text style={styles.sessionPreviewMeta}>{sessionMetaLabel}</Text>
          {` · ${sessionPreviewText}`}
        </Text>
      </Pressable>
    )
  }

  const EmptyState = () => {
    const isArchivedMode = sessionListMode === "archived"
    const emptyState = getConversationListEmptyState({
      mode: sessionListMode,
      hasActiveSearch: false,
    })

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateTextGroup}>
          <Text style={styles.emptyTitle}>{emptyState.title}</Text>
          <Text style={styles.emptySubtitle}>{emptyState.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.newButton,
            styles.sessionActionTouchTarget,
            styles.emptyStateButton,
          ]}
          onPress={
            isArchivedMode
              ? () => setSessionListMode("active")
              : handleCreateSession
          }
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel(
            emptyState.actionLabel,
          )}
          accessibilityHint={emptyState.actionHint}
        >
          <Text style={styles.emptyStateButtonText}>
            {emptyState.actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const DisconnectedState = () => (
    <View style={styles.disconnectedState}>
      <View style={styles.disconnectedCard}>
        <View style={styles.disconnectedStatusRow}>
          <ConnectionStatusIndicator
            state={connectionInfo.state}
            retryCount={connectionInfo.retryCount}
          />
        </View>
        <Text style={styles.disconnectedTitle}>{disconnectedTitle}</Text>
        <Text style={styles.disconnectedSubtitle}>{disconnectedSubtitle}</Text>
        {!!config.baseUrl && (
          <Text
            style={styles.disconnectedMeta}
            numberOfLines={
              conversationListSurface.disconnectedState.meta.numberOfLines
            }
          >
            {config.baseUrl}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.newButton,
            styles.sessionActionTouchTarget,
            styles.disconnectedPrimaryButton,
          ]}
          onPress={() => handleOpenConnectionSettings(true)}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel("Scan QR Code")}
          accessibilityHint="Opens the QR scanner to pair this mobile app with your desktop."
        >
          <Text style={styles.emptyStateButtonText}>Scan QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.disconnectedSecondaryButton,
            styles.sessionActionTouchTarget,
          ]}
          onPress={() => handleOpenConnectionSettings(false)}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel(
            "Connection Settings",
          )}
          accessibilityHint="Opens connection settings and pairing details."
        >
          <Text style={styles.disconnectedSecondaryButtonText}>
            Connection Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const SearchEmptyState = () => {
    const emptyState = getConversationListEmptyState({
      mode: sessionListMode,
      hasActiveSearch: true,
    })

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyStateTextGroup}>
          <Text style={styles.emptyTitle}>{emptyState.title}</Text>
          <Text style={styles.emptySubtitle}>{emptyState.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.newButton,
            styles.sessionActionTouchTarget,
            styles.emptyStateButton,
          ]}
          onPress={() => setSearchQuery("")}
          accessibilityRole="button"
          accessibilityLabel={createButtonAccessibilityLabel(
            emptyState.actionLabel,
          )}
          accessibilityHint={emptyState.actionHint}
        >
          <Text style={styles.emptyStateButtonText}>
            {emptyState.actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const rfHintText =
    rfStatus === "listening"
      ? "Release to send..."
      : rfStatus === "sending"
        ? "Sending..."
        : rfStatus === "sent"
          ? "Sent to a new chat. Tap it to open."
          : rfStatus === "empty"
            ? "No speech detected. Try again."
            : rfStatus === "permissionDenied"
              ? "Microphone permission denied. Enable it in settings."
              : rfStatus === "unavailable"
                ? "Speech recognition unavailable on this build/device."
                : rfStatus === "error"
                  ? "Rapid Fire failed. Try again."
                  : "Hold to talk (Rapid Fire)"

  if (!isConnected) {
    return (
      <View
        style={[
          styles.container,
          styles.disconnectedContainer,
          { paddingBottom: insets.bottom },
        ]}
      >
        <DisconnectedState />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.searchSection}>
        <View style={styles.searchInputRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={APP_CONVERSATION_LIST_COPY.searchPlaceholder}
            placeholderTextColor={
              conversationListColors.listShell.searchInputPlaceholderColor
            }
            accessibilityLabel={createTextInputAccessibilityLabel(
              "Chat search",
            )}
            accessibilityHint={
              APP_CONVERSATION_LIST_COPY.searchAccessibilityHint
            }
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {hasActiveSearch && (
            <TouchableOpacity
              style={styles.searchClearButton}
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel={createButtonAccessibilityLabel(
                conversationListSurface.searchClear.accessibilityLabel,
              )}
              accessibilityHint={
                conversationListSurface.searchClear.accessibilityHint
              }
            >
              <Text style={styles.searchClearButtonText}>
                {conversationListSurface.searchClear.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.sessionFilterRow}>
          {(
            [
              ["active", getConversationArchiveFilterLabel("active")],
              [
                "archived",
                getConversationArchiveFilterLabel(
                  "archived",
                  sessionArchiveCount,
                ),
              ],
            ] as const
          ).map(([mode, label]) => {
            const isSelected = sessionListMode === mode
            return (
              <Pressable
                key={mode}
                style={[
                  styles.sessionFilterButton,
                  isSelected && styles.sessionFilterButtonActive,
                ]}
                onPress={() => setSessionListMode(mode)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={createButtonAccessibilityLabel(label)}
              >
                <Text
                  style={[
                    styles.sessionFilterButtonText,
                    isSelected && styles.sessionFilterButtonTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <FlatList
        data={filteredSessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredSessions.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={hasActiveSearch ? SearchEmptyState : EmptyState}
        keyboardShouldPersistTaps="handled"
      />

      {/* Rapid Fire hold-to-speak button */}
      <View style={styles.rfContainer}>
        {(rfListening || rfStatus === "sent") && rfTranscript ? (
          <Text
            style={styles.rfTranscript}
            numberOfLines={
              conversationListSurface.rapidFire.transcript.numberOfLines
            }
          >
            {rfTranscript}
          </Text>
        ) : null}
        <Text style={styles.rfHint}>{rfHintText}</Text>
        <Pressable
          ref={rfButtonRef}
          accessibilityRole="button"
          accessibilityLabel={
            rfListening ? "Release to send" : "Hold to talk, Rapid Fire"
          }
          style={({ pressed }) => [
            styles.rfButton,
            rfListening && styles.rfButtonOn,
            Platform.OS === "web" &&
              ({
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                touchAction: "manipulation",
              } as any),
            pressed && !rfListening && styles.rfButtonPressed,
          ]}
          onPressIn={(e: GestureResponderEvent) => {
            rfGrantTimeRef.current = Date.now()
            rfPressInSeenRef.current = true
            rfLog("mic:onPressIn", {
              listening: rfListeningRef.current,
              starting: rfStartingRef.current,
              pageX: e.nativeEvent.pageX,
              pageY: e.nativeEvent.pageY,
            })
            if (!rfListeningRef.current) {
              void rfStartRecording(e)
            }
          }}
          onPressOut={() => {
            rfPressInSeenRef.current = false
            const dt = Date.now() - rfGrantTimeRef.current
            const delay = Math.max(0, rfMinHoldMs - dt)
            rfLog("mic:onPressOut", {
              listening: rfListeningRef.current,
              dt,
              delay,
            })
            if (delay > 0) {
              setTimeout(() => {
                rfLog("mic:onPressOut -> delayed stop fired", {
                  listening: rfListeningRef.current,
                })
                if (rfListeningRef.current) {
                  void rfStopAndFire()
                }
              }, delay)
            } else {
              if (rfListeningRef.current) {
                void rfStopAndFire()
              }
            }
          }}
        >
          <Text style={styles.rfButtonText}>
            {rfListening ? "\uD83C\uDF99\uFE0F" : "\uD83C\uDFA4"}
          </Text>
          <Text style={styles.rfButtonLabel}>
            {rfListening ? "..." : rfStatus === "sending" ? "Sending" : "Hold"}
          </Text>
        </Pressable>
      </View>
      <AgentSelectorSheet
        visible={agentSelectorVisible}
        onClose={() => setAgentSelectorVisible(false)}
      />
      <Modal
        visible={!!renameSession}
        transparent
        animationType="fade"
        onRequestClose={closeRenameSession}
      >
        <View style={styles.renameModalOverlay}>
          <View style={styles.renameModalContent}>
            <Text style={styles.renameModalTitle}>
              {conversationListSurface.renameDialog.title}
            </Text>
            <TextInput
              style={styles.renameInput}
              value={renameTitleDraft}
              onChangeText={setRenameTitleDraft}
              placeholder={
                conversationListSurface.renameDialog.inputPlaceholder
              }
              placeholderTextColor={
                conversationListColors.renameDialog.inputPlaceholderColor
              }
              autoCapitalize="sentences"
              autoCorrect
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleRenameSession()
              }}
              editable={!isRenameSaving}
              accessibilityLabel={createTextInputAccessibilityLabel(
                conversationListSurface.renameDialog.inputAccessibilityLabel,
              )}
            />
            <View style={styles.renameActions}>
              <Pressable
                style={[styles.renameActionButton, styles.renameCancelButton]}
                onPress={closeRenameSession}
                disabled={isRenameSaving}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(
                  conversationListSurface.renameDialog.cancelAccessibilityLabel,
                )}
              >
                <Text style={styles.renameCancelText}>
                  {conversationListSurface.renameDialog.cancelLabel}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.renameActionButton,
                  styles.renameSaveButton,
                  isRenameSaving && styles.renameSaveButtonDisabled,
                ]}
                onPress={() => {
                  void handleRenameSession()
                }}
                disabled={isRenameSaving}
                accessibilityRole="button"
                accessibilityLabel={createButtonAccessibilityLabel(
                  conversationListSurface.renameDialog.saveAccessibilityLabel,
                )}
              >
                <Text style={styles.renameSaveText}>
                  {isRenameSaving
                    ? conversationListSurface.renameDialog.savingLabel
                    : conversationListSurface.renameDialog.saveLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function createStyles(
  theme: Theme,
  screenHeight: number,
  conversationListColors: ConversationListMobileSurfaceColors,
  headerAgentSelectorColors: ChatRuntimeAgentSelectorMobileColors,
) {
  const headerSurface = getChatRuntimeHeaderMobileSurfaceState()
  const screenChrome = conversationListSurface.screen
  const conversationHeader = conversationListSurface.header
  const listShell = conversationListSurface.listShell
  const searchClear = conversationListSurface.searchClear
  const archiveFilter = conversationListSurface.archiveFilter
  const rowAction = conversationListSurface.rowAction
  const sessionRow = conversationListSurface.sessionRow
  const emptyStateSurface = conversationListSurface.emptyState
  const disconnectedStateSurface = conversationListSurface.disconnectedState
  const rapidFire = conversationListSurface.rapidFire
  const renameDialog = conversationListSurface.renameDialog
  const rfButtonHeight = Math.round(
    screenHeight * rapidFire.button.heightScreenRatio,
  )
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: conversationListColors.screen.containerBackgroundColor,
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    spinner: {
      width: 48,
      height: 48,
    },
    loadingText: {
      ...theme.typography.body,
      color: conversationListColors.screen.loadingTextColor,
      marginTop: spacing.md,
    },
    newButton: {
      backgroundColor:
        conversationListColors.screen.primaryActionButtonBackgroundColor,
      borderRadius: radius[screenChrome.primaryActionButton.borderRadius],
    },
    headerNewChatButton: {
      ...createMinimumTouchTargetStyle({
        horizontalPadding:
          spacing[conversationHeader.newChatButton.horizontalPadding],
        verticalPadding: spacing[conversationHeader.newChatButton.verticalPadding],
        horizontalMargin: conversationHeader.newChatButton.horizontalMargin,
      }),
      backgroundColor:
        conversationListColors.header.newChatButtonBackgroundColor,
      borderRadius: radius[conversationHeader.newChatButton.borderRadius],
      marginLeft: spacing[conversationHeader.newChatButton.marginLeft],
    },
    headerNewChatButtonText: {
      color: conversationListColors.header.newChatTextColor,
      fontSize: conversationHeader.newChatText.fontSize,
      fontWeight: conversationHeader.newChatText.fontWeight,
    },
    headerTitleAgentSelectorButton: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: headerSurface.agentSelectorButton.minHeight,
      minWidth: 0,
    },
    headerTitleText: {
      fontSize: conversationHeader.title.fontSize,
      fontWeight: conversationHeader.title.fontWeight,
      color: conversationListColors.header.titleColor,
    },
    headerActionsRow: {
      flexDirection: headerSurface.actionsRow.flexDirection,
      alignItems: headerSurface.actionsRow.alignItems,
      gap: headerSurface.actionsRow.gap,
    },
    headerAgentSelectorChip: {
      flexDirection: "row",
      alignItems: "center",
      maxWidth: headerSurface.agentSelectorChip.maxWidth,
      marginTop: conversationHeader.agentSelectorChip.marginTop,
      backgroundColor: headerAgentSelectorColors.chip.backgroundColor,
      paddingHorizontal: headerSurface.agentSelectorChip.paddingHorizontal,
      paddingVertical: headerSurface.agentSelectorChip.paddingVertical,
      borderRadius: headerSurface.agentSelectorChip.borderRadius,
      gap: headerSurface.agentSelectorChip.gap,
    },
    headerAgentSelectorText: {
      minWidth: 0,
      flexShrink: 1,
      fontSize: headerSurface.agentSelectorText.fontSize,
      color: headerAgentSelectorColors.text.color,
      fontWeight: headerSurface.agentSelectorText.fontWeight,
    },
    sessionActionTouchTarget: {
      ...createMinimumTouchTargetStyle({
        horizontalPadding: spacing.md,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
    },
    headerSettingsButton: {
      ...createMinimumTouchTargetStyle({
        horizontalPadding: spacing.sm,
        verticalPadding: spacing.sm,
        horizontalMargin: 0,
      }),
      marginLeft: spacing.xs,
    },
    searchSection: {
      paddingHorizontal: spacing[listShell.searchSection.paddingHorizontal],
      paddingTop: spacing[listShell.searchSection.paddingTop],
      paddingBottom: spacing[listShell.searchSection.paddingBottom],
      gap: spacing[listShell.searchSection.gap],
    },
    searchInputRow: {
      flexDirection: listShell.searchInputRow.flexDirection,
      alignItems: listShell.searchInputRow.alignItems,
      gap: spacing[listShell.searchInputRow.gap],
    },
    searchInput: {
      ...theme.input,
      flex: listShell.searchInput.flex,
    },
    searchClearButton: {
      ...createMinimumTouchTargetStyle({
        horizontalPadding: spacing[searchClear.button.horizontalPadding],
        verticalPadding: spacing[searchClear.button.verticalPadding],
        horizontalMargin: searchClear.button.horizontalMargin,
      }),
      borderRadius: radius[searchClear.button.borderRadius],
    },
    searchClearButtonText: {
      color: conversationListColors.searchClear.textColor,
      fontWeight: searchClear.text.fontWeight,
    },
    sessionFilterRow: {
      flexDirection: archiveFilter.row.flexDirection,
      alignItems: archiveFilter.row.alignItems,
      gap: spacing[archiveFilter.row.gap],
      flexWrap: archiveFilter.row.flexWrap,
    },
    sessionFilterButton: {
      ...createMinimumTouchTargetStyle({
        horizontalPadding: spacing[archiveFilter.button.horizontalPadding],
        verticalPadding: spacing[archiveFilter.button.verticalPadding],
        horizontalMargin: archiveFilter.button.horizontalMargin,
      }),
      borderRadius: radius[archiveFilter.button.borderRadius],
      borderWidth: archiveFilter.button.borderWidth,
      borderColor: conversationListColors.archiveFilter.buttonBorderColor,
      backgroundColor:
        conversationListColors.archiveFilter.buttonBackgroundColor,
    },
    sessionFilterButtonActive: {
      borderColor:
        conversationListColors.archiveFilter.selectedButtonBorderColor,
      backgroundColor:
        conversationListColors.archiveFilter.selectedButtonBackgroundColor,
    },
    sessionFilterButtonText: {
      ...theme.typography[archiveFilter.text.typographyToken],
      color: conversationListColors.archiveFilter.textColor,
      fontWeight: archiveFilter.text.fontWeight,
    },
    sessionFilterButtonTextActive: {
      color: conversationListColors.archiveFilter.selectedTextColor,
    },
    list: {
      padding: spacing[listShell.list.padding],
    },
    disconnectedContainer: {
      justifyContent: disconnectedStateSurface.screen.justifyContent,
      padding: spacing[disconnectedStateSurface.screen.padding],
    },
    disconnectedState: {
      width: disconnectedStateSurface.container.width,
      alignItems: disconnectedStateSurface.container.alignItems,
    },
    disconnectedCard: {
      width: disconnectedStateSurface.card.width,
      maxWidth: disconnectedStateSurface.card.maxWidth,
      backgroundColor:
        conversationListColors.disconnectedState.cardBackgroundColor,
      borderRadius: radius[disconnectedStateSurface.card.borderRadius],
      borderWidth: disconnectedStateSurface.card.borderWidth,
      borderColor: conversationListColors.disconnectedState.cardBorderColor,
      padding: spacing[disconnectedStateSurface.card.padding],
      gap: spacing[disconnectedStateSurface.card.gap],
    },
    disconnectedStatusRow: {
      alignItems: disconnectedStateSurface.statusRow.alignItems,
    },
    disconnectedTitle: {
      ...theme.typography[disconnectedStateSurface.title.typographyToken],
    },
    disconnectedSubtitle: {
      ...theme.typography[disconnectedStateSurface.subtitle.typographyToken],
      color: conversationListColors.disconnectedState.subtitleColor,
    },
    disconnectedMeta: {
      ...theme.typography[disconnectedStateSurface.meta.typographyToken],
      color: conversationListColors.disconnectedState.metaColor,
    },
    disconnectedPrimaryButton: {
      alignSelf: disconnectedStateSurface.primaryButton.alignSelf,
      minWidth: disconnectedStateSurface.primaryButton.minWidth,
    },
    disconnectedSecondaryButton: {
      alignSelf: disconnectedStateSurface.secondaryButton.alignSelf,
      minWidth: disconnectedStateSurface.secondaryButton.minWidth,
      borderRadius:
        radius[disconnectedStateSurface.secondaryButton.borderRadius],
      borderWidth: disconnectedStateSurface.secondaryButton.borderWidth,
      borderColor:
        conversationListColors.disconnectedState.secondaryButtonBorderColor,
      alignItems: disconnectedStateSurface.secondaryButton.alignItems,
    },
    disconnectedSecondaryButtonText: {
      color:
        conversationListColors.disconnectedState.secondaryButtonTextColor,
      fontWeight: disconnectedStateSurface.secondaryButtonText.fontWeight,
      textAlign: disconnectedStateSurface.secondaryButtonText.textAlign,
    },
    emptyList: {
      flex: listShell.emptyList.flex,
      justifyContent: listShell.emptyList.justifyContent,
      alignItems: listShell.emptyList.alignItems,
    },
    sessionItem: {
      backgroundColor: conversationListColors.sessionRow.itemBackgroundColor,
      borderRadius: radius[sessionRow.item.borderRadius],
      padding: spacing[sessionRow.item.padding],
      marginBottom: spacing[sessionRow.item.marginBottom],
      borderWidth: sessionRow.item.borderWidth,
      borderColor: conversationListColors.sessionRow.itemBorderColor,
    },
    sessionItemActive: {
      borderColor: conversationListColors.sessionRow.activeItemBorderColor,
      borderWidth: sessionRow.activeItem.borderWidth,
    },
    sessionItemPressed: {
      opacity: sessionRow.pressedItem.opacity,
    },
    sessionHeader: {
      flexDirection: sessionRow.header.flexDirection,
      justifyContent: sessionRow.header.justifyContent,
      marginBottom: sessionRow.header.marginBottom,
    },
    sessionTitleRow: {
      flexDirection: sessionRow.titleRow.flexDirection,
      alignItems: sessionRow.titleRow.alignItems,
      flex: sessionRow.titleRow.flex,
      minWidth: sessionRow.titleRow.minWidth,
      marginRight: sessionRow.titleRow.marginRight,
    },
    sessionHeaderMeta: {
      flexDirection: sessionRow.headerMeta.flexDirection,
      alignItems: sessionRow.headerMeta.alignItems,
      gap: spacing[sessionRow.headerMeta.gap],
      marginLeft: spacing[sessionRow.headerMeta.marginLeft],
    },
    sessionTitle: {
      fontSize: sessionRow.title.fontSize,
      lineHeight: sessionRow.title.lineHeight,
      fontWeight: sessionRow.title.fontWeight,
      color: conversationListColors.sessionRow.titleColor,
      flex: sessionRow.title.flex,
      minWidth: sessionRow.title.minWidth,
    },
    sessionPinButton: {
      ...createMinimumTouchTargetStyle({
        horizontalPadding: spacing[rowAction.button.horizontalPadding],
        verticalPadding: spacing[rowAction.button.verticalPadding],
        horizontalMargin: rowAction.button.horizontalMargin,
      }),
      borderRadius: radius[rowAction.button.borderRadius],
      borderWidth: rowAction.button.borderWidth,
      borderColor: conversationListColors.rowAction.buttonBorderColor,
      backgroundColor: conversationListColors.rowAction.buttonBackgroundColor,
    },
    sessionPinButtonActive: {
      borderColor: conversationListColors.rowAction.activeButtonBorderColor,
      backgroundColor:
        conversationListColors.rowAction.activeButtonBackgroundColor,
    },
    sessionArchiveButtonActive: {
      borderColor: conversationListColors.rowAction.activeButtonBorderColor,
      backgroundColor:
        conversationListColors.rowAction.activeButtonBackgroundColor,
    },
    sessionPinButtonText: {
      ...theme.typography[rowAction.text.typographyToken],
      color: conversationListColors.rowAction.textColor,
      fontWeight: rowAction.text.fontWeight,
    },
    sessionPinButtonTextActive: {
      color: conversationListColors.rowAction.activeTextColor,
    },
    sessionArchiveButtonTextActive: {
      color: conversationListColors.rowAction.activeTextColor,
    },
    sessionDate: {
      ...theme.typography[sessionRow.date.typographyToken],
      color: conversationListColors.sessionRow.dateColor,
    },
    sessionPreview: {
      ...theme.typography[sessionRow.preview.typographyToken],
      color: conversationListColors.sessionRow.previewColor,
    },
    sessionPreviewMeta: {
      ...theme.typography[sessionRow.previewMeta.typographyToken],
      color: conversationListColors.sessionRow.previewMetaColor,
      fontWeight: sessionRow.previewMeta.fontWeight,
    },
    emptyState: {
      alignItems: emptyStateSurface.container.alignItems,
      width: emptyStateSurface.container.width,
      maxWidth: emptyStateSurface.container.maxWidth,
      padding: spacing[emptyStateSurface.container.padding],
    },
    emptyStateTextGroup: {
      alignItems: emptyStateSurface.textGroup.alignItems,
      marginBottom: spacing[emptyStateSurface.textGroup.marginBottom],
    },
    emptyTitle: {
      ...theme.typography[emptyStateSurface.title.typographyToken],
      marginBottom: spacing[emptyStateSurface.title.marginBottom],
      textAlign: emptyStateSurface.title.textAlign,
    },
    emptySubtitle: {
      ...theme.typography[emptyStateSurface.subtitle.typographyToken],
      color: conversationListColors.emptyState.subtitleColor,
      textAlign: emptyStateSurface.subtitle.textAlign,
    },
    emptyStateButton: {
      width: emptyStateSurface.button.width,
      maxWidth: emptyStateSurface.button.maxWidth,
    },
    emptyStateButtonText: {
      color: conversationListColors.emptyState.buttonTextColor,
      fontWeight: emptyStateSurface.buttonText.fontWeight,
      textAlign: emptyStateSurface.buttonText.textAlign,
    },
    rfContainer: {
      borderTopWidth: theme[rapidFire.container.borderTopWidthToken],
      borderTopColor: conversationListColors.rapidFire.containerBorderTopColor,
      backgroundColor:
        conversationListColors.rapidFire.containerBackgroundColor,
      paddingHorizontal: spacing[rapidFire.container.paddingHorizontal],
      paddingTop: spacing[rapidFire.container.paddingTop],
      paddingBottom: spacing[rapidFire.container.paddingBottom],
      alignItems: rapidFire.container.alignItems,
    },
    rfHint: {
      ...theme.typography[rapidFire.hint.typographyToken],
      color: conversationListColors.rapidFire.hintColor,
      marginBottom: spacing[rapidFire.hint.marginBottom],
      textAlign: rapidFire.hint.textAlign,
    },
    rfTranscript: {
      ...theme.typography[rapidFire.transcript.typographyToken],
      color: conversationListColors.rapidFire.transcriptColor,
      textAlign: rapidFire.transcript.textAlign,
      marginBottom: spacing[rapidFire.transcript.marginBottom],
      paddingHorizontal: spacing[rapidFire.transcript.paddingHorizontal],
    },
    rfButton: {
      width: rapidFire.button.width,
      height: rfButtonHeight,
      borderRadius: radius[rapidFire.button.borderRadius],
      borderWidth: rapidFire.button.borderWidth,
      borderColor: conversationListColors.rapidFire.buttonBorderColor,
      backgroundColor: conversationListColors.rapidFire.buttonBackgroundColor,
      alignItems: rapidFire.button.alignItems,
      justifyContent: rapidFire.button.justifyContent,
    },
    rfButtonOn: {
      backgroundColor:
        conversationListColors.rapidFire.activeButtonBackgroundColor,
      borderColor: conversationListColors.rapidFire.activeButtonBorderColor,
    },
    rfButtonPressed: {
      opacity: rapidFire.pressedButton.opacity,
    },
    rfButtonText: {
      fontSize: rapidFire.buttonIconText.fontSize,
    },
    rfButtonLabel: {
      fontSize: rapidFire.buttonLabel.fontSize,
      color: conversationListColors.rapidFire.buttonLabelColor,
      marginTop: rapidFire.buttonLabel.marginTop,
      fontWeight: rapidFire.buttonLabel.fontWeight,
    },
    renameModalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: conversationListColors.renameDialog.overlayBackgroundColor,
      padding: spacing[renameDialog.overlay.padding],
    },
    renameModalContent: {
      width: renameDialog.content.width,
      maxWidth: renameDialog.content.maxWidth,
      backgroundColor:
        conversationListColors.renameDialog.contentBackgroundColor,
      borderRadius: radius[renameDialog.content.borderRadius],
      borderWidth: renameDialog.content.borderWidth,
      borderColor: conversationListColors.renameDialog.contentBorderColor,
      padding: spacing[renameDialog.content.padding],
      gap: spacing[renameDialog.content.gap],
    },
    renameModalTitle: {
      ...theme.typography[renameDialog.titleText.typographyToken],
    },
    renameInput: {
      ...theme.input,
    },
    renameActions: {
      flexDirection: renameDialog.actions.flexDirection,
      justifyContent: renameDialog.actions.justifyContent,
      alignItems: renameDialog.actions.alignItems,
      gap: spacing[renameDialog.actions.gap],
      flexWrap: renameDialog.actions.flexWrap,
    },
    renameActionButton: {
      ...createMinimumTouchTargetStyle({
        horizontalPadding: spacing[renameDialog.actionButton.horizontalPadding],
        verticalPadding: spacing[renameDialog.actionButton.verticalPadding],
        horizontalMargin: renameDialog.actionButton.horizontalMargin,
      }),
      borderRadius: radius[renameDialog.actionButton.borderRadius],
      alignItems: renameDialog.actionButton.alignItems,
    },
    renameCancelButton: {
      borderWidth: renameDialog.cancelButton.borderWidth,
      borderColor:
        conversationListColors.renameDialog.cancelButtonBorderColor,
      backgroundColor:
        conversationListColors.renameDialog.cancelButtonBackgroundColor,
    },
    renameCancelText: {
      color: conversationListColors.renameDialog.cancelTextColor,
      fontWeight: renameDialog.cancelText.fontWeight,
    },
    renameSaveButton: {
      backgroundColor:
        conversationListColors.renameDialog.saveButtonBackgroundColor,
    },
    renameSaveButtonDisabled: {
      opacity: renameDialog.saveButton.disabledOpacity,
    },
    renameSaveText: {
      color: conversationListColors.renameDialog.saveTextColor,
      fontWeight: renameDialog.saveText.fontWeight,
    },
  })
}
