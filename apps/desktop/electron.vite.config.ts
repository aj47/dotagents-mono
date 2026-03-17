import { resolve } from "path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import pkg from "./package.json"

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
      alias: {
        "@renderer": resolve(__dirname, "src/renderer/src"),
        "~": resolve(__dirname, "src/renderer/src"),
        "@shared": resolve(__dirname, "src/shared"),
      },
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
