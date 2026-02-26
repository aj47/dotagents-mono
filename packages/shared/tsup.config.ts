import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    colors: 'src/colors.ts',
    types: 'src/types.ts',
    'tts-preprocessing': 'src/tts-preprocessing.ts',
    'chat-utils': 'src/chat-utils.ts',
    providers: 'src/providers.ts',
    languages: 'src/languages.ts',
    session: 'src/session.ts',
    'shell-parse': 'src/shell-parse.ts',
    'connection-recovery': 'src/connection-recovery.ts',
    'api-types': 'src/api-types.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});

