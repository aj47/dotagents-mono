import { useEffect, useState } from 'react';

export const DEFAULT_STABLE_FOREGROUND_DELAY_MS = 1500;

export function useStableForeground(
  isForeground: boolean,
  delayMs = DEFAULT_STABLE_FOREGROUND_DELAY_MS,
): boolean {
  const [stableForeground, setStableForeground] = useState(isForeground);

  useEffect(() => {
    if (!isForeground) {
      setStableForeground(false);
      return;
    }

    if (delayMs <= 0) {
      setStableForeground(true);
      return;
    }

    const timer = setTimeout(() => {
      setStableForeground(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs, isForeground]);

  return stableForeground;
}
