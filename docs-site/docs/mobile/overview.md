---
sidebar_position: 1
sidebar_label: "Overview"
---

# Mobile App

The DotAgents mobile app puts AI agents in your pocket — chat by voice or text with full hands-free support, on iOS, Android, and the web.

---

## Overview

Built with Expo SDK 54 and React Native, the mobile app provides a portable interface to your DotAgents agents. It connects to your desktop instance's remote server or any OpenAI-compatible API endpoint.

### Key Capabilities

- Voice input with press-and-hold or hands-free mode
- Text chat with streaming responses
- Text-to-speech for assistant replies
- Agent profile management
- Knowledge note editing
- Loop (recurring task) scheduling
- Operator dashboard for health checks, logs, tunnels, integrations, updater, and emergency actions
- Session history with search
- QR code, deep-link, and easy pairing setup
- Android push notifications for desktop-delivered assistant replies
- Split chat view for multi-agent conversations

## Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| **iOS** | Full support | Requires development build (not Expo Go) |
| **Android** | Full support | Requires development build (not Expo Go) |
| **Web** | Supported | Speech recognition requires Chrome/Edge over HTTPS |

> **Important**: The app uses `expo-speech-recognition`, a native module not available in Expo Go. You must use a **development build** for native devices.

## Screens

### Chat Screen

The primary interface for conversations with your agent:

- **Text input** — Type messages and receive streaming responses
- **Voice input** — Press-and-hold the mic button for real-time transcription
- **Desktop Provider STT** — Use the paired desktop speech-to-text provider for push-to-talk when local mobile recognition is not the right fit
- **TTS playback** — Assistant replies can be spoken aloud via `expo-speech`
- **Hands-free mode** — Toggle no-hands listening, auto-send after silence, interrupt TTS with voice, and use Android locked-screen capture
- **Edit mode** — Release the mic while in edit state to place the transcript in the input box for review before sending

### Settings Screen

Configure your connection and preferences:

| Setting | Description |
|---------|-------------|
| **API Key** | Your API key (Bearer token) |
| **Base URL** | API endpoint URL |
| **Model** | Model identifier (e.g., `gpt-5.4-mini`) |
| **Environment** | Toggle between Local and Cloud |
| **Run API URL** | Endpoint for chat completions |
| **Manage API URL** | Endpoint for agent management |
| **Voice Preferences** | TTS voice, auto-play, language |

### Session List Screen

Browse and search your conversation history:

- Scrollable list of past sessions
- Search by content or title
- Tap to continue a previous conversation
- Pull to refresh from the paired desktop server
- Delete sessions you no longer need

### Connection Settings Screen

Quick setup via QR code:

- Scan a QR code from your desktop app to auto-configure connection settings
- Open a `dotagents://config?...` deep link from desktop or another device
- Use the desktop app's easy-pairing URL when LAN or Tailscale discovery is available
- Manually enter connection details as an alternative
- Test connectivity with a health check

### Agent Edit Screen

Create and configure agent profiles directly on mobile:

- Set name, description, and system prompt
- Configure guidelines and properties
- Select available tools

### Knowledge Note Edit Screen

Manage durable knowledge notes from your phone:

- View existing knowledge notes
- Create new notes
- Edit note context, summary, body, tags, and references
- Delete outdated notes

### Loop Edit Screen

Schedule recurring tasks:

- Define the prompt to execute
- Set the interval (e.g., every 5 minutes, every hour)
- Choose which agent handles the loop
- Start, pause, and monitor loops

### Operations Screen

Trusted operator dashboard backed by the desktop remote server:

- View runtime status, health checks, recent errors, and audit events
- Inspect Cloudflare Tunnel, Discord, WhatsApp, push, updater, and MCP status
- Start or stop tunnel exposure
- Connect or disconnect Discord and WhatsApp integrations
- Trigger updater checks, reveal downloads, restart MCP services, restart the remote server, restart the app, or run an agent

### Push Notifications

Android native builds can register for push notifications from Settings. When registered, the desktop remote server can send mobile notifications for new assistant messages, deep-link the notification back into the matching conversation, and clear badge state through the remote API.

Push requires a native development or release build, Firebase Android app config, and an Expo/EAS Android FCM V1 credential. It is not available in Expo Go or the web build. See [Build, Release, Deploy](/development/build-release-deploy#mobile-builds) and `apps/mobile/README.md` for credential setup and rotation notes.

### Split Chat Screen

Multi-agent conversation view:

- See responses from multiple agents side by side
- Compare agent outputs for the same query
- Switch between agents within a single interface

## Voice UX

### Press-and-Hold Mode

1. **Press and hold** the mic button
2. See **live transcription** as you speak
3. **Release to send** — the transcript is immediately sent to the agent
4. Or **release in edit mode** — the transcript goes into the text box for review

### Hands-Free Mode

1. **Toggle** hands-free from the chat screen header (microphone icon)
2. If the status chip says **Sleeping**, tap **Wake** or say the configured wake phrase (default: `hey dot agents`)
3. Speak after the listening cue
4. Pause briefly; after the configured silence window, the app **automatically sends**
5. Say the sleep phrase (default: `go to sleep`) to return to sleep
6. While the assistant is speaking, say `wait` or `stop` to stop TTS and return to listening

Hands-free mode is designed for driving, cooking, or any hands-busy scenario. The Chat screen includes a help button beside the hands-free status chip, and first-time users see a short guide modal.

#### Audio Cues

Hands-free mode plays short non-speech cues so you can use it without looking at the screen:

- Rising tones: listening
- Two short tones: processing
- Falling tones: stopped or sleeping
- Repeated low tones: error

#### Locked-Screen Use On Android

Android can keep hands-free capture and assistant TTS active after the phone locks:

1. Open **Settings**
2. Turn **Foreground Only** off
3. Return to Chat and enable hands-free mode before locking the phone

The app starts a visible microphone foreground service. Keep the notification active while testing locked-screen conversations.

#### Desktop Provider STT

When paired with desktop, mobile can route press-and-hold transcription through the desktop-configured STT provider. This is useful when you want the same OpenAI, Groq, or local desktop transcription behavior on mobile, or when native speech recognition is unreliable in a particular environment.

### Text-to-Speech

- Assistant replies can be read aloud via `expo-speech`
- Configure voice and auto-play preferences in Settings
- Works across all platforms (iOS, Android, Web)
- In hands-free mode, TTS starts only after audio playback actually begins. If you say `wait` or `stop` during playback, TTS stops and the app listens again.

## Architecture

```
┌─────────────────────────────────┐
│        Mobile App (Expo)         │
│                                 │
│  ┌───────────┐ ┌─────────────┐  │
│  │ Screens   │ │ Navigation  │  │
│  │ (React    │ │ (React      │  │
│  │  Native)  │ │  Navigation)│  │
│  └─────┬─────┘ └─────────────┘  │
│        │                        │
│  ┌─────▼─────────────────────┐  │
│  │  Store (AsyncStorage)     │  │
│  │  config, sessions,        │  │
│  │  profiles, message queue  │  │
│  └─────┬─────────────────────┘  │
│        │                        │
│  ┌─────▼─────────────────────┐  │
│  │  API Client               │  │
│  │  (OpenAI-compatible)      │  │
│  │  SSE streaming support    │  │
│  └─────┬─────────────────────┘  │
└────────┼────────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Desktop Remote      │
│  Server (Fastify)    │
│  OR                  │
│  Any OpenAI-         │
│  Compatible API      │
└─────────────────────┘
```

### Key Libraries

| Library | Purpose |
|---------|---------|
| `expo-speech-recognition` | Native speech recognition |
| `expo-speech` | Text-to-speech |
| `expo-camera` | QR code scanning for connection setup |
| `@react-native-async-storage/async-storage` | Persistent config storage |
| `react-native-sse` | Server-sent events for streaming |
| `@react-navigation/native-stack` | Screen navigation |

### State Management

| Store | Purpose |
|-------|---------|
| `config.ts` | Persistent settings (API key, URLs, voice prefs) |
| `sessions.ts` | Local session history |
| `connectionManager.ts` | Connection pooling and recovery |
| `tunnelConnection.ts` | Tunnel status and reconnect state |
| `profile.ts` | Agent profile state |
| `message-queue.ts` | Queued messages for offline/slow processing |

## Connecting to Desktop

The mobile app connects to your desktop app's remote server:

1. **Start DotAgents desktop** and enable **Settings > Remote Server**
2. **On mobile**, go to **Connection Settings**
3. **Scan the QR code** displayed on your desktop, or manually enter the URL and API key
4. The mobile app now communicates with your desktop's agent engine

This gives the mobile app access to all your desktop's MCP tools, agent profiles, and conversation history.

## API Compatibility

The mobile app works with any OpenAI-compatible API endpoint:

- **OpenAI** — Direct connection to OpenAI's API
- **Groq** — Fast inference with Groq's API
- **Azure OpenAI** — Microsoft's OpenAI service
- **Ollama** — Local models at `http://localhost:11434/v1`
- **LM Studio** — Local models with OpenAI-compatible API
- **DotAgents Remote Server** — Your desktop's agent engine

The API key is sent as `Authorization: Bearer <API_KEY>`.

## Getting Started

### Prerequisites

- Node.js 20.19.4+ (Node 24.x recommended via `.nvmrc`)
- pnpm 9.x
- For native builds: Xcode (iOS) or Android Studio (Android)

### Install

```bash
git clone https://github.com/aj47/dotagents-mono.git
cd dotagents-mono
nvm use
pnpm install
```

### Run

```bash
# Start Metro bundler (choose platform in UI)
pnpm --filter @dotagents/mobile start

# Or run directly
pnpm --filter @dotagents/mobile ios      # iOS
pnpm --filter @dotagents/mobile android  # Android
pnpm --filter @dotagents/mobile web      # Web
```

### Development Build

If you see `Cannot find native module 'ExpoSpeechRecognition'`:

```bash
# Build and install the development app
pnpm --filter @dotagents/mobile android
# or
pnpm --filter @dotagents/mobile ios
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find native module 'ExpoSpeechRecognition'` | Use a development build, not Expo Go |
| Speech recognition not starting | Grant microphone/speech permissions |
| Web speech not working | Use Chrome or Edge over HTTPS |
| Cannot list agents | Verify Manage API URL and API key |
| No assistant response | Check Run API URL and model setting |
| Operations actions fail | Confirm the desktop remote server is reachable and the operator allowlists/API key are correct |

---

## Next Steps

- **[Voice Interface](/voice/overview)** — Advanced voice features
- **[Remote Server & Pairing](/desktop/remote-server)** — Pair mobile with your desktop agent engine
- **[AI Providers](/tools/providers)** — Configure API providers
- **[Desktop App](/desktop/overview)** — Full desktop experience
