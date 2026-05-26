package com.aj47.dotagents

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.util.Log

object HandsFreeAudioRouter {
  private const val TAG = "DotAgentsHandsFree"
  private val requesters = linkedSetOf<String>()
  private var previousMode: Int? = null
  private var routingApplied = false

  @Synchronized
  fun acquire(context: Context, reason: String): Bundle {
    requesters.add(normalizeReason(reason))
    val audioManager = context.getSystemService(AudioManager::class.java)
    val target = preferredCommunicationHeadset(audioManager)

    if (target == null) {
      Log.i(TAG, "audio-route acquire reason=$reason target=none requesters=${requesters.joinToString(",")}")
      return routeBundle(audioManager, false)
    }

    if (previousMode == null) {
      previousMode = audioManager.mode
    }

    var applied = false
    try {
      audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
      applied = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        audioManager.setCommunicationDevice(target)
      } else {
        @Suppress("DEPRECATION")
        audioManager.isSpeakerphoneOn = false
        @Suppress("DEPRECATION")
        audioManager.startBluetoothSco()
        @Suppress("DEPRECATION")
        audioManager.isBluetoothScoOn = true
        true
      }
      routingApplied = routingApplied || applied
    } catch (error: Throwable) {
      Log.w(TAG, "audio-route acquire failed reason=$reason target=${audioDeviceTypeName(target.type)}", error)
    }

    Log.i(
      TAG,
      "audio-route acquire reason=$reason target=${audioDeviceTypeName(target.type)} applied=$applied requesters=${requesters.joinToString(",")}"
    )
    return routeBundle(audioManager, applied)
  }

  @Synchronized
  fun release(context: Context, reason: String): Bundle {
    requesters.remove(normalizeReason(reason))
    val audioManager = context.getSystemService(AudioManager::class.java)

    if (requesters.isNotEmpty()) {
      Log.i(TAG, "audio-route release reason=$reason deferred requesters=${requesters.joinToString(",")}")
      return routeBundle(audioManager, false)
    }

    try {
      if (routingApplied) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          audioManager.clearCommunicationDevice()
        } else {
          @Suppress("DEPRECATION")
          audioManager.stopBluetoothSco()
          @Suppress("DEPRECATION")
          audioManager.isBluetoothScoOn = false
        }
      }
      previousMode?.let { audioManager.mode = it }
    } catch (error: Throwable) {
      Log.w(TAG, "audio-route release failed reason=$reason", error)
    } finally {
      previousMode = null
      routingApplied = false
    }

    Log.i(TAG, "audio-route release reason=$reason requesters=none")
    return routeBundle(audioManager, false)
  }

  @Synchronized
  fun currentRoute(context: Context): Bundle {
    return routeBundle(context.getSystemService(AudioManager::class.java), false)
  }

  private fun preferredCommunicationHeadset(audioManager: AudioManager): AudioDeviceInfo? {
    val communicationDevices = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      audioManager.availableCommunicationDevices
    } else {
      emptyList()
    }

    return selectPreferredHeadset(communicationDevices)
      ?: selectPreferredHeadset(audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS).toList())
      ?: selectPreferredHeadset(audioManager.getDevices(AudioManager.GET_DEVICES_ALL).toList())
  }

  private fun selectPreferredHeadset(devices: List<AudioDeviceInfo>): AudioDeviceInfo? {
    val priority = listOf(
      AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
      bleHeadsetType(),
      AudioDeviceInfo.TYPE_USB_HEADSET,
      AudioDeviceInfo.TYPE_WIRED_HEADSET,
    ).filterNotNull()

    for (type in priority) {
      devices.firstOrNull { it.type == type }?.let { return it }
    }
    return devices.firstOrNull { isCommunicationHeadset(it.type) }
  }

  private fun routeBundle(audioManager: AudioManager, routeApplied: Boolean): Bundle {
    val inputDevices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
    val outputDevices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
    val allDevices = audioManager.getDevices(AudioManager.GET_DEVICES_ALL)
    val headsetDevices = allDevices.filter { isCommunicationHeadset(it.type) }
    val target = preferredCommunicationHeadset(audioManager)
    val communicationDevice = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      audioManager.communicationDevice
    } else {
      null
    }

    return Bundle().apply {
      putBoolean("hasHeadset", headsetDevices.isNotEmpty())
      putString("route", target?.let { audioDeviceTypeName(it.type) } ?: "speaker")
      putString("inputTypes", inputDevices.joinToString(",") { audioDeviceTypeName(it.type) })
      putString("outputTypes", outputDevices.joinToString(",") { audioDeviceTypeName(it.type) })
      putString("communicationDevice", communicationDevice?.let { audioDeviceTypeName(it.type) } ?: "default")
      putBoolean("routingActive", requesters.isNotEmpty() && routingApplied)
      putBoolean("routingRequested", requesters.isNotEmpty())
      putBoolean("routeApplied", routeApplied)
      putString("requesters", requesters.joinToString(","))
      putString("mode", audioModeName(audioManager.mode))
    }
  }

  private fun normalizeReason(reason: String): String {
    return reason.ifBlank { "unknown" }
  }

  private fun isCommunicationHeadset(type: Int): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && type == AudioDeviceInfo.TYPE_BLE_HEADSET) {
      return true
    }
    return when (type) {
      AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
      AudioDeviceInfo.TYPE_WIRED_HEADSET,
      AudioDeviceInfo.TYPE_USB_HEADSET -> true
      else -> false
    }
  }

  private fun bleHeadsetType(): Int? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      AudioDeviceInfo.TYPE_BLE_HEADSET
    } else {
      null
    }
  }

  private fun audioDeviceTypeName(type: Int): String {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && type == AudioDeviceInfo.TYPE_BLE_HEADSET) {
      return "ble-headset"
    }
    return when (type) {
      AudioDeviceInfo.TYPE_BUILTIN_EARPIECE -> "earpiece"
      AudioDeviceInfo.TYPE_BUILTIN_MIC -> "built-in-mic"
      AudioDeviceInfo.TYPE_BUILTIN_SPEAKER -> "speaker"
      AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> "bluetooth-a2dp"
      AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "bluetooth-sco"
      AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> "wired-headphones"
      AudioDeviceInfo.TYPE_WIRED_HEADSET -> "wired-headset"
      AudioDeviceInfo.TYPE_USB_DEVICE -> "usb-device"
      AudioDeviceInfo.TYPE_USB_HEADSET -> "usb-headset"
      else -> "audio-device-$type"
    }
  }

  private fun audioModeName(mode: Int): String {
    return when (mode) {
      AudioManager.MODE_NORMAL -> "normal"
      AudioManager.MODE_RINGTONE -> "ringtone"
      AudioManager.MODE_IN_CALL -> "in-call"
      AudioManager.MODE_IN_COMMUNICATION -> "in-communication"
      else -> "mode-$mode"
    }
  }
}
