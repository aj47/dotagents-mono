export default function Updater() {
  // Auto-updater is disabled in the main process, so keep the renderer surface inert
  // and avoid permanent background polling for a feature that cannot currently activate.
  return null
}
