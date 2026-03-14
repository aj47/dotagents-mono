import { resolve, dirname, join } from "path"
import { createRequire } from "module"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import pkg from "./package.json"

const _require = createRequire(import.meta.url)

// Resolve paths for packages with version conflicts in pnpm
const reactRouterV6 = resolve(dirname(_require.resolve("react-router-dom/package.json")), "../react-router")
// micromark-util-symbol v1 has no "." export; force v2 which does
const micromarkUtilSymbolV2 = resolve(__dirname, "../../node_modules/.pnpm/micromark-util-symbol@2.0.1/node_modules/micromark-util-symbol")

const builderConfig = require("./electron-builder.config.cjs")

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

export default defineConfig({
  main: {
    plugins: [tsconfigPaths(), externalizeDepsPlugin({ include: optionalDeps })],
    define,
  },
  preload: {
    plugins: [tsconfigPaths(), externalizeDepsPlugin()],
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
        // Resolve react-router v6 from react-router-dom's pnpm peer to avoid v5 mismatch
        { find: /^react-router$/, replacement: reactRouterV6 },
        // Force micromark-util-symbol bare import to v2 (v1 has no "." export);
        // subpath imports like micromark-util-symbol/codes.js must still resolve to v1
        { find: /^micromark-util-symbol$/, replacement: micromarkUtilSymbolV2 },
      ],
      dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
      preserveSymlinks: true,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@dotagents/shared"],
      esbuildOptions: {
        preserveSymlinks: true,
      },
    },
  },
})
