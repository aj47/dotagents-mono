import { AlertTriangle, CheckSquare2, Loader2, Square } from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import { Label } from "@renderer/components/ui/label"
import { Switch } from "@renderer/components/ui/switch"
import { cn } from "~/lib/utils"
import {
  DEFAULT_BUNDLE_COMPONENT_SELECTION as DEFAULT_EXPORT_COMPONENTS,
  EMPTY_BUNDLE_ITEM_SELECTION as EMPTY_BUNDLE_SELECTION,
  createBundleItemSelection as createDetailedBundleSelection,
  getBundleDependencyWarnings,
  type DetailedBundleItemSelection as BundleDetailedSelectionState,
  type ExportableBundleItems as BundleExportableItems,
  type RequiredBundleComponentSelection as BundleComponentSelectionState,
} from "@dotagents/shared/bundle-api"

export {
  DEFAULT_EXPORT_COMPONENTS,
  EMPTY_BUNDLE_SELECTION,
  createDetailedBundleSelection,
  getBundleDependencyWarnings,
}

export type {
  BundleComponentSelectionState,
  BundleDetailedSelectionState,
  BundleExportableItems,
}

interface BundleDetailedSelectionCardProps {
  items?: BundleExportableItems
  loading?: boolean
  loadError?: string | null
  components: BundleComponentSelectionState
  setComponents: (components: BundleComponentSelectionState) => void
  selection: BundleDetailedSelectionState
  setSelection: (selection: BundleDetailedSelectionState) => void
  title?: string
  description?: string
}

export function BundleDetailedSelectionCard({
  items,
  loading = false,
  loadError,
  components,
  setComponents,
  selection,
  setSelection,
  title = "Bundle contents",
  description = "Choose exactly which items are included in the exported bundle.",
}: BundleDetailedSelectionCardProps) {
  const warnings = getBundleDependencyWarnings(items, components, selection)

  const renderSection = <T,>({
    componentKey,
    selectionKey,
    label,
    description,
    items,
    getId,
    getPrimary,
    getSecondary,
  }: {
    componentKey: keyof BundleComponentSelectionState
    selectionKey: keyof BundleDetailedSelectionState
    label: string
    description: string
    items: T[]
    getId: (item: T) => string
    getPrimary: (item: T) => string
    getSecondary?: (item: T) => string | undefined
  }) => {
    const selectedIds = selection[selectionKey]
    const selectedIdSet = new Set(selectedIds)
    const enabled = components[componentKey]
    const allIds = items.map(getId)

    const setSelectedIds = (nextIds: string[]) => {
      setSelection({ ...selection, [selectionKey]: nextIds })
    }

    return (
      <div key={String(componentKey)} className="space-y-3 rounded-md border p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 pr-4">
            <div className="text-sm font-medium">{label}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
            <p className="text-[11px] text-muted-foreground">
              {enabled ? `${selectedIds.length} of ${items.length} selected` : "Excluded from export"}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => setComponents({ ...components, [componentKey]: checked })}
            aria-label={`Include ${label} in bundle`}
          />
        </div>

        {enabled && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setSelectedIds(allIds)}>
                Select all
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                No {label.toLowerCase()} available in the current config.
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto rounded-md border">
                <div className="space-y-1 p-2">
                  {items.map((item) => {
                    const id = getId(item)
                    const selected = selectedIdSet.has(id)
                    const secondary = getSecondary?.(item)

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedIds(
                            selected
                              ? selectedIds.filter((value) => value !== id)
                              : [...selectedIds, id]
                          )
                        }}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                          selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60"
                        )}
                      >
                        {selected ? (
                          <CheckSquare2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{getPrimary(item)}</div>
                          {secondary && <div className="text-xs text-muted-foreground">{secondary}</div>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium">{title}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading exportable items…
        </div>
      ) : loadError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          Failed to load exportable items: {loadError}
        </div>
      ) : !items ? (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No exportable items loaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {renderSection({
            componentKey: "agentProfiles",
            selectionKey: "agentProfileIds",
            label: "Agents",
            description: "Agent definitions and their non-secret configuration.",
            items: items.agentProfiles,
            getId: (item) => item.id,
            getPrimary: (item) => item.displayName || item.name,
            getSecondary: (item) => [
              item.displayName && item.displayName !== item.name ? item.name : null,
              item.role || null,
              item.enabled ? "enabled" : "disabled",
            ].filter(Boolean).join(" • "),
          })}

          {renderSection({
            componentKey: "mcpServers",
            selectionKey: "mcpServerNames",
            label: "MCP servers",
            description: "Server connections and non-secret settings with secrets stripped.",
            items: items.mcpServers,
            getId: (item) => item.name,
            getPrimary: (item) => item.name,
            getSecondary: (item) => [item.transport || "unknown transport", item.enabled === false ? "disabled" : "enabled"].join(" • "),
          })}

          {renderSection({
            componentKey: "skills",
            selectionKey: "skillIds",
            label: "Skills",
            description: "Skill instructions and metadata.",
            items: items.skills,
            getId: (item) => item.id,
            getPrimary: (item) => item.name,
            getSecondary: (item) => item.description,
          })}

          {renderSection({
            componentKey: "repeatTasks",
            selectionKey: "repeatTaskIds",
            label: "Repeat tasks",
            description: "Scheduled task prompts and cadence.",
            items: items.repeatTasks,
            getId: (item) => item.id,
            getPrimary: (item) => item.name,
            getSecondary: (item) => `${item.intervalMinutes} min • ${item.enabled ? "enabled" : "disabled"}`,
          })}

          {renderSection({
            componentKey: "knowledgeNotes",
            selectionKey: "knowledgeNoteIds",
            label: "Knowledge notes",
            description: "Knowledge note content and notes.",
            items: items.knowledgeNotes,
            getId: (item) => item.id,
            getPrimary: (item) => item.title,
            getSecondary: (item) => item.summary || item.context,
          })}

          {warnings.length > 0 && (
            <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-100">
                <AlertTriangle className="h-4 w-4" /> Dependency warnings
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-amber-800 dark:text-amber-200">
                {warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
