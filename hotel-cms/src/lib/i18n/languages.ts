/**
 * Language name → locale code mapping.
 * Keys are lowercase English language names used for natural-language detection.
 */
export const LANGUAGES: Record<string, string> = {
  french: "fr",
  spanish: "es",
  german: "de",
  hindi: "hi",
  japanese: "ja",
  chinese: "zh",
  arabic: "ar",
  portuguese: "pt",
  italian: "it",
  russian: "ru",
  dutch: "nl",
  korean: "ko",
  thai: "th",
  turkish: "tr",
  tamil: "ta",
  telugu: "te",
  bengali: "bn",
  marathi: "mr",
};

/**
 * Locale code → human-readable display name.
 */
export const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  hi: "Hindi",
  ja: "Japanese",
  zh: "Chinese",
  ar: "Arabic",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
  nl: "Dutch",
  ko: "Korean",
  th: "Thai",
  tr: "Turkish",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
};

/**
 * Scan a user prompt for a language name and return the matching locale + language.
 * Returns null if no known language is mentioned.
 */
export function detectLanguageFromPrompt(
  prompt: string
): { locale: string; language: string } | null {
  const lower = prompt.toLowerCase();
  for (const [language, locale] of Object.entries(LANGUAGES)) {
    if (lower.includes(language)) {
      return { locale, language };
    }
  }
  return null;
}
