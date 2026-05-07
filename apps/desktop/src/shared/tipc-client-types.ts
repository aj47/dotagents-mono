export type LooseTipcRouter = Record<string, {
  action: (args: { context: any; input: any }) => Promise<any>
}>

export type DesktopTipcClient = Record<string, (input?: any) => Promise<any>>
