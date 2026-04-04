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
        // Resolve is-plain-obj through pnpm .pnpm store to avoid symlink/junction issues on Windows
        { find: "is-plain-obj", replacement: resolve(__dirname, "../../node_modules/.pnpm/is-plain-obj@2.1.0/node_modules/is-plain-obj/index.js") },
      ],
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "remark-gfm",
        "rehype-highlight",
        // `react-markdown` can be served from source in desktop dev, but some of its
        // transitive dependencies are CJS-only and still need Vite interop.
        "style-to-js",
        "style-to-object",
        "debug",
        "extend",
        "escape-string-regexp",
        "highlight.js",
      ],
      exclude: [
        "@dotagents/shared",
        // Keep the markdown pipeline out of Vite's optimized dep cache in desktop dev.
        // We saw renderer lazy routes get stuck on a poisoned immutable
        // `react-markdown.js?v=...` URL after a failed prebundle/cached module load.
        // Serving react-markdown directly avoids that stale optimized-dep path.
        "react-markdown",
      ],
    },
  },
})
