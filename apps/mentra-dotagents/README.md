# DotAgents MentraOS app

A voice-first MentraOS app that forwards final glass transcriptions to DotAgents and speaks the streamed response back through the glasses.

## Run locally

```bash
export MENTRA_API_KEY=...
export DOTAGENTS_API_KEY=...
export DOTAGENTS_BASE_URL=http://127.0.0.1:3210/v1
pnpm --filter @dotagents/mentra-dotagents build
pnpm --filter @dotagents/mentra-dotagents start
```

Expose the listening port with a public HTTPS tunnel and configure that URL in the Mentra developer console. `MENTRA_PACKAGE_NAME`, `PORT`, and `DOTAGENTS_MODEL` are optional. Each Mentra session keeps its own DotAgents `conversation_id`; saying “stop” interrupts audio.
