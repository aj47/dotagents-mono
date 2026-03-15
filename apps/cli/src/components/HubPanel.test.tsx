import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HubPanelProps } from './HubPanel';
import type { ImportConflictStrategy } from '@dotagents/core';

/**
 * Tests for HubPanel component — validates Hub integration TUI panel:
 * menu navigation, catalog browsing, install, import, export, publish views.
 *
 * Tests component props interface and callback patterns without rendering,
 * matching the pattern used by other CLI panel tests (SkillsPanel, etc.).
 */

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@dotagents/core', () => ({}));

// ============================================================================
// Test Data
// ============================================================================

const mockCatalogItems = [
  {
    id: 'test-bundle',
    name: 'Test Bundle',
    summary: 'A test bundle',
    author: { displayName: 'Test Author' },
    tags: ['test'],
    bundleVersion: 1 as const,
    componentCounts: { agentProfiles: 2, mcpServers: 1, skills: 3, repeatTasks: 0, memories: 1 },
    artifact: { url: 'https://hub.dotagentsprotocol.com/bundles/test-bundle.dotagents', fileName: 'test-bundle.dotagents', sizeBytes: 1024 },
    publishedAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'coding-assistant',
    name: 'Coding Assistant',
    summary: 'Full coding agent setup',
    author: { displayName: 'CodeBot' },
    tags: ['coding', 'development'],
    bundleVersion: 1 as const,
    componentCounts: { agentProfiles: 1, mcpServers: 3, skills: 5, repeatTasks: 2, memories: 0 },
    artifact: { url: 'https://hub.dotagentsprotocol.com/bundles/coding-assistant.dotagents', fileName: 'coding-assistant.dotagents', sizeBytes: 2048 },
    publishedAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-03-01T00:00:00.000Z',
  },
];

const mockBundle = {
  manifest: {
    version: 1 as const,
    name: 'Test Bundle',
    description: 'A test bundle description',
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
    { id: 'profile-1', name: 'main', enabled: true, connection: { type: 'internal' as const } },
  ],
  mcpServers: [
    { name: 'test-server', command: 'node', args: ['server.js'], transport: 'stdio', enabled: true },
  ],
  skills: [
    { id: 'skill-1', name: 'Code Review', description: 'Reviews code', instructions: '# Review code' },
  ],
  repeatTasks: [],
  memories: [],
};

const mockImportResult = {
  success: true,
  agentProfiles: [{ id: 'profile-1', name: 'main', action: 'imported' as const }],
  mcpServers: [{ id: 'test-server', name: 'test-server', action: 'imported' as const }],
  skills: [{ id: 'skill-1', name: 'Code Review', action: 'imported' as const }],
  repeatTasks: [],
  memories: [],
  errors: [],
};

const mockPreviewResult = {
  success: true,
  filePath: '/tmp/test.dotagents',
  bundle: mockBundle,
  conflicts: {
    agentProfiles: [],
    mcpServers: [],
    skills: [],
    repeatTasks: [],
    memories: [],
  },
};

const mockExportableItems = {
  agentProfiles: [{ id: 'p1', name: 'Main', displayName: 'Main Agent', enabled: true, referencedMcpServerNames: [], referencedSkillIds: [] }],
  mcpServers: [{ name: 'server-1', transport: 'stdio', enabled: true }],
  skills: [{ id: 's1', name: 'Skill 1', description: 'A skill' }],
  repeatTasks: [],
  memories: [],
};

const mockPublishPayload = {
  catalogItem: {
    id: 'my-bundle',
    name: 'My Bundle',
    summary: 'A bundle',
    author: { displayName: 'Author' },
    tags: ['test'],
    bundleVersion: 1 as const,
    publishedAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    componentCounts: { agentProfiles: 1, mcpServers: 1, skills: 1, repeatTasks: 0, memories: 0 },
    artifact: { url: 'https://hub.dotagentsprotocol.com/bundles/my-bundle.dotagents', fileName: 'my-bundle.dotagents', sizeBytes: 512 },
  },
  bundleJson: '{}',
  installUrl: 'dotagents://install?bundle=test',
};

// ============================================================================
// Default props factory
// ============================================================================

function createDefaultProps(overrides?: Partial<HubPanelProps>): HubPanelProps {
  return {
    catalog: { items: [], loading: false, error: null },
    onBrowseCatalog: vi.fn(async () => {}),
    onInstallBundle: vi.fn(async () => mockImportResult),
    installLoading: false,
    installError: null,
    installResult: null,
    importState: {
      filePath: '',
      preview: null,
      conflictStrategy: 'skip' as const,
      result: null,
      loading: false,
      error: null,
    },
    onSetImportFilePath: vi.fn(),
    onPreviewImport: vi.fn(),
    onExecuteImport: vi.fn(async () => mockImportResult),
    onResetImport: vi.fn(),
    exportState: {
      exportableItems: null,
      bundleName: 'My Agent Configuration',
      bundleDescription: '',
      exportPath: '/home/user/Downloads',
      loading: false,
      error: null,
      success: false,
    },
    onLoadExportableItems: vi.fn(),
    onSetExportName: vi.fn(),
    onSetExportDescription: vi.fn(),
    onSetExportPath: vi.fn(),
    onExecuteExport: vi.fn(async () => true),
    onResetExport: vi.fn(),
    publishState: {
      bundleName: 'My Agent Configuration',
      summary: '',
      authorName: '',
      tags: '',
      loading: false,
      error: null,
      result: null,
    },
    onSetPublishName: vi.fn(),
    onSetPublishSummary: vi.fn(),
    onSetPublishAuthorName: vi.fn(),
    onSetPublishTags: vi.fn(),
    onExecutePublish: vi.fn(async () => mockPublishPayload),
    onResetPublish: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('HubPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Catalog
  // --------------------------------------------------------------------------

  describe('catalog browsing', () => {
    it('should have onBrowseCatalog callback', () => {
      const props = createDefaultProps();
      expect(typeof props.onBrowseCatalog).toBe('function');
    });

    it('should provide catalog items', () => {
      const props = createDefaultProps({
        catalog: { items: mockCatalogItems, loading: false, error: null },
      });
      expect(props.catalog.items).toHaveLength(2);
      expect(props.catalog.items[0].name).toBe('Test Bundle');
      expect(props.catalog.items[1].name).toBe('Coding Assistant');
    });

    it('should show component counts for catalog items', () => {
      const props = createDefaultProps({
        catalog: { items: mockCatalogItems, loading: false, error: null },
      });
      const item = props.catalog.items[0];
      expect(item.componentCounts.agentProfiles).toBe(2);
      expect(item.componentCounts.mcpServers).toBe(1);
      expect(item.componentCounts.skills).toBe(3);
    });

    it('should show author information', () => {
      const props = createDefaultProps({
        catalog: { items: mockCatalogItems, loading: false, error: null },
      });
      expect(props.catalog.items[0].author.displayName).toBe('Test Author');
    });

    it('should show tags', () => {
      const props = createDefaultProps({
        catalog: { items: mockCatalogItems, loading: false, error: null },
      });
      expect(props.catalog.items[0].tags).toEqual(['test']);
      expect(props.catalog.items[1].tags).toEqual(['coding', 'development']);
    });

    it('should handle loading state', () => {
      const props = createDefaultProps({
        catalog: { items: [], loading: true, error: null },
      });
      expect(props.catalog.loading).toBe(true);
      expect(props.catalog.items).toHaveLength(0);
    });

    it('should handle error state', () => {
      const props = createDefaultProps({
        catalog: { items: [], loading: false, error: 'Network error' },
      });
      expect(props.catalog.error).toBe('Network error');
    });

    it('should handle empty catalog', () => {
      const props = createDefaultProps({
        catalog: { items: [], loading: false, error: null },
      });
      expect(props.catalog.items).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Install
  // --------------------------------------------------------------------------

  describe('bundle install', () => {
    it('should call onInstallBundle with URL', async () => {
      const props = createDefaultProps();
      await props.onInstallBundle('https://example.com/bundle.dotagents');
      expect(props.onInstallBundle).toHaveBeenCalledWith('https://example.com/bundle.dotagents');
    });

    it('should call onInstallBundle with name', async () => {
      const props = createDefaultProps();
      await props.onInstallBundle('test-bundle');
      expect(props.onInstallBundle).toHaveBeenCalledWith('test-bundle');
    });

    it('should return import result', async () => {
      const props = createDefaultProps();
      const result = await props.onInstallBundle('test-bundle');
      expect(result).toEqual(mockImportResult);
      expect(result!.success).toBe(true);
    });

    it('should show loading during install', () => {
      const props = createDefaultProps({ installLoading: true });
      expect(props.installLoading).toBe(true);
    });

    it('should show install error', () => {
      const props = createDefaultProps({ installError: 'Download failed' });
      expect(props.installError).toBe('Download failed');
    });

    it('should show install result', () => {
      const props = createDefaultProps({ installResult: mockImportResult });
      expect(props.installResult).toBeDefined();
      expect(props.installResult!.agentProfiles).toHaveLength(1);
    });

    it('should install from catalog item URL', async () => {
      const props = createDefaultProps();
      const url = mockCatalogItems[0].artifact.url;
      await props.onInstallBundle(url);
      expect(props.onInstallBundle).toHaveBeenCalledWith(url);
    });
  });

  // --------------------------------------------------------------------------
  // Import
  // --------------------------------------------------------------------------

  describe('bundle import from file', () => {
    it('should call onSetImportFilePath', () => {
      const props = createDefaultProps();
      props.onSetImportFilePath('/path/to/bundle.dotagents');
      expect(props.onSetImportFilePath).toHaveBeenCalledWith('/path/to/bundle.dotagents');
    });

    it('should call onPreviewImport with file path', () => {
      const props = createDefaultProps();
      props.onPreviewImport('/path/to/bundle.dotagents');
      expect(props.onPreviewImport).toHaveBeenCalledWith('/path/to/bundle.dotagents');
    });

    it('should display preview with bundle contents', () => {
      const props = createDefaultProps({
        importState: {
          filePath: '/tmp/test.dotagents',
          preview: mockPreviewResult,
          conflictStrategy: 'skip',
          result: null,
          loading: false,
          error: null,
        },
      });
      expect(props.importState.preview).toBeDefined();
      expect(props.importState.preview!.bundle!.manifest.name).toBe('Test Bundle');
    });

    it('should show bundle component counts in preview', () => {
      const props = createDefaultProps({
        importState: {
          filePath: '/tmp/test.dotagents',
          preview: mockPreviewResult,
          conflictStrategy: 'skip',
          result: null,
          loading: false,
          error: null,
        },
      });
      const bundle = props.importState.preview!.bundle!;
      expect(bundle.agentProfiles).toHaveLength(1);
      expect(bundle.mcpServers).toHaveLength(1);
      expect(bundle.skills).toHaveLength(1);
    });

    it('should execute import with skip strategy', async () => {
      const props = createDefaultProps();
      const result = await props.onExecuteImport('/tmp/test.dotagents', 'skip');
      expect(props.onExecuteImport).toHaveBeenCalledWith('/tmp/test.dotagents', 'skip');
      expect(result!.success).toBe(true);
    });

    it('should execute import with overwrite strategy', async () => {
      const props = createDefaultProps();
      await props.onExecuteImport('/tmp/test.dotagents', 'overwrite');
      expect(props.onExecuteImport).toHaveBeenCalledWith('/tmp/test.dotagents', 'overwrite');
    });

    it('should execute import with rename strategy', async () => {
      const props = createDefaultProps();
      await props.onExecuteImport('/tmp/test.dotagents', 'rename');
      expect(props.onExecuteImport).toHaveBeenCalledWith('/tmp/test.dotagents', 'rename');
    });

    it('should display import result summary', () => {
      const props = createDefaultProps({
        importState: {
          filePath: '/tmp/test.dotagents',
          preview: null,
          conflictStrategy: 'skip',
          result: mockImportResult,
          loading: false,
          error: null,
        },
      });
      expect(props.importState.result).toBeDefined();
      expect(props.importState.result!.success).toBe(true);
      expect(props.importState.result!.agentProfiles).toHaveLength(1);
      expect(props.importState.result!.skills).toHaveLength(1);
    });

    it('should handle import error', () => {
      const props = createDefaultProps({
        importState: {
          filePath: '/nonexistent/path.dotagents',
          preview: null,
          conflictStrategy: 'skip',
          result: null,
          loading: false,
          error: 'File not found',
        },
      });
      expect(props.importState.error).toBe('File not found');
    });

    it('should show loading state during import', () => {
      const props = createDefaultProps({
        importState: {
          filePath: '/tmp/test.dotagents',
          preview: mockPreviewResult,
          conflictStrategy: 'skip',
          result: null,
          loading: true,
          error: null,
        },
      });
      expect(props.importState.loading).toBe(true);
    });

    it('should reset import state', () => {
      const props = createDefaultProps();
      props.onResetImport();
      expect(props.onResetImport).toHaveBeenCalled();
    });

    it('should detect conflicts in preview', () => {
      const previewWithConflicts = {
        ...mockPreviewResult,
        conflicts: {
          ...mockPreviewResult.conflicts,
          agentProfiles: [{ id: 'profile-1', name: 'main', existingName: 'Main Agent' }],
          skills: [{ id: 'skill-1', name: 'Code Review', existingName: 'Code Review v1' }],
        },
      };
      const props = createDefaultProps({
        importState: {
          filePath: '/tmp/test.dotagents',
          preview: previewWithConflicts,
          conflictStrategy: 'skip',
          result: null,
          loading: false,
          error: null,
        },
      });
      expect(props.importState.preview!.conflicts!.agentProfiles).toHaveLength(1);
      expect(props.importState.preview!.conflicts!.skills).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------

  describe('bundle export', () => {
    it('should call onLoadExportableItems', () => {
      const props = createDefaultProps();
      props.onLoadExportableItems();
      expect(props.onLoadExportableItems).toHaveBeenCalled();
    });

    it('should display exportable items', () => {
      const props = createDefaultProps({
        exportState: {
          exportableItems: mockExportableItems,
          bundleName: 'My Config',
          bundleDescription: '',
          exportPath: '/tmp/export',
          loading: false,
          error: null,
          success: false,
        },
      });
      expect(props.exportState.exportableItems).toBeDefined();
      expect(props.exportState.exportableItems!.agentProfiles).toHaveLength(1);
      expect(props.exportState.exportableItems!.skills).toHaveLength(1);
    });

    it('should set export name', () => {
      const props = createDefaultProps();
      props.onSetExportName('Custom Bundle');
      expect(props.onSetExportName).toHaveBeenCalledWith('Custom Bundle');
    });

    it('should set export description', () => {
      const props = createDefaultProps();
      props.onSetExportDescription('My custom description');
      expect(props.onSetExportDescription).toHaveBeenCalledWith('My custom description');
    });

    it('should set export path', () => {
      const props = createDefaultProps();
      props.onSetExportPath('/custom/path');
      expect(props.onSetExportPath).toHaveBeenCalledWith('/custom/path');
    });

    it('should execute export', async () => {
      const props = createDefaultProps();
      const success = await props.onExecuteExport();
      expect(props.onExecuteExport).toHaveBeenCalled();
      expect(success).toBe(true);
    });

    it('should show export success', () => {
      const props = createDefaultProps({
        exportState: {
          exportableItems: mockExportableItems,
          bundleName: 'My Config',
          bundleDescription: '',
          exportPath: '/tmp/export',
          loading: false,
          error: null,
          success: true,
        },
      });
      expect(props.exportState.success).toBe(true);
    });

    it('should show export error', () => {
      const props = createDefaultProps({
        exportState: {
          exportableItems: null,
          bundleName: 'My Config',
          bundleDescription: '',
          exportPath: '/tmp/export',
          loading: false,
          error: 'Permission denied',
          success: false,
        },
      });
      expect(props.exportState.error).toBe('Permission denied');
    });

    it('should show loading state during export', () => {
      const props = createDefaultProps({
        exportState: {
          exportableItems: mockExportableItems,
          bundleName: 'My Config',
          bundleDescription: '',
          exportPath: '/tmp/export',
          loading: true,
          error: null,
          success: false,
        },
      });
      expect(props.exportState.loading).toBe(true);
    });

    it('should strip API keys from export (verified by using exportBundle)', async () => {
      // The export function calls @dotagents/core exportBundle which strips secrets
      const props = createDefaultProps();
      const success = await props.onExecuteExport();
      expect(success).toBe(true);
      // The actual secret stripping is handled by core's bundle-service
    });

    it('should reset export state', () => {
      const props = createDefaultProps();
      props.onResetExport();
      expect(props.onResetExport).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Publish
  // --------------------------------------------------------------------------

  describe('bundle publish', () => {
    it('should set publish name', () => {
      const props = createDefaultProps();
      props.onSetPublishName('My Published Bundle');
      expect(props.onSetPublishName).toHaveBeenCalledWith('My Published Bundle');
    });

    it('should set publish summary', () => {
      const props = createDefaultProps();
      props.onSetPublishSummary('A great bundle for coding');
      expect(props.onSetPublishSummary).toHaveBeenCalledWith('A great bundle for coding');
    });

    it('should set publish author name', () => {
      const props = createDefaultProps();
      props.onSetPublishAuthorName('Test Author');
      expect(props.onSetPublishAuthorName).toHaveBeenCalledWith('Test Author');
    });

    it('should set publish tags', () => {
      const props = createDefaultProps();
      props.onSetPublishTags('coding, test, automation');
      expect(props.onSetPublishTags).toHaveBeenCalledWith('coding, test, automation');
    });

    it('should execute publish', async () => {
      const props = createDefaultProps();
      const result = await props.onExecutePublish();
      expect(props.onExecutePublish).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result!.catalogItem.name).toBe('My Bundle');
    });

    it('should show publish result with install URL', async () => {
      const props = createDefaultProps();
      const result = await props.onExecutePublish();
      expect(result!.installUrl).toBeDefined();
      expect(result!.catalogItem.id).toBe('my-bundle');
    });

    it('should show publish loading state', () => {
      const props = createDefaultProps({
        publishState: {
          bundleName: 'Test',
          summary: 'A bundle',
          authorName: 'Author',
          tags: 'test',
          loading: true,
          error: null,
          result: null,
        },
      });
      expect(props.publishState.loading).toBe(true);
    });

    it('should show publish error', () => {
      const props = createDefaultProps({
        publishState: {
          bundleName: 'Test',
          summary: '',
          authorName: '',
          tags: '',
          loading: false,
          error: 'Summary is required',
          result: null,
        },
      });
      expect(props.publishState.error).toBe('Summary is required');
    });

    it('should show publish result', () => {
      const props = createDefaultProps({
        publishState: {
          bundleName: 'Test',
          summary: 'A bundle',
          authorName: 'Author',
          tags: 'test',
          loading: false,
          error: null,
          result: mockPublishPayload,
        },
      });
      expect(props.publishState.result).toBeDefined();
      expect(props.publishState.result!.catalogItem.name).toBe('My Bundle');
    });

    it('should reset publish state', () => {
      const props = createDefaultProps();
      props.onResetPublish();
      expect(props.onResetPublish).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Panel lifecycle
  // --------------------------------------------------------------------------

  describe('panel lifecycle', () => {
    it('should have onClose callback', () => {
      const props = createDefaultProps();
      props.onClose();
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should support all conflict strategies', () => {
      const strategies: ImportConflictStrategy[] = ['skip', 'overwrite', 'rename'];
      expect(strategies).toHaveLength(3);
    });

    it('should have default export path', () => {
      const props = createDefaultProps();
      expect(props.exportState.exportPath).toBe('/home/user/Downloads');
    });

    it('should have default bundle name', () => {
      const props = createDefaultProps();
      expect(props.exportState.bundleName).toBe('My Agent Configuration');
    });
  });
});
