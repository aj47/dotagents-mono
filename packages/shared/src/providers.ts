/**
 * Provider constants and types for DotAgents apps
 * These are platform-agnostic and can be used by both desktop and mobile.
 */

export interface ModelPreset {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  isBuiltIn?: boolean;
  createdAt?: number;
  updatedAt?: number;
  /** Preferred agent model field. Deprecated legacy alias: mcpToolsModel. */
  agentModel?: string;
  /** @deprecated Use agentModel instead. */
  mcpToolsModel?: string;
  transcriptProcessingModel?: string;
}

export const STT_PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Groq", value: "groq" },
  { label: "Parakeet (Local)", value: "parakeet" },
] as const;

export type STT_PROVIDER_ID = (typeof STT_PROVIDERS)[number]["value"];

export const CHAT_PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Groq", value: "groq" },
  { label: "Gemini", value: "gemini" },
  { label: "OpenAI Codex", value: "chatgpt-web" },
] as const;

export type CHAT_PROVIDER_ID = (typeof CHAT_PROVIDERS)[number]["value"];

export const DEFAULT_TRANSCRIPT_POST_PROCESSING_PROMPT = [
  "Clean up the transcript for punctuation, capitalization, and obvious speech-to-text mistakes.",
  "Preserve the original meaning and wording as much as possible.",
  "Do not answer the transcript or add commentary. Return only the cleaned transcript.",
  "",
  "{transcript}",
].join("\n");

export const TTS_PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Groq", value: "groq" },
  { label: "Gemini", value: "gemini" },
  { label: "Edge TTS (Free)", value: "edge" },
  { label: "Kitten (Local)", value: "kitten" },
  { label: "Supertonic (Local)", value: "supertonic" },
] as const;

export type TTS_PROVIDER_ID = (typeof TTS_PROVIDERS)[number]["value"];

// OpenAI TTS Voice Options
export const OPENAI_TTS_VOICES = [
  { label: "Alloy", value: "alloy" },
  { label: "Echo", value: "echo" },
  { label: "Fable", value: "fable" },
  { label: "Onyx", value: "onyx" },
  { label: "Nova", value: "nova" },
  { label: "Shimmer", value: "shimmer" },
] as const;

export const OPENAI_TTS_MODELS = [
  { label: "GPT-4o Mini TTS", value: "gpt-4o-mini-tts" },
  { label: "TTS-1 (Standard)", value: "tts-1" },
  { label: "TTS-1-HD (High Quality)", value: "tts-1-hd" },
] as const;

// Groq TTS Voice Options (English) - Orpheus model voices
export const GROQ_TTS_VOICES_ENGLISH = [
  { label: "Autumn", value: "autumn" },
  { label: "Diana", value: "diana" },
  { label: "Hannah", value: "hannah" },
  { label: "Austin", value: "austin" },
  { label: "Daniel", value: "daniel" },
  { label: "Troy", value: "troy" },
] as const;

// Groq TTS Voice Options (Arabic Saudi) - Orpheus model voices
export const GROQ_TTS_VOICES_ARABIC = [
  { label: "Fahad", value: "fahad" },
  { label: "Sultan", value: "sultan" },
  { label: "Lulwa", value: "lulwa" },
  { label: "Noura", value: "noura" },
] as const;

export const GROQ_TTS_MODELS = [
  { label: "Orpheus TTS (English)", value: "canopylabs/orpheus-v1-english" },
  { label: "Orpheus TTS (Arabic Saudi)", value: "canopylabs/orpheus-arabic-saudi" },
] as const;

// Gemini TTS Voice Options (30 voices)
export const GEMINI_TTS_VOICES = [
  { label: "Zephyr (Bright)", value: "Zephyr" },
  { label: "Puck (Upbeat)", value: "Puck" },
  { label: "Charon (Informative)", value: "Charon" },
  { label: "Kore (Firm)", value: "Kore" },
  { label: "Fenrir (Excitable)", value: "Fenrir" },
  { label: "Leda (Young)", value: "Leda" },
  { label: "Orus (Corporate)", value: "Orus" },
  { label: "Aoede (Breezy)", value: "Aoede" },
  { label: "Callirrhoe (Casual)", value: "Callirrhoe" },
  { label: "Autonoe (Bright)", value: "Autonoe" },
  { label: "Enceladus (Breathy)", value: "Enceladus" },
  { label: "Iapetus (Clear)", value: "Iapetus" },
  { label: "Umbriel (Calm)", value: "Umbriel" },
  { label: "Algieba (Smooth)", value: "Algieba" },
  { label: "Despina (Smooth)", value: "Despina" },
  { label: "Erinome (Serene)", value: "Erinome" },
  { label: "Algenib (Gravelly)", value: "Algenib" },
  { label: "Rasalgethi (Informative)", value: "Rasalgethi" },
  { label: "Laomedeia (Upbeat)", value: "Laomedeia" },
  { label: "Achernar (Soft)", value: "Achernar" },
  { label: "Alnilam (Firm)", value: "Alnilam" },
  { label: "Schedar (Even)", value: "Schedar" },
  { label: "Gacrux (Mature)", value: "Gacrux" },
  { label: "Pulcherrima (Forward)", value: "Pulcherrima" },
  { label: "Achird (Friendly)", value: "Achird" },
  { label: "Zubenelgenubi (Casual)", value: "Zubenelgenubi" },
  { label: "Vindemiatrix (Gentle)", value: "Vindemiatrix" },
  { label: "Sadachbia (Lively)", value: "Sadachbia" },
  { label: "Sadaltager (Knowledgeable)", value: "Sadaltager" },
  { label: "Sulafat (Warm)", value: "Sulafat" },
] as const;

export const GEMINI_TTS_MODELS = [
  { label: "Gemini 2.5 Flash TTS", value: "gemini-2.5-flash-preview-tts" },
  { label: "Gemini 2.5 Pro TTS", value: "gemini-2.5-pro-preview-tts" },
] as const;

// Edge TTS (Microsoft Edge cloud TTS) options
export const EDGE_TTS_MODELS = [
  { label: "Edge Neural (Free)", value: "edge-tts" },
] as const;

export const EDGE_TTS_VOICES = [
  { label: "Aria (US, Female)", value: "en-US-AriaNeural" },
  { label: "Guy (US, Male)", value: "en-US-GuyNeural" },
  { label: "Jenny (US, Female)", value: "en-US-JennyNeural" },
  { label: "Sonia (UK, Female)", value: "en-GB-SoniaNeural" },
  { label: "Ryan (UK, Male)", value: "en-GB-RyanNeural" },
] as const;

// Kitten TTS Voice Options (8 voices, sid 0-7)
export const KITTEN_TTS_VOICES = [
  { label: "Voice 2 - Male (Default)", value: 0 },
  { label: "Voice 2 - Female", value: 1 },
  { label: "Voice 3 - Male", value: 2 },
  { label: "Voice 3 - Female", value: 3 },
  { label: "Voice 4 - Male", value: 4 },
  { label: "Voice 4 - Female", value: 5 },
  { label: "Voice 5 - Male", value: 6 },
  { label: "Voice 5 - Female", value: 7 },
] as const;

// Supertonic TTS Voice Options (10 voices: 5 male + 5 female)
export const SUPERTONIC_TTS_VOICES = [
  { label: "Male 1 (M1)", value: "M1" },
  { label: "Male 2 (M2)", value: "M2" },
  { label: "Male 3 (M3)", value: "M3" },
  { label: "Male 4 (M4)", value: "M4" },
  { label: "Male 5 (M5)", value: "M5" },
  { label: "Female 1 (F1)", value: "F1" },
  { label: "Female 2 (F2)", value: "F2" },
  { label: "Female 3 (F3)", value: "F3" },
  { label: "Female 4 (F4)", value: "F4" },
  { label: "Female 5 (F5)", value: "F5" },
] as const;

// Supertonic TTS Language Options
export const SUPERTONIC_TTS_LANGUAGES = [
  { label: "English", value: "en" },
  { label: "Korean", value: "ko" },
  { label: "Spanish", value: "es" },
  { label: "Portuguese", value: "pt" },
  { label: "French", value: "fr" },
] as const;

// OpenAI Compatible Provider Presets
export const OPENAI_COMPATIBLE_PRESETS = [
  {
    label: "OpenAI",
    value: "openai",
    description: "Official OpenAI API",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    label: "OpenRouter",
    value: "openrouter",
    description: "Access to multiple AI models via OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
  },
  {
    label: "Together AI",
    value: "together",
    description: "Together AI's inference platform",
    baseUrl: "https://api.together.xyz/v1",
  },
  {
    label: "Cerebras",
    value: "cerebras",
    description: "Cerebras fast inference API",
    baseUrl: "https://api.cerebras.ai/v1",
  },
  {
    label: "Zhipu GLM",
    value: "zhipu",
    description: "Zhipu AI GLM models (China)",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
  },
  {
    label: "Perplexity",
    value: "perplexity",
    description: "Perplexity's AI models",
    baseUrl: "https://api.perplexity.ai",
  },
  {
    label: "Custom",
    value: "custom",
    description: "Enter your own base URL",
    baseUrl: "",
  },
] as const;

export type OPENAI_COMPATIBLE_PRESET_ID = (typeof OPENAI_COMPATIBLE_PRESETS)[number]["value"];

// Default preset ID
export const DEFAULT_MODEL_PRESET_ID = "builtin-openai";

// Helper to get built-in presets as ModelPreset objects (without API keys)
export const getBuiltInModelPresets = (): ModelPreset[] => {
  return OPENAI_COMPATIBLE_PRESETS.filter(p => p.value !== "custom").map(preset => ({
    id: `builtin-${preset.value}`,
    name: preset.label,
    baseUrl: preset.baseUrl,
    apiKey: "",
    isBuiltIn: true,
  }));
};

/**
 * Get the current preset display name from config.
 * Looks up the preset by ID and returns its name.
 */
export const getCurrentPresetName = (
  currentModelPresetId: string | undefined,
  modelPresets: ModelPreset[] | undefined
): string => {
  const presetId = currentModelPresetId || DEFAULT_MODEL_PRESET_ID;
  const allPresets = [...getBuiltInModelPresets(), ...(modelPresets || [])];
  return allPresets.find(p => p.id === presetId)?.name || "OpenAI";
};
