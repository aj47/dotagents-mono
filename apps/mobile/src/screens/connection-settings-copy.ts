export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

export const CONNECTION_BASE_URL_HELPER_TEXT =
  'Leave Base URL empty to use OpenAI by default, or enter another OpenAI-compatible server URL.';

export function resolveConnectionBaseUrlForSave(baseUrl?: string): string {
  const trimmedBaseUrl = baseUrl?.trim?.() ?? '';
  return trimmedBaseUrl || DEFAULT_OPENAI_BASE_URL;
}