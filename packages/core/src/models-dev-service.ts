/**
 * models.dev API Client Service
 *
 * Fetches and caches model data from the models.dev API.
 * Provides functions to query models by provider and model ID.
 *
 * Extracted to @dotagents/core — uses PathResolver instead of Electron's app.getPath.
 */

import fs from "fs"
import path from "path"
import type { PathResolver } from "./interfaces/path-resolver"
import { container, ServiceTokens } from "./service-container"
import { diagnosticsService } from "./diagnostics"

// ============================================================================
// Types
// ============================================================================

/** Cost information for a model (in USD per million tokens) */
export interface ModelsDevCost {
  input: number
  output: number
  cache_read?: number
  cache_write?: number
  reasoning?: number
  input_audio?: number
  output_audio?: number
}

/** Context/output limits for a model */
export interface ModelsDevLimit {
  context: number
  output: number
}

/** Input/output modalities supported by the model */
export interface ModelsDevModalities {
  input: string[]
  output: string[]
}

/** Model definition from models.dev API */
export interface ModelsDevModel {
  id: string
  name: string
  family?: string
  attachment?: boolean
  reasoning?: boolean
  tool_call?: boolean
  structured_output?: boolean
  temperature?: boolean
  knowledge?: string
  release_date?: string
  last_updated?: string
  modalities?: ModelsDevModalities
  open_weights?: boolean
  cost?: ModelsDevCost
  limit?: ModelsDevLimit
  interleaved?: { field: string }
}

/** Provider definition from models.dev API */
export interface ModelsDevProvider {
  id: string
  name: string
  env?: string[]
  npm?: string
  api?: string
  doc?: string
  models: Record<string, ModelsDevModel>
}

/** Full API response: Record of provider ID to provider data */
export type ModelsDevData = Record<string, ModelsDevProvider>

/** Cache file structure */
interface ModelsDevCache {
  timestamp: number
  data: ModelsDevData
}

// ============================================================================
// Constants
// ============================================================================

const MODELS_DEV_API_URL = "https://models.dev/api.json"
const CACHE_FILENAME = "models-dev-cache.json"
const CACHE_REFRESH_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

// ============================================================================
// Internal State
// ============================================================================

let inMemoryCache: ModelsDevData | null = null
let lastFetchTimestamp = 0

// ============================================================================
// Helper Functions
// ============================================================================

function getCachePath(): string {
  const pathResolver = container.resolve<PathResolver>(ServiceTokens.PathResolver)
  const userDataPath = pathResolver.getUserDataPath()
  return path.join(userDataPath, CACHE_FILENAME)
}

function readCacheFromDisk(): ModelsDevCache | null {
  try {
    const cachePath = getCachePath()
    if (!fs.existsSync(cachePath)) {
      return null
    }
    const cacheContent = fs.readFileSync(cachePath, "utf-8")
    return JSON.parse(cacheContent) as ModelsDevCache
  } catch (error) {
    diagnosticsService.logError(
      "models-dev-service",
      "Failed to read cache from disk",
      error
    )
    return null
  }
}

function writeCacheToDisk(data: ModelsDevData): void {
  try {
    const cachePath = getCachePath()
    const cache: ModelsDevCache = {
      timestamp: Date.now(),
      data,
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8")
    diagnosticsService.logInfo(
      "models-dev-service",
      `Cache written to disk: ${cachePath}`
    )
  } catch (error) {
    diagnosticsService.logError(
      "models-dev-service",
      "Failed to write cache to disk",
      error
    )
  }
}

async function fetchFromApi(): Promise<ModelsDevData> {
  diagnosticsService.logInfo(
    "models-dev-service",
    `Fetching models from ${MODELS_DEV_API_URL}`
  )

  const response = await fetch(MODELS_DEV_API_URL)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json() as ModelsDevData

  const providerCount = Object.keys(data).length
  const modelCount = Object.values(data).reduce(
    (sum, provider) => sum + Object.keys(provider.models || {}).length,
    0
  )

  diagnosticsService.logInfo(
    "models-dev-service",
    `Fetched ${providerCount} providers with ${modelCount} total models`
  )

  return data
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_REFRESH_INTERVAL
}

// ============================================================================
// Fuzzy Matching Utilities
// ============================================================================

/** Minimum score threshold for fuzzy matches to avoid bad matches */
const FUZZY_MATCH_MIN_SCORE = 50

/**
 * Normalize a model name for fuzzy matching.
 * Handles provider prefixes, date suffixes, version variations.
 */
function normalizeModelName(model: string): string {
  let normalized = model.toLowerCase()

  // Remove provider prefixes
  const prefixPatterns = [
    /^accounts\/[^/]+\/models\//,
    /^[a-z0-9]+\/[a-z0-9-]+\//,
    /^[a-z0-9-]+\//,
  ]
  for (const pattern of prefixPatterns) {
    if (pattern.test(normalized)) {
      normalized = normalized.replace(pattern, "")
      break
    }
  }

  // Remove date suffixes
  normalized = normalized.replace(/-\d{8}$/, "")
  normalized = normalized.replace(/-\d{4}-\d{2}-\d{2}$/, "")
  normalized = normalized.replace(/-\d{6}$/, "")

  // Remove version suffixes like ":latest", ":free", ":exacto"
  normalized = normalized.replace(/:[a-z]+$/, "")

  // Normalize version separators
  normalized = normalized.replace(/v(\d+)p(\d+)/g, "$1.$2")
  normalized = normalized.replace(/v(\d+)-(\d+)/g, "$1.$2")
  normalized = normalized.replace(/v(\d+)/g, "$1")

  // Insert hyphen between letters and digits where missing
  normalized = normalized.replace(/([a-z])(\d)/g, "$1-$2")

  return normalized
}

/**
 * Calculate a match score between a normalized model name and a candidate model ID.
 */
function calculateMatchScore(normalizedQuery: string, normalizedCandidate: string): number {
  if (normalizedQuery === normalizedCandidate) return 1000

  if (normalizedQuery.includes(normalizedCandidate)) {
    const position = normalizedQuery.indexOf(normalizedCandidate)
    const lengthScore = normalizedCandidate.length * 10
    const positionScore = normalizedQuery.length - position
    const boundaryBonus = (position === 0 || normalizedQuery[position - 1] === "-") ? 50 : 0
    return lengthScore + positionScore + boundaryBonus
  }

  if (normalizedCandidate.includes(normalizedQuery)) {
    const position = normalizedCandidate.indexOf(normalizedQuery)
    const lengthScore = normalizedQuery.length * 10
    const positionScore = normalizedCandidate.length - position
    const boundaryBonus = (position === 0 || normalizedCandidate[position - 1] === "-") ? 50 : 0
    return lengthScore + positionScore + boundaryBonus
  }

  return 0
}

/** Result of finding the best model match */
export interface ModelMatchResult {
  model: ModelsDevModel
  providerId: string
  matchType: "exact" | "fuzzy"
  score: number
}

/**
 * Find the best matching model using fuzzy matching.
 */
export function findBestModelMatch(
  modelId: string,
  providerId?: string
): ModelMatchResult | undefined {
  if (!inMemoryCache) {
    diagnosticsService.logInfo(
      "models-dev-service",
      "Cache not loaded, cannot find model match synchronously"
    )
    return undefined
  }

  const normalizedQuery = normalizeModelName(modelId)
  let bestMatch: ModelMatchResult | undefined

  const searchProvider = (provId: string, provider: ModelsDevProvider): void => {
    if (!provider.models) return

    for (const [candidateId, candidateModel] of Object.entries(provider.models)) {
      if (candidateId === modelId) {
        const score = 1000
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            model: candidateModel,
            providerId: provId,
            matchType: "exact",
            score,
          }
        }
        continue
      }

      const normalizedCandidate = normalizeModelName(candidateId)
      const score = calculateMatchScore(normalizedQuery, normalizedCandidate)

      if (score >= FUZZY_MATCH_MIN_SCORE && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          model: candidateModel,
          providerId: provId,
          matchType: "fuzzy",
          score,
        }
      }
    }
  }

  if (providerId) {
    const provider = inMemoryCache[providerId]
    if (provider) {
      searchProvider(providerId, provider)
    }
    if (!bestMatch) {
      for (const [provId, provider] of Object.entries(inMemoryCache)) {
        if (provId !== providerId) {
          searchProvider(provId, provider)
        }
      }
    }
  } else {
    for (const [provId, provider] of Object.entries(inMemoryCache)) {
      searchProvider(provId, provider)
    }
  }

  if (bestMatch) {
    diagnosticsService.logInfo(
      "models-dev-service",
      `findBestModelMatch: ${modelId} -> ${bestMatch.model.id} (${bestMatch.matchType}, provider: ${bestMatch.providerId}, score: ${bestMatch.score})`
    )
  }

  return bestMatch
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch models.dev data, using cache when available.
 */
export async function fetchModelsDevData(): Promise<ModelsDevData> {
  if (inMemoryCache && isCacheValid(lastFetchTimestamp)) {
    diagnosticsService.logInfo(
      "models-dev-service",
      "Returning data from in-memory cache"
    )
    return inMemoryCache
  }

  const diskCache = readCacheFromDisk()
  if (diskCache && isCacheValid(diskCache.timestamp)) {
    diagnosticsService.logInfo(
      "models-dev-service",
      "Returning data from disk cache"
    )
    inMemoryCache = diskCache.data
    lastFetchTimestamp = diskCache.timestamp
    return diskCache.data
  }

  try {
    const data = await fetchFromApi()
    inMemoryCache = data
    lastFetchTimestamp = Date.now()
    writeCacheToDisk(data)
    return data
  } catch (error) {
    diagnosticsService.logError(
      "models-dev-service",
      "Failed to fetch from API, falling back to cached data",
      error
    )

    if (diskCache) {
      diagnosticsService.logInfo(
        "models-dev-service",
        "Using expired disk cache as fallback"
      )
      inMemoryCache = diskCache.data
      lastFetchTimestamp = diskCache.timestamp
      return diskCache.data
    }

    throw new Error(
      `Failed to fetch models.dev data and no cache available: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Get a specific model by provider ID and model ID.
 */
export function getModelFromModelsDevByProviderId(
  modelId: string,
  providerId: string
): ModelsDevModel | undefined {
  if (!inMemoryCache) {
    diagnosticsService.logInfo(
      "models-dev-service",
      "Cache not loaded, cannot lookup model synchronously"
    )
    return undefined
  }

  const provider = inMemoryCache[providerId]
  if (provider?.models?.[modelId]) {
    diagnosticsService.logInfo(
      "models-dev-service",
      `Exact match found: ${modelId} in provider ${providerId}`
    )
    return provider.models[modelId]
  }

  const matchResult = findBestModelMatch(modelId, providerId)
  if (matchResult) {
    diagnosticsService.logInfo(
      "models-dev-service",
      `Fuzzy match used: ${modelId} -> ${matchResult.model.id} (${matchResult.matchType}, provider: ${matchResult.providerId}, score: ${matchResult.score})`
    )
    return matchResult.model
  }

  diagnosticsService.logInfo(
    "models-dev-service",
    `No match found for: ${modelId} in provider ${providerId}`
  )
  return undefined
}

/**
 * Force refresh the cache from the API.
 */
export async function refreshModelsDevCache(): Promise<void> {
  diagnosticsService.logInfo(
    "models-dev-service",
    "Force refreshing cache from API"
  )

  try {
    const data = await fetchFromApi()
    inMemoryCache = data
    lastFetchTimestamp = Date.now()
    writeCacheToDisk(data)

    diagnosticsService.logInfo(
      "models-dev-service",
      "Cache successfully refreshed"
    )
  } catch (error) {
    diagnosticsService.logError(
      "models-dev-service",
      "Failed to refresh cache",
      error
    )
    throw error
  }
}

/**
 * Initialize the models.dev service.
 * Call this on app startup to trigger background refresh if needed.
 */
export function initModelsDevService(): void {
  diagnosticsService.logInfo(
    "models-dev-service",
    "Initializing models.dev service"
  )

  const diskCache = readCacheFromDisk()
  if (diskCache) {
    inMemoryCache = diskCache.data
    lastFetchTimestamp = diskCache.timestamp
    diagnosticsService.logInfo(
      "models-dev-service",
      `Loaded cache from disk (age: ${Math.round((Date.now() - diskCache.timestamp) / 1000 / 60)} minutes)`
    )
  }

  if (!diskCache || !isCacheValid(diskCache.timestamp)) {
    diagnosticsService.logInfo(
      "models-dev-service",
      "Cache is stale or missing, triggering background refresh"
    )

    fetchModelsDevData().catch((error) => {
      diagnosticsService.logError(
        "models-dev-service",
        "Background refresh failed",
        error
      )
    })
  }
}
