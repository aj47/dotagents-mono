export type QrCameraPermissionResult = {
  granted: boolean;
  canAskAgain?: boolean;
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
}: ResolveQrScannerActivationOptions): Promise<{
  errorMessage: string | null;
  shouldShowScanner: boolean;
}> {
  if (!hasPermission) {
    const result = await requestPermission();

    if (!result.granted) {
      return {
        errorMessage: createCameraPermissionDeniedMessage({
          isWeb,
          canAskAgain: result.canAskAgain,
        }),
        shouldShowScanner: false,
      };
    }
  }

  return {
    errorMessage: null,
    shouldShowScanner: true,
  };
}