# DotAgents Mobile

A React Native (Expo) mobile client for DotAgents. Pair it with the desktop remote server by QR code, or point it at any OpenAI-compatible API endpoint, then chat with agents by text, press-and-hold voice, or hands-free VAD.

## Features

- Chat with DotAgents agent profiles from your desktop runtime
- Voice input two ways:
  - Press‑and‑hold mic for real‑time transcription; release to send (or release in edit mode to keep the text in the input)
  - Hands‑free mode to listen, auto-send after silence, and keep capture active while the assistant speaks
- Assistant responses can be spoken aloud using text‑to‑speech, including Android locked-screen playback through the hands-free service
- Local vs Cloud environment toggle with separate Manage API and Run API base URLs
- Agent profile, skill, knowledge note, loop, and MCP management through the desktop remote API
- Persisted settings (API key, IDs, URLs, voice prefs) via AsyncStorage
- Clean, readable UI with safe area support and basic theming
- Web fallback for speech recognition when available (Chrome/Edge over HTTPS)

## Architecture

- Expo SDK 54, React Native 0.81, React 19
- Navigation: @react-navigation/native + native-stack
- Speech recognition: expo-speech-recognition (native); Web Speech API fallback in browsers
- Speech synthesis: expo-speech
- Persistent config: AsyncStorage
- DotAgents remote server + OpenAI-compatible API integration
  - Chat completions endpoint with optional streaming token updates

Key files:
- App.tsx: Navigation and providers
- src/store/config.ts: Config shape, persistence
- src/lib/openaiClient.ts: OpenAI-compatible API client with streaming parsing
- src/screens/SettingsScreen.tsx: Configure API key, base URL, model, hands‑free toggle
- src/screens/ChatScreen.tsx: Chat UI, voice UX, TTS

## Getting started

Prerequisites:
- Node 20.19.4+ (Node 24.x recommended via the repo `.nvmrc`)
- pnpm 9.x

Install dependencies from the repository root:

```bash
nvm use
pnpm install
```

Run the app:

```bash
# Start Metro bundler (choose a platform in the UI)
pnpm --filter @dotagents/mobile start

# Or run directly on a device/simulator
pnpm --filter @dotagents/mobile ios
pnpm --filter @dotagents/mobile android
```

Open the app and configure Settings:
- API Key: Bearer token from DotAgents desktop remote server, or provider API key
- Model: Model identifier used by the Run API (for example, `gpt-5.4-mini`)
- Environment: Toggle Local vs Cloud
  - Run API Base URL (Local/Cloud)
  - Manage API Base URL (Local/Cloud)

For the desktop flow, enable **Settings > Remote Server** in DotAgents desktop and scan the QR code from the mobile **Connection Settings** screen.

## Voice UX

- Press‑and‑hold mic (when hands‑free is off):
  - Hold to record with live transcription overlay
  - Release to send; or release while in "edit" state to place the transcript into the text box for editing
- Hands‑free mode:
  - Toggle from the Chat screen header (microphone icon)
  - If the chip says Sleeping, tap **Wake** or say the configured wake phrase (default: `hey dot agents`)
  - Speak after the listening cue; the app auto-sends after the configured silence window
  - Say the sleep phrase (default: `go to sleep`) to return to sleep
  - While the assistant is speaking, say `wait` or `stop` to interrupt TTS and return to listening
  - On Android, turn **Foreground Only** off in Settings before locking the phone to keep the microphone service and TTS active in the background
  - Short audio cues announce state when the screen is not visible: rising tones for listening, double tones for processing, falling tones for stopped/sleeping, and low repeated tones for errors
- Assistant replies can be read aloud via text‑to‑speech

Notes:
- On native devices, the app uses expo-speech-recognition; on web, it falls back to the browser’s Web Speech API when available
- Permissions for microphone and speech recognition are requested at runtime (see app.json for iOS `NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription`; Android uses `RECORD_AUDIO`)

## Android hands-free harness

Use the ADB harness to regression-test locked-screen hands-free behavior without speaking into the phone:

```bash
pnpm --filter @dotagents/mobile android
pnpm --filter @dotagents/mobile test:handsfree:android
```

The harness requires a debug/dev build because it drives a debug-only test receiver. It verifies the foreground microphone service, communication audio routing, app backgrounding, mic disarm/rearm, synthetic voice input debounce, and native service TTS restore behavior. It writes `logcat.txt` and `report.json` under `apps/mobile/test-artifacts/handsfree/`.

Useful options:

```bash
pnpm --filter @dotagents/mobile test:handsfree:android -- --skip-tts
pnpm --filter @dotagents/mobile test:handsfree:android -- --lock
pnpm --filter @dotagents/mobile test:handsfree:android -- --serial <device-id>
```

Synthetic transcript injection covers the app/native debounce path deterministically. It does not prove the Google speech service can hear a real microphone phrase in every acoustic or Bluetooth condition; use the harness to catch routing, service, TTS, and state regressions, then do a short real-voice smoke test when changing recognizer integration.

## OpenAI API compatibility

The app works with any OpenAI-compatible API endpoint:
- Chat completions endpoint at `/v1/chat/completions` supporting streaming (SSE or textual chunking)
- The client falls back gracefully when streaming readers aren’t available in React Native
- Compatible with OpenAI, Azure OpenAI, local models (Ollama, LM Studio), and other OpenAI-compatible services

The API key is sent as `Authorization: Bearer <API_KEY>`.

## Important: Development Build Required

This app uses `expo-speech-recognition`, which is a native module **not included in Expo Go**. You must use a **development build** to run the app on Android or iOS devices.

If you see the error:
```
Error: Cannot find native module 'ExpoSpeechRecognition'
```

You need to build and run the native app:

```bash
# For Android
pnpm --filter @dotagents/mobile android

# For iOS
pnpm --filter @dotagents/mobile ios

# If you have existing native folders and need a clean rebuild
cd android && ./gradlew clean && cd ..
pnpm --filter @dotagents/mobile android
```

This will compile the native code with all required modules and install the app on your device/emulator.

## Troubleshooting

- Speech recognition not starting on native / `Cannot find native module 'ExpoSpeechRecognition'`:
  - **You must use a development build** — Expo Go does not support native modules like `expo-speech-recognition`
  - Run `pnpm --filter @dotagents/mobile android` or `pnpm --filter @dotagents/mobile ios` to build and install the development app
  - See the "Important: Development Build Required" section above
  - Verify microphone/speech permissions are granted
- Web speech not working:
  - Use Chrome or Edge over HTTPS; some browsers or insecure origins disable Web Speech API
- Cannot list agents:
  - Confirm Manage API base URL is reachable and `/health` returns OK
  - Verify the remote server API key
- No assistant response:
  - Check Run API base URL and logs; the client supports SSE and non‑SSE responses

## License

MIT
