# DotAgents Mobile

A React Native (Expo) companion app for DotAgents. Pair it with a DotAgents desktop app or another DotAgents server, then continue chats on mobile with voice input, hands-free mode, text-to-speech, and synced conversation history.

## Features

- Pair with DotAgents by scanning a QR code from the desktop app
- Manual fallback for direct DotAgents server URL + API key entry
- Chat with your current DotAgents profile and synced conversations
- Voice input:
  - Press-and-hold mic for live transcription
  - Hands-free mode for foreground chat sessions
- Spoken assistant replies with text-to-speech
- Push notifications and conversation sync when connected to DotAgents

## Architecture

- Expo SDK 54, React Native 0.81, React 19
- Navigation: `@react-navigation/native` + native stack
- Speech recognition: `expo-speech-recognition` on native, Web Speech API fallback on web
- Speech synthesis: `expo-speech`
- Persistent config: AsyncStorage
- DotAgents remote server integration:
  - connection handshake via `GET /v1/settings`
  - chat via `/v1/chat/completions`
  - conversation/profile/settings sync via existing DotAgents mobile endpoints

Key files:
- `App.tsx`: app providers, deep links, tunnel lifecycle, session sync
- `src/store/config.ts`: persisted mobile config
- `src/lib/openaiClient.ts`: DotAgents chat transport and streaming parser
- `src/screens/ConnectionSettingsScreen.tsx`: QR pairing and manual DotAgents server connection
- `src/screens/SettingsScreen.tsx`: local mobile settings plus connected DotAgents settings
- `src/screens/ChatScreen.tsx`: chat UI, voice UX, TTS

## Getting Started

Prerequisites:
- Node 18+

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm --filter @dotagents/mobile start

# Or run directly on a device/simulator
pnpm --filter @dotagents/mobile ios
pnpm --filter @dotagents/mobile android
```

Connect the app:
- Recommended: open DotAgents desktop remote server settings and scan the QR code
- Fallback: open mobile connection settings and enter a DotAgents server URL plus API key

## Voice UX

- Press-and-hold mic:
  - Hold to record with live transcription
  - Release to send, or release in edit mode to keep the text in the composer
- Hands-free mode:
  - Toggle from chat
  - Mobile v1 only works while the app stays open on the Chat screen in the foreground
- Assistant replies can be read aloud with text-to-speech

## Important: Development Build Required

This app uses `expo-speech-recognition`, which is a native module and is not included in Expo Go. Use a development build on Android or iOS devices.

If you see:

```text
Error: Cannot find native module 'ExpoSpeechRecognition'
```

build and run the native app:

```bash
pnpm --filter @dotagents/mobile exec expo run:android
pnpm --filter @dotagents/mobile exec expo run:ios
```

## Troubleshooting

- Speech recognition not starting on native:
  - use a development build, not Expo Go
  - verify microphone and speech permissions
- Mobile stays disconnected:
  - rescan the desktop QR code or re-enter the DotAgents server URL and API key
  - confirm the server exposes `GET /v1/settings`
- Chats or settings do not sync:
  - confirm the desktop remote server is running and reachable from the device
  - reconnect from mobile connection settings if the saved server is stale

## License

MIT
