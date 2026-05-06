import {
  checkOperatorUpdaterAction,
  downloadLatestOperatorUpdateAssetAction,
  getOperatorUpdaterAction,
  openOperatorReleasesPageAction,
  openOperatorUpdateAssetAction,
  revealOperatorUpdateAssetAction,
  type OperatorUpdaterActionOptions,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import {
  MANUAL_RELEASES_URL,
  checkForUpdatesAndDownload,
  downloadLatestReleaseAsset,
  getUpdateInfo,
  openManualReleasesPage,
  openDownloadedReleaseAsset,
  revealDownloadedReleaseAsset,
} from "./updater"

export type OperatorUpdaterActionResult = OperatorRouteActionResult

const updaterActionOptions: OperatorUpdaterActionOptions = {
  service: {
    getUpdateInfo,
    checkForUpdatesAndDownload,
    downloadLatestReleaseAsset,
    revealDownloadedReleaseAsset,
    openDownloadedReleaseAsset,
    openManualReleasesPage,
  },
}

export function getOperatorUpdater(currentVersion: string): OperatorUpdaterActionResult {
  return getOperatorUpdaterAction(currentVersion, MANUAL_RELEASES_URL, updaterActionOptions)
}

export async function checkOperatorUpdater(): Promise<OperatorUpdaterActionResult> {
  return checkOperatorUpdaterAction(MANUAL_RELEASES_URL, updaterActionOptions)
}

export async function downloadLatestOperatorUpdateAsset(): Promise<OperatorUpdaterActionResult> {
  return downloadLatestOperatorUpdateAssetAction(updaterActionOptions)
}

export async function revealOperatorUpdateAsset(): Promise<OperatorUpdaterActionResult> {
  return revealOperatorUpdateAssetAction(updaterActionOptions)
}

export async function openOperatorUpdateAsset(): Promise<OperatorUpdaterActionResult> {
  return openOperatorUpdateAssetAction(updaterActionOptions)
}

export async function openOperatorReleasesPage(): Promise<OperatorUpdaterActionResult> {
  return openOperatorReleasesPageAction(updaterActionOptions)
}
