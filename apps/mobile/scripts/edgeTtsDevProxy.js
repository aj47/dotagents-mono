// Development-only HTTP -> Edge TTS WebSocket proxy, mounted as Metro
// middleware in apps/mobile/metro.config.js. Exists because browsers (Expo
// Web) cannot set the `Origin`/`User-Agent` headers required by Microsoft's
// consumer Edge TTS endpoint, while Metro (Node) can.
//
// Endpoint: POST /edge-tts on the Metro dev server
// Request body: { "text": string, "voice"?: string, "rate"?: number }
// Response:     raw audio/mpeg bytes (MP3, 24kHz mono 48kbps)
//
// This file must stay CommonJS + zero-dep (Node >=21 built-in WebSocket)
// so it can be `require`d from metro.config.js without tooling surprises.
'use strict';

const crypto = require('node:crypto');

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const SEC_MS_GEC_VERSION = '1-143.0.3650.75';
const WSS_BASE_URL =
  'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const WSS_FAKE_ORIGIN = 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold';
const WSS_FAKE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0';
const WIN_EPOCH_SECONDS = 11644473600n;
const MAX_TEXT_BYTES = 32 * 1024; // 32 KB of input text is already a huge TTS request
const SYNTHESIS_TIMEOUT_MS = 15000;

function generateSecMsGec() {
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  let ticks = nowSec + WIN_EPOCH_SECONDS;
  ticks -= ticks % 300n;
  ticks *= 10000000n;
  return crypto
    .createHash('sha256')
    .update(ticks.toString() + TRUSTED_CLIENT_TOKEN, 'ascii')
    .digest('hex')
    .toUpperCase();
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Edge TTS binary frames are framed as:
//   [uint16 BE header length][header text][audio bytes]
// Returns { headerText, audio } or null if the buffer is malformed.
function parseBinaryFrame(buf) {
  if (buf.length < 2) return null;
  const headerLength = buf.readUInt16BE(0);
  if (headerLength <= 0 || headerLength + 2 > buf.length) return null;
  const headerText = buf.subarray(2, 2 + headerLength).toString('ascii');
  const audio = buf.subarray(2 + headerLength);
  return { headerText, audio };
}

async function synthesize({ text, voice = 'en-US-AriaNeural', rate = 1.0 }) {
  const clampedSpeed = Math.min(2.0, Math.max(0.5, Number(rate) || 1.0));
  const ratePercent = Math.round((clampedSpeed - 1) * 100);
  const rateStr = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;
  const connectionId = crypto.randomUUID().replace(/-/g, '');
  const requestId = crypto.randomUUID().replace(/-/g, '');
  const timestamp = new Date().toISOString();
  const url =
    `${WSS_BASE_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
    `&Sec-MS-GEC=${generateSecMsGec()}` +
    `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}` +
    `&ConnectionId=${connectionId}`;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: {
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        Origin: WSS_FAKE_ORIGIN,
        'User-Agent': WSS_FAKE_USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    ws.binaryType = 'arraybuffer';
    const audioChunks = [];
    let settled = false;
    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      fn();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error('Edge TTS synthesis timed out'))),
      SYNTHESIS_TIMEOUT_MS,
    );

    ws.addEventListener('open', () => {
      const speechConfig = [
        `X-Timestamp:${timestamp}`,
        'Content-Type:application/json; charset=utf-8',
        'Path:speech.config',
        '',
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: 'false',
                  wordBoundaryEnabled: 'false',
                },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
              },
            },
          },
        }),
      ].join('\r\n');
      const ssml =
        `<speak version='1.0' xml:lang='en-US'><voice name='${escapeXml(voice)}'>` +
        `<prosody rate='${escapeXml(rateStr)}'>${escapeXml(text)}</prosody></voice></speak>`;
      const ssmlRequest = [
        `X-RequestId:${requestId}`,
        'Content-Type:application/ssml+xml',
        `X-Timestamp:${timestamp}`,
        'Path:ssml',
        '',
        ssml,
      ].join('\r\n');
      ws.send(speechConfig);
      ws.send(ssmlRequest);
    });

    ws.addEventListener('message', (event) => {
      if (settled) return;
      const { data } = event;
      if (typeof data === 'string') {
        if (data.includes('Path:turn.end')) {
          finish(() => {
            const total = audioChunks.reduce((n, c) => n + c.length, 0);
            const merged = Buffer.alloc(total);
            let offset = 0;
            for (const c of audioChunks) {
              merged.set(c, offset);
              offset += c.length;
            }
            resolve(merged);
          });
        }
        return;
      }
      const buf = data instanceof ArrayBuffer ? Buffer.from(new Uint8Array(data)) : Buffer.from(data);
      const frame = parseBinaryFrame(buf);
      if (!frame) return;
      if (!frame.headerText.includes('Path:audio')) return;
      if (frame.audio.length > 0) audioChunks.push(frame.audio);
    });

    ws.addEventListener('error', (e) => {
      finish(() => reject(new Error(`Edge TTS websocket failed: ${(e && e.message) || 'unknown'}`)));
    });
    ws.addEventListener('close', (e) => {
      if (audioChunks.length === 0) {
        finish(() =>
          reject(
            new Error(
              `Edge TTS websocket closed without audio (code=${e && e.code ? e.code : 'unknown'}, reason=${(e && e.reason) || '(empty)'})`,
            ),
          ),
        );
      }
    });
  });
}

module.exports = { synthesize, generateSecMsGec, MAX_TEXT_BYTES };
