import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'node:path'

const sharedSrcRoot = resolve(__dirname, '../../packages/shared/src')

export default defineConfig({
  plugins: [tsconfigPaths({ root: __dirname, projects: ['tsconfig.node.json', 'tsconfig.web.json'], ignoreConfigErrors: true })],
  resolve: {
    alias: [
      { find: /^@dotagents\/shared$/, replacement: resolve(sharedSrcRoot, 'index.ts') },
      { find: /^@dotagents\/shared\/(.+)$/, replacement: `${sharedSrcRoot}/$1.ts` },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
