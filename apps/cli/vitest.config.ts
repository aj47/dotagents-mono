import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Fix ESM import for react-reconciler/constants (missing .js extension in OpenTUI)
      'react-reconciler/constants': 'react-reconciler/constants.js',
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/test-setup.ts'],
  },
});
