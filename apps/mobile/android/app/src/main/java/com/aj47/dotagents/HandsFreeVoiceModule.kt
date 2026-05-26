package com.aj47.dotagents

import android.os.Bundle
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap

class HandsFreeVoiceModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
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

    try {
      val intent = HandsFreeVoiceService.createStartIntent(reactContext, language, listeningEnabled)
      ContextCompat.startForegroundService(reactContext, intent)
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("handsfree_start_failed", error.message, error)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      reactContext.stopService(HandsFreeVoiceService.createStopIntent(reactContext))
      promise.resolve(null)
    } catch (error: Throwable) {
      promise.reject("handsfree_stop_failed", error.message, error)
    }
  }

  @ReactMethod
  fun setListeningEnabled(enabled: Boolean, promise: Promise) {
    try {
      val updated = HandsFreeVoiceService.setListeningEnabled(enabled)
      promise.resolve(updated)
    } catch (error: Throwable) {
      promise.reject("handsfree_set_listening_failed", error.message, error)
    }
  }

  @ReactMethod
  fun isRunning(promise: Promise) {
    promise.resolve(HandsFreeVoiceService.isRunning())
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
}
