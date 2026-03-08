import { useLocation } from "react-router-dom"
import { Component as ModelsSettings } from "./settings-models"
import { SettingsProvidersContent } from "./settings-providers"

export function Component() {
  const location = useLocation()
  const isModelsRoute = location.pathname === "/settings/models"

  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
      <div className="grid gap-4">
        {isModelsRoute && <ModelsSettings />}
        <SettingsProvidersContent />
      </div>
    </div>
  )
}

