import { resolve } from "path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import pkg from "./package.json"

const builderConfig = require("./electron-builder.config.cjs")
const sharedSrcRoot = resolve(__dirname, "../../packages/shared/src")

const define = {
  "process.env.APP_ID": JSON.stringify(builderConfig.appId),
  "process.env.PRODUCT_NAME": JSON.stringify(builderConfig.productName),
  "process.env.APP_VERSION": JSON.stringify(pkg.version),
  "process.env.IS_MAC": JSON.stringify(process.platform === "darwin"),
}

// externalizeDepsPlugin only reads pkg.dependencies, not optionalDependencies.
// Native modules like onnxruntime-node must be externalized (not bundled) so their
// internal require() for .node bindings works at runtime.
const optionalDeps = Object.keys(pkg.optionalDependencies || {})
const desktopTsconfigPathsOptions = {
  root: __dirname,
  projects: ["tsconfig.node.json"] as string[],
  ignoreConfigErrors: true,
}

export default defineConfig({
  main: {
    plugins: [tsconfigPaths(desktopTsconfigPathsOptions), externalizeDepsPlugin({ include: optionalDeps })],
    define,
  },
  preload: {
    plugins: [tsconfigPaths(desktopTsconfigPathsOptions), externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: "cjs",
          entryFileNames: "[name].cjs",
          chunkFileNames: "[name].cjs",
        },
      },
    },
  },
  renderer: {
    define,
    plugins: [react()],
    resolve: {
      alias: [
        { find: "@renderer", replacement: resolve(__dirname, "src/renderer/src") },
        { find: "~", replacement: resolve(__dirname, "src/renderer/src") },
        { find: "@shared", replacement: resolve(__dirname, "src/shared") },
        // In desktop renderer dev, resolve the shared workspace package directly to source.
        // This avoids stale export errors from Vite serving cached transforms of the built
        // package under node_modules after shared constants/helpers change.
        { find: /^@dotagents\/shared$/, replacement: resolve(sharedSrcRoot, "index.ts") },
        { find: /^@dotagents\/shared\/(.+)$/, replacement: `${sharedSrcRoot}/$1.ts` },
      ],
      dedupe: ["react", "react-dom"],
      preserveSymlinks: true,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
      exclude: ["@dotagents/shared"],
      esbuildOptions: {
        preserveSymlinks: true,
      },
    },
  },
})
