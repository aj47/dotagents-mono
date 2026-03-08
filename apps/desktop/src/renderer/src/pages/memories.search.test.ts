import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const memoriesSource = readFileSync(
  new URL("./memories.tsx", import.meta.url),
  "utf8",
)
const compactMemoriesSource = memoriesSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactMemoriesSource).toContain(fragment.replace(/\s+/g, ""))
}

describe("memories page search guardrails", () => {
  it("debounces backend search and keys results by the settled query", () => {
    expectSourceToContain("const MEMORY_SEARCH_DEBOUNCE_MS = 250")
    expectSourceToContain("const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(\"\")")
    expectSourceToContain("setDebouncedSearchQuery(trimmedSearchQuery)")
    expectSourceToContain("MEMORY_SEARCH_DEBOUNCE_MS")
    expectSourceToContain('queryKey: ["memories", "search", debouncedSearchQuery]')
    expectSourceToContain("enabled: debouncedSearchQuery.length > 0")
    expectSourceToContain("placeholderData: (previousData) => previousData")
  })

  it("keeps loading feedback visible without flashing a false empty state while search settles", () => {
    expectSourceToContain("const isSearchLoading = trimmedSearchQuery.length > 0")
    expectSourceToContain("trimmedSearchQuery !== debouncedSearchQuery || searchResultsQuery.isFetching")
    expectSourceToContain("searchResultsQuery.data ?? (isSearchLoading ? memories : [])")
    expectSourceToContain("{isSearchLoading ? (")
    expectSourceToContain("<Loader2 className=\"absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground\" />")
  })
})