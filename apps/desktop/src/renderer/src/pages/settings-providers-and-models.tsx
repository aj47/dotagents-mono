// Compose the existing Providers and Models settings into a single view
import { Component as ProvidersSettings } from "./settings-providers"
import { Component as ModelsSettings } from "./settings-models"

export function Component() {
  return (
    <>
      <ProvidersSettings />
      <ModelsSettings />
    </>
  )
}

