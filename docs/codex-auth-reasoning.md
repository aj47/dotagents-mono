# Codex-authenticated reasoning support

DotAgents' ChatGPT/Codex provider calls the ChatGPT backend Responses API through the
Codex OAuth credentials stored by the desktop app.

For Codex-authenticated speech-to-text support and notes on investigated TTS and
image-generation paths, see [`codex-auth-media.md`](./codex-auth-media.md).

## Request behavior

- Reasoning-capable Codex models receive a `reasoning.effort` request option.
- The effort is controlled by the existing OpenAI reasoning-effort setting.
- `none` leaves provider defaults untouched and omits the `reasoning` payload.
- `minimal`, `low`, `medium`, and `high` are passed through directly.
- `xhigh` is downgraded to `high` because the Codex Responses API uses the OpenAI
  Responses effort values.
- When no explicit setting exists, reasoning-capable Codex models default to
  `medium`, matching the OpenAI provider path.

## Telemetry and usage behavior

- Debug LLM logging records the model, requested effort, and whether it came from
  user config or the default.
- Responses usage is mapped from `output_tokens_details.reasoning_tokens` into the
  ChatGPT/Codex usage object as `outputTokenDetails.reasoningTokens` so callers can
  account for thinking tokens when the backend reports them.

## Limitations

Models that are not recognized as reasoning-capable do not receive a `reasoning`
request option. If ChatGPT/Codex changes model naming, update the model-pattern list
in `apps/desktop/src/main/chatgpt-web-provider.ts`.