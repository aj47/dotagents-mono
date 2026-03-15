import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock must use inline factory — no top-level variable references
vi.mock('@dotagents/core', () => ({
  setMCPServicePathResolver: vi.fn(),
  setMCPServiceUserInteraction: vi.fn(),
  setBuiltinToolsMcpService: vi.fn(),
  setBuiltinToolsEmergencyStop: vi.fn(),
  setBuiltinToolNamesProvider: vi.fn(),
  setProfileBuiltinToolNamesProvider: vi.fn(),
  setLLMProgressEmitter: vi.fn(),
  setEmitAgentProgressEmitter: vi.fn(),
  setAgentSessionTrackerProgressEmitter: vi.fn(),
  setMessageQueueServiceProgressEmitter: vi.fn(),
  setElicitationProgressEmitter: vi.fn(),
  setElicitationUserInteraction: vi.fn(),
  setSamplingProgressEmitter: vi.fn(),
  setCommandPathResolver: vi.fn(),
  setKittenTTSPathResolver: vi.fn(),
  setSupertonicTTSPathResolver: vi.fn(),
  setParakeetSTTPathResolver: vi.fn(),
  setRemoteServerProgressEmitter: vi.fn(),
  setOAuthClientUserInteraction: vi.fn(),
  mcpService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAvailableTools: vi.fn().mockReturnValue([]),
    cleanup: vi.fn().mockResolvedValue(undefined),
  },
  getBuiltinToolNames: vi.fn().mockReturnValue([]),
  emergencyStopAll: vi.fn(),
}));

import {
  setMCPServicePathResolver,
  setMCPServiceUserInteraction,
  setBuiltinToolsMcpService,
  setBuiltinToolsEmergencyStop,
  setBuiltinToolNamesProvider,
  setProfileBuiltinToolNamesProvider,
  setLLMProgressEmitter,
  setEmitAgentProgressEmitter,
  setAgentSessionTrackerProgressEmitter,
  setMessageQueueServiceProgressEmitter,
  setElicitationProgressEmitter,
  setElicitationUserInteraction,
  setSamplingProgressEmitter,
  setCommandPathResolver,
  setKittenTTSPathResolver,
  setSupertonicTTSPathResolver,
  setParakeetSTTPathResolver,
  setRemoteServerProgressEmitter,
  setOAuthClientUserInteraction,
  mcpService,
  getBuiltinToolNames,
  emergencyStopAll,
} from '@dotagents/core';

import { wireCoreDependencies, initializeMcpServers, cleanupMcpService } from './core-wiring';

describe('core-wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('wireCoreDependencies', () => {
    it('wires ProgressEmitter into all core services', () => {
      const mockPath = {} as any;
      const mockProgress = {} as any;
      const mockUI = {} as any;

      wireCoreDependencies(mockPath, mockProgress, mockUI);

      expect(setEmitAgentProgressEmitter).toHaveBeenCalledWith(mockProgress);
      expect(setAgentSessionTrackerProgressEmitter).toHaveBeenCalledWith(mockProgress);
      expect(setMessageQueueServiceProgressEmitter).toHaveBeenCalledWith(mockProgress);
      expect(setLLMProgressEmitter).toHaveBeenCalledWith(mockProgress);
      expect(setElicitationProgressEmitter).toHaveBeenCalledWith(mockProgress);
      expect(setSamplingProgressEmitter).toHaveBeenCalledWith(mockProgress);
    });

    it('wires UserInteraction into MCP and elicitation services', () => {
      const mockPath = {} as any;
      const mockProgress = {} as any;
      const mockUI = {} as any;

      wireCoreDependencies(mockPath, mockProgress, mockUI);

      expect(setMCPServiceUserInteraction).toHaveBeenCalledWith(mockUI);
      expect(setElicitationUserInteraction).toHaveBeenCalledWith(mockUI);
    });

    it('wires PathResolver into MCP service', () => {
      const mockPath = {} as any;
      const mockProgress = {} as any;
      const mockUI = {} as any;

      wireCoreDependencies(mockPath, mockProgress, mockUI);

      expect(setMCPServicePathResolver).toHaveBeenCalledWith(mockPath);
    });

    it('wires cross-service dependencies (builtins, emergency stop)', () => {
      const mockPath = {} as any;
      const mockProgress = {} as any;
      const mockUI = {} as any;

      wireCoreDependencies(mockPath, mockProgress, mockUI);

      expect(setBuiltinToolsMcpService).toHaveBeenCalled();
      expect(setBuiltinToolsEmergencyStop).toHaveBeenCalledWith(emergencyStopAll);
      expect(setBuiltinToolNamesProvider).toHaveBeenCalledWith(getBuiltinToolNames);
      expect(setProfileBuiltinToolNamesProvider).toHaveBeenCalledWith(getBuiltinToolNames);
    });

    it('wires TTS/STT PathResolvers for voice services', () => {
      const mockPath = {} as any;
      const mockProgress = {} as any;
      const mockUI = {} as any;

      wireCoreDependencies(mockPath, mockProgress, mockUI);

      expect(setKittenTTSPathResolver).toHaveBeenCalledWith(mockPath);
      expect(setSupertonicTTSPathResolver).toHaveBeenCalledWith(mockPath);
      expect(setParakeetSTTPathResolver).toHaveBeenCalledWith(mockPath);
    });

    it('wires command path resolver', () => {
      const mockPath = {} as any;
      const mockProgress = {} as any;
      const mockUI = {} as any;

      wireCoreDependencies(mockPath, mockProgress, mockUI);

      expect(setCommandPathResolver).toHaveBeenCalledWith(
        expect.objectContaining({
          resolveCommandPath: expect.any(Function),
        }),
      );
    });

    it('wires remote server ProgressEmitter', () => {
      const mockPath = {} as any;
      const mockProgress = {} as any;
      const mockUI = {} as any;

      wireCoreDependencies(mockPath, mockProgress, mockUI);

      expect(setRemoteServerProgressEmitter).toHaveBeenCalledWith(mockProgress);
    });

    it('wires OAuth client UserInteraction', () => {
      const mockPath = {} as any;
      const mockProgress = {} as any;
      const mockUI = {} as any;

      wireCoreDependencies(mockPath, mockProgress, mockUI);

      expect(setOAuthClientUserInteraction).toHaveBeenCalledWith(mockUI);
    });
  });

  describe('initializeMcpServers', () => {
    it('initializes MCP service and returns tool count', async () => {
      vi.mocked(mcpService.getAvailableTools).mockReturnValue([
        { name: 'test-tool', description: 'A test tool' },
        { name: 'another-tool', description: 'Another tool' },
      ] as any);

      const result = await initializeMcpServers();

      expect(mcpService.initialize).toHaveBeenCalled();
      expect(result.toolCount).toBe(2);
      expect(result.errors).toEqual([]);
    });

    it('captures initialization errors without throwing', async () => {
      vi.mocked(mcpService.initialize).mockRejectedValueOnce(
        new Error('Server connection failed'),
      );
      vi.mocked(mcpService.getAvailableTools).mockReturnValue([]);

      const result = await initializeMcpServers();

      expect(result.errors).toEqual(['Server connection failed']);
      expect(result.toolCount).toBe(0);
    });

    it('handles non-Error thrown values', async () => {
      vi.mocked(mcpService.initialize).mockRejectedValueOnce('string error');
      vi.mocked(mcpService.getAvailableTools).mockReturnValue([]);

      const result = await initializeMcpServers();

      expect(result.errors).toEqual(['Unknown MCP initialization error']);
    });
  });

  describe('cleanupMcpService', () => {
    it('calls mcpService.cleanup()', async () => {
      await cleanupMcpService();
      expect(mcpService.cleanup).toHaveBeenCalled();
    });

    it('swallows cleanup errors silently', async () => {
      vi.mocked(mcpService.cleanup).mockRejectedValueOnce(
        new Error('cleanup failed'),
      );
      // Should not throw
      await cleanupMcpService();
    });
  });
});
