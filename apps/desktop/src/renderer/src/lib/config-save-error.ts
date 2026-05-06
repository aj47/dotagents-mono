import { getSettingsSaveErrorMessage } from "@dotagents/shared/config-save-error"
import { toast } from "sonner"

export function reportConfigSaveError(error: unknown): void {
  console.error("Failed to save config:", error)
  toast.error(getSettingsSaveErrorMessage(error))
}
