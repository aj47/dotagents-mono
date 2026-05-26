package com.aj47.dotagents

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.util.Log

object HandsFreeVoiceEvents {
  const val EVENT_NAME = "DotAgentsHandsFreeVoiceEvent"
  private const val TAG = "DotAgentsHandsFree"

  @Volatile
  private var reactContext: ReactApplicationContext? = null

  fun bind(context: ReactApplicationContext) {
    reactContext = context
  }

  fun unbind(context: ReactApplicationContext) {
    if (reactContext === context) {
      reactContext = null
    }
  }

  fun emit(type: String, configure: ((WritableMap) -> Unit)? = null) {
    val payload = Arguments.createMap().apply {
      putString("type", type)
      configure?.invoke(this)
    }
    Log.i(
      TAG,
      "event type=$type textLength=${readTextLength(payload)} message=${readString(payload, "message") ?: "-"} errorCode=${readInt(payload, "errorCode") ?: "-"} recoverable=${readBoolean(payload, "recoverable") ?: "-"}",
    )

    val context = reactContext ?: return

    try {
      context.runOnJSQueueThread {
        try {
          context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_NAME, payload)
        } catch (_: Throwable) {
          // The service can outlive the currently attached JS bridge.
        }
      }
    } catch (_: Throwable) {
      // Ignore events emitted before React Native has initialized.
    }
  }

  private fun readTextLength(payload: WritableMap): Int {
    return try {
      if (payload.hasKey("text") && !payload.isNull("text")) {
        payload.getString("text")?.length ?: 0
      } else {
        0
      }
    } catch (_: Throwable) {
      0
    }
  }

  private fun readString(payload: WritableMap, key: String): String? {
    return try {
      if (payload.hasKey(key) && !payload.isNull(key)) payload.getString(key) else null
    } catch (_: Throwable) {
      null
    }
  }

  private fun readInt(payload: WritableMap, key: String): Int? {
    return try {
      if (payload.hasKey(key) && !payload.isNull(key)) payload.getInt(key) else null
    } catch (_: Throwable) {
      null
    }
  }

  private fun readBoolean(payload: WritableMap, key: String): Boolean? {
    return try {
      if (payload.hasKey(key) && !payload.isNull(key)) payload.getBoolean(key) else null
    } catch (_: Throwable) {
      null
    }
  }
}
