import {
  buildOperatorActionAuditContext,
  buildOperatorActionErrorResponse,
  buildOperatorDownloadedAssetActionResponse,
  buildOperatorOpenReleasesActionResponse,
  buildOperatorUpdaterCheckActionResponse,
  buildOperatorUpdaterDownloadLatestActionResponse,
  buildOperatorUpdaterStatus,
  type OperatorActionAuditContext,
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
import { getErrorMessage } from "./error-utils"

export type OperatorUpdaterActionResult = OperatorRouteActionResult

function ok(body: unknown, auditContext?: OperatorActionAuditContext): OperatorUpdaterActionResult {
  return {
    statusCode: 200,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

export function getOperatorUpdater(currentVersion: string): OperatorUpdaterActionResult {
  return ok(buildOperatorUpdaterStatus({
    currentVersion,
    updateInfo: getUpdateInfo(),
    manualReleasesUrl: MANUAL_RELEASES_URL,
  }))
}

export async function checkOperatorUpdater(): Promise<OperatorUpdaterActionResult> {
  const result = await checkForUpdatesAndDownload()
  const response = buildOperatorUpdaterCheckActionResponse(result.updateInfo, MANUAL_RELEASES_URL)
  return ok(response, buildOperatorActionAuditContext(response))
}

export async function downloadLatestOperatorUpdateAsset(): Promise<OperatorUpdaterActionResult> {
  try {
    const result = await downloadLatestReleaseAsset()
    const response = buildOperatorUpdaterDownloadLatestActionResponse(result)
    return ok(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const response = buildOperatorActionErrorResponse("updater-download-latest", getErrorMessage(caughtError))
    return ok(response, buildOperatorActionAuditContext(response))
  }
}

export async function revealOperatorUpdateAsset(): Promise<OperatorUpdaterActionResult> {
  try {
    const downloadedAsset = await revealDownloadedReleaseAsset()
    const response = buildOperatorDownloadedAssetActionResponse("updater-reveal-download", downloadedAsset)
    return ok(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const response = buildOperatorActionErrorResponse("updater-reveal-download", getErrorMessage(caughtError))
    return ok(response, buildOperatorActionAuditContext(response))
  }
}

export async function openOperatorUpdateAsset(): Promise<OperatorUpdaterActionResult> {
  try {
    const downloadedAsset = await openDownloadedReleaseAsset()
    const response = buildOperatorDownloadedAssetActionResponse("updater-open-download", downloadedAsset)
    return ok(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const response = buildOperatorActionErrorResponse("updater-open-download", getErrorMessage(caughtError))
    return ok(response, buildOperatorActionAuditContext(response))
  }
}

export async function openOperatorReleasesPage(): Promise<OperatorUpdaterActionResult> {
  try {
    const result = await openManualReleasesPage()
    const response = buildOperatorOpenReleasesActionResponse(result.url)
    return ok(response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const response = buildOperatorActionErrorResponse("updater-open-releases", getErrorMessage(caughtError))
    return ok(response, buildOperatorActionAuditContext(response))
  }
}
