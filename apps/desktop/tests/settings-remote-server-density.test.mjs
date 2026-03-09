import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const remoteServerSource = fs.readFileSync(
  path.join(process.cwd(), 'apps/desktop/src/renderer/src/pages/settings-remote-server.tsx'),
  'utf8',
)

const remoteServerGroup = remoteServerSource.match(
  /<ControlGroup[\s\S]*?title="Remote Server"[\s\S]*?<\/ControlGroup>/,
)?.[0] ?? ''

const cloudflareGroup = remoteServerSource.match(
  /<ControlGroup[\s\S]*?title="Cloudflare Tunnel"[\s\S]*?<\/ControlGroup>/,
)?.[0] ?? ''

test('desktop remote server settings keep the intro copy compact while preserving orientation', () => {
  assert.ok(remoteServerGroup, 'expected to find the Remote Server settings group')
  assert.match(
    remoteServerGroup,
    /Expose DotAgents as an OpenAI-compatible[\s\S]*?<span className="font-mono">\/v1<\/span>[\s\S]*?DotAgents Mobile app[\s\S]*?and other clients\./,
  )
  assert.match(remoteServerGroup, /<Control label="Enable Remote Server" className="px-3">/)
  assert.doesNotMatch(remoteServerGroup, /Exposes your DotAgents agent over an OpenAI BaseURL-compatible/)
  assert.doesNotMatch(remoteServerGroup, /Recommended: use with the/)
})

test('desktop cloudflare tunnel settings replace the long explainer with a shorter summary', () => {
  assert.ok(cloudflareGroup, 'expected to find the Cloudflare Tunnel settings group')
  assert.match(cloudflareGroup, /Optional internet access for the remote server\./)
  assert.match(cloudflareGroup, /Quick tunnels use random[\s\S]*?URLs; named tunnels keep a/)
  assert.match(cloudflareGroup, /persistent URL/)
  assert.match(cloudflareGroup, /<Control label=\{<ControlLabel label="Tunnel Mode"/)
  assert.doesNotMatch(cloudflareGroup, /Create a secure tunnel to expose your remote server to the internet\./)
  assert.doesNotMatch(cloudflareGroup, /<strong>Quick tunnels<\/strong>/)
  assert.doesNotMatch(cloudflareGroup, /<strong>Named tunnels<\/strong>/)
})