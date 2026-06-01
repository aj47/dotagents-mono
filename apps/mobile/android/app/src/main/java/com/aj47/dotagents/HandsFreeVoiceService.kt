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
import android.media.AudioAttributes
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.RecognitionPart
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
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
  private var textToSpeech: TextToSpeech? = null
  private var textToSpeechReady = false
  private var textToSpeechInitializing = false
  private var pendingTtsRequest: TtsRequest? = null
  private var activeTtsUtteranceId: String? = null
  private var activeTtsRestoreListeningAfterDone = false
  private var activeTtsAllowBargeIn = false
  private var ttsSpeaking = false

  private val restartRunnable = Runnable {
    if (captureEnabled && (activeTtsUtteranceId == null || activeTtsAllowBargeIn)) {
      startListening()
    }
  }

  private data class TtsRequest(
    val utteranceId: String,
    val text: String,
    val language: String,
    val rate: Float,
    val pitch: Float,
    val voice: String?,
    val restoreListeningAfterDone: Boolean,
    val allowBargeIn: Boolean,
  )

  override fun onCreate() {
    super.onCreate()
    activeService = this
    running = true
    ensureNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    Log.i(TAG, "service onStartCommand action=${intent?.action ?: "-"} startId=$startId flags=$flags running=$running captureEnabled=$captureEnabled")
    when (intent?.action) {
      ACTION_STOP -> {
        Log.i(TAG, "service stop action received")
        stopSelf()
        return START_NOT_STICKY
      }
      ACTION_SET_LISTENING -> {
        val enabled = intent.getBooleanExtra(EXTRA_LISTENING_ENABLED, true)
        Log.i(TAG, "service set-listening action received enabled=$enabled")
        setCaptureEnabled(enabled)
        return START_NOT_STICKY
      }
      else -> {
        language = intent?.getStringExtra(EXTRA_LANGUAGE)?.takeIf { it.isNotBlank() } ?: DEFAULT_LANGUAGE
        captureEnabled = intent?.getBooleanExtra(EXTRA_LISTENING_ENABLED, true) ?: true
        Log.i(TAG, "service start action language=$language captureEnabled=$captureEnabled")
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
          HandsFreeVoiceEvents.emit("error") {
            it.putString("message", "permission-denied")
            it.putBoolean("recoverable", false)
          }
          stopSelf()
          return START_NOT_STICKY
        }
        startForegroundWithNotification()
        HandsFreeAudioRouter.acquire(this, SESSION_ROUTE_REQUESTER)
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
    stopTtsOnMain(emitStopped = false)
    shutdownTextToSpeech()
    HandsFreeAudioRouter.release(this, CAPTURE_ROUTE_REQUESTER)
    HandsFreeAudioRouter.release(this, SESSION_ROUTE_REQUESTER)
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
        Log.i(TAG, "service capture unchanged enabled=$enabled listening=$listening")
        return@post
      }

      captureEnabled = enabled
      Log.i(TAG, "service capture changed enabled=$captureEnabled listening=$listening")
      HandsFreeVoiceEvents.emit("capture-state") {
        it.putBoolean("listeningEnabled", captureEnabled)
      }

      if (captureEnabled && (activeTtsUtteranceId == null || activeTtsAllowBargeIn)) {
        startListening()
      } else {
        mainHandler.removeCallbacks(restartRunnable)
        stopListening()
        HandsFreeAudioRouter.release(this@HandsFreeVoiceService, CAPTURE_ROUTE_REQUESTER)
      }
    }
  }

  private fun startForegroundWithNotification() {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      Log.i(TAG, "service startForeground type=microphone sdk=${Build.VERSION.SDK_INT}")
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
    } else {
      Log.i(TAG, "service startForeground sdk=${Build.VERSION.SDK_INT}")
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
    if (!captureEnabled || listening || (activeTtsUtteranceId != null && !activeTtsAllowBargeIn)) {
      Log.i(TAG, "recognizer start skipped captureEnabled=$captureEnabled listening=$listening activeTts=${activeTtsUtteranceId != null} activeTtsAllowBargeIn=$activeTtsAllowBargeIn")
      return
    }

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
    HandsFreeAudioRouter.acquire(this, CAPTURE_ROUTE_REQUESTER)
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
    Log.i(TAG, "recognizer stop requested suppressEvent=$suppressEvent listening=$listening captureEnabled=$captureEnabled")
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

  fun speakTts(
    utteranceId: String,
    text: String,
    language: String,
    rate: Float,
    pitch: Float,
    voice: String?,
    restoreListeningAfterDone: Boolean,
    allowBargeIn: Boolean,
  ) {
    val request = TtsRequest(
      utteranceId = utteranceId,
      text = text,
      language = language.ifBlank { DEFAULT_LANGUAGE },
      rate = rate.coerceIn(MIN_TTS_RATE, MAX_TTS_RATE),
      pitch = pitch.coerceIn(MIN_TTS_PITCH, MAX_TTS_PITCH),
      voice = voice?.takeIf { it.isNotBlank() },
      restoreListeningAfterDone = restoreListeningAfterDone,
      allowBargeIn = allowBargeIn,
    )

    mainHandler.post {
      speakTtsOnMain(request)
    }
  }

  fun stopTts() {
    mainHandler.post {
      stopTtsOnMain(emitStopped = true)
    }
  }

  fun isTtsSpeaking(): Boolean = activeTtsUtteranceId != null || ttsSpeaking

  private fun speakTtsOnMain(request: TtsRequest) {
    Log.i(
      TAG,
      "tts speak requested utteranceId=${request.utteranceId} textLength=${request.text.length} language=${request.language} restoreListening=${request.restoreListeningAfterDone} allowBargeIn=${request.allowBargeIn} ready=$textToSpeechReady initializing=$textToSpeechInitializing",
    )

    stopTtsOnMain(emitStopped = true)
    prepareCaptureForTts(request)
    activeTtsUtteranceId = request.utteranceId
    activeTtsRestoreListeningAfterDone = request.restoreListeningAfterDone
    activeTtsAllowBargeIn = request.allowBargeIn
    ttsSpeaking = false

    val engine = ensureTextToSpeech()
    if (engine == null) {
      failTtsRequest(request, "tts-init-unavailable")
      return
    }

    if (!textToSpeechReady) {
      pendingTtsRequest = request
      HandsFreeVoiceEvents.emit("tts-loading") {
        it.putString("utteranceId", request.utteranceId)
        it.putInt("textLength", request.text.length)
      }
      return
    }

    startTtsRequest(request)
  }

  private fun prepareCaptureForTts(request: TtsRequest) {
    if (request.allowBargeIn) {
      mainHandler.removeCallbacks(restartRunnable)
      if (request.restoreListeningAfterDone && !captureEnabled) {
        captureEnabled = true
        HandsFreeVoiceEvents.emit("capture-state") {
          it.putBoolean("listeningEnabled", true)
        }
      }
      if (captureEnabled) {
        startListening()
      }
      activeTtsRestoreListeningAfterDone = request.restoreListeningAfterDone
      return
    }

    mainHandler.removeCallbacks(restartRunnable)
    stopListening()
    HandsFreeAudioRouter.release(this, CAPTURE_ROUTE_REQUESTER)
    HandsFreeAudioRouter.logCurrentRoute(this, "tts-prepare")

    if (captureEnabled) {
      captureEnabled = false
      HandsFreeVoiceEvents.emit("capture-state") {
        it.putBoolean("listeningEnabled", false)
      }
    }
    activeTtsRestoreListeningAfterDone = request.restoreListeningAfterDone
  }

  private fun ensureTextToSpeech(): TextToSpeech? {
    val existing = textToSpeech
    if (existing != null) return existing
    if (textToSpeechInitializing) return textToSpeech

    textToSpeechInitializing = true
    return try {
      TextToSpeech(applicationContext) { status ->
        mainHandler.post {
          textToSpeechInitializing = false
          if (status != TextToSpeech.SUCCESS) {
            textToSpeechReady = false
            val pending = pendingTtsRequest
            pendingTtsRequest = null
            Log.e(TAG, "tts init failed status=$status")
            if (pending != null) {
              failTtsRequest(pending, "tts-init-failed-$status")
            }
            return@post
          }

          textToSpeechReady = true
          configureTextToSpeechEngine()
          val pending = pendingTtsRequest
          pendingTtsRequest = null
          if (pending != null && activeTtsUtteranceId == pending.utteranceId) {
            startTtsRequest(pending)
          }
        }
      }.also { engine ->
        textToSpeech = engine
      }
    } catch (error: Throwable) {
      textToSpeechInitializing = false
      Log.e(TAG, "tts init threw", error)
      null
    }
  }

  private fun configureTextToSpeechEngine() {
    val engine = textToSpeech ?: return
    engine.setOnUtteranceProgressListener(createTtsProgressListener())
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      try {
        engine.setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build(),
        )
      } catch (error: Throwable) {
        Log.w(TAG, "tts audio attributes failed", error)
      }
    }
  }

  private fun startTtsRequest(request: TtsRequest) {
    val engine = textToSpeech
    if (engine == null || !textToSpeechReady) {
      pendingTtsRequest = request
      return
    }

    try {
      val locale = Locale.forLanguageTag(request.language)
      val languageResult = engine.setLanguage(locale)
      if (
        languageResult == TextToSpeech.LANG_MISSING_DATA
        || languageResult == TextToSpeech.LANG_NOT_SUPPORTED
      ) {
        Log.w(TAG, "tts language unsupported language=${request.language} result=$languageResult")
      }

      request.voice?.let { voiceName ->
        val selectedVoice = try {
          engine.voices?.firstOrNull { it.name == voiceName }
        } catch (_: Throwable) {
          null
        }
        if (selectedVoice != null) {
          engine.voice = selectedVoice
        } else {
          Log.w(TAG, "tts voice unavailable voice=$voiceName")
        }
      }

      engine.setSpeechRate(request.rate)
      engine.setPitch(request.pitch)

      Log.i(
        TAG,
        "tts dispatching utteranceId=${request.utteranceId} textLength=${request.text.length} language=${request.language} rate=${request.rate} pitch=${request.pitch} voice=${request.voice ?: "default"}",
      )
      HandsFreeAudioRouter.logCurrentRoute(this, "tts-dispatch")

      val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        engine.speak(request.text, TextToSpeech.QUEUE_FLUSH, null, request.utteranceId)
      } else {
        @Suppress("DEPRECATION")
        engine.speak(request.text, TextToSpeech.QUEUE_FLUSH, null)
      }

      if (result != TextToSpeech.SUCCESS) {
        failTtsRequest(request, "tts-speak-failed-$result")
      } else {
        Log.i(TAG, "tts speak dispatched utteranceId=${request.utteranceId}")
      }
    } catch (error: Throwable) {
      Log.e(TAG, "tts speak failed utteranceId=${request.utteranceId}", error)
      failTtsRequest(request, error.message ?: "tts-speak-failed")
    }
  }

  private fun createTtsProgressListener(): UtteranceProgressListener {
    return object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String?) {
        mainHandler.post {
          if (utteranceId == null || activeTtsUtteranceId != utteranceId) return@post
          ttsSpeaking = true
          Log.i(TAG, "tts started utteranceId=$utteranceId")
          HandsFreeVoiceEvents.emit("tts-started") {
            it.putString("utteranceId", utteranceId)
          }
        }
      }

      override fun onDone(utteranceId: String?) {
        mainHandler.post {
          if (utteranceId != null) {
            completeTts(utteranceId, "tts-done")
          }
        }
      }

      @Deprecated("Deprecated in Java")
      override fun onError(utteranceId: String?) {
        mainHandler.post {
          if (utteranceId != null) {
            completeTts(utteranceId, "tts-error", "tts-error")
          }
        }
      }

      override fun onError(utteranceId: String?, errorCode: Int) {
        mainHandler.post {
          if (utteranceId != null) {
            completeTts(utteranceId, "tts-error", "tts-error-$errorCode", errorCode)
          }
        }
      }

      override fun onStop(utteranceId: String?, interrupted: Boolean) {
        mainHandler.post {
          if (utteranceId != null) {
            completeTts(utteranceId, "tts-stopped", if (interrupted) "interrupted" else "stopped")
          }
        }
      }
    }
  }

  private fun failTtsRequest(request: TtsRequest, message: String) {
    if (activeTtsUtteranceId != request.utteranceId) return
    completeTts(request.utteranceId, "tts-error", message)
  }

  private fun completeTts(
    utteranceId: String,
    eventType: String,
    message: String? = null,
    errorCode: Int? = null,
  ) {
    if (activeTtsUtteranceId != utteranceId) {
      return
    }

    val shouldRestoreListening = activeTtsRestoreListeningAfterDone && eventType != "tts-stopped"
    activeTtsUtteranceId = null
    activeTtsRestoreListeningAfterDone = false
    activeTtsAllowBargeIn = false
    pendingTtsRequest = null
    ttsSpeaking = false

    Log.i(
      TAG,
      "tts completed utteranceId=$utteranceId eventType=$eventType restoreListening=$shouldRestoreListening message=${message ?: "-"} errorCode=${errorCode ?: "-"}",
    )
    HandsFreeAudioRouter.logCurrentRoute(this, "tts-complete-$eventType")
    HandsFreeVoiceEvents.emit(eventType) {
      it.putString("utteranceId", utteranceId)
      message?.let { value -> it.putString("message", value) }
      errorCode?.let { value -> it.putInt("errorCode", value) }
    }

    if (shouldRestoreListening || captureEnabled) {
      if (shouldRestoreListening) {
        captureEnabled = true
        HandsFreeVoiceEvents.emit("capture-state") {
          it.putBoolean("listeningEnabled", true)
        }
      }
      startListening()
    }
  }

  private fun stopTtsOnMain(emitStopped: Boolean) {
    val utteranceId = activeTtsUtteranceId
    val hadActiveTts = utteranceId != null || pendingTtsRequest != null || ttsSpeaking
    activeTtsUtteranceId = null
    activeTtsRestoreListeningAfterDone = false
    activeTtsAllowBargeIn = false
    pendingTtsRequest = null
    ttsSpeaking = false
    try {
      textToSpeech?.stop()
    } catch (_: Throwable) {
    }
    if (emitStopped && utteranceId != null) {
      Log.i(TAG, "tts stopped utteranceId=$utteranceId")
      HandsFreeVoiceEvents.emit("tts-stopped") {
        it.putString("utteranceId", utteranceId)
        it.putString("message", "stopped")
      }
    } else if (emitStopped && hadActiveTts) {
      Log.i(TAG, "tts stopped pending")
    }
  }

  private fun shutdownTextToSpeech() {
    try {
      textToSpeech?.shutdown()
    } catch (_: Throwable) {
    } finally {
      textToSpeech = null
      textToSpeechReady = false
      textToSpeechInitializing = false
      pendingTtsRequest = null
      activeTtsUtteranceId = null
      activeTtsRestoreListeningAfterDone = false
      activeTtsAllowBargeIn = false
      ttsSpeaking = false
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
    private const val SESSION_ROUTE_REQUESTER = "service-session"
    private const val CAPTURE_ROUTE_REQUESTER = "service-capture"
    private const val MIN_TTS_RATE = 0.1f
    private const val MAX_TTS_RATE = 3.0f
    private const val MIN_TTS_PITCH = 0.1f
    private const val MAX_TTS_PITCH = 3.0f

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

    fun speakTts(
      utteranceId: String,
      text: String,
      language: String,
      rate: Float,
      pitch: Float,
      voice: String?,
      restoreListeningAfterDone: Boolean,
      allowBargeIn: Boolean,
    ): Boolean {
      val service = activeService ?: return false
      service.speakTts(
        utteranceId = utteranceId,
        text = text,
        language = language,
        rate = rate,
        pitch = pitch,
        voice = voice,
        restoreListeningAfterDone = restoreListeningAfterDone,
        allowBargeIn = allowBargeIn,
      )
      return true
    }

    fun stopTts(): Boolean {
      val service = activeService ?: return false
      service.stopTts()
      return true
    }

    fun isTtsSpeaking(): Boolean {
      return activeService?.isTtsSpeaking() ?: false
    }
  }
}
