#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const DEFAULT_PACKAGE = 'com.aj47.dotagents';
const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_DEBOUNCE_MS = 1500;
const ACTION_PREFIX = 'com.aj47.dotagents.handsfree';

const ACTIONS = {
  start: `${ACTION_PREFIX}.TEST_START`,
  stop: `${ACTION_PREFIX}.TEST_STOP`,
  setListening: `${ACTION_PREFIX}.TEST_SET_LISTENING`,
  snapshot: `${ACTION_PREFIX}.TEST_SNAPSHOT`,
  injectPartial: `${ACTION_PREFIX}.TEST_INJECT_PARTIAL`,
  injectFinal: `${ACTION_PREFIX}.TEST_INJECT_FINAL`,
  speak: `${ACTION_PREFIX}.TEST_SPEAK`,
  stopSpeaking: `${ACTION_PREFIX}.TEST_STOP_SPEAKING`,
};

const options = parseArgs(process.argv.slice(2));
const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), '../../..');
const startedAt = new Date();
const artifactDir = resolve(
  repoRoot,
  options.artifactDir,
  startedAt.toISOString().replace(/[:.]/g, '-'),
);
const logcatPath = resolve(artifactDir, 'logcat.txt');
const reportPath = resolve(artifactDir, 'report.json');
const tests = [];
const warnings = [];
const logLines = [];
let logcatProcess;
let logcatStream;
let serial = options.serial;

if (options.help) {
  printHelp();
  process.exit(0);
}

try {
  await main();
} catch (error) {
  await cleanup();
  writeReport('failed', error);
  console.error(`\nFAIL ${error.message}`);
  console.error(`Artifacts: ${artifactDir}`);
  process.exit(1);
}

async function main() {
  mkdirSync(artifactDir, { recursive: true });
  serial = detectDevice(serial);

  console.log(`Device: ${serial}`);
  console.log(`Package: ${options.packageName}`);
  console.log(`Artifacts: ${artifactDir}`);

  grantPermissions();
  clearLogcat();
  startLogcat();

  await step('debug receiver is reachable', async () => {
    const mark = markLogs();
    broadcast(ACTIONS.snapshot);
    await waitFor(/test receiver action=.*TEST_SNAPSHOT/, 'debug test receiver log', mark, options.timeoutMs);
    await waitFor(/audio-route snapshot reason=test-snapshot\b/, 'audio route snapshot log', mark, options.timeoutMs);
  });

  if (options.launchApp) {
    await step('launch app', async () => {
      runAdb(['shell', 'am', 'start', '-n', `${options.packageName}/.MainActivity`]);
      await sleep(3000);
    });
  }

  const activeRouteMark = markLogs();

  await step('start foreground handsfree service and arm mic', async () => {
    const mark = markLogs();
    broadcast(ACTIONS.start, {
      language: options.language,
      listeningEnabled: true,
      transcriptDebounceMs: options.debounceMs,
    });
    await waitFor(/service start action language=.*captureEnabled=true/, 'service start', mark, options.timeoutMs);
    await waitFor(/service startForeground(?: type=microphone)?/, 'foreground microphone service', mark, options.timeoutMs);
    await waitFor(
      /audio-route acquire reason=service-session\b.*mode=in-communication\b.*routingRequested=true\b.*routingActive=true\b/,
      'service session communication route',
      mark,
      options.timeoutMs,
    );
    await waitFor(
      /audio-route acquire reason=service-capture\b.*mode=in-communication\b.*routingRequested=true\b.*routingActive=true\b/,
      'capture communication route',
      mark,
      options.timeoutMs,
    );
    await waitFor(/event type=recognizer-started\b/, 'recognizer started', mark, options.timeoutMs);
    await waitForReady(mark);
  });

  if (!options.skipBackground) {
    await step('stay routed after app is backgrounded', async () => {
      const mark = markLogs();
      runAdb(['shell', 'input', 'keyevent', 'HOME']);
      await sleep(1500);
      broadcast(ACTIONS.snapshot);
      await waitFor(
        /audio-route snapshot reason=test-snapshot\b.*mode=in-communication\b.*routingRequested=true\b.*routingActive=true\b/,
        'background communication route snapshot',
        mark,
        options.timeoutMs,
      );
    });
  }

  if (options.lock) {
    await step('stay routed after device sleep key', async () => {
      const mark = markLogs();
      runAdb(['shell', 'input', 'keyevent', 'SLEEP']);
      await sleep(2000);
      broadcast(ACTIONS.snapshot);
      await waitFor(
        /audio-route snapshot reason=test-snapshot\b.*mode=in-communication\b.*routingRequested=true\b.*routingActive=true\b/,
        'locked communication route snapshot',
        mark,
        options.timeoutMs,
      );
      runAdb(['shell', 'input', 'keyevent', 'WAKEUP'], { allowFailure: true });
    });
  }

  await step('toggle mic arm off and back on', async () => {
    let mark = markLogs();
    broadcast(ACTIONS.setListening, { listeningEnabled: false });
    await waitFor(/service set-listening action received enabled=false/, 'set listening false action', mark, options.timeoutMs);
    await waitFor(/event type=capture-state\b.*listeningEnabled=false\b/, 'capture disabled event', mark, options.timeoutMs);
    await waitFor(/event type=recognizer-stopped\b/, 'recognizer stopped', mark, options.timeoutMs);

    mark = markLogs();
    broadcast(ACTIONS.snapshot);
    await waitFor(
      /audio-route snapshot reason=test-snapshot\b.*mode=in-communication\b.*routingRequested=true\b.*routingActive=true\b/,
      'session route remains in communication mode while mic is disarmed',
      mark,
      options.timeoutMs,
    );

    mark = markLogs();
    broadcast(ACTIONS.setListening, { listeningEnabled: true });
    await waitFor(/service set-listening action received enabled=true/, 'set listening true action', mark, options.timeoutMs);
    await waitFor(/event type=capture-state\b.*listeningEnabled=true\b/, 'capture enabled event', mark, options.timeoutMs);
    await waitFor(/event type=recognizer-started\b/, 'recognizer restarted', mark, options.timeoutMs);
    await waitForReady(mark);
  });

  if (!options.skipInject) {
    await step('inject voice input and honor debounce delay', async () => {
      const text = `hands free harness final ${Date.now()}`;
      let mark = markLogs();
      broadcast(ACTIONS.injectPartial, { text: 'hands free harness partial' });
      await waitFor(/test transcript inject isFinal=false\b.*callback=test-partial-results\b/, 'partial transcript injection', mark, options.timeoutMs);
      await waitFor(/event type=partial-result\b.*callback=test-partial-results\b/, 'partial transcript event', mark, options.timeoutMs);

      mark = markLogs();
      broadcast(ACTIONS.injectFinal, { text });
      await waitFor(/test transcript inject isFinal=true\b.*callback=test-results\b/, 'final transcript injection', mark, options.timeoutMs);
      await waitFor(/event type=result\b.*callback=test-results\b/, 'final transcript event', mark, options.timeoutMs);
      await waitFor(
        new RegExp(`transcript debounce scheduled textLength=${text.length}\\b.*debounceMs=${options.debounceMs}\\b.*callback=test-results`),
        'configured debounce scheduled',
        mark,
        options.timeoutMs,
      );
      await waitFor(/event type=debounced-result\b.*callback=test-results\b/, 'debounced transcript event', mark, options.timeoutMs + options.debounceMs);
    });
  }

  if (!options.skipTts) {
    await step('play native service TTS and restore mic arm', async () => {
      const utteranceId = `handsfree-harness-${Date.now()}`;
      const mark = markLogs();
      broadcast(ACTIONS.speak, {
        text: options.ttsText,
        utteranceId,
        language: options.language,
        restoreListeningAfterDone: true,
        allowBargeIn: true,
      });
      await waitFor(new RegExp(`test speak requested utteranceId=${escapeRegExp(utteranceId)} started=true`), 'test TTS accepted', mark, options.timeoutMs);
      await waitFor(new RegExp(`tts speak requested utteranceId=${escapeRegExp(utteranceId)}`), 'TTS request reached service', mark, options.timeoutMs);
      await waitFor(
        /audio-route snapshot reason=tts-(prepare|dispatch)\b.*mode=in-communication\b.*routingRequested=true\b.*routingActive=true\b/,
        'TTS communication route snapshot',
        mark,
        options.timeoutMs,
      );

      const started = await waitForAny(
        [
          { label: 'tts-started', regex: new RegExp(`event type=tts-started\\b.*utteranceId=${escapeRegExp(utteranceId)}`) },
          { label: 'tts-error', regex: new RegExp(`event type=tts-error\\b.*utteranceId=${escapeRegExp(utteranceId)}`) },
        ],
        'TTS start or error',
        mark,
        options.timeoutMs,
      );
      if (started.label === 'tts-error') {
        throw new Error('native service TTS errored before playback started');
      }

      const completed = await waitForAny(
        [
          { label: 'tts-done', regex: new RegExp(`event type=tts-done\\b.*utteranceId=${escapeRegExp(utteranceId)}`) },
          { label: 'tts-error', regex: new RegExp(`event type=tts-error\\b.*utteranceId=${escapeRegExp(utteranceId)}`) },
          { label: 'tts-stopped', regex: new RegExp(`event type=tts-stopped\\b.*utteranceId=${escapeRegExp(utteranceId)}`) },
        ],
        'TTS completion',
        mark,
        Math.max(options.timeoutMs, 30000),
      );
      if (completed.label !== 'tts-done') {
        throw new Error(`native service TTS ended with ${completed.label}`);
      }

      await waitFor(/event type=capture-state\b.*listeningEnabled=true\b/, 'capture restored after TTS', mark, options.timeoutMs);
      await waitForAny(
        [
          { label: 'recognizer-started', regex: /event type=recognizer-started\b/ },
          { label: 'recognizer-already-listening', regex: /recognizer start skipped\b.*listening=true\b.*activeTts=false\b/ },
        ],
        'recognizer active after TTS',
        mark,
        options.timeoutMs,
      );
    });
  }

  assertNoActiveRouteModeDrops(activeRouteMark);

  await cleanup();
  writeReport('passed');
  console.log(`\nPASS handsfree harness`);
  console.log(`Artifacts: ${artifactDir}`);
}

async function step(name, fn) {
  const start = Date.now();
  process.stdout.write(`- ${name} ... `);
  try {
    await fn();
    const durationMs = Date.now() - start;
    tests.push({ name, status: 'passed', durationMs });
    console.log(`ok (${durationMs}ms)`);
  } catch (error) {
    const durationMs = Date.now() - start;
    tests.push({ name, status: 'failed', durationMs, error: error.message });
    console.log('failed');
    throw error;
  }
}

async function waitForReady(mark) {
  try {
    await waitFor(/event type=ready-for-speech\b/, 'recognizer ready for speech', mark, options.timeoutMs);
  } catch (error) {
    if (!options.allowNoReady) {
      throw error;
    }
    warnings.push(error.message);
    console.warn(`\n  warning: ${error.message}`);
  }
}

function assertNoActiveRouteModeDrops(after) {
  const badLines = logLines.slice(after).filter((line) => (
    /audio-route\b/.test(line)
    && /(routingRequested=true|routingActive=true)/.test(line)
    && !/mode=in-communication\b/.test(line)
  ));

  if (badLines.length > 0) {
    throw new Error(`audio route left communication mode while active:\n${badLines.slice(-5).join('\n')}`);
  }
}

function broadcast(action, extras = {}) {
  const args = [
    'shell',
    'am',
    'broadcast',
    '-n',
    `${options.packageName}/.HandsFreeTestReceiver`,
    '-a',
    action,
  ];

  for (const [key, value] of Object.entries(extras)) {
    if (key === 'text') {
      args.push('--es', 'textBase64', Buffer.from(String(value), 'utf8').toString('base64'));
    } else if (typeof value === 'boolean') {
      args.push('--ez', key, String(value));
    } else if (Number.isInteger(value)) {
      args.push('--el', key, String(value));
    } else if (typeof value === 'number') {
      args.push('--ef', key, String(value));
    } else {
      args.push('--es', key, String(value));
    }
  }

  const result = runAdb(args, { allowFailure: true });
  if (result.status !== 0) {
    throw new Error(`adb broadcast failed for ${action}:\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function grantPermissions() {
  for (const permission of [
    'android.permission.RECORD_AUDIO',
    'android.permission.POST_NOTIFICATIONS',
  ]) {
    runAdb(['shell', 'pm', 'grant', options.packageName, permission], { allowFailure: true });
  }
  runAdb(['shell', 'appops', 'set', options.packageName, 'RECORD_AUDIO', 'allow'], { allowFailure: true });
}

function clearLogcat() {
  runAdb(['logcat', '-c'], { allowFailure: true });
}

function startLogcat() {
  logcatStream = createWriteStream(logcatPath, { flags: 'a' });
  const args = adbArgs([
    'logcat',
    '-v',
    'time',
    'DotAgentsHandsFree:V',
    'ReactNativeJS:V',
    'AndroidRuntime:E',
    '*:S',
  ]);
  logcatProcess = spawn('adb', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  let partial = '';
  logcatProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString('utf8');
    logcatStream.write(text);
    const lines = `${partial}${text}`.split(/\r?\n/);
    partial = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) logLines.push(line);
    }
  });
  logcatProcess.stderr.on('data', (chunk) => logcatStream.write(chunk));
}

async function cleanup() {
  if (serial && !options.noCleanup) {
    try {
      broadcast(ACTIONS.stopSpeaking);
    } catch (_error) {
      // Best effort; the report/logcat already capture the actionable failure.
    }
    try {
      broadcast(ACTIONS.stop);
    } catch (_error) {
      // Best effort.
    }
  }

  if (logcatProcess) {
    logcatProcess.kill('SIGTERM');
    await sleep(250);
    if (!logcatProcess.killed) {
      logcatProcess.kill('SIGKILL');
    }
    logcatProcess = undefined;
  }
  if (logcatStream) {
    await new Promise((resolveStream) => logcatStream.end(resolveStream));
    logcatStream = undefined;
  }
}

async function waitFor(regex, label, after = 0, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (let index = after; index < logLines.length; index += 1) {
      if (regex.test(logLines[index])) {
        return { line: logLines[index], index };
      }
    }
    await sleep(200);
  }

  const recent = logLines.slice(Math.max(after, logLines.length - 40)).join('\n');
  throw new Error(`timed out waiting for ${label}. Recent logs:\n${recent}`);
}

async function waitForAny(patterns, label, after = 0, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (let index = after; index < logLines.length; index += 1) {
      for (const pattern of patterns) {
        if (pattern.regex.test(logLines[index])) {
          return { ...pattern, line: logLines[index], index };
        }
      }
    }
    await sleep(200);
  }

  const recent = logLines.slice(Math.max(after, logLines.length - 40)).join('\n');
  throw new Error(`timed out waiting for ${label}. Recent logs:\n${recent}`);
}

function markLogs() {
  return logLines.length;
}

function detectDevice(requestedSerial) {
  if (requestedSerial) {
    runRaw('adb', ['-s', requestedSerial, 'get-state']);
    return requestedSerial;
  }

  const result = runRaw('adb', ['devices']);
  const devices = result.stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([id, state]) => id && state === 'device')
    .map(([id]) => id);

  if (devices.length !== 1) {
    throw new Error(`expected exactly one connected adb device, found ${devices.length}. Pass --serial <id>.`);
  }
  return devices[0];
}

function runAdb(args, opts = {}) {
  return runRaw('adb', adbArgs(args), opts);
}

function adbArgs(args) {
  return serial ? ['-s', serial, ...args] : args;
}

function runRaw(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });

  if (result.error) {
    throw result.error;
  }
  if (!opts.allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return result;
}

function writeReport(status, error) {
  mkdirSync(artifactDir, { recursive: true });
  const report = {
    status,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    device: serial,
    packageName: options.packageName,
    options: {
      timeoutMs: options.timeoutMs,
      debounceMs: options.debounceMs,
      language: options.language,
      launchApp: options.launchApp,
      skipBackground: options.skipBackground,
      lock: options.lock,
      skipInject: options.skipInject,
      skipTts: options.skipTts,
      allowNoReady: options.allowNoReady,
    },
    tests,
    warnings,
    error: error ? { message: error.message, stack: error.stack } : undefined,
    artifacts: {
      logcat: logcatPath,
      report: reportPath,
    },
  };
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function parseArgs(argv) {
  const parsed = {
    artifactDir: 'apps/mobile/test-artifacts/handsfree',
    packageName: DEFAULT_PACKAGE,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    debounceMs: DEFAULT_DEBOUNCE_MS,
    language: 'en-US',
    ttsText: 'DotAgents hands-free harness test.',
    launchApp: true,
    skipBackground: false,
    lock: false,
    skipInject: false,
    skipTts: false,
    allowNoReady: false,
    noCleanup: false,
    help: false,
    serial: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      continue;
    }
    switch (arg) {
      case '--help':
      case '-h':
        parsed.help = true;
        break;
      case '--serial':
      case '-s':
        parsed.serial = requiredValue(argv, ++index, arg);
        break;
      case '--package':
        parsed.packageName = requiredValue(argv, ++index, arg);
        break;
      case '--artifact-dir':
        parsed.artifactDir = requiredValue(argv, ++index, arg);
        break;
      case '--timeout-ms':
        parsed.timeoutMs = parsePositiveInt(requiredValue(argv, ++index, arg), arg);
        break;
      case '--debounce-ms':
        parsed.debounceMs = parseNonNegativeInt(requiredValue(argv, ++index, arg), arg);
        break;
      case '--language':
        parsed.language = requiredValue(argv, ++index, arg);
        break;
      case '--tts-text':
        parsed.ttsText = requiredValue(argv, ++index, arg);
        break;
      case '--launch-app':
        parsed.launchApp = true;
        break;
      case '--skip-launch-app':
        parsed.launchApp = false;
        break;
      case '--skip-background':
        parsed.skipBackground = true;
        break;
      case '--lock':
        parsed.lock = true;
        break;
      case '--skip-inject':
        parsed.skipInject = true;
        break;
      case '--skip-tts':
        parsed.skipTts = true;
        break;
      case '--allow-no-ready':
        parsed.allowNoReady = true;
        break;
      case '--no-cleanup':
        parsed.noCleanup = true;
        break;
      default:
        throw new Error(`unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function requiredValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parsePositiveInt(value, flag) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function parseNonNegativeInt(value, flag) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer`);
  }
  return parsed;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function printHelp() {
  console.log(`Usage: pnpm --filter @dotagents/mobile test:handsfree:android -- [options]

Runs an Android ADB harness against the debug-only DotAgents hands-free test receiver.
Install a debug/dev build first, then keep exactly one adb device connected or pass --serial.

Options:
  --serial, -s <id>       Target adb device serial.
  --package <name>        Android package name. Default: ${DEFAULT_PACKAGE}
  --timeout-ms <ms>       Per-assertion timeout. Default: ${DEFAULT_TIMEOUT_MS}
  --debounce-ms <ms>      Transcript debounce to assert. Default: ${DEFAULT_DEBOUNCE_MS}
  --language <tag>        Speech/TTS language. Default: en-US
  --launch-app            Launch MainActivity before service tests. This is the default.
  --skip-launch-app       Do not launch MainActivity before starting the microphone service.
  --lock                  Also press SLEEP/WAKEUP and assert route while the phone is asleep.
  --skip-background       Skip HOME/background route assertion.
  --skip-inject           Skip synthetic partial/final transcript injection.
  --skip-tts              Skip native service TTS playback.
  --allow-no-ready        Warn instead of fail if ready-for-speech is not observed.
  --no-cleanup            Leave the service running after the harness finishes.
  --artifact-dir <path>   Artifact root. Default: apps/mobile/test-artifacts/handsfree
`);
}
