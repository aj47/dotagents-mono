/**
 * Text preprocessing utilities for Text-to-Speech (TTS)
 * Converts technical content into speech-friendly text
 * 
 * This module is shared between desktop and mobile apps to ensure
 * consistent TTS output across platforms.
 */

import {
  DEFAULT_TTS_CONVERT_MARKDOWN,
  DEFAULT_TTS_REMOVE_CODE_BLOCKS,
  DEFAULT_TTS_REMOVE_URLS,
} from "./text-to-speech-settings"

export interface TTSPreprocessingOptions {
  removeCodeBlocks?: boolean
  removeUrls?: boolean
  convertMarkdown?: boolean
  removeSymbols?: boolean
  convertNumbers?: boolean
  maxLength?: number
  removeThinkingBlocks?: boolean
}

export interface TTSPreprocessingConfigLike {
  ttsRemoveCodeBlocks?: boolean
  ttsRemoveUrls?: boolean
  ttsConvertMarkdown?: boolean
}

const DEFAULT_OPTIONS: TTSPreprocessingOptions = {
  removeCodeBlocks: DEFAULT_TTS_REMOVE_CODE_BLOCKS,
  removeUrls: DEFAULT_TTS_REMOVE_URLS,
  convertMarkdown: DEFAULT_TTS_CONVERT_MARKDOWN,
  removeSymbols: true,
  convertNumbers: true,
  maxLength: 4000, // Reasonable limit for TTS
  removeThinkingBlocks: true,
}

/**
 * Converts app-level TTS preprocessing config into regex preprocessor options.
 */
export function getTTSPreprocessingOptionsFromConfig(
  config: TTSPreprocessingConfigLike,
): Pick<TTSPreprocessingOptions, "removeCodeBlocks" | "removeUrls" | "convertMarkdown"> {
  return {
    removeCodeBlocks: config.ttsRemoveCodeBlocks ?? DEFAULT_TTS_REMOVE_CODE_BLOCKS,
    removeUrls: config.ttsRemoveUrls ?? DEFAULT_TTS_REMOVE_URLS,
    convertMarkdown: config.ttsConvertMarkdown ?? DEFAULT_TTS_CONVERT_MARKDOWN,
  }
}

/**
 * Builds the LLM prompt used to convert assistant text into speech-friendly text.
 */
export function buildTTSPreprocessingPrompt(config: TTSPreprocessingConfigLike): string {
  const instructions: string[] = []

  if (config.ttsRemoveCodeBlocks ?? DEFAULT_TTS_REMOVE_CODE_BLOCKS) {
    instructions.push("- Remove code blocks and replace with brief description if relevant")
  }
  if (config.ttsRemoveUrls ?? DEFAULT_TTS_REMOVE_URLS) {
    instructions.push("- Remove URLs but mention if a link was shared")
  }
  if (config.ttsConvertMarkdown ?? DEFAULT_TTS_CONVERT_MARKDOWN) {
    instructions.push("- Convert markdown formatting to natural speech")
    instructions.push("- Strip bullet/list markers silently; do not say or add words like \"item\" for list entries")
  }

  instructions.push("- Expand abbreviations and acronyms appropriately (e.g., \"Dr.\" → \"Doctor\", \"API\" → \"A P I\")")
  instructions.push("- Convert technical symbols to spoken words (e.g., \"&&\" → \"and\", \"=>\" → \"arrow\")")
  instructions.push("- Remove or describe any content that wouldn't make sense when spoken aloud")
  instructions.push("- Keep the core meaning but optimize for listening")
  instructions.push("- Do NOT add any commentary, just output the converted text")

  return `Convert this AI response to natural spoken text.
${instructions.join("\n")}

Only output the converted text, nothing else.

Text to convert:
`
}

/**
 * Preprocesses text to make it more suitable for text-to-speech conversion
 */
export function preprocessTextForTTS(
  text: string,
  options: TTSPreprocessingOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let processedText = text

  // Remove thinking blocks first (before other processing)
  if (opts.removeThinkingBlocks) {
    processedText = removeThinkingBlocks(processedText)
  }

  // Remove or replace code blocks
  if (opts.removeCodeBlocks) {
    processedText = removeCodeBlocks(processedText)
  }

  // Remove or replace URLs
  if (opts.removeUrls) {
    processedText = removeUrls(processedText)
  }

  // Convert markdown formatting to speech-friendly text
  if (opts.convertMarkdown) {
    processedText = convertMarkdownToSpeech(processedText)
  }

  // Remove or replace problematic symbols
  if (opts.removeSymbols) {
    processedText = cleanSymbols(processedText)
  }

  // Convert numbers to spoken form
  if (opts.convertNumbers) {
    processedText = convertNumbers(processedText)
  }

  // Clean up whitespace and normalize
  processedText = normalizeWhitespace(processedText)

  // Truncate if too long
  if (opts.maxLength && processedText.length > opts.maxLength) {
    processedText = truncateText(processedText, opts.maxLength)
  }

  return processedText
}

/** Removes thinking blocks (<think>...</think>) from text */
function removeThinkingBlocks(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "")
}

/** Removes code blocks and replaces them with descriptive text */
function removeCodeBlocks(text: string): string {
  text = text.replace(/```[\s\S]*?```/g, " [code block] ")
  text = text.replace(/`([^`]+)`/g, " $1 ")
  text = text.replace(/<[^>]*>/g, " ")
  return text
}

/** Removes URLs and replaces them with descriptive text */
function removeUrls(text: string): string {
  text = text.replace(/https?:\/\/[^\s]+/g, " [web link] ")
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, " [email address] ")
  return text
}

/** Converts markdown formatting to speech-friendly equivalents */
function convertMarkdownToSpeech(text: string): string {
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "Heading: $1.")
  text = text.replace(/^\s*[-*+]\s+(.+)$/gm, "$1.")
  text = text.replace(/^\s*\d+\.\s+(.+)$/gm, "$1.")
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1")
  text = text.replace(/__([^_]+)__/g, "$1")
  text = text.replace(/\*([^*]+)\*/g, "$1")
  text = text.replace(/_([^_]+)_/g, "$1")
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  text = text.replace(/[*_`~]/g, "")
  return text
}

/** Cleans up symbols that don't read well in speech */
function cleanSymbols(text: string): string {
  const symbolReplacements: Record<string, string> = {
    "&": " and ", "@": " at ", "#": " hash ", "%": " percent ",
    "++": " plus plus ", "--": " minus minus ", "=>": " arrow ", "->": " arrow ",
    "===": " equals ", "!==": " not equals ", ">=": " greater than or equal ",
    "<=": " less than or equal ", "&&": " and ", "||": " or ",
    "!=": " not equal ", "==": " equals ",
  }
  for (const [symbol, replacement] of Object.entries(symbolReplacements)) {
    text = text.replace(new RegExp(escapeRegExp(symbol), "g"), replacement)
  }
  text = text.replace(/[!]{2,}/g, "!")
  text = text.replace(/[?]{2,}/g, "?")
  text = text.replace(/[.]{3,}/g, "...")
  text = text.replace(/\([^)]*\)/g, "")
  // Remove brackets but preserve TTS placeholders like [code block], [web link], [email address]
  text = text.replace(/\[(?!code block\]|web link\]|email address\])[^\]]*\]/g, "")
  return text
}

/** Converts numbers to more speech-friendly formats */
function convertNumbers(text: string): string {
  text = text.replace(/v?(\d+)\.(\d+)\.(\d+)/g, "version $1 point $2 point $3")
  text = text.replace(/(\d+)\.(\d+)/g, "$1 point $2")
  // Remove commas from numbers - TTS engines pronounce large numbers naturally
  // Use lookahead to match any comma between digits (handles 1,234,567,890 etc.)
  text = text.replace(/(\d),(?=\d)/g, "$1")
  return text
}

/** Normalizes whitespace and cleans up the text */
function normalizeWhitespace(text: string): string {
  text = text.replace(/\s+/g, " ")
  text = text.trim()
  text = text.replace(/([a-zA-Z0-9])\s*$/, "$1.")
  text = text.replace(/([.!?])\s+/g, "$1 ")
  return text
}

/** Truncates text at a reasonable sentence boundary */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const truncated = text.substring(0, maxLength)
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."), truncated.lastIndexOf("!"), truncated.lastIndexOf("?")
  )
  if (lastSentenceEnd > maxLength * 0.7) return truncated.substring(0, lastSentenceEnd + 1)
  const lastSpace = truncated.lastIndexOf(" ")
  if (lastSpace > maxLength * 0.8) return truncated.substring(0, lastSpace) + "..."
  return truncated + "..."
}

/** Escapes special regex characters */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Validates if text is suitable for TTS after preprocessing
 */
export function validateTTSText(text: string): {
  isValid: boolean
  issues: string[]
  processedLength: number
} {
  const issues: string[] = []

  if (!text || text.trim().length === 0) {
    issues.push("Text is empty")
  }

  if (text.length > 10000) {
    issues.push("Text is too long for TTS")
  }

  // Check for remaining problematic content
  if (text.includes("```")) {
    issues.push("Contains unprocessed code blocks")
  }

  if (/https?:\/\//.test(text)) {
    issues.push("Contains unprocessed URLs")
  }

  return {
    isValid: issues.length === 0,
    issues,
    processedLength: text.length,
  }
}
