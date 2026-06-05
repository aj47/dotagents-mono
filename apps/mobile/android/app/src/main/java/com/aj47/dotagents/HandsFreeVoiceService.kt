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
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.SystemClock
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
  private var consecutiveRecognizerErrors = 0
  private var activeTtsAudioPlayback: TtsAudioPlayback? = null
  private var transcriptDebounceMs = DEFAULT_TRANSCRIPT_DEBOUNCE_MS
  private var pendingDebouncedResultText: String? = null
  private var pendingDebouncedResultCallback: String? = null
  private var consecutiveEmptyFinalResults = 0
  private var standardRecognizerModeUntilElapsed = 0L
  private var recognizerSessionMode = "standard"
  private var currentRecognizerSessionHadSpeech = false
  private var pendingDebouncedResultHeld = false
  private val activeCuePlayers = mutableListOf<CuePlayback>()

  private val restartRunnable = Runnable {
    if (captureEnabled && (activeTtsUtteranceId == null || activeTtsAllowBargeIn)) {
      startListening()
    }
  }

  private val debouncedResultRunnable = Runnable {
    val text = pendingDebouncedResultText?.takeIf { it.isNotBlank() } ?: return@Runnable
    val callback = pendingDebouncedResultCallback ?: "native-debounce"
    pendingDebouncedResultText = null
    pendingDebouncedResultCallback = null
    pendingDebouncedResultHeld = false
    Log.i(TAG, "transcript debounce elapsed textLength=${text.length} debounceMs=$transcriptDebounceMs callback=$callback")
    HandsFreeVoiceEvents.emit("debounced-result") {
      it.putString("text", text)
      it.putBoolean("isFinal", true)
      it.putString("callback", callback)
      it.putInt("debounceMs", transcriptDebounceMs.toInt())
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

  private data class TtsAudioRequest(
    val utteranceId: String,
    val filePath: String,
    val restoreListeningAfterDone: Boolean,
    val allowBargeIn: Boolean,
    val deleteFileOnRelease: Boolean,
  )

  private class TtsAudioPlayback(
    val utteranceId: String,
    val player: MediaPlayer,
    val filePath: String?,
    val deleteFileOnRelease: Boolean,
  ) {
    var prepareTimeout: Runnable? = null
  }

  private class CuePlayback(
    val cueId: String,
    val player: MediaPlayer,
    val onStartResult: ((Boolean) -> Unit)?,
  ) {
    var startResultDelivered = false
    var prepareTimeout: Runnable? = null
  }

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
        transcriptDebounceMs = intent
          ?.getLongExtra(EXTRA_TRANSCRIPT_DEBOUNCE_MS, DEFAULT_TRANSCRIPT_DEBOUNCE_MS)
          ?.coerceAtLeast(0L)
          ?: DEFAULT_TRANSCRIPT_DEBOUNCE_MS
        Log.i(TAG, "service start action language=$language captureEnabled=$captureEnabled transcriptDebounceMs=$transcriptDebounceMs")
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
    cancelDebouncedResult()
    stopListening(suppressEvent = true)
    stopTtsOnMain(emitStopped = false)
    shutdownTextToSpeech()
    releaseAllCuePlayers()
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
      if (captureEnabled) {
        consecutiveRecognizerErrors = 0
      }
      Log.i(TAG, "service capture changed enabled=$captureEnabled listening=$listening")
      HandsFreeVoiceEvents.emit("capture-state") {
        it.putBoolean("listeningEnabled", captureEnabled)
      }

      if (captureEnabled && (activeTtsUtteranceId == null || activeTtsAllowBargeIn)) {
        startListening()
      } else {
        cancelDebouncedResult()
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
    if (listening) {
      HandsFreeAudioRouter.acquire(this, CAPTURE_ROUTE_REQUESTER)
      Log.i(TAG, "recognizer start skipped captureEnabled=$captureEnabled listening=$listening activeTts=${activeTtsUtteranceId != null} activeTtsAllowBargeIn=$activeTtsAllowBargeIn")
      return
    }

    if (!captureEnabled || (activeTtsUtteranceId != null && !activeTtsAllowBargeIn)) {
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
    val useSegmentedSession = shouldUseSegmentedRecognizerSession()
    recognizerSessionMode = if (useSegmentedSession) "segmented-minimum" else "standard-silence"
    currentRecognizerSessionHadSpeech = false

    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language)
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
      putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, packageName)
      if (useSegmentedSession) {
        val segmentedSessionMode = RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS
        // EXTRA_SEGMENTED_SESSION expects the name of the timing extra that controls segmentation.
        putExtra(RecognizerIntent.EXTRA_SEGMENTED_SESSION, segmentedSessionMode)
        putExtra(segmentedSessionMode, SEGMENT_SESSION_TIMEOUT_MS)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, SEGMENT_COMPLETE_SILENCE_MS)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, SEGMENT_POSSIBLY_COMPLETE_SILENCE_MS)
      } else {
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, STANDARD_COMPLETE_SILENCE_MS)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, STANDARD_MINIMUM_LENGTH_MS)
        putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, STANDARD_POSSIBLY_COMPLETE_SILENCE_MS)
      }
    }

    try {
      suppressRecognizerEnd = false
      listening = true
      recognizer.startListening(intent)
      HandsFreeVoiceEvents.emit("recognizer-started") {
        it.putString("language", language)
        it.putString("sessionMode", recognizerSessionMode)
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

  fun playTtsAudio(
    utteranceId: String,
    filePath: String,
    restoreListeningAfterDone: Boolean,
    allowBargeIn: Boolean,
    deleteFileOnRelease: Boolean,
  ) {
    val request = TtsAudioRequest(
      utteranceId = utteranceId,
      filePath = filePath,
      restoreListeningAfterDone = restoreListeningAfterDone,
      allowBargeIn = allowBargeIn,
      deleteFileOnRelease = deleteFileOnRelease,
    )
    mainHandler.post {
      playTtsAudioOnMain(request)
    }
  }

  fun playCue(cueId: String, filePath: String, onStartResult: ((Boolean) -> Unit)?) {
    mainHandler.post {
      playCueOnMain(cueId, filePath, onStartResult)
    }
  }

  fun isTtsSpeaking(): Boolean = activeTtsUtteranceId != null || ttsSpeaking

  private fun speakTtsOnMain(request: TtsRequest) {
    Log.i(
      TAG,
      "tts speak requested utteranceId=${request.utteranceId} textLength=${request.text.length} language=${request.language} restoreListening=${request.restoreListeningAfterDone} allowBargeIn=${request.allowBargeIn} ready=$textToSpeechReady initializing=$textToSpeechInitializing",
    )

    stopTtsOnMain(emitStopped = true)
    prepareCaptureForTts(
      restoreListeningAfterDone = request.restoreListeningAfterDone,
      allowBargeIn = request.allowBargeIn,
    )
    HandsFreeAudioRouter.acquire(this, TTS_ROUTE_REQUESTER)
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

  private fun prepareCaptureForTts(
    restoreListeningAfterDone: Boolean,
    allowBargeIn: Boolean,
  ) {
    if (allowBargeIn) {
      mainHandler.removeCallbacks(restartRunnable)
      if (restoreListeningAfterDone && !captureEnabled) {
        captureEnabled = true
        HandsFreeVoiceEvents.emit("capture-state") {
          it.putBoolean("listeningEnabled", true)
        }
      }
      HandsFreeAudioRouter.acquire(this, CAPTURE_ROUTE_REQUESTER)
      if (captureEnabled) {
        startListening()
      }
      activeTtsRestoreListeningAfterDone = restoreListeningAfterDone
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
    activeTtsRestoreListeningAfterDone = restoreListeningAfterDone
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
        val usage = if (HandsFreeAudioRouter.isCommunicationRoutingActive()) {
          AudioAttributes.USAGE_VOICE_COMMUNICATION
        } else {
          AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY
        }
        engine.setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(usage)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build(),
        )
        Log.i(TAG, "tts audio attributes configured usage=$usage")
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

      request.voice?.let { requestedVoice ->
        val selectedVoice = try {
          selectTtsVoice(engine.voices, requestedVoice)
        } catch (_: Throwable) {
          null
        }
        if (selectedVoice != null) {
          engine.voice = selectedVoice
          Log.i(TAG, "tts voice selected requested=$requestedVoice selected=${selectedVoice.name} locale=${selectedVoice.locale}")
        } else {
          Log.w(TAG, "tts voice unavailable requested=$requestedVoice available=${availableTtsVoiceSummary(engine)}")
        }
      }

      configureTextToSpeechEngine()
      engine.setSpeechRate(request.rate)
      engine.setPitch(request.pitch)

      Log.i(
        TAG,
        "tts dispatching utteranceId=${request.utteranceId} textLength=${request.text.length} language=${request.language} rate=${request.rate} pitch=${request.pitch} voice=${request.voice ?: "default"}",
      )
      HandsFreeAudioRouter.logCurrentRoute(this, "tts-dispatch")
      HandsFreeVoiceEvents.emit("tts-native-fallback") {
        it.putString("utteranceId", request.utteranceId)
        it.putString("language", request.language)
        request.voice?.let { value -> it.putString("voice", value) }
      }

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

  private fun selectTtsVoice(voices: Set<android.speech.tts.Voice>?, requestedVoice: String): android.speech.tts.Voice? {
    if (voices.isNullOrEmpty()) return null
    val normalizedRequested = normalizeTtsVoiceId(requestedVoice)
    return voices.firstOrNull { it.name == requestedVoice }
      ?: voices.firstOrNull { normalizeTtsVoiceId(it.name) == normalizedRequested }
      ?: voices.firstOrNull { requestedVoice.endsWith(it.name) }
      ?: voices.firstOrNull { it.name.endsWith(normalizedRequested) }
  }

  private fun normalizeTtsVoiceId(value: String): String {
    return value.substringAfterLast(':')
      .substringAfterLast('/')
      .trim()
      .lowercase(Locale.US)
  }

  private fun availableTtsVoiceSummary(engine: TextToSpeech): String {
    return try {
      engine.voices
        ?.take(12)
        ?.joinToString("|") { voice -> "${voice.name}:${voice.locale}" }
        ?: "unavailable"
    } catch (_: Throwable) {
      "unreadable"
    }
  }

  private fun failTtsRequest(request: TtsRequest, message: String) {
    if (activeTtsUtteranceId != request.utteranceId) return
    completeTts(request.utteranceId, "tts-error", message)
  }

  private fun playTtsAudioOnMain(request: TtsAudioRequest) {
    Log.i(
      TAG,
      "tts audio playback requested utteranceId=${request.utteranceId} filePath=${request.filePath} restoreListening=${request.restoreListeningAfterDone} allowBargeIn=${request.allowBargeIn}",
    )

    if (!running || activeService !== this) {
      HandsFreeVoiceEvents.emit("tts-error") {
        it.putString("utteranceId", request.utteranceId)
        it.putString("message", "service-unavailable")
      }
      return
    }

    stopTtsOnMain(emitStopped = true)
    prepareCaptureForTts(
      restoreListeningAfterDone = request.restoreListeningAfterDone,
      allowBargeIn = request.allowBargeIn,
    )
    HandsFreeAudioRouter.acquire(this, TTS_ROUTE_REQUESTER)
    activeTtsUtteranceId = request.utteranceId
    activeTtsRestoreListeningAfterDone = request.restoreListeningAfterDone
    activeTtsAllowBargeIn = request.allowBargeIn
    ttsSpeaking = false

    val uri = parseAudioUri(request.filePath)
    if (uri == null) {
      completeTts(request.utteranceId, "tts-error", "invalid-audio-path")
      return
    }

    HandsFreeVoiceEvents.emit("tts-loading") {
      it.putString("utteranceId", request.utteranceId)
      it.putInt("textLength", 0)
    }

    val player = MediaPlayer()
    val playback = TtsAudioPlayback(
      utteranceId = request.utteranceId,
      player = player,
      filePath = request.filePath,
      deleteFileOnRelease = request.deleteFileOnRelease,
    )

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        val usage = if (HandsFreeAudioRouter.isCommunicationRoutingActive()) {
          AudioAttributes.USAGE_VOICE_COMMUNICATION
        } else {
          AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY
        }
        player.setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(usage)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build(),
        )
        Log.i(TAG, "tts audio playback attributes configured utteranceId=${request.utteranceId} usage=$usage")
      }
      player.setDataSource(applicationContext, uri)
      player.setOnPreparedListener { prepared ->
        playback.prepareTimeout?.let { mainHandler.removeCallbacks(it) }
        playback.prepareTimeout = null
        try {
          if (
            activeTtsAudioPlayback !== playback
            || activeTtsUtteranceId != request.utteranceId
            || !running
            || activeService !== this
          ) {
            releaseTtsAudioPlayback(playback)
            return@setOnPreparedListener
          }
          prepared.start()
          ttsSpeaking = true
          Log.i(TAG, "tts audio playback started utteranceId=${request.utteranceId} uri=$uri")
          HandsFreeVoiceEvents.emit("tts-started") {
            it.putString("utteranceId", request.utteranceId)
          }
        } catch (error: Throwable) {
          Log.w(TAG, "tts audio playback start failed utteranceId=${request.utteranceId}", error)
          releaseTtsAudioPlayback(playback)
          completeTts(request.utteranceId, "tts-error", error.message ?: "audio-start-failed")
        }
      }
      player.setOnCompletionListener {
        Log.i(TAG, "tts audio playback completed utteranceId=${request.utteranceId}")
        releaseTtsAudioPlayback(playback)
        completeTts(request.utteranceId, "tts-done")
      }
      player.setOnErrorListener { _, what, extra ->
        Log.w(TAG, "tts audio playback error utteranceId=${request.utteranceId} what=$what extra=$extra")
        releaseTtsAudioPlayback(playback)
        completeTts(request.utteranceId, "tts-error", "audio-error-$what", what)
        true
      }
      activeTtsAudioPlayback = playback
      playback.prepareTimeout = Runnable {
        if (activeTtsAudioPlayback !== playback || activeTtsUtteranceId != request.utteranceId) {
          return@Runnable
        }
        Log.w(TAG, "tts audio playback prepare timed out utteranceId=${request.utteranceId}")
        releaseTtsAudioPlayback(playback)
        completeTts(request.utteranceId, "tts-error", "audio-prepare-timeout")
      }
      mainHandler.postDelayed(playback.prepareTimeout!!, TTS_AUDIO_PREPARE_TIMEOUT_MS)
      player.prepareAsync()
    } catch (error: Throwable) {
      Log.w(TAG, "tts audio playback failed utteranceId=${request.utteranceId}", error)
      releaseTtsAudioPlayback(playback)
      completeTts(request.utteranceId, "tts-error", error.message ?: "audio-playback-failed")
    }
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
    activeTtsAudioPlayback
      ?.takeIf { it.utteranceId == utteranceId }
      ?.let { releaseTtsAudioPlayback(it) }
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
    HandsFreeAudioRouter.release(this, TTS_ROUTE_REQUESTER)
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
    activeTtsAudioPlayback?.let { releaseTtsAudioPlayback(it) }
    activeTtsUtteranceId = null
    activeTtsRestoreListeningAfterDone = false
    activeTtsAllowBargeIn = false
    pendingTtsRequest = null
    ttsSpeaking = false
    try {
      textToSpeech?.stop()
    } catch (_: Throwable) {
    }
    if (hadActiveTts) {
      HandsFreeAudioRouter.release(this, TTS_ROUTE_REQUESTER)
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
      activeTtsAudioPlayback?.let { releaseTtsAudioPlayback(it) }
      ttsSpeaking = false
      HandsFreeAudioRouter.release(this, TTS_ROUTE_REQUESTER)
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
        consecutiveRecognizerErrors = 0
        HandsFreeVoiceEvents.emit("ready-for-speech")
      }

      override fun onBeginningOfSpeech() {
        currentRecognizerSessionHadSpeech = true
        holdDebouncedResult("speech-started")
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

        if (
          error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY
          || error == SpeechRecognizer.ERROR_CLIENT
          || message == "server-disconnected"
        ) {
          destroyRecognizer()
        }
        if (message == "no-speech") {
          noteEmptyFinalRecognition("error-no-speech")
          settlePendingDebouncedResultAfterNoSpeech()
        }
        currentRecognizerSessionHadSpeech = false
        consecutiveRecognizerErrors += 1
        val restartDelay = when {
          message == "no-speech" -> 1500L
          message == "server-disconnected" -> (2500L + (consecutiveRecognizerErrors - 1).coerceAtMost(8) * 500L)
          consecutiveRecognizerErrors >= 3 -> 3000L
          else -> 1000L
        }
        Log.i(TAG, "recognizer recoverable error message=$message consecutive=$consecutiveRecognizerErrors restartDelayMs=$restartDelay")
        scheduleRestart(restartDelay)
      }

      override fun onResults(results: Bundle?) {
        listening = false
        consecutiveRecognizerErrors = 0
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

  private fun emitBestResult(results: Bundle?, callback: String, isFinal: Boolean): Boolean {
    val candidates = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
    val text = normalizeRecognizerText(candidates?.firstOrNull())
      ?: extractRecognitionPartsText(results)

    Log.i(
      TAG,
      "callback=$callback isFinal=$isFinal resultCount=${candidates?.size ?: 0} textLength=${text?.length ?: 0} ${recognitionBundleSummary(results)}"
    )

    if (text.isNullOrBlank()) {
      if (isFinal) {
        noteEmptyFinalRecognition("empty-$callback")
      }
      return false
    }

    consecutiveEmptyFinalResults = 0
    scheduleDebouncedResult(text, callback)
    HandsFreeVoiceEvents.emit(if (isFinal) "result" else "partial-result") {
      it.putString("text", text)
      it.putBoolean("isFinal", isFinal)
      it.putString("callback", callback)
    }
    return true
  }

  private fun injectRecognitionResultForTest(text: String, isFinal: Boolean, callback: String) {
    if (!BuildConfig.DEBUG) return

    val normalized = normalizeRecognizerText(text) ?: return
    Log.i(TAG, "test transcript inject isFinal=$isFinal callback=$callback textLength=${normalized.length}")

    if (isFinal) {
      suppressRecognizerEnd = true
      try {
        speechRecognizer?.cancel()
      } catch (_: Throwable) {
      }
      listening = false
      consecutiveRecognizerErrors = 0
    }

    scheduleDebouncedResult(normalized, callback)
    HandsFreeVoiceEvents.emit(if (isFinal) "result" else "partial-result") {
      it.putString("text", normalized)
      it.putBoolean("isFinal", isFinal)
      it.putString("callback", callback)
    }

    if (isFinal && captureEnabled) {
      scheduleRestart(300L)
    }
  }

  private fun scheduleDebouncedResult(text: String, callback: String) {
    val mergedText = mergeRecognizerSegments(pendingDebouncedResultText, text)
    pendingDebouncedResultText = mergedText
    pendingDebouncedResultCallback = callback
    pendingDebouncedResultHeld = false
    mainHandler.removeCallbacks(debouncedResultRunnable)
    Log.i(TAG, "transcript debounce scheduled textLength=${mergedText.length} debounceMs=$transcriptDebounceMs callback=$callback incomingTextLength=${text.length}")
    mainHandler.postDelayed(debouncedResultRunnable, transcriptDebounceMs)
  }

  private fun cancelDebouncedResult() {
    pendingDebouncedResultText = null
    pendingDebouncedResultCallback = null
    pendingDebouncedResultHeld = false
    mainHandler.removeCallbacks(debouncedResultRunnable)
  }

  private fun holdDebouncedResult(reason: String) {
    val text = pendingDebouncedResultText?.takeIf { it.isNotBlank() } ?: return
    mainHandler.removeCallbacks(debouncedResultRunnable)
    pendingDebouncedResultHeld = true
    Log.i(TAG, "transcript debounce held reason=$reason textLength=${text.length} debounceMs=$transcriptDebounceMs")
  }

  private fun settlePendingDebouncedResultAfterNoSpeech() {
    if (currentRecognizerSessionHadSpeech || pendingDebouncedResultHeld) {
      reschedulePendingDebouncedResult("no-speech-after-speech")
      return
    }

    val text = pendingDebouncedResultText?.takeIf { it.isNotBlank() } ?: return
    Log.i(TAG, "transcript debounce preserved reason=no-speech textLength=${text.length} debounceMs=$transcriptDebounceMs")
  }

  private fun reschedulePendingDebouncedResult(reason: String) {
    val text = pendingDebouncedResultText?.takeIf { it.isNotBlank() } ?: return
    mainHandler.removeCallbacks(debouncedResultRunnable)
    pendingDebouncedResultHeld = false
    Log.i(TAG, "transcript debounce rescheduled reason=$reason textLength=${text.length} debounceMs=$transcriptDebounceMs")
    mainHandler.postDelayed(debouncedResultRunnable, transcriptDebounceMs)
  }

  private fun normalizeRecognizerText(text: String?): String? {
    val normalized = text
      ?.replace(Regex("\\s+"), " ")
      ?.replace(Regex("\\s+([,.!?;:])"), "$1")
      ?.trim()

    return normalized?.takeIf { it.isNotBlank() }
  }

  private fun mergeRecognizerSegments(existing: String?, next: String): String {
    val current = normalizeRecognizerText(existing)
    val incoming = normalizeRecognizerText(next) ?: return current ?: ""
    if (current == null) return incoming
    if (current == incoming) return current
    if (incoming.startsWith(current, ignoreCase = true)) return incoming
    if (current.endsWith(incoming, ignoreCase = true)) return current

    val currentWords = current.split(" ")
    val incomingWords = incoming.split(" ")
    val maxOverlap = minOf(currentWords.size, incomingWords.size)
    for (overlap in maxOverlap downTo 1) {
      val currentSuffix = currentWords.takeLast(overlap).joinToString(" ")
      val incomingPrefix = incomingWords.take(overlap).joinToString(" ")
      if (currentSuffix.equals(incomingPrefix, ignoreCase = true)) {
        return (currentWords + incomingWords.drop(overlap)).joinToString(" ")
      }
    }
    return "$current $incoming"
  }

  private fun shouldUseSegmentedRecognizerSession(): Boolean {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      SystemClock.elapsedRealtime() >= standardRecognizerModeUntilElapsed
  }

  private fun noteEmptyFinalRecognition(reason: String) {
    if (recognizerSessionMode != "segmented-minimum") return
    consecutiveEmptyFinalResults += 1
    Log.i(TAG, "recognizer empty final reason=$reason sessionMode=$recognizerSessionMode consecutive=$consecutiveEmptyFinalResults")
    if (consecutiveEmptyFinalResults < EMPTY_SEGMENT_FALLBACK_THRESHOLD) return

    consecutiveEmptyFinalResults = 0
    standardRecognizerModeUntilElapsed = SystemClock.elapsedRealtime() + STANDARD_RECOGNIZER_FALLBACK_MS
    Log.i(TAG, "recognizer switching to standard session reason=$reason cooldownMs=$STANDARD_RECOGNIZER_FALLBACK_MS")
    try {
      suppressRecognizerEnd = true
      speechRecognizer?.cancel()
    } catch (_: Throwable) {
    } finally {
      destroyRecognizer()
      if (captureEnabled) {
        scheduleRestart(300L)
      }
    }
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
      11 -> "server-disconnected"
      else -> String.format(Locale.US, "speech-error-%d", error)
    }
  }

  private fun isRecoverableError(error: Int): Boolean {
    return error != SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS
  }

  private fun playCueOnMain(
    cueId: String,
    filePath: String,
    onStartResult: ((Boolean) -> Unit)?,
  ) {
    if (!running || activeService !== this) {
      onStartResult?.invoke(false)
      return
    }

    val uri = parseCueUri(filePath)
    if (uri == null) {
      Log.w(TAG, "cue uri unparseable cueId=$cueId path=$filePath")
      HandsFreeVoiceEvents.emit("cue-error") {
        it.putString("cueId", cueId)
        it.putString("message", "invalid-path")
      }
      onStartResult?.invoke(false)
      return
    }

    val player = MediaPlayer()
    val playback = CuePlayback(cueId, player, onStartResult)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        val usage = if (HandsFreeAudioRouter.isCommunicationRoutingActive()) {
          AudioAttributes.USAGE_VOICE_COMMUNICATION
        } else {
          AudioAttributes.USAGE_ASSISTANCE_SONIFICATION
        }
        player.setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(usage)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
        )
        Log.i(TAG, "cue audio attributes configured cueId=$cueId usage=$usage")
      }
      player.setDataSource(applicationContext, uri)
      player.setOnPreparedListener { prepared ->
        try {
          if (!running || activeService !== this || !activeCuePlayers.contains(playback)) {
            deliverCueStartResult(playback, false)
            return@setOnPreparedListener
          }
          prepared.start()
          Log.i(TAG, "cue played cueId=$cueId uri=$uri")
          HandsFreeVoiceEvents.emit("cue-played") {
            it.putString("cueId", cueId)
          }
          deliverCueStartResult(playback, true)
        } catch (error: Throwable) {
          Log.w(TAG, "cue start failed cueId=$cueId", error)
          releaseCuePlayer(playback)
          HandsFreeVoiceEvents.emit("cue-error") {
            it.putString("cueId", cueId)
            it.putString("message", error.message ?: "cue-start-failed")
          }
          deliverCueStartResult(playback, false)
        }
      }
      player.setOnCompletionListener { releaseCuePlayer(playback) }
      player.setOnErrorListener { _, what, extra ->
        Log.w(TAG, "cue error cueId=$cueId what=$what extra=$extra")
        releaseCuePlayer(playback)
        HandsFreeVoiceEvents.emit("cue-error") {
          it.putString("cueId", cueId)
          it.putInt("errorCode", what)
        }
        deliverCueStartResult(playback, false)
        true
      }
      activeCuePlayers.add(playback)
      playback.prepareTimeout = Runnable {
        if (!activeCuePlayers.contains(playback) || playback.startResultDelivered) {
          return@Runnable
        }
        Log.w(TAG, "cue prepare timed out cueId=$cueId")
        releaseCuePlayer(playback)
        HandsFreeVoiceEvents.emit("cue-error") {
          it.putString("cueId", cueId)
          it.putString("message", "prepare-timeout")
        }
        deliverCueStartResult(playback, false)
      }
      mainHandler.postDelayed(playback.prepareTimeout!!, CUE_PREPARE_TIMEOUT_MS)
      player.prepareAsync()
    } catch (error: Throwable) {
      Log.w(TAG, "cue playback failed cueId=$cueId", error)
      activeCuePlayers.remove(playback)
      try { player.release() } catch (_: Throwable) {}
      HandsFreeVoiceEvents.emit("cue-error") {
        it.putString("cueId", cueId)
        it.putString("message", error.message ?: "cue-failed")
      }
      deliverCueStartResult(playback, false)
    }
  }

  private fun parseCueUri(filePath: String): Uri? {
    return parseAudioUri(filePath)
  }

  private fun parseAudioUri(filePath: String): Uri? {
    return try {
      val trimmed = filePath.trim()
      if (trimmed.isEmpty()) return null
      if (trimmed.startsWith("file://") || trimmed.startsWith("content://")) {
        Uri.parse(trimmed)
      } else {
        Uri.fromFile(java.io.File(trimmed))
      }
    } catch (_: Throwable) {
      null
    }
  }

  private fun releaseTtsAudioPlayback(playback: TtsAudioPlayback) {
    if (activeTtsAudioPlayback === playback) {
      activeTtsAudioPlayback = null
    }
    playback.prepareTimeout?.let { mainHandler.removeCallbacks(it) }
    playback.prepareTimeout = null
    try { playback.player.release() } catch (_: Throwable) {}
    if (playback.deleteFileOnRelease) {
      deleteAudioFile(playback.filePath)
    }
  }

  private fun deleteAudioFile(filePath: String?) {
    if (filePath.isNullOrBlank()) return
    try {
      val uri = parseAudioUri(filePath)
      val path = when {
        uri?.scheme == "file" -> uri.path
        uri?.scheme == null -> filePath
        else -> null
      }
      if (!path.isNullOrBlank()) {
        java.io.File(path).delete()
      }
    } catch (error: Throwable) {
      Log.w(TAG, "tts audio file delete failed path=$filePath", error)
    }
  }

  private fun releaseCuePlayer(playback: CuePlayback) {
    activeCuePlayers.remove(playback)
    try { playback.player.release() } catch (_: Throwable) {}
  }

  private fun releaseAllCuePlayers() {
    val snapshot = activeCuePlayers.toList()
    activeCuePlayers.clear()
    for (playback in snapshot) {
      deliverCueStartResult(playback, false)
      try { playback.player.release() } catch (_: Throwable) {}
    }
  }

  private fun deliverCueStartResult(playback: CuePlayback, started: Boolean) {
    if (playback.startResultDelivered) return
    playback.startResultDelivered = true
    playback.prepareTimeout?.let { mainHandler.removeCallbacks(it) }
    playback.prepareTimeout = null
    try {
      playback.onStartResult?.invoke(started)
    } catch (error: Throwable) {
      Log.w(TAG, "cue result callback failed cueId=${playback.cueId} started=$started", error)
    }
  }

  companion object {
    private const val ACTION_START = "com.aj47.dotagents.handsfree.START"
    private const val ACTION_STOP = "com.aj47.dotagents.handsfree.STOP"
    private const val ACTION_SET_LISTENING = "com.aj47.dotagents.handsfree.SET_LISTENING"
    private const val EXTRA_LANGUAGE = "language"
    private const val EXTRA_LISTENING_ENABLED = "listeningEnabled"
    private const val EXTRA_TRANSCRIPT_DEBOUNCE_MS = "transcriptDebounceMs"
    private const val DEFAULT_LANGUAGE = "en-US"
    private const val TAG = "DotAgentsHandsFree"
    private const val DEFAULT_TRANSCRIPT_DEBOUNCE_MS = 1500L
    private const val SEGMENT_COMPLETE_SILENCE_MS = 1800
    private const val SEGMENT_POSSIBLY_COMPLETE_SILENCE_MS = 1200
    private const val SEGMENT_SESSION_TIMEOUT_MS = 30000
    private const val STANDARD_COMPLETE_SILENCE_MS = 1800
    private const val STANDARD_POSSIBLY_COMPLETE_SILENCE_MS = 1200
    private const val STANDARD_MINIMUM_LENGTH_MS = 1000
    private const val EMPTY_SEGMENT_FALLBACK_THRESHOLD = 2
    private const val STANDARD_RECOGNIZER_FALLBACK_MS = 120000L
    private const val NOTIFICATION_CHANNEL_ID = "dotagents_handsfree_voice"
    private const val NOTIFICATION_ID = 4701
    private const val SESSION_ROUTE_REQUESTER = "service-session"
    private const val CAPTURE_ROUTE_REQUESTER = "service-capture"
    private const val TTS_ROUTE_REQUESTER = "service-tts"
    private const val MIN_TTS_RATE = 0.1f
    private const val MAX_TTS_RATE = 3.0f
    private const val MIN_TTS_PITCH = 0.1f
    private const val MAX_TTS_PITCH = 3.0f
    private const val CUE_PREPARE_TIMEOUT_MS = 1500L
    private const val TTS_AUDIO_PREPARE_TIMEOUT_MS = 2500L

    @Volatile
    private var running = false

    @Volatile
    private var activeService: HandsFreeVoiceService? = null

    fun createStartIntent(
      context: Context,
      language: String,
      listeningEnabled: Boolean,
      transcriptDebounceMs: Long,
    ): Intent {
      return Intent(context, HandsFreeVoiceService::class.java).apply {
        action = ACTION_START
        putExtra(EXTRA_LANGUAGE, language)
        putExtra(EXTRA_LISTENING_ENABLED, listeningEnabled)
        putExtra(EXTRA_TRANSCRIPT_DEBOUNCE_MS, transcriptDebounceMs.coerceAtLeast(0L))
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

    fun debugInjectRecognitionResult(text: String, isFinal: Boolean, callback: String): Boolean {
      if (!BuildConfig.DEBUG) return false
      val service = activeService ?: return false
      service.mainHandler.post {
        service.injectRecognitionResultForTest(text, isFinal, callback)
      }
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

    fun playTtsAudio(
      utteranceId: String,
      filePath: String,
      restoreListeningAfterDone: Boolean,
      allowBargeIn: Boolean,
      deleteFileOnRelease: Boolean,
    ): Boolean {
      val service = activeService ?: return false
      service.playTtsAudio(
        utteranceId = utteranceId,
        filePath = filePath,
        restoreListeningAfterDone = restoreListeningAfterDone,
        allowBargeIn = allowBargeIn,
        deleteFileOnRelease = deleteFileOnRelease,
      )
      return true
    }

    fun playCue(cueId: String, filePath: String, onStartResult: (Boolean) -> Unit): Boolean {
      val service = activeService ?: return false
      service.playCue(cueId, filePath, onStartResult)
      return true
    }

    fun isTtsSpeaking(): Boolean {
      return activeService?.isTtsSpeaking() ?: false
    }
  }
}
