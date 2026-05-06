import { useState, useMemo, useCallback } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { useConfigQuery, useSaveConfigMutation } from "@renderer/lib/queries"
import type { Config } from "@shared/types"
import type { ModelPreset } from "@dotagents/shared/providers"
import { toast } from "sonner"
import { Plus, Trash2, Key, Globe, Bot, Settings2 } from "lucide-react"
import {
  buildCustomModelPresetFromRequest,
  buildModelPresetDeleteUpdates,
  buildModelPresetEditUpdates,
  buildPresetModelSelectionUpdates,
  getMergedModelPresets,
  getModelPresetActivationUpdates,
} from "@dotagents/shared/model-presets"
import { DEFAULT_MODEL_PRESET_ID } from "@dotagents/shared/providers"
import { PresetModelSelector } from "./preset-model-selector"

export function ModelPresetManager({
  showAgentModel = true,
  showTranscriptCleanupModel = true,
}: {
  showAgentModel?: boolean
  showTranscriptCleanupModel?: boolean
} = {}) {
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<ModelPreset | null>(null)
  const [newPreset, setNewPreset] = useState<Partial<ModelPreset>>({
    name: "",
    baseUrl: "",
    apiKey: "",
    agentModel: "",
    transcriptProcessingModel: "",
  })

  const config = configQuery.data

  const allPresets = useMemo(
    () => (config ? getMergedModelPresets(config) : []),
    [config?.modelPresets, config?.openaiApiKey],
  )

  const currentPresetId = config?.currentModelPresetId || DEFAULT_MODEL_PRESET_ID
  const currentPreset = allPresets.find(p => p.id === currentPresetId)

  const saveConfig = useCallback((updates: Partial<Config>) => {
    saveConfigMutation.mutate({
      config: { ...config, ...updates },
    })
  }, [config, saveConfigMutation])

  // Save model selection to the current preset (called when user changes model)
  // Save model selection to both global config AND the current preset in a single save
  const saveModelWithPreset = useCallback((
    modelType: 'agentModel' | 'transcriptProcessingModel',
    globalConfigKey: 'agentOpenaiModel' | 'transcriptPostProcessingOpenaiModel',
    modelId: string
  ) => {
    if (!currentPresetId || !config) return

    saveConfig(buildPresetModelSelectionUpdates(config, currentPresetId, modelType, globalConfigKey, modelId) as Partial<Config>)
  }, [currentPresetId, config, saveConfig])

  const handlePresetChange = (presetId: string) => {
    const preset = allPresets.find(p => p.id === presetId)
    if (preset) {
      saveConfig(getModelPresetActivationUpdates(preset))
      toast.success(`Switched to preset: ${preset.name}`)
    }
  }

  const handleCreatePreset = () => {
    if (!newPreset.name?.trim()) {
      toast.error("Preset name is required")
      return
    }
    if (!newPreset.baseUrl?.trim()) {
      toast.error("Base URL is required")
      return
    }

    const now = Date.now()
    const preset = buildCustomModelPresetFromRequest(`custom-${now}`, {
      name: newPreset.name.trim(),
      baseUrl: newPreset.baseUrl.trim(),
      apiKey: newPreset.apiKey || "",
      agentModel: newPreset.agentModel || newPreset.mcpToolsModel || "",
      transcriptProcessingModel: newPreset.transcriptProcessingModel || "",
    }, now)

    const existingPresets = config?.modelPresets || []
    saveConfig({
      modelPresets: [...existingPresets, preset],
    })

    setIsCreateDialogOpen(false)
    setNewPreset({ name: "", baseUrl: "", apiKey: "", agentModel: "", transcriptProcessingModel: "" })
    toast.success("Preset created successfully")
  }

  const handleUpdatePreset = () => {
    if (!editingPreset || !config) return

    saveConfig(buildModelPresetEditUpdates(config, editingPreset, currentPresetId) as Partial<Config>)
    setIsEditDialogOpen(false)
    setEditingPreset(null)
    toast.success("Preset updated successfully")
  }

  const handleDeletePreset = (preset: ModelPreset) => {
    if (!config) return
    if (preset.isBuiltIn) {
      toast.error("Cannot delete built-in presets")
      return
    }
    if (confirm(`Delete preset "${preset.name}"?`)) {
      saveConfig(buildModelPresetDeleteUpdates(config, preset.id, currentPresetId) as Partial<Config>)
      toast.success("Preset deleted")
    }
  }

  const handleEditPreset = (preset: ModelPreset) => {
    setEditingPreset({ ...preset })
    setIsEditDialogOpen(true)
  }

  if (!config) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>OpenAI-Compatible Preset</Label>
        <div className="flex gap-2">
          {currentPreset && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditPreset(currentPreset)}
            >
              <Settings2 className="h-3 w-3 mr-1" />
              {currentPreset.isBuiltIn ? "Configure" : "Edit"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            New Preset
          </Button>
        </div>
      </div>

      <Select value={currentPresetId} onValueChange={handlePresetChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a preset" />
        </SelectTrigger>
        <SelectContent>
          {allPresets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <div className="flex items-center gap-2">
                <span>{preset.name}</span>
                {preset.isBuiltIn && (
                  <span className="text-xs text-muted-foreground">(Built-in)</span>
                )}
                {preset.apiKey && (
                  <Key className="h-3 w-3 text-green-500" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentPreset && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="truncate">{currentPreset.baseUrl || "No URL set"}</span>
          </div>

          {/* Inline model selectors - changes are auto-saved to preset */}
          <div className="space-y-3">
            {showAgentModel && (
              <PresetModelSelector
                presetId={currentPreset.id}
                baseUrl={currentPreset.baseUrl}
                apiKey={currentPreset.apiKey}
                value={config?.agentOpenaiModel || config?.mcpToolsOpenaiModel || ""}
                onValueChange={(value) => {
                  saveModelWithPreset('agentModel', 'agentOpenaiModel', value)
                }}
                label="Agent Model"
                placeholder="Select model"
              />
            )}
            {showTranscriptCleanupModel && (
              <PresetModelSelector
                presetId={currentPreset.id}
                baseUrl={currentPreset.baseUrl}
                apiKey={currentPreset.apiKey}
                value={config?.transcriptPostProcessingOpenaiModel || ""}
                onValueChange={(value) => {
                  saveModelWithPreset('transcriptProcessingModel', 'transcriptPostProcessingOpenaiModel', value)
                }}
                label="Transcript Processing Model"
                placeholder="Select model"
              />
            )}
          </div>

          {!currentPreset.isBuiltIn && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeletePreset(currentPreset)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete Preset
            </Button>
          )}
        </div>
      )}

      {/* Create Preset Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Preset</DialogTitle>
            <DialogDescription>
              Create a custom preset with its own API key, base URL, and model preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={newPreset.name}
                onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                placeholder="e.g., My OpenRouter"
              />
            </div>
            <div>
              <Label htmlFor="preset-url">API Base URL</Label>
              <Input
                id="preset-url"
                type="url"
                value={newPreset.baseUrl}
                onChange={(e) => setNewPreset({ ...newPreset, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
            </div>
            <div>
              <Label htmlFor="preset-key">API Key</Label>
              <Input
                id="preset-key"
                type="password"
                value={newPreset.apiKey}
                onChange={(e) => setNewPreset({ ...newPreset, apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>

            {/* Model Preferences Section */}
            {newPreset.baseUrl && newPreset.apiKey && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Model Preferences (Optional)</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Set default models that will be selected when switching to this preset.
                </p>

                <div className="space-y-4">
                  <PresetModelSelector
                    presetId="new-preset"
                    baseUrl={newPreset.baseUrl || ""}
                    apiKey={newPreset.apiKey || ""}
                    value={newPreset.agentModel || newPreset.mcpToolsModel || ""}
                    onValueChange={(value) =>
                      setNewPreset({ ...newPreset, agentModel: value })
                    }
                    label="Agent Model"
                    placeholder="Select model for agent mode"
                  />

                  <PresetModelSelector
                    presetId="new-preset"
                    baseUrl={newPreset.baseUrl || ""}
                    apiKey={newPreset.apiKey || ""}
                    value={newPreset.transcriptProcessingModel || ""}
                    onValueChange={(value) =>
                      setNewPreset({ ...newPreset, transcriptProcessingModel: value })
                    }
                    label="Transcript Processing Model"
                    placeholder="Select model for transcript processing"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePreset} disabled={saveConfigMutation.isPending}>
              Create Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Preset Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPreset?.isBuiltIn ? "Configure Preset" : "Edit Preset"}
            </DialogTitle>
            <DialogDescription>
              {editingPreset?.isBuiltIn
                ? "Set the API key and model preferences for this built-in preset."
                : "Update the preset settings and model preferences."}
            </DialogDescription>
          </DialogHeader>
          {editingPreset && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-preset-name">Preset Name</Label>
                <Input
                  id="edit-preset-name"
                  value={editingPreset.name}
                  onChange={(e) =>
                    setEditingPreset({ ...editingPreset, name: e.target.value })
                  }
                  disabled={editingPreset.isBuiltIn}
                />
              </div>
              <div>
                <Label htmlFor="edit-preset-url">API Base URL</Label>
                <Input
                  id="edit-preset-url"
                  type="url"
                  value={editingPreset.baseUrl}
                  onChange={(e) =>
                    setEditingPreset({ ...editingPreset, baseUrl: e.target.value })
                  }
                  disabled={editingPreset.isBuiltIn}
                />
              </div>
              <div>
                <Label htmlFor="edit-preset-key">API Key</Label>
                <Input
                  id="edit-preset-key"
                  type="password"
                  value={editingPreset.apiKey}
                  onChange={(e) =>
                    setEditingPreset({ ...editingPreset, apiKey: e.target.value })
                  }
                  placeholder="sk-..."
                />
              </div>

              {/* Model Preferences Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Model Preferences</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Optionally set default models for this preset. When switching to this preset, these models will be selected automatically.
                </p>

                <div className="space-y-4">
                  <PresetModelSelector
                    presetId={editingPreset.id}
                    baseUrl={editingPreset.baseUrl}
                    apiKey={editingPreset.apiKey}
                    value={editingPreset.agentModel || editingPreset.mcpToolsModel || ""}
                    onValueChange={(value) =>
                      setEditingPreset({ ...editingPreset, agentModel: value })
                    }
                    label="Agent Model"
                    placeholder="Select model for agent mode"
                  />

                  <PresetModelSelector
                    presetId={editingPreset.id}
                    baseUrl={editingPreset.baseUrl}
                    apiKey={editingPreset.apiKey}
                    value={editingPreset.transcriptProcessingModel || ""}
                    onValueChange={(value) =>
                      setEditingPreset({ ...editingPreset, transcriptProcessingModel: value })
                    }
                    label="Transcript Processing Model"
                    placeholder="Select model for transcript processing"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePreset} disabled={saveConfigMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
