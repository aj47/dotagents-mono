import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const settingsProvidersSource = fs.readFileSync(
  path.join(__dirname, 'settings-providers.tsx'),
  'utf8',
)
const sharedProvidersSource = fs.readFileSync(
  path.join(__dirname, '../../../../../../packages/shared/src/providers.ts'),
  'utf8',
)

test('settings providers clarifies that ChatGPT subscriptions do not unlock OpenAI API access', () => {
  assert.match(
    settingsProvidersSource,
    /ChatGPT Plus\/Pro subscriptions are billed separately from the OpenAI API\./,
  )
  assert.match(
    settingsProvidersSource,
    /To use OpenAI here, add API billing credentials or an OpenAI-compatible preset\./,
  )
})

test('chat provider list still only exposes officially supported API-backed providers', () => {
  assert.match(sharedProvidersSource, /\{ label: "OpenAI", value: "openai" \}/)
  assert.match(sharedProvidersSource, /\{ label: "Groq", value: "groq" \}/)
  assert.match(sharedProvidersSource, /\{ label: "Gemini", value: "gemini" \}/)
  assert.doesNotMatch(sharedProvidersSource, /ChatGPT \(Subscription\)/)
})

