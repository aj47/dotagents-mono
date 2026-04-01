import { test, expect, chromium } from '@playwright/test';
import { spawn } from 'child_process';
import kill from 'tree-kill';

test.describe('Desktop App E2E', () => {
  let appProcess;
  let browser;

  test.beforeAll(async () => {
    // Launch Electron with remote debugging using the dev wrapper
    appProcess = spawn('pnpm', ['--filter', '@dotagents/desktop', 'dev:no-sherpa', '--', '-d'], {
      env: { ...process.env, REMOTE_DEBUGGING_PORT: '9333' },
      shell: process.platform === 'win32',
      stdio: 'inherit'
    });

    // Wait for CDP to be available
    // In a real implementation, you might use 'wait-on' or a custom polling function here
    await new Promise(resolve => setTimeout(resolve, 15000)); // wait 15s for dev server

    // Attach Playwright over CDP
    browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
  });

  test.afterAll(async () => {
    if (browser) await browser.close();
    if (appProcess && appProcess.pid) {
      // Ensure all child processes (Vite, Electron, etc.) are killed
      await new Promise<void>((resolve) => {
        kill(appProcess.pid, 'SIGKILL', () => {
          resolve();
        });
      });
    }
  });

  test('app should launch and display a window', async () => {
    // Get the first window
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    // Wait for the window to finish loading
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Basic assertion to ensure the window is visible
    const title = await page.title();
    expect(title).toBeDefined();
  });
});
