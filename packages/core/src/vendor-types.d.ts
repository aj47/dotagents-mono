// Type declarations for optional dependencies without type definitions

declare module 'unbzip2-stream' {
  function unbzip2Stream(): NodeJS.ReadWriteStream;
  export = unbzip2Stream;
}

declare module 'qrcode' {
  export function toDataURL(text: string, options?: Record<string, unknown>): Promise<string>;
  export function toString(text: string, options?: Record<string, unknown>): Promise<string>;
  export function toBuffer(text: string, options?: Record<string, unknown>): Promise<Buffer>;
}
