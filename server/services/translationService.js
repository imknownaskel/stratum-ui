import { env } from '../config/env.js'
import { normalizeLanguage } from '../config/languages.js'

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2'
const BATCH_SIZE = 100

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function addArrayReferences(references, values) {
  values.forEach((value, index) => {
    if (typeof value === 'string' && value.trim()) references.push({ container: values, key: index, value })
  })
}

export function translatableSummaryReferences(summary) {
  const references = []
  const add = (container, key) => {
    const value = container?.[key]
    if (typeof value === 'string' && value.trim()) references.push({ container, key, value })
  }

  add(summary, 'overview')
  addArrayReferences(references, summary.uncertainties || [])
  addArrayReferences(references, summary.key_points || [])
  for (const flag of summary.risk_flags || []) {
    add(flag, 'title')
    add(flag, 'explanation')
  }
  addArrayReferences(references, summary.data_practices?.collected || [])
  addArrayReferences(references, summary.data_practices?.shared_with || [])
  addArrayReferences(references, summary.data_practices?.purposes || [])
  add(summary.data_practices, 'retention')
  addArrayReferences(references, summary.user_rights || [])
  addArrayReferences(references, summary.financial_terms || [])
  addArrayReferences(references, summary.recommended_actions || [])
  return references
}

async function translateBatch(strings, targetLanguage) {
  const response = await fetch(GOOGLE_TRANSLATE_URL + '?key=' + encodeURIComponent(env.googleTranslateApiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ q: strings, source: 'en', target: targetLanguage, format: 'text' }),
    signal: AbortSignal.timeout(env.translationTimeoutMs),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const providerMessage = payload?.error?.message
    throw new Error(providerMessage ? 'Google Cloud Translation: ' + providerMessage : 'Google Cloud Translation failed (' + response.status + ')')
  }
  const translations = payload?.data?.translations
  if (!Array.isArray(translations) || translations.length !== strings.length) {
    throw new Error('Google Cloud Translation returned an incomplete response')
  }
  return translations.map((item) => decodeEntities(item.translatedText || ''))
}

export function getTranslationConfiguration() {
  return {
    provider: env.translationProvider,
    configured: env.translationProvider === 'nvidia' || Boolean(env.googleTranslateApiKey),
  }
}

export async function translatePolicySummary(summary, target) {
  const targetLanguage = normalizeLanguage(target)
  if (targetLanguage === 'en' || env.translationProvider === 'nvidia') {
    return {
      summary,
      meta: { provider: targetLanguage === 'en' ? 'none' : 'nvidia-nim', targetLanguage, translatedFieldCount: 0 },
    }
  }
  if (env.translationProvider !== 'google') throw new Error('Unsupported translation provider: ' + env.translationProvider)
  if (!env.googleTranslateApiKey) throw new Error('Google Cloud Translation is not configured')

  const localized = structuredClone(summary)
  const references = translatableSummaryReferences(localized)
  for (let offset = 0; offset < references.length; offset += BATCH_SIZE) {
    const batch = references.slice(offset, offset + BATCH_SIZE)
    const translated = await translateBatch(batch.map((item) => item.value), targetLanguage)
    translated.forEach((value, index) => {
      batch[index].container[batch[index].key] = value
    })
  }

  return {
    summary: localized,
    meta: { provider: 'google-cloud-translation', targetLanguage, translatedFieldCount: references.length },
  }
}