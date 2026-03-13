# Mobile App

The DotAgents mobile app puts AI agents in your pocket — chat by voice or text with full hands-free support, on iOS, Android, and the web.

---

## Overview

Built with Expo SDK 54 and React Native, the mobile app provides a portable interface to your DotAgents agents. It connects to your desktop instance's remote server or any OpenAI-compatible API endpoint.

### Key Capabilities

- Voice input with press-and-hold or hands-free VAD mode
- Text chat with streaming responses
- Text-to-speech for assistant replies
- Agent profile management
- Memory editing
- Loop (recurring task) scheduling
- Session history with search
- QR code connection setup
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
- **TTS playback** — Assistant replies can be spoken aloud via `expo-speech`
- **Hands-free mode** — Toggle VAD (Voice Activity Detection) for no-hands interaction
- **Edit mode** — Release the mic while in edit state to place the transcript in the input box for review before sending

### Settings Screen

Configure your connection and preferences:

| Setting | Description |
|---------|-------------|
| **API Key** | Your API key (Bearer token) |
| **Base URL** | API endpoint URL |
| **Model** | Model identifier (e.g., `gpt-4o-mini`) |
| **Environment** | Toggle between Local and Cloud |
| **Run API URL** | Endpoint for chat completions |
| **Manage API URL** | Endpoint for agent management |
| **Voice Preferences** | TTS voice, auto-play, language |

### Session List Screen

Browse and search your conversation history:

- Scrollable list of past sessions
- Search by content or title
- Tap to continue a previous conversation
- Delete sessions you no longer need

### Connection Settings Screen

Quick setup via QR code:

- Scan a QR code from your desktop app to auto-configure connection settings
- Manually enter connection details as an alternative
- Test connectivity with a health check

### Agent Edit Screen

Create and configure agent profiles directly on mobile:

- Set name, description, and system prompt
- Configure guidelines and properties
- Select available tools

### Memory Edit Screen

Manage agent memories from your phone:

- View existing memories
- Create new memory entries
- Edit memory content, importance, and tags
- Delete outdated memories

### Loop Edit Screen

Schedule recurring tasks:

- Define the prompt to execute
- Set the interval (e.g., every 5 minutes, every hour)
- Choose which agent handles the loop
- Start, pause, and monitor loops

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

### Hands-Free Mode (VAD)

1. **Toggle** hands-free from the chat screen header (microphone icon)
2. The app **listens continuously** using Voice Activity Detection
3. When speech is detected, it **automatically transcribes**
4. On silence (end of speech segment), it **automatically sends**
5. Great for driving, cooking, or any hands-busy scenario

### Text-to-Speech

- Assistant replies can be read aloud via `expo-speech`
- Configure voice and auto-play preferences in Settings
- Works across all platforms (iOS, Android, Web)

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
| `profile.ts` | Agent profile state |
| `message-queue.ts` | Queued messages for offline/slow processing |

## Connecting to Desktop

The mobile app connects to your desktop app's remote server:

1. **Start DotAgents desktop** — The remote server starts automatically
2. **On mobile**, go to **Connection Settings**
3. **Scan the QR code** displayed on your desktop, or manually enter the URL
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

- Node.js 18+
- For native builds: Xcode (iOS) or Android Studio (Android)

### Install

```bash
cd apps/mobile
npm install
```

### Run

```bash
# Start Metro bundler (choose platform in UI)
npm run start

# Or run directly
npx expo run:ios        # iOS
npx expo run:android    # Android
npx expo start --web    # Web
```

### Development Build

If you see `Cannot find native module 'ExpoSpeechRecognition'`:

```bash
# Build and install the development app
npx expo run:android
# or
npx expo run:ios
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find native module 'ExpoSpeechRecognition'` | Use a development build, not Expo Go |
| Speech recognition not starting | Grant microphone/speech permissions |
| Web speech not working | Use Chrome or Edge over HTTPS |
| Cannot list agents | Verify Manage API URL and API key |
| No assistant response | Check Run API URL and model setting |

---

## Next Steps

- **[Voice Interface](../voice/overview.md)** — Advanced voice features
- **[AI Providers](../tools/providers.md)** — Configure API providers
- **[Desktop App](../desktop/overview.md)** — Full desktop experience
