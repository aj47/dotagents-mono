/**
 * useHub — React hook for Hub integration in the CLI.
 *
 * Provides operations for:
 * - Browse Hub catalog (fetch from Hub API)
 * - Install bundle by name/URL (download and import)
 * - Import .dotagents bundle from a local file
 * - Export current config as .dotagents bundle (strips API keys)
 * - Publish bundle to Hub
 *
 * Uses @dotagents/core bundle-service for all operations.
 * Hub catalog is fetched from DEFAULT_HUB_BASE_URL/api/catalog.
 */

import { useState, useCallback, useRef } from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  exportBundle,
  exportBundleFromLayers,
  importBundle,
  previewBundle,
  previewBundleWithConflicts,
  getBundleExportableItems,
  getBundleExportableItemsFromLayers,
  generatePublishPayload,
  globalAgentsFolder,
  resolveWorkspaceAgentsFolder,
} from '@dotagents/core';
import type {
  DotAgentsBundle,
  ImportConflictStrategy,
  ImportBundleResult,
  ExportBundleOptions,
  ExportableBundleItems,
  BundlePreviewResult,
  GeneratePublishPayloadOptions,
  BundlePublicMetadata,
} from '@dotagents/core';
import type { HubCatalogItem, HubPublishPayload } from '@dotagents/shared';
import { DEFAULT_HUB_BASE_URL } from '@dotagents/shared';

// ============================================================================
// Types
// ============================================================================

export type HubPanelView =
  | 'menu'
  | 'catalog'
  | 'install'
  | 'import-path'
  | 'import-preview'
  | 'export'
  | 'export-success'
  | 'publish'
  | 'publish-confirm';

export interface CatalogState {
  items: HubCatalogItem[];
  loading: boolean;
  error: string | null;
}

export interface ImportState {
  filePath: string;
  preview: BundlePreviewResult | null;
  conflictStrategy: ImportConflictStrategy;
  result: ImportBundleResult | null;
  loading: boolean;
  error: string | null;
}

export interface ExportState {
  exportableItems: ExportableBundleItems | null;
  bundleName: string;
  bundleDescription: string;
  exportPath: string;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface PublishState {
  bundleName: string;
  summary: string;
  authorName: string;
  tags: string;
  loading: boolean;
  error: string | null;
  result: HubPublishPayload | null;
}

export interface UseHubReturn {
  // Catalog
  catalog: CatalogState;
  browseCatalog: () => Promise<void>;

  // Install
  installBundle: (urlOrName: string) => Promise<ImportBundleResult | null>;
  installLoading: boolean;
  installError: string | null;
  installResult: ImportBundleResult | null;

  // Import
  importState: ImportState;
  setImportFilePath: (filePath: string) => void;
  previewImport: (filePath: string) => void;
  executeImport: (filePath: string, conflictStrategy: ImportConflictStrategy) => Promise<ImportBundleResult | null>;
  resetImport: () => void;

  // Export
  exportState: ExportState;
  loadExportableItems: () => void;
  setExportName: (name: string) => void;
  setExportDescription: (desc: string) => void;
  setExportPath: (p: string) => void;
  executeExport: () => Promise<boolean>;
  resetExport: () => void;

  // Publish
  publishState: PublishState;
  setPublishName: (name: string) => void;
  setPublishSummary: (summary: string) => void;
  setPublishAuthorName: (name: string) => void;
  setPublishTags: (tags: string) => void;
  executePublish: () => Promise<HubPublishPayload | null>;
  resetPublish: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function getActiveAgentsDirs(): string[] {
  const dirs: string[] = [globalAgentsFolder];
  const workspace = resolveWorkspaceAgentsFolder();
  if (workspace) {
    dirs.push(workspace);
  }
  return dirs;
}

function getTargetAgentsDir(): string {
  return resolveWorkspaceAgentsFolder() || globalAgentsFolder;
}

function getDefaultExportPath(): string {
  return path.join(os.homedir(), 'Downloads');
}

// ============================================================================
// Hook
// ============================================================================

export function useHub(): UseHubReturn {
  // --- Catalog state ---
  const [catalog, setCatalog] = useState<CatalogState>({
    items: [],
    loading: false,
    error: null,
  });

  // --- Install state ---
  const [installLoading, setInstallLoading] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installResult, setInstallResult] = useState<ImportBundleResult | null>(null);

  // --- Import state ---
  const [importState, setImportState] = useState<ImportState>({
    filePath: '',
    preview: null,
    conflictStrategy: 'skip',
    result: null,
    loading: false,
    error: null,
  });

  // --- Export state ---
  const [exportState, setExportState] = useState<ExportState>({
    exportableItems: null,
    bundleName: 'My Agent Configuration',
    bundleDescription: '',
    exportPath: getDefaultExportPath(),
    loading: false,
    error: null,
    success: false,
  });

  // --- Publish state ---
  const [publishState, setPublishState] = useState<PublishState>({
    bundleName: 'My Agent Configuration',
    summary: '',
    authorName: '',
    tags: '',
    loading: false,
    error: null,
    result: null,
  });

  // -----------------------------------------------------------------------
  // Catalog
  // -----------------------------------------------------------------------

  const browseCatalog = useCallback(async () => {
    setCatalog(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${DEFAULT_HUB_BASE_URL}/api/catalog`);
      if (!response.ok) {
        throw new Error(`Hub API returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json() as { items?: HubCatalogItem[] };
      const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data as HubCatalogItem[] : [];
      setCatalog({ items, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch Hub catalog';
      setCatalog(prev => ({ ...prev, loading: false, error: msg }));
    }
  }, []);

  // -----------------------------------------------------------------------
  // Install (from URL)
  // -----------------------------------------------------------------------

  const installBundle = useCallback(async (urlOrName: string): Promise<ImportBundleResult | null> => {
    setInstallLoading(true);
    setInstallError(null);
    setInstallResult(null);

    try {
      // Determine the URL to fetch
      let bundleUrl: string;
      if (urlOrName.startsWith('http://') || urlOrName.startsWith('https://')) {
        bundleUrl = urlOrName;
      } else {
        // Treat as a catalog ID — construct download URL
        const catalogId = urlOrName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
        bundleUrl = `${DEFAULT_HUB_BASE_URL}/bundles/${catalogId}.dotagents`;
      }

      // Download the bundle
      const response = await fetch(bundleUrl);
      if (!response.ok) {
        throw new Error(`Failed to download bundle: ${response.status} ${response.statusText}`);
      }

      const bundleJson = await response.text();

      // Write to a temporary file
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `dotagents-install-${Date.now()}.dotagents`);
      fs.writeFileSync(tempFile, bundleJson, 'utf-8');

      // Import the bundle
      const targetDir = getTargetAgentsDir();
      const result = await importBundle(tempFile, targetDir, {
        conflictStrategy: 'skip',
        components: {
          agentProfiles: true,
          mcpServers: true,
          skills: true,
          repeatTasks: true,
          memories: true,
        },
      });

      // Clean up temp file
      try { fs.unlinkSync(tempFile); } catch { /* ignore */ }

      setInstallResult(result);
      setInstallLoading(false);

      if (!result.success) {
        setInstallError(result.errors.join('; '));
      }

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to install bundle';
      setInstallError(msg);
      setInstallLoading(false);
      return null;
    }
  }, []);

  // -----------------------------------------------------------------------
  // Import from file
  // -----------------------------------------------------------------------

  const setImportFilePath = useCallback((filePath: string) => {
    setImportState(prev => ({ ...prev, filePath, error: null }));
  }, []);

  const previewImport = useCallback((filePath: string) => {
    try {
      const resolved = path.resolve(filePath);
      if (!fs.existsSync(resolved)) {
        setImportState(prev => ({
          ...prev,
          filePath: resolved,
          preview: null,
          error: 'File not found',
        }));
        return;
      }

      const targetDir = getTargetAgentsDir();
      const preview = previewBundleWithConflicts(resolved, targetDir);
      setImportState(prev => ({
        ...prev,
        filePath: resolved,
        preview,
        error: preview.success ? null : (preview.error || 'Failed to parse bundle'),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to preview bundle';
      setImportState(prev => ({ ...prev, error: msg }));
    }
  }, []);

  const executeImport = useCallback(async (
    filePath: string,
    conflictStrategy: ImportConflictStrategy,
  ): Promise<ImportBundleResult | null> => {
    setImportState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const resolved = path.resolve(filePath);
      const targetDir = getTargetAgentsDir();
      const result = await importBundle(resolved, targetDir, {
        conflictStrategy,
        components: {
          agentProfiles: true,
          mcpServers: true,
          skills: true,
          repeatTasks: true,
          memories: true,
        },
      });
      setImportState(prev => ({
        ...prev,
        result,
        loading: false,
        error: result.success ? null : result.errors.join('; '),
      }));
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to import bundle';
      setImportState(prev => ({ ...prev, loading: false, error: msg }));
      return null;
    }
  }, []);

  const resetImport = useCallback(() => {
    setImportState({
      filePath: '',
      preview: null,
      conflictStrategy: 'skip',
      result: null,
      loading: false,
      error: null,
    });
  }, []);

  // -----------------------------------------------------------------------
  // Export
  // -----------------------------------------------------------------------

  const loadExportableItems = useCallback(() => {
    try {
      const dirs = getActiveAgentsDirs();
      const items = dirs.length === 1
        ? getBundleExportableItems(dirs[0])
        : getBundleExportableItemsFromLayers(dirs);
      setExportState(prev => ({ ...prev, exportableItems: items, error: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load exportable items';
      setExportState(prev => ({ ...prev, error: msg }));
    }
  }, []);

  const setExportName = useCallback((name: string) => {
    setExportState(prev => ({ ...prev, bundleName: name }));
  }, []);

  const setExportDescription = useCallback((desc: string) => {
    setExportState(prev => ({ ...prev, bundleDescription: desc }));
  }, []);

  const setExportPath = useCallback((p: string) => {
    setExportState(prev => ({ ...prev, exportPath: p }));
  }, []);

  const executeExport = useCallback(async (): Promise<boolean> => {
    setExportState(prev => ({ ...prev, loading: true, error: null, success: false }));
    try {
      const dirs = getActiveAgentsDirs();
      const options: ExportBundleOptions = {
        name: exportState.bundleName || 'My Agent Configuration',
        description: exportState.bundleDescription || undefined,
      };

      const bundle = dirs.length === 1
        ? await exportBundle(dirs[0], options)
        : await exportBundleFromLayers(dirs, options);

      // Write to file
      const safeName = (exportState.bundleName || 'agent-config')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .trim() || 'agent-config';
      const fileName = `${safeName}.dotagents`;
      const exportDir = exportState.exportPath || getDefaultExportPath();

      fs.mkdirSync(exportDir, { recursive: true });
      const filePath = path.join(exportDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2), 'utf-8');

      setExportState(prev => ({
        ...prev,
        loading: false,
        error: null,
        success: true,
      }));

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export bundle';
      setExportState(prev => ({ ...prev, loading: false, error: msg }));
      return false;
    }
  }, [exportState.bundleName, exportState.bundleDescription, exportState.exportPath]);

  const resetExport = useCallback(() => {
    setExportState({
      exportableItems: null,
      bundleName: 'My Agent Configuration',
      bundleDescription: '',
      exportPath: getDefaultExportPath(),
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  // -----------------------------------------------------------------------
  // Publish
  // -----------------------------------------------------------------------

  const setPublishName = useCallback((name: string) => {
    setPublishState(prev => ({ ...prev, bundleName: name }));
  }, []);

  const setPublishSummary = useCallback((summary: string) => {
    setPublishState(prev => ({ ...prev, summary }));
  }, []);

  const setPublishAuthorName = useCallback((name: string) => {
    setPublishState(prev => ({ ...prev, authorName: name }));
  }, []);

  const setPublishTags = useCallback((tags: string) => {
    setPublishState(prev => ({ ...prev, tags }));
  }, []);

  const executePublish = useCallback(async (): Promise<HubPublishPayload | null> => {
    setPublishState(prev => ({ ...prev, loading: true, error: null, result: null }));
    try {
      if (!publishState.summary.trim()) {
        throw new Error('Summary is required');
      }
      if (!publishState.authorName.trim()) {
        throw new Error('Author name is required');
      }

      const dirs = getActiveAgentsDirs();
      const publicMetadata: BundlePublicMetadata = {
        summary: publishState.summary.trim(),
        author: {
          displayName: publishState.authorName.trim(),
        },
        tags: publishState.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
      };

      const options: GeneratePublishPayloadOptions = {
        name: publishState.bundleName || 'My Agent Configuration',
        publicMetadata,
      };

      const payload = await generatePublishPayload(dirs, options);

      // Submit to Hub API
      try {
        const response = await fetch(`${DEFAULT_HUB_BASE_URL}/api/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'dotagents-cli',
            version: 1,
            payload,
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`Hub publish failed: ${response.status} ${response.statusText}${errText ? ` — ${errText}` : ''}`);
        }
      } catch (publishErr) {
        // If Hub API is unreachable, still return payload (user can manually submit)
        const msg = publishErr instanceof Error ? publishErr.message : 'Publish request failed';
        setPublishState(prev => ({
          ...prev,
          loading: false,
          error: `Payload generated but publish failed: ${msg}. The payload is ready for manual submission.`,
          result: payload,
        }));
        return payload;
      }

      setPublishState(prev => ({
        ...prev,
        loading: false,
        error: null,
        result: payload,
      }));
      return payload;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish bundle';
      setPublishState(prev => ({ ...prev, loading: false, error: msg }));
      return null;
    }
  }, [publishState.bundleName, publishState.summary, publishState.authorName, publishState.tags]);

  const resetPublish = useCallback(() => {
    setPublishState({
      bundleName: 'My Agent Configuration',
      summary: '',
      authorName: '',
      tags: '',
      loading: false,
      error: null,
      result: null,
    });
  }, []);

  return {
    catalog,
    browseCatalog,
    installBundle,
    installLoading,
    installError,
    installResult,
    importState,
    setImportFilePath,
    previewImport,
    executeImport,
    resetImport,
    exportState,
    loadExportableItems,
    setExportName,
    setExportDescription,
    setExportPath,
    executeExport,
    resetExport,
    publishState,
    setPublishName,
    setPublishSummary,
    setPublishAuthorName,
    setPublishTags,
    executePublish,
    resetPublish,
  };
}
