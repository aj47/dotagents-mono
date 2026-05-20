/// <reference types="vite/client" />

declare module "@babel/standalone" {
  export function transform(
    code: string,
    options: {
      presets?: unknown[]
      plugins?: unknown[]
      filename?: string
      sourceType?: "script" | "module" | "unambiguous"
    },
  ): { code?: string | null }
}
