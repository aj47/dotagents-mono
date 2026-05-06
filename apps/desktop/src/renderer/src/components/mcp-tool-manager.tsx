import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card"
import { Switch } from "@renderer/components/ui/switch"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@renderer/components/ui/dialog"

import {
  Search,
  ChevronDown,
  ChevronRight,
  Settings,
  Server,
  Wrench,
  Eye,
  EyeOff,
  Power,
  PowerOff,
} from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { toast } from "sonner"
import type { DetailedToolInfo } from "@dotagents/shared/mcp-utils"

type DetailedTool = DetailedToolInfo

interface MCPToolManagerProps {
  onToolToggle?: (toolName: string, enabled: boolean) => void
}

export function MCPToolManager({ onToolToggle }: MCPToolManagerProps) {
  const [tools, setTools] = useState<DetailedTool[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())
  const [showDisabledTools, setShowDisabledTools] = useState(true)

  // Fetch tools periodically
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const toolList = await tipcClient.getMcpDetailedToolList({})
        setTools(toolList as any)
      } catch (error) {}
    }

    fetchTools()
    const interval = setInterval(fetchTools, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Filter tools to only include those from enabled servers
  const toolsFromEnabledSources = tools.filter((tool) => tool.serverEnabled)

  // Group tools by source (real MCP server or DotAgents runtime tools)
  const toolsBySource = toolsFromEnabledSources.reduce(
    (acc, tool) => {
      if (!acc[tool.sourceName]) {
        acc[tool.sourceName] = []
      }
      acc[tool.sourceName].push(tool)
      return acc
    },
    {} as Record<string, DetailedTool[]>,
  )

  // Filter tools based on search and server selection
  const filteredToolsBySource = (Object.entries(toolsBySource) as Array<[string, DetailedTool[]]>).reduce<Record<string, DetailedTool[]>>(
    (acc, [sourceName, sourceTools]) => {
      if (selectedSource !== "all" && sourceName !== selectedSource) {
        return acc
      }

      const filteredTools = sourceTools.filter((tool) => {
        const matchesSearch =
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesVisibility = showDisabledTools || tool.enabled
        return matchesSearch && matchesVisibility
      })

      if (filteredTools.length > 0) {
        acc[sourceName] = filteredTools
      }

      return acc
    },
    {},
  )

  const handleToolToggle = async (toolName: string, enabled: boolean) => {
    try {
      // Update local state immediately for better UX
      setTools((prevTools) =>
        prevTools.map((tool) =>
          tool.name === toolName ? { ...tool, enabled } : tool,
        ),
      )

      // Call the backend API
      const result = await tipcClient.setMcpToolEnabled({ toolName, enabled })

      if ((result as any).success) {
        // Call the callback if provided
        if (onToolToggle) {
          onToolToggle(toolName, enabled)
        }
        toast.success(`Tool ${toolName} ${enabled ? "enabled" : "disabled"}`)
      } else {
        // Revert local state if backend call failed
        setTools((prevTools) =>
          prevTools.map((tool) =>
            tool.name === toolName ? { ...tool, enabled: !enabled } : tool,
          ),
        )
        toast.error(
          `Failed to ${enabled ? "enable" : "disable"} tool ${toolName}`,
        )
      }
    } catch (error) {
      // Revert local state on error
      setTools((prevTools) =>
        prevTools.map((tool) =>
          tool.name === toolName ? { ...tool, enabled: !enabled } : tool,
        ),
      )
      toast.error(`Error toggling tool: ${error.message}`)
    }
  }

  const toggleSourceExpansion = (sourceName: string) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sourceName)) {
        newSet.delete(sourceName)
      } else {
        newSet.add(sourceName)
      }
      return newSet
    })
  }

  const handleToggleAllTools = async (sourceName: string, enable: boolean) => {
    const sourceTools = tools.filter((tool) => tool.sourceName === sourceName)
    if (sourceTools.length === 0) return
    const sourceLabel = sourceTools[0]?.sourceLabel || sourceName

    // Update local state immediately for better UX
    const updatedTools = tools.map((tool) => {
      if (tool.sourceName === sourceName) {
        return { ...tool, enabled: enable }
      }
      return tool
    })
    setTools(updatedTools)

    // Track promises for all backend calls
    const promises = sourceTools.map((tool) =>
      tipcClient.setMcpToolEnabled({ toolName: tool.name, enabled: enable }),
    )

    try {
      const results = await Promise.allSettled(promises)
      // A fulfilled promise with { success: false } (e.g. essential tool that
      // cannot be disabled) should also be treated as a failure.
      const successful = results.filter(
        (r) => r.status === "fulfilled" && (r.value as any)?.success,
      ).length
      const failed = results.length - successful

      if (failed === 0) {
        toast.success(
          `All ${sourceTools.length} tools for ${sourceLabel} ${enable ? "enabled" : "disabled"}`,
        )
      } else {
        // Revert local state for failed calls (rejected OR success:false)
        const failedTools = sourceTools.filter(
          (_, index) => {
            const r = results[index]
            return r.status === "rejected" || !(r.value as any)?.success
          },
        )
        const revertedTools = tools.map((tool) => {
          if (tool.sourceName === sourceName && failedTools.includes(tool)) {
            return { ...tool, enabled: !enable }
          }
          return tool
        })
        setTools(revertedTools)

        toast.warning(
          `${successful}/${sourceTools.length} tools ${enable ? "enabled" : "disabled"} for ${sourceLabel} (${failed} failed)`,
        )
      }
    } catch (error) {
      // Revert all tools on error
      const revertedTools = tools.map((tool) => {
        if (tool.sourceName === sourceName) {
          return { ...tool, enabled: !enable }
        }
        return tool
      })
      setTools(revertedTools)
      toast.error(`Error toggling tools for ${sourceLabel}: ${error.message}`)
    }
  }

  const sourceNames = Object.keys(toolsBySource)
  const totalTools = toolsFromEnabledSources.length
  const enabledTools = toolsFromEnabledSources.filter((tool) => tool.enabled).length

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="text-lg font-medium">Tool Management</h3>
          <Badge variant="secondary" className="shrink-0 text-sm">
            {enabledTools}/{totalTools} enabled
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDisabledTools(!showDisabledTools)}
            className="gap-2"
          >
            {showDisabledTools ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showDisabledTools ? "Hide Disabled" : "Show All"}
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Sources</option>
            {sourceNames.map((sourceName) => (
              <option key={sourceName} value={sourceName}>
                {toolsBySource[sourceName][0]?.sourceLabel || sourceName} ({toolsBySource[sourceName].length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tools List */}
      <div className="space-y-4">
        {Object.keys(filteredToolsBySource).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Settings className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                {tools.length === 0
                  ? "No tools available."
                  : toolsFromEnabledSources.length === 0
                    ? "No tools from enabled sources. Enable an MCP server or runtime tool source to see its tools."
                    : "No tools match your search criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(filteredToolsBySource).map(
            ([sourceName, sourceTools]) => (
              <Card key={sourceName}>
                <CardHeader
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => toggleSourceExpansion(sourceName)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {expandedSources.has(sourceName) ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      {sourceTools[0]?.sourceKind === "runtime"
                        ? <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
                        : <Server className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <CardTitle className="truncate text-base">{sourceTools[0]?.sourceLabel || sourceName}</CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {sourceTools.filter((t) => t.enabled).length}/
                        {sourceTools.length} enabled
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleAllTools(sourceName, true)
                        }}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Power className="h-3 w-3" />
                        All ON
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleAllTools(sourceName, false)
                        }}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <PowerOff className="h-3 w-3" />
                        All OFF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedSources.has(sourceName) && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {sourceTools.map((tool) => (
                        <div
                          key={tool.name}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="truncate text-sm font-medium">
                                {tool.name.includes(":")
                                  ? tool.name.split(":").slice(1).join(":")
                                  : tool.name}
                              </h4>
                              {!tool.enabled && (
                                <Badge variant="outline" className="text-xs">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {tool.description}
                            </p>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl w-[90vw] max-h-[85vh] overflow-y-auto">
                                <DialogHeader className="min-w-0">
                                  <DialogTitle className="break-words">{tool.name}</DialogTitle>
                                  <DialogDescription className="break-words">
                                    {tool.description}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 min-w-0">
                                  <div className="min-w-0">
                                    <Label className="text-sm font-medium">
                                      Input Schema
                                    </Label>
                                    <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-words">
                                      {JSON.stringify(
                                        tool.inputSchema,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Switch
                              checked={tool.enabled}
                              onCheckedChange={(enabled) =>
                                handleToolToggle(tool.name, enabled)
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ),
          )
        )}
      </div>
    </div>
  )
}
