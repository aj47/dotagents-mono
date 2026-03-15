/**
 * DotAgents CLI Entry Point
 *
 * Initializes the service container with CLI-specific adapters,
 * wires core dependencies (MCP, builtins, LLM, etc.),
 * and renders the TUI application using OpenTUI React.
 */

import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import {
  container,
  ServiceTokens,
} from '@dotagents/core';
import type { PathResolver, ProgressEmitter, UserInteraction } from '@dotagents/core';
import {
  FilePathResolver,
  TerminalProgressEmitter,
  TerminalUserInteraction,
  TerminalNotificationService,
} from './adapters/index';
import { wireCoreDependencies } from './core-wiring';
import { App } from './components/App';

/**
 * Initialize the service container with CLI-specific adapter implementations
 * and wire all core service dependencies.
 */
function initializeServiceContainer(): void {
  const pathResolver = new FilePathResolver();
  const progressEmitter = new TerminalProgressEmitter();
  const userInteraction = new TerminalUserInteraction();
  const notificationService = new TerminalNotificationService();

  container.register(ServiceTokens.PathResolver, pathResolver);
  container.register(ServiceTokens.ProgressEmitter, progressEmitter, () => {
    progressEmitter.dispose();
  });
  container.register(ServiceTokens.UserInteraction, userInteraction);
  container.register(ServiceTokens.NotificationService, notificationService);

  // Wire all core service dependencies (MCP, builtins, LLM, etc.)
  wireCoreDependencies(
    pathResolver as PathResolver,
    progressEmitter as ProgressEmitter,
    userInteraction as UserInteraction,
  );
}

/**
 * Main entry — bootstraps the CLI application.
 */
async function main(): Promise<void> {
  try {
    // Register CLI-specific services and wire dependencies
    initializeServiceContainer();

    // Start the OpenTUI renderer
    const renderer = await createCliRenderer({
      // We handle Ctrl+C ourselves in the App component
      exitOnCtrlC: false,
    });

    // Render the TUI
    createRoot(renderer).render(<App />);
  } catch (error) {
    console.error('Failed to start DotAgents CLI:', error);
    process.exit(1);
  }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

main();
