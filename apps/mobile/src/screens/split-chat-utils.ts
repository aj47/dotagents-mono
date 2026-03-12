export type SplitOrientationPreference = 'auto' | 'horizontal' | 'vertical';
export type SplitPane = 'primary' | 'secondary';

export type SplitPaneSelection = {
  primary: string | null;
  secondary: string | null;
};

function uniqueSessionIds(sessionIds: string[]): string[] {
  return Array.from(new Set(sessionIds.filter(Boolean)));
}

export function getInitialSplitSessionIds(sessionIds: string[], preferredId?: string | null): SplitPaneSelection {
  const uniqueIds = uniqueSessionIds(sessionIds);
  const primary = preferredId && uniqueIds.includes(preferredId)
    ? preferredId
    : uniqueIds[0] ?? null;
  const secondary = uniqueIds.find((id) => id !== primary) ?? null;

  return { primary, secondary };
}

export function replaceSplitPaneSelection(
  selection: SplitPaneSelection,
  pane: SplitPane,
  nextSessionId: string | null,
): SplitPaneSelection {
  if (pane === 'primary') {
    if (!nextSessionId) return { ...selection, primary: null };
    return nextSessionId === selection.secondary
      ? { primary: nextSessionId, secondary: selection.primary }
      : { ...selection, primary: nextSessionId };
  }

  if (!nextSessionId) return { ...selection, secondary: null };
  return nextSessionId === selection.primary
    ? { primary: selection.secondary, secondary: nextSessionId }
    : { ...selection, secondary: nextSessionId };
}

export function reconcileSplitPaneSelection(
  selection: SplitPaneSelection,
  sessionIds: string[],
  preferredId?: string | null,
): SplitPaneSelection {
  const uniqueIds = uniqueSessionIds(sessionIds);
  let primary = selection.primary && uniqueIds.includes(selection.primary) ? selection.primary : null;
  let secondary = selection.secondary && uniqueIds.includes(selection.secondary) ? selection.secondary : null;

  if (!primary) {
    primary = preferredId && uniqueIds.includes(preferredId)
      ? preferredId
      : uniqueIds[0] ?? null;
  }

  if (secondary === primary) {
    secondary = null;
  }

  if (!secondary) {
    secondary = uniqueIds.find((id) => id !== primary) ?? null;
  }

  return { primary, secondary };
}

export function resolveSplitOrientation(
  preference: SplitOrientationPreference,
  width: number,
  height: number,
): 'horizontal' | 'vertical' {
  if (preference !== 'auto') return preference;
  return width >= 960 || width > height ? 'vertical' : 'horizontal';
}