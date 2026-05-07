import crypto from "crypto"
import { authorizeRemoteServerRequest } from "@dotagents/shared/operator-actions"
import type { RemoteServerControllerAdapters } from "./remote-server-controller"
import {
  recordOperatorResponseAuditEvent,
  recordRejectedOperatorDeviceAttempt,
} from "./operator-audit-actions"
import {
  getConnectableBaseUrlForMobilePairing,
  getRemoteNetworkAddresses,
  getResolvedRemoteServerApiKey,
  printTerminalQRCode,
  readDotAgentsSecretReference,
} from "./remote-server-pairing-actions"

function generateRemoteServerApiKey(): string {
  return crypto.randomBytes(32).toString("hex")
}

export const remoteServerDesktopAdapters: RemoteServerControllerAdapters = {
  authorizeRequest: authorizeRemoteServerRequest,
  generateApiKey: generateRemoteServerApiKey,
  resolveApiKeyReference: readDotAgentsSecretReference,
  resolveConfiguredApiKey: getResolvedRemoteServerApiKey,
  getNetworkAddresses: getRemoteNetworkAddresses,
  getConnectableBaseUrlForMobilePairing,
  printTerminalQRCode,
  recordRejectedOperatorDeviceAttempt,
  recordOperatorResponseAuditEvent,
}
