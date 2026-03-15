import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceContainer, ServiceTokens } from './service-container';
import { MockPathResolver } from './testing/mock-path-resolver';
import { MockProgressEmitter } from './testing/mock-progress-emitter';
import { MockUserInteraction } from './testing/mock-user-interaction';
import { MockNotificationService } from './testing/mock-notification-service';
import type { PathResolver } from './interfaces/path-resolver';
import type { ProgressEmitter } from './interfaces/progress-emitter';
import type { UserInteraction } from './interfaces/user-interaction';
import type { NotificationService } from './interfaces/notification-service';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  describe('register', () => {
    it('should register a service successfully', () => {
      const resolver = new MockPathResolver();
      container.register(ServiceTokens.PathResolver, resolver);
      expect(container.has(ServiceTokens.PathResolver)).toBe(true);
    });

    it('should throw when registering a duplicate token', () => {
      const resolver = new MockPathResolver();
      container.register(ServiceTokens.PathResolver, resolver);
      expect(() => {
        container.register(ServiceTokens.PathResolver, new MockPathResolver());
      }).toThrow('Service "PathResolver" is already registered');
    });

    it('should register multiple services under different tokens', () => {
      container.register(ServiceTokens.PathResolver, new MockPathResolver());
      container.register(ServiceTokens.ProgressEmitter, new MockProgressEmitter());
      container.register(ServiceTokens.UserInteraction, new MockUserInteraction());
      container.register(ServiceTokens.NotificationService, new MockNotificationService());

      expect(container.size).toBe(4);
    });
  });

  describe('resolve', () => {
    it('should resolve a registered service', () => {
      const resolver = new MockPathResolver('/test/base');
      container.register(ServiceTokens.PathResolver, resolver);

      const resolved = container.resolve<PathResolver>(ServiceTokens.PathResolver);
      expect(resolved.getUserDataPath()).toBe('/test/base/userData');
    });

    it('should throw when resolving an unregistered token', () => {
      expect(() => {
        container.resolve('NonExistent');
      }).toThrow('Service "NonExistent" is not registered');
    });

    it('should include available services in error message', () => {
      container.register('ServiceA', { name: 'A' });
      container.register('ServiceB', { name: 'B' });

      expect(() => {
        container.resolve('Missing');
      }).toThrow('Available services: [ServiceA, ServiceB]');
    });

    it('should resolve the correct instance when multiple services are registered', () => {
      const pathResolver = new MockPathResolver('/paths');
      const emitter = new MockProgressEmitter();
      const interaction = new MockUserInteraction();
      const notification = new MockNotificationService();

      container.register(ServiceTokens.PathResolver, pathResolver);
      container.register(ServiceTokens.ProgressEmitter, emitter);
      container.register(ServiceTokens.UserInteraction, interaction);
      container.register(ServiceTokens.NotificationService, notification);

      const resolvedEmitter = container.resolve<ProgressEmitter>(ServiceTokens.ProgressEmitter);
      const resolvedInteraction = container.resolve<UserInteraction>(ServiceTokens.UserInteraction);

      expect(resolvedEmitter).toBe(emitter);
      expect(resolvedInteraction).toBe(interaction);
    });
  });

  describe('tryResolve', () => {
    it('should return the service if registered', () => {
      const resolver = new MockPathResolver();
      container.register(ServiceTokens.PathResolver, resolver);

      const resolved = container.tryResolve<PathResolver>(ServiceTokens.PathResolver);
      expect(resolved).toBe(resolver);
    });

    it('should return undefined if not registered', () => {
      const resolved = container.tryResolve<PathResolver>('Missing');
      expect(resolved).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered services', () => {
      container.register('TestService', { value: 42 });
      expect(container.has('TestService')).toBe(true);
    });

    it('should return false for unregistered services', () => {
      expect(container.has('Missing')).toBe(false);
    });
  });

  describe('replace', () => {
    it('should replace an existing service', async () => {
      const oldResolver = new MockPathResolver('/old');
      const newResolver = new MockPathResolver('/new');

      container.register(ServiceTokens.PathResolver, oldResolver);
      await container.replace(ServiceTokens.PathResolver, newResolver);

      const resolved = container.resolve<PathResolver>(ServiceTokens.PathResolver);
      expect(resolved.getUserDataPath()).toBe('/new/userData');
    });

    it('should call cleanup on the old service when replacing', async () => {
      const cleanup = vi.fn();
      container.register('Service', { value: 1 }, cleanup);

      await container.replace('Service', { value: 2 });
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should register a new service if token does not exist', async () => {
      await container.replace('NewService', { value: 42 });
      expect(container.resolve('NewService')).toEqual({ value: 42 });
    });
  });

  describe('unregister', () => {
    it('should unregister a service', async () => {
      container.register('Service', { value: 1 });
      const result = await container.unregister('Service');

      expect(result).toBe(true);
      expect(container.has('Service')).toBe(false);
    });

    it('should call cleanup when unregistering', async () => {
      const cleanup = vi.fn();
      container.register('Service', { value: 1 }, cleanup);

      await container.unregister('Service');
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should return false when unregistering a non-existent service', async () => {
      const result = await container.unregister('Missing');
      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should call cleanup for all registered services', async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const cleanup3 = vi.fn();

      container.register('Service1', { name: 'one' }, cleanup1);
      container.register('Service2', { name: 'two' }, cleanup2);
      container.register('Service3', { name: 'three' }, cleanup3);

      await container.cleanup();

      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
      expect(cleanup3).toHaveBeenCalledTimes(1);
      expect(container.size).toBe(0);
    });

    it('should clear the registry even if no cleanup functions exist', async () => {
      container.register('Service1', { name: 'one' });
      container.register('Service2', { name: 'two' });

      await container.cleanup();
      expect(container.size).toBe(0);
    });

    it('should throw AggregateError when cleanup fails for some services', async () => {
      const failingCleanup = vi.fn().mockRejectedValue(new Error('cleanup failed'));
      const succeedingCleanup = vi.fn();

      container.register('Failing', { name: 'fail' }, failingCleanup);
      container.register('Succeeding', { name: 'success' }, succeedingCleanup);

      await expect(container.cleanup()).rejects.toThrow('Cleanup failed for 1 service(s)');
      expect(succeedingCleanup).toHaveBeenCalledTimes(1);
      expect(container.size).toBe(0); // still clears even on error
    });
  });

  describe('getRegisteredTokens', () => {
    it('should return all registered tokens', () => {
      container.register('A', {});
      container.register('B', {});
      container.register('C', {});

      const tokens = container.getRegisteredTokens();
      expect(tokens).toEqual(['A', 'B', 'C']);
    });

    it('should return empty array when no services are registered', () => {
      expect(container.getRegisteredTokens()).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return 0 for empty container', () => {
      expect(container.size).toBe(0);
    });

    it('should return correct count after registrations', () => {
      container.register('A', {});
      container.register('B', {});
      expect(container.size).toBe(2);
    });
  });

  describe('ServiceTokens', () => {
    it('should have the 4 core abstraction tokens', () => {
      expect(ServiceTokens.PathResolver).toBe('PathResolver');
      expect(ServiceTokens.ProgressEmitter).toBe('ProgressEmitter');
      expect(ServiceTokens.UserInteraction).toBe('UserInteraction');
      expect(ServiceTokens.NotificationService).toBe('NotificationService');
    });
  });

  describe('interface substitution with mock implementations', () => {
    it('should resolve MockPathResolver as PathResolver', () => {
      const mock = new MockPathResolver('/test');
      container.register(ServiceTokens.PathResolver, mock);

      const resolved = container.resolve<PathResolver>(ServiceTokens.PathResolver);
      expect(resolved.getUserDataPath()).toBe('/test/userData');
      expect(resolved.getConfigPath()).toBe('/test/config');
      expect(resolved.getAppDataPath()).toBe('/test/appData');
      expect(resolved.getTempPath()).toBe('/test/temp');
      expect(resolved.getHomePath()).toBe('/test/home');
      expect(resolved.getDesktopPath()).toBe('/test/home/Desktop');
      expect(resolved.getDownloadsPath()).toBe('/test/home/Downloads');
      expect(resolved.getLogsPath()).toBe('/test/logs');
    });

    it('should resolve MockProgressEmitter as ProgressEmitter', () => {
      const mock = new MockProgressEmitter();
      container.register(ServiceTokens.ProgressEmitter, mock);

      const resolved = container.resolve<ProgressEmitter>(ServiceTokens.ProgressEmitter);
      resolved.emitAgentProgress({} as any);
      resolved.emitSessionUpdate({ activeSessions: [], recentSessions: [] });
      resolved.emitQueueUpdate({ conversationId: 'conv-1', queue: [{ id: 1 }], isPaused: false });
      resolved.emitEvent('custom', { data: true });

      expect(mock.progressUpdates).toHaveLength(1);
      expect(mock.sessionUpdates).toHaveLength(1);
      expect(mock.queueUpdates).toHaveLength(1);
      expect(mock.events).toHaveLength(1);
    });

    it('should resolve MockUserInteraction as UserInteraction', async () => {
      const mock = new MockUserInteraction();
      mock.approvalResult = false;
      container.register(ServiceTokens.UserInteraction, mock);

      const resolved = container.resolve<UserInteraction>(ServiceTokens.UserInteraction);
      resolved.showError('Error', 'Something went wrong');
      const approved = await resolved.requestApproval({
        toolName: 'dangerousTool',
        args: { path: '/etc/passwd' },
      });

      expect(mock.errors).toHaveLength(1);
      expect(approved).toBe(false);
      expect(mock.approvalRequests).toHaveLength(1);
      expect(mock.approvalRequests[0].toolName).toBe('dangerousTool');
    });

    it('should resolve MockNotificationService as NotificationService', () => {
      const mock = new MockNotificationService();
      container.register(ServiceTokens.NotificationService, mock);

      const resolved = container.resolve<NotificationService>(ServiceTokens.NotificationService);
      resolved.showNotification('Hello', 'World');
      resolved.showNotificationWithOptions({
        title: 'Alert',
        body: 'Important',
        urgency: 'critical',
      });

      expect(mock.notifications).toHaveLength(1);
      expect(mock.notificationsWithOptions).toHaveLength(1);
      expect(resolved.isSupported()).toBe(true);

      mock.supported = false;
      expect(resolved.isSupported()).toBe(false);
    });
  });
});
