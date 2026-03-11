import { describe, expect, it } from 'vitest';

import { getAgentSelectorHeaderState } from './agent-selector-header-state';

describe('getAgentSelectorHeaderState', () => {
  it('keeps the agent dropdown affordance when connection settings are configured', () => {
    expect(getAgentSelectorHeaderState({
      currentAgentLabel: 'Research Agent',
      isConnectionConfigured: true,
    })).toEqual({
      badgeLabel: 'Research Agent ▼',
      accessibilityLabel: 'Current agent: Research Agent. Tap to change.',
      accessibilityHint: 'Opens agent selection menu',
      opensAgentSelector: true,
    });
  });

  it('turns the header into a setup affordance when connection settings are missing', () => {
    expect(getAgentSelectorHeaderState({
      currentAgentLabel: 'Research Agent',
      isConnectionConfigured: false,
    })).toEqual({
      badgeLabel: 'Setup required',
      accessibilityLabel: 'Connection settings required before switching agents.',
      accessibilityHint: 'Opens connection settings so you can finish setup before switching agents.',
      opensAgentSelector: false,
    });
  });
});