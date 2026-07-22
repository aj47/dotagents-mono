import { useContext, type ReactNode } from 'react';
import { MentraContext, unsupportedMentraValue } from './MentraContext';
import type { MentraContextValue } from './types';

export function MentraProvider({ children }: { children: ReactNode }) {
  return <MentraContext.Provider value={unsupportedMentraValue}>{children}</MentraContext.Provider>;
}

export function useMentra(): MentraContextValue {
  return useContext(MentraContext);
}
