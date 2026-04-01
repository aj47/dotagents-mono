import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
});
