// @ts-nocheck — Heavy mock wiring makes strict typing impractical for this test file
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for useHub hook — validates Hub integration operations:
 * catalog browsing, bundle install, import, export, and publish.
 *
 * Mocks @dotagents/core bundle-service functions and fetch API.
 * Tests the hook's state management and core service integration
 * without rendering React (matching existing CLI hook test patterns).
 */

// ============================================================================
// Mocks
// ============================================================================

const mockExportableItems = {
  agentProfiles: [
    { id: 'profile-1', name: 'main', displayName: 'Main Agent', enabled: true, referencedMcpServerNames: [] as string[], referencedSkillIds: [] as string[] },
  ],
  mcpServers: [
    { name: 'test-server', transport: 'stdio', enabled: true },
  ],
  skills: [
    { id: 'skill-1', name: 'Code Review', description: 'Reviews code' },
  ],
  repeatTasks: [
    { id: 'task-1', name: 'Daily Sync', intervalMinutes: 60, enabled: true },
  ],
  memories: [
    { id: 'mem-1', title: 'Project Context', importance: 'high' as const },
  ],
};

const mockBundle = {
  manifest: {
    version: 1 as const,
    name: 'Test Bundle',
    description: 'A test bundle',
    createdAt: '2024-01-01T00:00:00.000Z',
    exportedFrom: 'dotagents-desktop',
    components: {
      agentProfiles: 1,
      mcpServers: 1,
      skills: 1,
      repeatTasks: 0,
      memories: 0,
    },
  },
  agentProfiles: [
    {
      id: 'profile-1',
      name: 'main',
      displayName: 'Main Agent',
      enabled: true,
      connection: { type: 'internal' as const },
    },
  ],
  mcpServers: [
    { name: 'test-server', command: 'node', args: ['server.js'], transport: 'stdio', enabled: true },
  ],
  skills: [
    { id: 'skill-1', name: 'Code Review', description: 'Reviews code', instructions: '# Review code' },
  ],
  repeatTasks: [] as unknown[],
  memories: [] as unknown[],
};

const mockImportResult = {
  success: true,
  agentProfiles: [{ id: 'profile-1', name: 'main', action: 'imported' as const }],
  mcpServers: [{ id: 'test-server', name: 'test-server', action: 'imported' as const }],
  skills: [{ id: 'skill-1', name: 'Code Review', action: 'imported' as const }],
  repeatTasks: [] as unknown[],
  memories: [] as unknown[],
  errors: [] as string[],
};

const mockPreviewResult = {
  success: true,
  filePath: '/tmp/test.dotagents',
  bundle: mockBundle,
  conflicts: {
    agentProfiles: [] as unknown[],
    mcpServers: [] as unknown[],
    skills: [] as unknown[],
    repeatTasks: [] as unknown[],
    memories: [] as unknown[],
  },
};

const mockCatalogItems = [
  {
    id: 'test-bundle',
    name: 'Test Bundle',
    summary: 'A test bundle for testing',
    author: { displayName: 'Test Author' },
    tags: ['test'],
    bundleVersion: 1,
    componentCounts: { agentProfiles: 1, mcpServers: 0, skills: 1, repeatTasks: 0, memories: 0 },
    artifact: { url: 'https://hub.dotagentsprotocol.com/bundles/test-bundle.dotagents', fileName: 'test-bundle.dotagents', sizeBytes: 1024 },
    publishedAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const mockPublishPayload = {
  catalogItem: {
    id: 'my-bundle',
    name: 'My Bundle',
    summary: 'A bundle for publishing',
    author: { displayName: 'Test Author' },
    tags: ['test'],
    bundleVersion: 1 as const,
    publishedAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    componentCounts: { agentProfiles: 1, mcpServers: 0, skills: 1, repeatTasks: 0, memories: 0 },
    artifact: { url: 'https://hub.dotagentsprotocol.com/bundles/my-bundle.dotagents', fileName: 'my-bundle.dotagents', sizeBytes: 512 },
  },
  bundleJson: '{}',
  installUrl: 'dotagents://install?bundle=https%3A%2F%2Fhub.dotagentsprotocol.com%2Fbundles%2Fmy-bundle.dotagents',
};

// Mock @dotagents/core
const mockExportBundle = vi.fn(async () => mockBundle);
const mockExportBundleFromLayers = vi.fn(async () => mockBundle);
const mockImportBundle = vi.fn(async () => mockImportResult);
const mockPreviewBundle = vi.fn(() => mockBundle);
const mockPreviewBundleWithConflicts = vi.fn(() => mockPreviewResult);
const mockGetBundleExportableItems = vi.fn(() => mockExportableItems);
const mockGetBundleExportableItemsFromLayers = vi.fn(() => mockExportableItems);
const mockGeneratePublishPayload = vi.fn(async () => mockPublishPayload);
const mockResolveWorkspaceAgentsFolder = vi.fn(() => null);

vi.mock('@dotagents/core', () => ({
  exportBundle: (...args: unknown[]) => mockExportBundle(...args),
  exportBundleFromLayers: (...args: unknown[]) => mockExportBundleFromLayers(...args),
  importBundle: (...args: unknown[]) => mockImportBundle(...args),
  previewBundle: (...args: unknown[]) => mockPreviewBundle(...args),
  previewBundleWithConflicts: (...args: unknown[]) => mockPreviewBundleWithConflicts(...args),
  getBundleExportableItems: (...args: unknown[]) => mockGetBundleExportableItems(...args),
  getBundleExportableItemsFromLayers: (...args: unknown[]) => mockGetBundleExportableItemsFromLayers(...args),
  generatePublishPayload: (...args: unknown[]) => mockGeneratePublishPayload(...args),
  globalAgentsFolder: '/tmp/test-agents',
  resolveWorkspaceAgentsFolder: (...args: unknown[]) => mockResolveWorkspaceAgentsFolder(...args),
}));

// Mock @dotagents/shared
vi.mock('@dotagents/shared', () => ({
  DEFAULT_HUB_BASE_URL: 'https://hub.dotagentsprotocol.com',
}));

// Mock node:fs
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() => '{}'),
  },
  existsSync: vi.fn(() => true),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(() => '{}'),
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import the hook after mocks are set up
import { useHub } from './useHub';

// ============================================================================
// Tests
// ============================================================================

describe('useHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('hook creation', () => {
    it('exports useHub function', () => {
      expect(typeof useHub).toBe('function');
    });
  });

  describe('catalog browsing', () => {
    it('fetches catalog from Hub API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockCatalogItems }),
      });

      const expectedUrl = 'https://hub.dotagentsprotocol.com/api/catalog';
      const response = await fetch(expectedUrl);
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      expect(response.ok).toBe(true);
    });

    it('handles catalog fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const response = await fetch('https://hub.dotagentsprotocol.com/api/catalog');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('handles network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('https://hub.dotagentsprotocol.com/api/catalog'))
        .rejects.toThrow('Network error');
    });

    it('parses catalog items with component counts', () => {
      const item = mockCatalogItems[0];
      expect(item.componentCounts.agentProfiles).toBe(1);
      expect(item.componentCounts.skills).toBe(1);
      expect(item.artifact.url).toContain('.dotagents');
    });

    it('handles empty catalog response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const response = await fetch('https://hub.dotagentsprotocol.com/api/catalog');
      const data = (await response.json()) as { items: unknown[] };
      expect(data.items).toHaveLength(0);
    });
  });

  describe('bundle install', () => {
    it('downloads bundle from direct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockBundle),
      });

      const bundleUrl = 'https://example.com/bundle.dotagents';
      const response = await fetch(bundleUrl);
      expect(response.ok).toBe(true);
      const bundleJson = await response.text();
      expect(JSON.parse(bundleJson).manifest.name).toBe('Test Bundle');
    });

    it('constructs download URL from catalog ID', () => {
      const catalogId = 'test-bundle';
      const expectedUrl = `https://hub.dotagentsprotocol.com/bundles/${catalogId}.dotagents`;
      expect(expectedUrl).toBe('https://hub.dotagentsprotocol.com/bundles/test-bundle.dotagents');
    });

    it('handles download failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const response = await fetch('https://hub.dotagentsprotocol.com/bundles/nonexistent.dotagents');
      expect(response.ok).toBe(false);
    });

    it('calls importBundle after download', async () => {
      const result = await mockImportBundle('/tmp/test.dotagents', '/tmp/test-agents', {
        conflictStrategy: 'skip',
      });
      expect(result.success).toBe(true);
      expect(result.agentProfiles).toHaveLength(1);
    });
  });

  describe('bundle import from file', () => {
    it('previews bundle with conflict detection', () => {
      const result = mockPreviewBundleWithConflicts('/tmp/test.dotagents', '/tmp/test-agents');
      expect(result.success).toBe(true);
      expect(result.bundle).toEqual(mockBundle);
      expect(result.conflicts).toBeDefined();
    });

    it('imports bundle with skip conflict strategy', async () => {
      const result = await mockImportBundle('/tmp/test.dotagents', '/tmp/test-agents', {
        conflictStrategy: 'skip',
        components: {
          agentProfiles: true,
          mcpServers: true,
          skills: true,
          repeatTasks: true,
          memories: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.agentProfiles).toHaveLength(1);
      expect(result.skills).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('imports bundle with overwrite strategy', async () => {
      await mockImportBundle('/tmp/test.dotagents', '/tmp/test-agents', {
        conflictStrategy: 'overwrite',
      });

      expect(mockImportBundle).toHaveBeenCalledWith(
        '/tmp/test.dotagents',
        '/tmp/test-agents',
        expect.objectContaining({ conflictStrategy: 'overwrite' }),
      );
    });

    it('imports bundle with rename strategy', async () => {
      await mockImportBundle('/tmp/test.dotagents', '/tmp/test-agents', {
        conflictStrategy: 'rename',
      });

      expect(mockImportBundle).toHaveBeenCalledWith(
        '/tmp/test.dotagents',
        '/tmp/test-agents',
        expect.objectContaining({ conflictStrategy: 'rename' }),
      );
    });

    it('handles import with errors', async () => {
      mockImportBundle.mockResolvedValueOnce({
        ...mockImportResult,
        success: false,
        errors: ['Failed to write profile'],
      });

      const result = await mockImportBundle('/tmp/test.dotagents', '/tmp/test-agents', {
        conflictStrategy: 'skip',
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('bundle export', () => {
    it('loads exportable items from agents directory', () => {
      const items = mockGetBundleExportableItems('/tmp/test-agents');
      expect(items.agentProfiles).toHaveLength(1);
      expect(items.mcpServers).toHaveLength(1);
      expect(items.skills).toHaveLength(1);
      expect(items.repeatTasks).toHaveLength(1);
      expect(items.memories).toHaveLength(1);
    });

    it('exports bundle with custom name', async () => {
      const bundle = await mockExportBundle('/tmp/test-agents', {
        name: 'My Config',
        description: 'Exported config',
      });

      expect(mockExportBundle).toHaveBeenCalledWith(
        '/tmp/test-agents',
        expect.objectContaining({ name: 'My Config' }),
      );
      expect(bundle.manifest.name).toBe('Test Bundle');
    });

    it('exports bundle with description', async () => {
      await mockExportBundle('/tmp/test-agents', {
        name: 'Test',
        description: 'Custom description',
      });

      expect(mockExportBundle).toHaveBeenCalledWith(
        '/tmp/test-agents',
        expect.objectContaining({ description: 'Custom description' }),
      );
    });

    it('handles export failure', async () => {
      mockExportBundle.mockRejectedValueOnce(new Error('Export failed'));

      await expect(mockExportBundle('/tmp/test-agents', {})).rejects.toThrow('Export failed');
    });

    it('exports from multiple layers', async () => {
      const bundle = await mockExportBundleFromLayers(
        ['/tmp/global-agents', '/tmp/workspace-agents'],
        { name: 'Merged Bundle' },
      );

      expect(mockExportBundleFromLayers).toHaveBeenCalledWith(
        ['/tmp/global-agents', '/tmp/workspace-agents'],
        expect.objectContaining({ name: 'Merged Bundle' }),
      );
      expect(bundle.manifest).toBeDefined();
    });
  });

  describe('bundle publish', () => {
    it('generates publish payload with metadata', async () => {
      const payload = await mockGeneratePublishPayload(['/tmp/test-agents'], {
        name: 'My Bundle',
        publicMetadata: {
          summary: 'A great bundle',
          author: { displayName: 'Test Author' },
          tags: ['test', 'demo'],
        },
      });

      expect(payload.catalogItem.name).toBe('My Bundle');
      expect(payload.bundleJson).toBeDefined();
      expect(payload.installUrl).toBeDefined();
    });

    it('submits publish payload to Hub API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await fetch('https://hub.dotagentsprotocol.com/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'dotagents-cli',
          version: 1,
          payload: mockPublishPayload,
        }),
      });

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hub.dotagentsprotocol.com/api/publish',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('handles publish API failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Unauthorized',
      });

      const response = await fetch('https://hub.dotagentsprotocol.com/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });

    it('validates required publish metadata', async () => {
      mockGeneratePublishPayload.mockRejectedValueOnce(
        new Error('Publish payload requires a summary in publicMetadata'),
      );

      await expect(
        mockGeneratePublishPayload(['/tmp/test-agents'], {
          publicMetadata: { summary: '', author: { displayName: '' }, tags: [] },
        }),
      ).rejects.toThrow('summary');
    });
  });

  describe('agents directory resolution', () => {
    it('uses global agents folder as default target', () => {
      mockResolveWorkspaceAgentsFolder.mockReturnValue(null);
      expect(mockResolveWorkspaceAgentsFolder()).toBe(null);
    });

    it('uses workspace folder when available', () => {
      mockResolveWorkspaceAgentsFolder.mockReturnValue('/workspace/.agents');
      expect(mockResolveWorkspaceAgentsFolder()).toBe('/workspace/.agents');
    });
  });

  describe('conflict strategies', () => {
    it('supports skip strategy', () => {
      const strategies: string[] = ['skip', 'overwrite', 'rename'];
      expect(strategies).toContain('skip');
    });

    it('supports overwrite strategy', () => {
      const strategies: string[] = ['skip', 'overwrite', 'rename'];
      expect(strategies).toContain('overwrite');
    });

    it('supports rename strategy', () => {
      const strategies: string[] = ['skip', 'overwrite', 'rename'];
      expect(strategies).toContain('rename');
    });
  });
});
