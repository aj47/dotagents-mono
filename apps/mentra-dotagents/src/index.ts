import { AppServer, type AppSession } from '@mentra/sdk';

const packageName = process.env.MENTRA_PACKAGE_NAME || 'com.dotagents.mentra';
const mentraApiKey = process.env.MENTRA_API_KEY;
const dotagentsBaseUrl = (process.env.DOTAGENTS_BASE_URL || 'http://127.0.0.1:3210/v1').replace(/\/+$/, '');
const dotagentsApiKey = process.env.DOTAGENTS_API_KEY;
const port = Number(process.env.PORT || 3000);
const model = process.env.DOTAGENTS_MODEL || 'gpt-4.1-mini';

if (!mentraApiKey) throw new Error('MENTRA_API_KEY is required');
if (!dotagentsApiKey) throw new Error('DOTAGENTS_API_KEY is required');

const STOP_WORDS = /^(stop|cancel|never mind|nevermind)$/i;
const MAX_INPUT_LENGTH = 4000;
const MAX_OUTPUT_LENGTH = 8000;

type SessionState = { conversationId?: string; busy: boolean; lastTranscript?: string };

function getState(map: Map<string, SessionState>, sessionId: string): SessionState {
  let state = map.get(sessionId);
  if (!state) {
    state = { busy: false };
    map.set(sessionId, state);
  }
  return state;
}

async function readStreamingResponse(response: Response): Promise<{ text: string; conversationId?: string }> {
  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`DotAgents returned ${response.status}: ${detail}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    const payload = (await response.json()) as { content?: string; conversation_id?: string; choices?: Array<{ message?: { content?: string } }> };
    return {
      text: payload.content || payload.choices?.[0]?.message?.content || '',
      conversationId: payload.conversation_id,
    };
  }

  const reader = response.body?.getReader();
  if (!reader) return { text: '' };

  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let conversationId: string | undefined;

  const processEvent = (raw: string) => {
    for (const line of raw.split(/\r?\n/)) {
      const data = line.replace(/^data:\s?/, '').trim();
      if (!data || data === '[DONE]') continue;
      try {
        const event = JSON.parse(data) as {
          type?: string;
          data?: { content?: string; conversation_id?: string; conversation_history?: unknown[]; message?: string; streamingContent?: { text?: string } };
          choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
          conversation_id?: string;
          content?: string;
        };
        conversationId ||= event.data?.conversation_id || event.conversation_id;
        if (event.type === 'error') throw new Error(event.data?.message || 'DotAgents stream error');
        if (event.type === 'done') {
          text = event.data?.content || event.data?.streamingContent?.text || text;
          continue;
        }
        if (event.type === 'progress' && event.data?.streamingContent?.text) {
          text = event.data.streamingContent.text;
          continue;
        }
        text += event.data?.content || event.choices?.[0]?.delta?.content || event.choices?.[0]?.message?.content || event.content || '';
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
  };

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const events = buffer.split(/\n\n+/);
    buffer = events.pop() || '';
    for (const event of events) processEvent(event);
  }
  processEvent(buffer);
  return { text: text.trim(), conversationId };
}

class DotAgentsMentraApp extends AppServer {
  private readonly states = new Map<string, SessionState>();

  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    const state = getState(this.states, sessionId);
    session.logger.info(`DotAgents session started: ${JSON.stringify({ sessionId, userId, dotagentsBaseUrl })}`);
    session.layouts.showTextWall('DotAgents ready. Ask me anything.');

    session.events.onTranscription((data) => {
      if (!data.isFinal) return;
      const text = data.text.trim();
      if (!text || text === state.lastTranscript) return;
      state.lastTranscript = text;
      void this.handleTranscript(session, sessionId, text);
    });
  }

  protected async onStop(sessionId: string, userId: string, reason: string): Promise<void> {
    this.states.delete(sessionId);
    console.log(`[mentra] session stopped: ${sessionId} (${userId}) ${reason}`);
  }

  private async handleTranscript(session: AppSession, sessionId: string, rawText: string): Promise<void> {
    const state = getState(this.states, sessionId);
    const text = rawText.slice(0, MAX_INPUT_LENGTH);
    if (STOP_WORDS.test(text)) {
      session.audio.stopAudio();
      session.layouts.showTextWall('Stopped.');
      return;
    }
    if (state.busy) {
      session.layouts.showTextWall('Still working…');
      return;
    }

    state.busy = true;
    session.layouts.showTextWall('Thinking…');
    try {
      const response = await fetch(`${dotagentsBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${dotagentsApiKey}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/json',
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [{ role: 'user', content: text }],
          ...(state.conversationId ? { conversation_id: state.conversationId } : {}),
        }),
      });
      const result = await readStreamingResponse(response);
      if (result.conversationId) state.conversationId = result.conversationId;
      const answer = result.text.slice(0, MAX_OUTPUT_LENGTH).trim() || 'I did not get a response.';
      session.layouts.showTextWall(answer.slice(0, 500));
      await session.audio.speak(answer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      session.logger.error(error, 'DotAgents request failed');
      session.layouts.showTextWall('DotAgents connection failed.');
      await session.audio.speak('I could not reach DotAgents.');
      console.error(`[mentra] request failed for ${sessionId}: ${message}`);
    } finally {
      state.busy = false;
    }
  }
}

const app = new DotAgentsMentraApp({
  packageName,
  apiKey: mentraApiKey,
  port,
  healthCheck: true,
});

await app.start();
console.log(`[mentra] ${packageName} listening on port ${port}`);
console.log(`[mentra] forwarding chat to ${dotagentsBaseUrl}/chat/completions`);
