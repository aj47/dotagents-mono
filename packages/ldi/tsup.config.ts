import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
})
