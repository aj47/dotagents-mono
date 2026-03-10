export type QrCameraPermissionResult = {
  granted: boolean;
  canAskAgain?: boolean;
};

export type DotAgentsConnectionConfig = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
};

type ResolveQrScannerActivationOptions = {
  hasPermission: boolean;
  isWeb: boolean;
  requestPermission: () => Promise<QrCameraPermissionResult>;
};

export function parseDotAgentsConnectionConfig(rawValue: string): DotAgentsConnectionConfig | null {
  const value = rawValue.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'dotagents:') return null;
    if (parsed.hostname !== 'config') return null;

    const baseUrl = parsed.searchParams.get('baseUrl') ?? undefined;
    const apiKey = parsed.searchParams.get('apiKey') ?? undefined;
    const model = parsed.searchParams.get('model') ?? undefined;
    if (!baseUrl && !apiKey && !model) return null;

    return {
      baseUrl,
      apiKey,
      model,
    };
  } catch {
    return null;
  }
}

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