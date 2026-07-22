export const supportedLanguages = Object.freeze({
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  pt: 'Portuguese',
  ha: 'Hausa',
  yo: 'Yoruba',
  ig: 'Igbo',
})

export const supportedLanguageCodes = Object.freeze(Object.keys(supportedLanguages))

export function normalizeLanguage(value) {
  return supportedLanguageCodes.includes(value) ? value : 'en'
}

export function languageName(value) {
  return supportedLanguages[normalizeLanguage(value)]
}