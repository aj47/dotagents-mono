/**
 * Re-exports from @dotagents/shared
 * This file acts as a barrel to maintain backwards compatibility.
 * All language constants and utilities are now in the shared package.
 */

export {
  SUPPORTED_LANGUAGES,
  OPENAI_WHISPER_SUPPORTED_LANGUAGES,
  GROQ_WHISPER_SUPPORTED_LANGUAGES,
  getLanguageName,
  getLanguageNativeName,
  isValidLanguageCode,
  isValidLanguageForProvider,
  getApiLanguageCode,
  getSupportedLanguagesForProvider,
} from '@dotagents/shared'

export type { LanguageOption } from '@dotagents/shared'
