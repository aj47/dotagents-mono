import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./mcp-tool-manager.tsx", import.meta.url), "utf8")

function getBlock(startMarker: string, endMarker: string) {
	const start = source.indexOf(startMarker)
	const end = source.indexOf(endMarker, start)
	return source.slice(start, end)
}

describe("desktop MCP tool manager load states", () => {
	it("shows loading and retryable error UI instead of a misleading empty state on fetch failures", () => {
		expect(source).toContain("const [isLoadingTools, setIsLoadingTools] = useState(true)")
		expect(source).toContain("const [toolsLoadError, setToolsLoadError] = useState<string | null>(null)")
		expect(source).toContain('console.error("[MCPToolManager] Failed to load tool list:", error)')
		expect(source).toContain("setToolsLoadError(getToolLoadErrorMessage(error))")
		expect(source).toContain("setToolsLoadError(null)")
		expect(source).toContain("Loading MCP tools...")
		expect(source).toContain("Failed to load MCP tools")
		expect(source).toContain("Please check your MCP server configuration and try again.")
		expect(source).toContain("fetchTools({ showLoadingIndicator: true })")
		expect(source).toContain("No tools available. Configure MCP servers to see tools.")
	})

	it("restores each failed per-server bulk toggle to its original enabled state", () => {
		const bulkToggleBlock = getBlock(
			"const handleToggleAllTools = async (serverName: string, enable: boolean) => {",
			"const serverNames = Object.keys(toolsByServer)",
		)

		expect(bulkToggleBlock).toContain("const originalStates = new Map<string, boolean>()")
		expect(bulkToggleBlock).toContain("originalStates.set(tool.name, tool.enabled)")
		expect(bulkToggleBlock).toContain("const revertedTools = updatedTools.map((tool) => {")
		expect(bulkToggleBlock).toContain("enabled: originalStates.get(tool.name) ?? tool.enabled")
	})
})