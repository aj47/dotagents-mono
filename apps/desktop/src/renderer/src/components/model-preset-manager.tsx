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
import {
  APP_SHELL_MODEL_PRESET_PRESENTATION,
  getAppShellModelPresetDeleteConfirmMessage,
  getAppShellModelPresetEditorDescription,
  getAppShellModelPresetEditorTitle,
} from "@dotagents/shared/app-shell"

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
      toast.success(`${APP_SHELL_MODEL_PRESET_PRESENTATION.toasts.switchedPrefix}: ${preset.name}`)
    }
  }

  const handleCreatePreset = () => {
    if (!newPreset.name?.trim()) {
      toast.error(APP_SHELL_MODEL_PRESET_PRESENTATION.validation.nameRequired)
      return
    }
    if (!newPreset.baseUrl?.trim()) {
      toast.error(APP_SHELL_MODEL_PRESET_PRESENTATION.validation.baseUrlRequired)
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
    toast.success(APP_SHELL_MODEL_PRESET_PRESENTATION.toasts.created)
  }

  const handleUpdatePreset = () => {
    if (!editingPreset || !config) return

    saveConfig(buildModelPresetEditUpdates(config, editingPreset, currentPresetId) as Partial<Config>)
    setIsEditDialogOpen(false)
    setEditingPreset(null)
    toast.success(APP_SHELL_MODEL_PRESET_PRESENTATION.toasts.updated)
  }

  const handleDeletePreset = (preset: ModelPreset) => {
    if (!config) return
    if (preset.isBuiltIn) {
      toast.error(APP_SHELL_MODEL_PRESET_PRESENTATION.toasts.cannotDeleteBuiltIn)
      return
    }
    if (confirm(getAppShellModelPresetDeleteConfirmMessage(preset.name))) {
      saveConfig(buildModelPresetDeleteUpdates(config, preset.id, currentPresetId) as Partial<Config>)
      toast.success(APP_SHELL_MODEL_PRESET_PRESENTATION.toasts.deleted)
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
        <Label>{APP_SHELL_MODEL_PRESET_PRESENTATION.manager.title}</Label>
        <div className="flex gap-2">
          {currentPreset && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditPreset(currentPreset)}
            >
              <Settings2 className="h-3 w-3 mr-1" />
              {currentPreset.isBuiltIn
                ? APP_SHELL_MODEL_PRESET_PRESENTATION.actions.configure
                : APP_SHELL_MODEL_PRESET_PRESENTATION.actions.edit}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            {APP_SHELL_MODEL_PRESET_PRESENTATION.actions.newPreset}
          </Button>
        </div>
      </div>

      <Select value={currentPresetId} onValueChange={handlePresetChange}>
        <SelectTrigger>
          <SelectValue placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.manager.selectPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {allPresets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <div className="flex items-center gap-2">
                <span>{preset.name}</span>
                {preset.isBuiltIn && (
                  <span className="text-xs text-muted-foreground">({APP_SHELL_MODEL_PRESET_PRESENTATION.manager.builtInBadge})</span>
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
            <span className="truncate">{currentPreset.baseUrl || APP_SHELL_MODEL_PRESET_PRESENTATION.manager.noUrlLabel}</span>
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
                label={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.agentModel.label}
                placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.agentModel.placeholder}
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
                label={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.transcriptProcessingModel.label}
                placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.transcriptProcessingModel.placeholder}
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
              {APP_SHELL_MODEL_PRESET_PRESENTATION.actions.deletePreset}
            </Button>
          )}
        </div>
      )}

      {/* Create Preset Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getAppShellModelPresetEditorTitle("create")}</DialogTitle>
            <DialogDescription>
              {APP_SHELL_MODEL_PRESET_PRESENTATION.editor.createDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="preset-name">{APP_SHELL_MODEL_PRESET_PRESENTATION.fields.name.label}</Label>
              <Input
                id="preset-name"
                value={newPreset.name}
                onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.name.placeholder}
              />
            </div>
            <div>
              <Label htmlFor="preset-url">{APP_SHELL_MODEL_PRESET_PRESENTATION.fields.baseUrl.label}</Label>
              <Input
                id="preset-url"
                type="url"
                value={newPreset.baseUrl}
                onChange={(e) => setNewPreset({ ...newPreset, baseUrl: e.target.value })}
                placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.baseUrl.placeholder}
              />
            </div>
            <div>
              <Label htmlFor="preset-key">{APP_SHELL_MODEL_PRESET_PRESENTATION.fields.apiKey.label}</Label>
              <Input
                id="preset-key"
                type="password"
                value={newPreset.apiKey}
                onChange={(e) => setNewPreset({ ...newPreset, apiKey: e.target.value })}
                placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.apiKey.placeholder}
              />
            </div>

            {/* Model Preferences Section */}
            {newPreset.baseUrl && newPreset.apiKey && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {APP_SHELL_MODEL_PRESET_PRESENTATION.modelPreferences.createTitle}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {APP_SHELL_MODEL_PRESET_PRESENTATION.modelPreferences.createDescription}
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
                    label={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.agentModel.label}
                    placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.agentModel.placeholder}
                  />

                  <PresetModelSelector
                    presetId="new-preset"
                    baseUrl={newPreset.baseUrl || ""}
                    apiKey={newPreset.apiKey || ""}
                    value={newPreset.transcriptProcessingModel || ""}
                    onValueChange={(value) =>
                      setNewPreset({ ...newPreset, transcriptProcessingModel: value })
                    }
                    label={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.transcriptProcessingModel.label}
                    placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.transcriptProcessingModel.placeholder}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {APP_SHELL_MODEL_PRESET_PRESENTATION.actions.cancel}
            </Button>
            <Button onClick={handleCreatePreset} disabled={saveConfigMutation.isPending}>
              {APP_SHELL_MODEL_PRESET_PRESENTATION.actions.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Preset Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {getAppShellModelPresetEditorTitle("edit", editingPreset?.isBuiltIn)}
            </DialogTitle>
            <DialogDescription>
              {getAppShellModelPresetEditorDescription(!!editingPreset?.isBuiltIn)}
            </DialogDescription>
          </DialogHeader>
          {editingPreset && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-preset-name">{APP_SHELL_MODEL_PRESET_PRESENTATION.fields.name.label}</Label>
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
                <Label htmlFor="edit-preset-url">{APP_SHELL_MODEL_PRESET_PRESENTATION.fields.baseUrl.label}</Label>
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
                <Label htmlFor="edit-preset-key">{APP_SHELL_MODEL_PRESET_PRESENTATION.fields.apiKey.label}</Label>
                <Input
                  id="edit-preset-key"
                  type="password"
                  value={editingPreset.apiKey}
                  onChange={(e) =>
                    setEditingPreset({ ...editingPreset, apiKey: e.target.value })
                  }
                  placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.apiKey.placeholder}
                />
              </div>

              {/* Model Preferences Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {APP_SHELL_MODEL_PRESET_PRESENTATION.modelPreferences.editTitle}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {APP_SHELL_MODEL_PRESET_PRESENTATION.modelPreferences.editDescription}
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
                    label={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.agentModel.label}
                    placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.agentModel.placeholder}
                  />

                  <PresetModelSelector
                    presetId={editingPreset.id}
                    baseUrl={editingPreset.baseUrl}
                    apiKey={editingPreset.apiKey}
                    value={editingPreset.transcriptProcessingModel || ""}
                    onValueChange={(value) =>
                      setEditingPreset({ ...editingPreset, transcriptProcessingModel: value })
                    }
                    label={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.transcriptProcessingModel.label}
                    placeholder={APP_SHELL_MODEL_PRESET_PRESENTATION.fields.transcriptProcessingModel.placeholder}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {APP_SHELL_MODEL_PRESET_PRESENTATION.actions.cancel}
            </Button>
            <Button onClick={handleUpdatePreset} disabled={saveConfigMutation.isPending}>
              {APP_SHELL_MODEL_PRESET_PRESENTATION.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
