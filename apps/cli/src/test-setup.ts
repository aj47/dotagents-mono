/**
 * Vitest setup file for @dotagents/cli tests.
 *
 * Mocks OpenTUI packages so component-level tests can import
 * modules that reference @opentui/react hooks without requiring
 * the native TUI renderer (which needs react-reconciler at runtime).
 */
import { vi } from 'vitest';

vi.mock('@opentui/react', () => ({
  useKeyboard: vi.fn(),
  useTerminalDimensions: vi.fn(() => ({ width: 80, height: 24 })),
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

vi.mock('@opentui/core', () => ({
  createCliRenderer: vi.fn(async () => ({})),
}));
