package com.aj47.dotagents

import android.os.Bundle
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import java.util.UUID

class HandsFreeVoiceModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val tag = "DotAgentsHandsFree"

  init {
    HandsFreeVoiceEvents.bind(reactContext)
  }

  override fun getName(): String = "DotAgentsHandsFreeVoice"

  @ReactMethod
  fun start(options: ReadableMap?, promise: Promise) {
    val language = if (options?.hasKey("language") == true && !options.isNull("language")) {
      options.getString("language")?.takeIf { it.isNotBlank() } ?: "en-US"
    } else {
      "en-US"
    }
    val listeningEnabled = if (options?.hasKey("listeningEnabled") == true && !options.isNull("listeningEnabled")) {
      options.getBoolean("listeningEnabled")
    } else {
      true
    }
    val transcriptDebounceMs = readDouble(options, "debounceMs", 1500.0)
      .toLong()
      .coerceAtLeast(0L)

    try {
      Log.i(tag, "module start requested language=$language listeningEnabled=$listeningEnabled transcriptDebounceMs=$transcriptDebounceMs isRunning=${HandsFreeVoiceService.isRunning()}")
      val intent = HandsFreeVoiceService.createStartIntent(reactContext, language, listeningEnabled, transcriptDebounceMs)
      ContextCompat.startForegroundService(reactContext, intent)
      Log.i(tag, "module start dispatched")
      promise.resolve(null)
    } catch (error: Throwable) {
      Log.e(tag, "module start failed language=$language listeningEnabled=$listeningEnabled transcriptDebounceMs=$transcriptDebounceMs", error)
      promise.reject("handsfree_start_failed", error.message, error)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      Log.i(tag, "module stop requested isRunning=${HandsFreeVoiceService.isRunning()}")
      reactContext.stopService(HandsFreeVoiceService.createStopIntent(reactContext))
      Log.i(tag, "module stop dispatched")
      promise.resolve(null)
    } catch (error: Throwable) {
      Log.e(tag, "module stop failed", error)
      promise.reject("handsfree_stop_failed", error.message, error)
    }
  }

  @ReactMethod
  fun setListeningEnabled(enabled: Boolean, promise: Promise) {
    try {
      Log.i(tag, "module setListeningEnabled requested enabled=$enabled isRunning=${HandsFreeVoiceService.isRunning()}")
      val updated = HandsFreeVoiceService.setListeningEnabled(enabled)
      Log.i(tag, "module setListeningEnabled result enabled=$enabled updated=$updated")
      promise.resolve(updated)
    } catch (error: Throwable) {
      Log.e(tag, "module setListeningEnabled failed enabled=$enabled", error)
      promise.reject("handsfree_set_listening_failed", error.message, error)
    }
  }

  @ReactMethod
  fun isRunning(promise: Promise) {
    promise.resolve(HandsFreeVoiceService.isRunning())
  }

  @ReactMethod
  fun speak(options: ReadableMap?, promise: Promise) {
    val text = readString(options, "text")?.trim()
    if (text.isNullOrBlank()) {
      promise.resolve(null)
      return
    }

    val utteranceId = readString(options, "utteranceId")?.takeIf { it.isNotBlank() }
      ?: "handsfree-tts-${UUID.randomUUID()}"
    val language = readString(options, "language")?.takeIf { it.isNotBlank() } ?: "en-US"
    val rate = readDouble(options, "rate", 1.0).toFloat()
    val pitch = readDouble(options, "pitch", 1.0).toFloat()
    val voice = readString(options, "voice")?.takeIf { it.isNotBlank() }
    val restoreListeningAfterDone = readBoolean(options, "restoreListeningAfterDone", false)
    val allowBargeIn = readBoolean(options, "allowBargeIn", false)

    try {
      Log.i(tag, "module speak requested utteranceId=$utteranceId textLength=${text.length} isRunning=${HandsFreeVoiceService.isRunning()} restoreListening=$restoreListeningAfterDone allowBargeIn=$allowBargeIn")
      val started = HandsFreeVoiceService.speakTts(
        utteranceId = utteranceId,
        text = text,
        language = language,
        rate = rate,
        pitch = pitch,
        voice = voice,
        restoreListeningAfterDone = restoreListeningAfterDone,
        allowBargeIn = allowBargeIn,
      )
      Log.i(tag, "module speak result utteranceId=$utteranceId started=$started")
      promise.resolve(if (started) utteranceId else null)
    } catch (error: Throwable) {
      Log.e(tag, "module speak failed utteranceId=$utteranceId", error)
      promise.reject("handsfree_tts_failed", error.message, error)
    }
  }

  @ReactMethod
  fun stopSpeaking(promise: Promise) {
    try {
      Log.i(tag, "module stopSpeaking requested isRunning=${HandsFreeVoiceService.isRunning()}")
      val stopped = HandsFreeVoiceService.stopTts()
      Log.i(tag, "module stopSpeaking result stopped=$stopped")
      promise.resolve(stopped)
    } catch (error: Throwable) {
      Log.e(tag, "module stopSpeaking failed", error)
      promise.reject("handsfree_tts_stop_failed", error.message, error)
    }
  }

  @ReactMethod
  fun isSpeaking(promise: Promise) {
    promise.resolve(HandsFreeVoiceService.isTtsSpeaking())
  }

  @ReactMethod
  fun playTtsAudio(options: ReadableMap?, promise: Promise) {
    val utteranceId = readString(options, "utteranceId")?.takeIf { it.isNotBlank() }
      ?: "handsfree-tts-${UUID.randomUUID()}"
    val filePath = readString(options, "filePath")?.takeIf { it.isNotBlank() }
    if (filePath == null) {
      promise.resolve(null)
      return
    }

    val restoreListeningAfterDone = readBoolean(options, "restoreListeningAfterDone", false)
    val allowBargeIn = readBoolean(options, "allowBargeIn", false)
    val deleteFileOnRelease = readBoolean(options, "deleteFileOnRelease", false)

    try {
      Log.i(tag, "module playTtsAudio requested utteranceId=$utteranceId isRunning=${HandsFreeVoiceService.isRunning()} restoreListening=$restoreListeningAfterDone allowBargeIn=$allowBargeIn")
      val started = HandsFreeVoiceService.playTtsAudio(
        utteranceId = utteranceId,
        filePath = filePath,
        restoreListeningAfterDone = restoreListeningAfterDone,
        allowBargeIn = allowBargeIn,
        deleteFileOnRelease = deleteFileOnRelease,
      )
      Log.i(tag, "module playTtsAudio result utteranceId=$utteranceId started=$started")
      promise.resolve(if (started) utteranceId else null)
    } catch (error: Throwable) {
      Log.e(tag, "module playTtsAudio failed utteranceId=$utteranceId", error)
      promise.reject("handsfree_tts_audio_failed", error.message, error)
    }
  }

  @ReactMethod
  fun playCue(options: ReadableMap?, promise: Promise) {
    val cueId = readString(options, "cueId")?.takeIf { it.isNotBlank() }
    val filePath = readString(options, "filePath")?.takeIf { it.isNotBlank() }
    if (cueId == null || filePath == null) {
      promise.resolve(false)
      return
    }

    try {
      val routed = HandsFreeVoiceService.playCue(cueId, filePath) { played ->
        Log.i(tag, "module playCue cueId=$cueId played=$played isRunning=${HandsFreeVoiceService.isRunning()}")
        promise.resolve(played)
      }
      if (!routed) {
        Log.i(tag, "module playCue cueId=$cueId played=false isRunning=${HandsFreeVoiceService.isRunning()}")
        promise.resolve(false)
      }
    } catch (error: Throwable) {
      Log.e(tag, "module playCue failed cueId=$cueId", error)
      promise.reject("handsfree_cue_failed", error.message, error)
    }
  }

  @ReactMethod
  fun getAudioRoute(promise: Promise) {
    try {
      promise.resolve(bundleToWritableMap(HandsFreeAudioRouter.currentRoute(reactContext)))
    } catch (error: Throwable) {
      promise.reject("handsfree_audio_route_failed", error.message, error)
    }
  }

  @ReactMethod
  fun setAudioRoutingEnabled(enabled: Boolean, reason: String?, promise: Promise) {
    try {
      val route = if (enabled) {
        HandsFreeAudioRouter.acquire(reactContext, reason ?: "foreground")
      } else {
        HandsFreeAudioRouter.release(reactContext, reason ?: "foreground")
      }
      promise.resolve(bundleToWritableMap(route))
    } catch (error: Throwable) {
      promise.reject("handsfree_audio_route_update_failed", error.message, error)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) = Unit

  @ReactMethod
  fun removeListeners(count: Int) = Unit

  override fun invalidate() {
    HandsFreeVoiceEvents.unbind(reactContext)
    super.invalidate()
  }

  private fun bundleToWritableMap(bundle: Bundle): WritableMap {
    return Arguments.createMap().apply {
      bundle.keySet().forEach { key ->
        when (val value = bundle.get(key)) {
          is Boolean -> putBoolean(key, value)
          is Int -> putInt(key, value)
          is Double -> putDouble(key, value)
          is String -> putString(key, value)
          null -> putNull(key)
          else -> putString(key, value.toString())
        }
      }
    }
  }

  private fun readString(options: ReadableMap?, key: String): String? {
    return if (options?.hasKey(key) == true && !options.isNull(key)) {
      options.getString(key)
    } else {
      null
    }
  }

  private fun readBoolean(options: ReadableMap?, key: String, defaultValue: Boolean): Boolean {
    return if (options?.hasKey(key) == true && !options.isNull(key)) {
      options.getBoolean(key)
    } else {
      defaultValue
    }
  }

  private fun readDouble(options: ReadableMap?, key: String, defaultValue: Double): Double {
    return if (options?.hasKey(key) == true && !options.isNull(key)) {
      options.getDouble(key)
    } else {
      defaultValue
    }
  }
}
