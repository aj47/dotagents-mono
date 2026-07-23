/**
 * Reproducible routing/cache-envelope comparison for a 15-turn conversation.
 *
 * This is intentionally a mock provider: it models a proxy that keeps prompt
 * prefixes in worker-local caches and uses prompt_cache_key/session_id for
 * sticky routing. It reports the same subset accounting used by providers:
 * cacheReadTokens + cacheWriteTokens <= inputTokens.
 *
 * Run with:
 *   pnpm --filter @dotagents/desktop exec tsx scripts/prompt-cache-mock-benchmark.ts
 */

import { createHash } from "node:crypto"

type Request = {
  tokens: string[]
  promptCacheKey?: string
  sessionId?: string
}

type Usage = {
  inputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

class WorkerLocalMockProxy {
  private static readonly workerCount = 32
  private readonly cachedPrompts = new Map<number, string[][]>()
  private requestNumber = 0

  send(request: Request): Usage {
    const worker = request.promptCacheKey || request.sessionId
      ? Number.parseInt(createHash("sha256").update(request.promptCacheKey || request.sessionId || "").digest("hex").slice(0, 8), 16) % WorkerLocalMockProxy.workerCount
      : this.requestNumber % WorkerLocalMockProxy.workerCount
    this.requestNumber++

    const workerPrompts = this.cachedPrompts.get(worker) || []
    const cacheReadTokens = workerPrompts.reduce((longest, cached) => {
      const matches = cached.every((token, index) => request.tokens[index] === token)
      return matches && cached.length > longest ? cached.length : longest
    }, 0)
    workerPrompts.push([...request.tokens])
    this.cachedPrompts.set(worker, workerPrompts)

    const inputTokens = request.tokens.length
    return {
      inputTokens,
      cacheReadTokens,
      cacheWriteTokens: inputTokens - cacheReadTokens,
    }
  }
}

function run(useStableSessionIdentity: boolean) {
  const proxy = new WorkerLocalMockProxy()
  const usage: Usage[] = []
  const staticPrefix = Array.from({ length: 1_200 }, (_, index) => `static-${index}`)
  let history: string[] = []

  for (let turn = 0; turn < 15; turn++) {
    const request: Request = {
      tokens: [...staticPrefix, ...history, `user-turn-${turn}`],
      ...(useStableSessionIdentity
        ? { promptCacheKey: "agentbattler-session", sessionId: "agentbattler-session" }
        : {}),
    }
    usage.push(proxy.send(request))
    history = [...history, `user-turn-${turn}`, `assistant-turn-${turn}`]
  }

  const inputTokens = usage.reduce((sum, item) => sum + item.inputTokens, 0)
  const cacheReadTokens = usage.reduce((sum, item) => sum + item.cacheReadTokens, 0)
  const cacheWriteTokens = usage.reduce((sum, item) => sum + item.cacheWriteTokens, 0)
  return {
    turns: usage.length,
    inputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    cacheReadRate: Number((cacheReadTokens / inputTokens).toFixed(4)),
    subsetAccounting: cacheReadTokens + cacheWriteTokens <= inputTokens,
  }
}

console.log(JSON.stringify({
  baselineWithoutStableIdentity: run(false),
  configuredStableIdentity: run(true),
}, null, 2))
