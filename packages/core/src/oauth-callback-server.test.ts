import { describe, it, expect, afterEach } from 'vitest'
import { OAuthCallbackServer } from './oauth-callback-server'

describe('OAuthCallbackServer', () => {
  let server: OAuthCallbackServer

  afterEach(() => {
    server?.stop()
  })

  it('creates server with default port', () => {
    server = new OAuthCallbackServer()
    expect(server.getPort()).toBe(3000)
    expect(server.getRedirectUri()).toBe('http://localhost:3000/callback')
  })

  it('creates server with custom port', () => {
    server = new OAuthCallbackServer(8888)
    expect(server.getPort()).toBe(8888)
    expect(server.getRedirectUri()).toBe('http://localhost:8888/callback')
  })

  it('reports not running before start', () => {
    server = new OAuthCallbackServer(0)
    expect(server.isRunning()).toBe(false)
  })

  it('starts and reports running', async () => {
    server = new OAuthCallbackServer(0)
    await server.startServer()
    expect(server.isRunning()).toBe(true)
  })

  it('stops cleanly', async () => {
    server = new OAuthCallbackServer(0)
    await server.startServer()
    expect(server.isRunning()).toBe(true)
    server.stop()
    expect(server.isRunning()).toBe(false)
  })
})
