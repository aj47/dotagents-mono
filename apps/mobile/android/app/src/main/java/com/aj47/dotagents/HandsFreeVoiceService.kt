package com.aj47.dotagents

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.RecognitionPart
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.core.content.ContextCompat
import java.util.Locale

class HandsFreeVoiceService : Service() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var speechRecognizer: SpeechRecognizer? = null
  private var captureEnabled = true
  private var listening = false
  private var language = DEFAULT_LANGUAGE
  private var suppressRecognizerEnd = false

  private val restartRunnable = Runnable {
    if (captureEnabled) {
      startListening()
    }
  }

  override fun onCreate() {
    super.onCreate()
    activeService = this
    running = true
    ensureNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopSelf()
        return START_NOT_STICKY
      }
      ACTION_SET_LISTENING -> {
        setCaptureEnabled(intent.getBooleanExtra(EXTRA_LISTENING_ENABLED, true))
        return START_NOT_STICKY
      }
      else -> {
        language = intent?.getStringExtra(EXTRA_LANGUAGE)?.takeIf { it.isNotBlank() } ?: DEFAULT_LANGUAGE
        captureEnabled = intent?.getBooleanExtra(EXTRA_LISTENING_ENABLED, true) ?: true
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
          HandsFreeVoiceEvents.emit("error") {
            it.putString("message", "permission-denied")
            it.putBoolean("recoverable", false)
          }
          stopSelf()
          return START_NOT_STICKY
        }
        startForegroundWithNotification()
        HandsFreeVoiceEvents.emit("service-started") {
          it.putString("language", language)
          it.putBoolean("listeningEnabled", captureEnabled)
        }
        if (captureEnabled) {
          startListening()
        }
        return START_NOT_STICKY
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    captureEnabled = false
    mainHandler.removeCallbacks(restartRunnable)
    stopListening(suppressEvent = true)
    HandsFreeAudioRouter.release(this, ROUTE_REQUESTER)
    destroyRecognizer()
    running = false
    if (activeService === this) {
      activeService = null
    }
    HandsFreeVoiceEvents.emit("service-stopped")
    super.onDestroy()
  }

  fun setCaptureEnabled(enabled: Boolean) {
    mainHandler.post {
      if (captureEnabled == enabled) {
        return@post
      }

      captureEnabled = enabled
      HandsFreeVoiceEvents.emit("capture-state") {
        it.putBoolean("listeningEnabled", captureEnabled)
      }

      if (captureEnabled) {
        startListening()
      } else {
        mainHandler.removeCallbacks(restartRunnable)
        stopListening()
        HandsFreeAudioRouter.release(this@HandsFreeVoiceService, ROUTE_REQUESTER)
      }
    }
  }

  private fun startForegroundWithNotification() {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun buildNotification(): Notification {
    val openIntent = (packageManager.getLaunchIntentForPackage(packageName)
      ?: Intent(this, MainActivity::class.java)).apply {
      addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    val openPendingIntent = PendingIntent.getActivity(
      this,
      0,
      openIntent,
      pendingIntentFlags(),
    )

    val stopIntent = Intent(this, HandsFreeVoiceService::class.java).apply {
      action = ACTION_STOP
    }
    val stopPendingIntent = PendingIntent.getService(
      this,
      1,
      stopIntent,
      pendingIntentFlags(),
    )

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, NOTIFICATION_CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }

    return builder
      .setSmallIcon(R.drawable.notification_icon)
      .setContentTitle("DotAgents hands-free")
      .setContentText("Listening is available while the phone is locked.")
      .setContentIntent(openPendingIntent)
      .setOngoing(true)
      .setCategory(Notification.CATEGORY_SERVICE)
      .setPriority(Notification.PRIORITY_LOW)
      .addAction(Notification.Action.Builder(R.drawable.notification_icon, "Stop", stopPendingIntent).build())
      .build()
  }

  private fun ensureNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(NOTIFICATION_CHANNEL_ID) != null) return

    val channel = NotificationChannel(
      NOTIFICATION_CHANNEL_ID,
      "Hands-free voice",
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "Keeps DotAgents hands-free listening active while Android is locked."
      setShowBadge(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun startListening() {
    if (!captureEnabled || listening) return

    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      HandsFreeVoiceEvents.emit("error") {
        it.putString("message", "permission-denied")
        it.putBoolean("recoverable", false)
      }
      stopSelf()
      return
    }

    if (!SpeechRecognizer.isRecognitionAvailable(this)) {
      HandsFreeVoiceEvents.emit("error") {
        it.putString("message", "speech-recognition-unavailable")
        it.putBoolean("recoverable", false)
      }
      stopSelf()
      return
    }

    val recognizer = ensureRecognizer()
    HandsFreeAudioRouter.acquire(this, ROUTE_REQUESTER)
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language)
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
      putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, packageName)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val segmentedSessionMode = RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS
        // EXTRA_SEGMENTED_SESSION expects the name of the timing extra that controls segmentation.
        putExtra(RecognizerIntent.EXTRA_SEGMENTED_SESSION, segmentedSessionMode)
        putExtra(segmentedSessionMode, SEGMENT_SESSION_TIMEOUT_MS)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, SEGMENT_COMPLETE_SILENCE_MS)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, SEGMENT_POSSIBLY_COMPLETE_SILENCE_MS)
      } else {
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, LONG_SESSION_TIMEOUT_MS)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, LONG_SESSION_TIMEOUT_MS)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, LONG_SESSION_TIMEOUT_MS)
      }
    }

    try {
      suppressRecognizerEnd = false
      listening = true
      recognizer.startListening(intent)
      HandsFreeVoiceEvents.emit("recognizer-started") {
        it.putString("language", language)
        it.putString("sessionMode", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) "segmented-minimum" else "long-standard")
      }
    } catch (error: Throwable) {
      listening = false
      HandsFreeVoiceEvents.emit("error") {
        it.putString("message", error.message ?: "recognizer-start-failed")
        it.putBoolean("recoverable", true)
      }
      scheduleRestart(1000L)
    }
  }

  private fun stopListening(suppressEvent: Boolean = false) {
    suppressRecognizerEnd = true
    mainHandler.removeCallbacks(restartRunnable)
    try {
      speechRecognizer?.cancel()
    } catch (_: Throwable) {}
    listening = false
    if (!suppressEvent) {
      HandsFreeVoiceEvents.emit("recognizer-stopped")
    }
  }

  private fun ensureRecognizer(): SpeechRecognizer {
    val existing = speechRecognizer
    if (existing != null) return existing

    return SpeechRecognizer.createSpeechRecognizer(applicationContext).also { recognizer ->
      recognizer.setRecognitionListener(createRecognitionListener())
      speechRecognizer = recognizer
    }
  }

  private fun destroyRecognizer() {
    try {
      speechRecognizer?.destroy()
    } catch (_: Throwable) {
    } finally {
      speechRecognizer = null
      listening = false
    }
  }

  private fun createRecognitionListener(): RecognitionListener {
    return object : RecognitionListener {
      override fun onReadyForSpeech(params: Bundle?) {
        HandsFreeVoiceEvents.emit("ready-for-speech")
      }

      override fun onBeginningOfSpeech() {
        HandsFreeVoiceEvents.emit("speech-started")
      }

      override fun onRmsChanged(rmsdB: Float) = Unit
      override fun onBufferReceived(buffer: ByteArray?) = Unit

      override fun onEndOfSpeech() {
        HandsFreeVoiceEvents.emit("speech-ended")
      }

      override fun onError(error: Int) {
        listening = false
        val message = recognizerErrorMessage(error)

        if (suppressRecognizerEnd || !captureEnabled) {
          suppressRecognizerEnd = false
          return
        }

        HandsFreeVoiceEvents.emit("error") {
          it.putString("message", message)
          it.putInt("errorCode", error)
          it.putBoolean("recoverable", isRecoverableError(error))
        }

        if (!isRecoverableError(error)) {
          stopSelf()
          return
        }

        if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || error == SpeechRecognizer.ERROR_CLIENT) {
          destroyRecognizer()
        }
        scheduleRestart(if (message == "no-speech") 1500L else 1000L)
      }

      override fun onResults(results: Bundle?) {
        listening = false
        emitBestResult(results, callback = "results", isFinal = true)
        if (captureEnabled) {
          scheduleRestart(300L)
        }
      }

      override fun onSegmentResults(segmentResults: Bundle) {
        emitBestResult(segmentResults, callback = "segment-results", isFinal = true)
      }

      override fun onEndOfSegmentedSession() {
        listening = false
        if (captureEnabled) {
          scheduleRestart(300L)
        }
      }

      override fun onPartialResults(partialResults: Bundle?) {
        emitBestResult(partialResults, callback = "partial-results", isFinal = false)
      }

      override fun onEvent(eventType: Int, params: Bundle?) = Unit
    }
  }

  private fun emitBestResult(results: Bundle?, callback: String, isFinal: Boolean) {
    val candidates = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    val text = normalizeRecognizerText(candidates?.firstOrNull())
      ?: extractRecognitionPartsText(results)

    Log.i(
      TAG,
      "callback=$callback isFinal=$isFinal resultCount=${candidates?.size ?: 0} textLength=${text?.length ?: 0} ${recognitionBundleSummary(results)}"
    )

    if (text.isNullOrBlank()) {
      return
    }

    HandsFreeVoiceEvents.emit(if (isFinal) "result" else "partial-result") {
      it.putString("text", text)
      it.putBoolean("isFinal", isFinal)
      it.putString("callback", callback)
    }
  }

  private fun normalizeRecognizerText(text: String?): String? {
    val normalized = text
      ?.replace(Regex("\\s+"), " ")
      ?.replace(Regex("\\s+([,.!?;:])"), "$1")
      ?.trim()

    return normalized?.takeIf { it.isNotBlank() }
  }

  private fun extractRecognitionPartsText(results: Bundle?): String? {
    if (results == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return null
    }

    return try {
      val parts = results.getParcelableArrayList(
        SpeechRecognizer.RECOGNITION_PARTS,
        RecognitionPart::class.java,
      )
      normalizeRecognizerText(
        parts
          ?.mapNotNull { part -> part.formattedText ?: part.rawText }
          ?.joinToString(" ")
      )
    } catch (_: Throwable) {
      null
    }
  }

  private fun recognitionBundleSummary(results: Bundle?): String {
    if (results == null) return "bundleKeys=-"

    val keys = try {
      results.keySet().joinToString(",")
    } catch (_: Throwable) {
      "unreadable"
    }
    val confidenceCount = try {
      results.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)?.size ?: 0
    } catch (_: Throwable) {
      0
    }
    val recognitionPartsCount = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      try {
        results.getParcelableArrayList(
          SpeechRecognizer.RECOGNITION_PARTS,
          RecognitionPart::class.java,
        )?.size ?: 0
      } catch (_: Throwable) {
        0
      }
    } else {
      0
    }

    return "bundleKeys=$keys confidenceCount=$confidenceCount recognitionPartsCount=$recognitionPartsCount"
  }

  private fun scheduleRestart(delayMs: Long) {
    mainHandler.removeCallbacks(restartRunnable)
    mainHandler.postDelayed(restartRunnable, delayMs)
  }

  private fun pendingIntentFlags(): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }
  }

  private fun recognizerErrorMessage(error: Int): String {
    return when (error) {
      SpeechRecognizer.ERROR_AUDIO -> "audio"
      SpeechRecognizer.ERROR_CLIENT -> "client"
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "permission-denied"
      SpeechRecognizer.ERROR_NETWORK -> "network"
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "network-timeout"
      SpeechRecognizer.ERROR_NO_MATCH -> "no-speech"
      SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "recognizer-busy"
      SpeechRecognizer.ERROR_SERVER -> "server"
      SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "no-speech"
      else -> String.format(Locale.US, "speech-error-%d", error)
    }
  }

  private fun isRecoverableError(error: Int): Boolean {
    return error != SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS
  }

  companion object {
    private const val ACTION_START = "com.aj47.dotagents.handsfree.START"
    private const val ACTION_STOP = "com.aj47.dotagents.handsfree.STOP"
    private const val ACTION_SET_LISTENING = "com.aj47.dotagents.handsfree.SET_LISTENING"
    private const val EXTRA_LANGUAGE = "language"
    private const val EXTRA_LISTENING_ENABLED = "listeningEnabled"
    private const val DEFAULT_LANGUAGE = "en-US"
    private const val TAG = "DotAgentsHandsFree"
    private const val SEGMENT_COMPLETE_SILENCE_MS = 1800
    private const val SEGMENT_POSSIBLY_COMPLETE_SILENCE_MS = 1200
    private const val SEGMENT_SESSION_TIMEOUT_MS = 30000
    private const val LONG_SESSION_TIMEOUT_MS = 600000
    private const val NOTIFICATION_CHANNEL_ID = "dotagents_handsfree_voice"
    private const val NOTIFICATION_ID = 4701
    private const val ROUTE_REQUESTER = "service"

    @Volatile
    private var running = false

    @Volatile
    private var activeService: HandsFreeVoiceService? = null

    fun createStartIntent(context: Context, language: String, listeningEnabled: Boolean): Intent {
      return Intent(context, HandsFreeVoiceService::class.java).apply {
        action = ACTION_START
        putExtra(EXTRA_LANGUAGE, language)
        putExtra(EXTRA_LISTENING_ENABLED, listeningEnabled)
      }
    }

    fun createStopIntent(context: Context): Intent {
      return Intent(context, HandsFreeVoiceService::class.java).apply {
        action = ACTION_STOP
      }
    }

    fun createSetListeningIntent(context: Context, enabled: Boolean): Intent {
      return Intent(context, HandsFreeVoiceService::class.java).apply {
        action = ACTION_SET_LISTENING
        putExtra(EXTRA_LISTENING_ENABLED, enabled)
      }
    }

    fun isRunning(): Boolean = running

    fun setListeningEnabled(enabled: Boolean): Boolean {
      val service = activeService ?: return false
      service.setCaptureEnabled(enabled)
      return true
    }
  }
}
