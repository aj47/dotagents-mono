export type QrCameraPermissionResult = {
  granted: boolean;
  canAskAgain?: boolean;
};

export type QrScannerWebSheetContent = {
  title: string;
  message: string;
  actionLabel: string | null;
};

type ResolveQrScannerActivationOptions = {
  hasPermission: boolean;
  isWeb: boolean;
  requestPermission: () => Promise<QrCameraPermissionResult>;
};

function createCameraPermissionDeniedMessage({
  isWeb,
  canAskAgain,
}: {
  isWeb: boolean;
  canAskAgain?: boolean;
}): string {
  if (isWeb) {
    if (canAskAgain === false) {
      return 'Camera access is blocked in this browser. Allow camera access in your browser site settings and try scanning again.';
    }

    return 'Camera access is required to scan a QR code. Allow camera access in your browser and try scanning again.';
  }

  if (canAskAgain === false) {
    return 'Camera access is blocked. Allow camera access in your device settings and try scanning again.';
  }

  return 'Camera access is required to scan a QR code. Allow camera access and try scanning again.';
}

export async function resolveQrScannerActivation({
  hasPermission,
  isWeb,
  requestPermission,
}: ResolveQrScannerActivationOptions): Promise<string | null> {
  if (!hasPermission) {
    const result = await requestPermission();

    if (!result.granted) {
      return createCameraPermissionDeniedMessage({
        isWeb,
        canAskAgain: result.canAskAgain,
      });
    }
  }

  return null;
}

export function getQrScannerWebSheetContent({
  permission,
  hasRequestedPermission,
}: {
  permission?: QrCameraPermissionResult | null;
  hasRequestedPermission: boolean;
}): QrScannerWebSheetContent {
  if (permission?.granted) {
    return {
      title: 'Scan a DotAgents QR code',
      message: 'Point your camera at the QR code from the DotAgents desktop app to fill these settings automatically.',
      actionLabel: null,
    };
  }

  if (permission?.canAskAgain === false) {
    return {
      title: 'Camera blocked in this browser',
      message: 'Camera access is blocked in this browser. Allow camera access in your browser site settings and reopen the scanner. You can still enter the API key and base URL manually below.',
      actionLabel: null,
    };
  }

  if (hasRequestedPermission) {
    return {
      title: 'Allow camera access to keep scanning',
      message: 'Camera access is required to scan a QR code. If no browser prompt appeared, check the address bar or browser site settings, then try again. You can still enter the API key and base URL manually below.',
      actionLabel: 'Try camera access again',
    };
  }

  return {
    title: 'Allow camera access to scan',
    message: 'On web, your browser may show a camera prompt after you continue. If nothing appears, check the address bar or site settings. You can still enter the API key and base URL manually below.',
    actionLabel: 'Allow camera access',
  };
}