package com.aj47.dotagents

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Base64
import android.util.Log
import androidx.core.content.ContextCompat
import java.util.UUID

class HandsFreeTestReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (!BuildConfig.DEBUG) {
      Log.w(TAG, "test receiver ignored in non-debug build action=${intent?.action ?: "-"}")
      return
    }

    val action = intent?.action ?: return
    Log.i(TAG, "test receiver action=$action")

    when (action) {
      ACTION_START -> {
        val serviceIntent = HandsFreeVoiceService.createStartIntent(
          context,
          intent.getStringExtra(EXTRA_LANGUAGE)?.takeIf { it.isNotBlank() } ?: DEFAULT_LANGUAGE,
          intent.getBooleanExtra(EXTRA_LISTENING_ENABLED, true),
          intent.getLongExtra(EXTRA_TRANSCRIPT_DEBOUNCE_MS, DEFAULT_TRANSCRIPT_DEBOUNCE_MS),
        )
        ContextCompat.startForegroundService(context, serviceIntent)
      }

      ACTION_STOP -> {
        context.stopService(HandsFreeVoiceService.createStopIntent(context))
      }

      ACTION_SET_LISTENING -> {
        context.startService(
          HandsFreeVoiceService.createSetListeningIntent(
            context,
            intent.getBooleanExtra(EXTRA_LISTENING_ENABLED, true),
          ),
        )
      }

      ACTION_SNAPSHOT -> {
        HandsFreeAudioRouter.logCurrentRoute(context, "test-snapshot")
      }

      ACTION_INJECT_PARTIAL -> {
        injectTranscript(intent, isFinal = false)
      }

      ACTION_INJECT_FINAL -> {
        injectTranscript(intent, isFinal = true)
      }

      ACTION_SPEAK -> {
        val text = readTextExtra(intent)
          ?: "DotAgents hands-free test."
        val utteranceId = intent.getStringExtra(EXTRA_UTTERANCE_ID)?.takeIf { it.isNotBlank() }
          ?: "handsfree-test-${UUID.randomUUID()}"
        val started = HandsFreeVoiceService.speakTts(
          utteranceId = utteranceId,
          text = text,
          language = intent.getStringExtra(EXTRA_LANGUAGE)?.takeIf { it.isNotBlank() } ?: DEFAULT_LANGUAGE,
          rate = intent.getFloatExtra(EXTRA_RATE, 1.0f),
          pitch = intent.getFloatExtra(EXTRA_PITCH, 1.0f),
          voice = intent.getStringExtra(EXTRA_VOICE)?.takeIf { it.isNotBlank() },
          restoreListeningAfterDone = intent.getBooleanExtra(EXTRA_RESTORE_LISTENING, true),
          allowBargeIn = intent.getBooleanExtra(EXTRA_ALLOW_BARGE_IN, false),
        )
        Log.i(TAG, "test speak requested utteranceId=$utteranceId started=$started textLength=${text.length}")
      }

      ACTION_STOP_SPEAKING -> {
        val stopped = HandsFreeVoiceService.stopTts()
        Log.i(TAG, "test stop-speaking requested stopped=$stopped")
      }
    }
  }

  private fun injectTranscript(intent: Intent, isFinal: Boolean) {
    val text = readTextExtra(intent)
      ?: if (isFinal) "hands free final test" else "hands free partial test"
    val callback = if (isFinal) "test-results" else "test-partial-results"
    val delivered = HandsFreeVoiceService.debugInjectRecognitionResult(text, isFinal, callback)
    Log.i(TAG, "test transcript requested isFinal=$isFinal delivered=$delivered textLength=${text.length}")
  }

  private fun readTextExtra(intent: Intent): String? {
    val encoded = intent.getStringExtra(EXTRA_TEXT_BASE64)?.takeIf { it.isNotBlank() }
    if (encoded != null) {
      try {
        return String(Base64.decode(encoded, Base64.DEFAULT), Charsets.UTF_8).takeIf { it.isNotBlank() }
      } catch (error: Throwable) {
        Log.w(TAG, "test receiver failed to decode textBase64", error)
      }
    }

    return intent.getStringExtra(EXTRA_TEXT)?.takeIf { it.isNotBlank() }
  }

  companion object {
    private const val TAG = "DotAgentsHandsFree"
    private const val DEFAULT_LANGUAGE = "en-US"
    private const val DEFAULT_TRANSCRIPT_DEBOUNCE_MS = 1500L

    const val ACTION_START = "com.aj47.dotagents.handsfree.TEST_START"
    const val ACTION_STOP = "com.aj47.dotagents.handsfree.TEST_STOP"
    const val ACTION_SET_LISTENING = "com.aj47.dotagents.handsfree.TEST_SET_LISTENING"
    const val ACTION_SNAPSHOT = "com.aj47.dotagents.handsfree.TEST_SNAPSHOT"
    const val ACTION_INJECT_PARTIAL = "com.aj47.dotagents.handsfree.TEST_INJECT_PARTIAL"
    const val ACTION_INJECT_FINAL = "com.aj47.dotagents.handsfree.TEST_INJECT_FINAL"
    const val ACTION_SPEAK = "com.aj47.dotagents.handsfree.TEST_SPEAK"
    const val ACTION_STOP_SPEAKING = "com.aj47.dotagents.handsfree.TEST_STOP_SPEAKING"

    private const val EXTRA_LANGUAGE = "language"
    private const val EXTRA_LISTENING_ENABLED = "listeningEnabled"
    private const val EXTRA_TRANSCRIPT_DEBOUNCE_MS = "transcriptDebounceMs"
    private const val EXTRA_TEXT = "text"
    private const val EXTRA_TEXT_BASE64 = "textBase64"
    private const val EXTRA_UTTERANCE_ID = "utteranceId"
    private const val EXTRA_RATE = "rate"
    private const val EXTRA_PITCH = "pitch"
    private const val EXTRA_VOICE = "voice"
    private const val EXTRA_RESTORE_LISTENING = "restoreListeningAfterDone"
    private const val EXTRA_ALLOW_BARGE_IN = "allowBargeIn"
  }
}
