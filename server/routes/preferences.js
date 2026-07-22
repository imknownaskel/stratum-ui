import { Router } from 'express'
import { z } from 'zod'
import { requireUser } from '../auth/session.js'
import { supportedLanguageCodes } from '../config/languages.js'
import { supabaseAdmin } from '../lib/supabase.js'

const router = Router()
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  autoSummaries: z.boolean().optional(),
  responseStyle: z.number().int().min(0).max(100).optional(),
  accent: z.enum(['blue', 'teal', 'purple', 'coral', 'rose']).optional(),
  font: z.enum(['inter', 'poppins', 'grotesk']).optional(),
  displayName: z.string().trim().min(1).max(100).optional(),
  language: z.enum(supportedLanguageCodes).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one preference')

function serialize(preferences, profile) {
  return {
    theme: preferences?.theme || 'light',
    autoSummaries: preferences?.auto_summaries ?? true,
    responseStyle: preferences?.response_style ?? 50,
    accent: preferences?.accent || 'blue',
    font: preferences?.font || 'inter',
    displayName: profile?.full_name || '',
    language: profile?.preferred_language || 'en',
  }
}

router.use(requireUser)

router.get('/', async (request, response, next) => {
  try {
    const [preferencesResult, profileResult] = await Promise.all([
      supabaseAdmin.from('user_preferences').select('*').eq('user_id', request.user.id).maybeSingle(),
      supabaseAdmin.from('profiles').select('full_name, preferred_language').eq('id', request.user.id).maybeSingle(),
    ])
    if (preferencesResult.error || profileResult.error) throw new Error('Unable to load preferences')
    response.json({ preferences: serialize(preferencesResult.data, profileResult.data) })
  } catch (error) {
    next(error)
  }
})

router.patch('/', async (request, response, next) => {
  try {
    const body = preferencesSchema.parse(request.body)
    const values = {
      user_id: request.user.id,
      updated_at: new Date().toISOString(),
    }
    if (body.theme !== undefined) values.theme = body.theme
    if (body.autoSummaries !== undefined) values.auto_summaries = body.autoSummaries
    if (body.responseStyle !== undefined) values.response_style = body.responseStyle
    if (body.accent !== undefined) values.accent = body.accent
    if (body.font !== undefined) values.font = body.font

    const profileValues = { updated_at: new Date().toISOString() }
    if (body.displayName !== undefined) profileValues.full_name = body.displayName
    if (body.language !== undefined) profileValues.preferred_language = body.language
    const shouldUpdateProfile = body.displayName !== undefined || body.language !== undefined
    const profileOperation = shouldUpdateProfile
      ? supabaseAdmin.from('profiles').update(profileValues).eq('id', request.user.id).select('full_name, preferred_language').single()
      : supabaseAdmin.from('profiles').select('full_name, preferred_language').eq('id', request.user.id).maybeSingle()

    const [preferencesResult, profileResult] = await Promise.all([
      supabaseAdmin.from('user_preferences').upsert(values, { onConflict: 'user_id' }).select('*').single(),
      profileOperation,
    ])
    if (preferencesResult.error || profileResult.error) throw new Error('Unable to save preferences')
    response.json({ preferences: serialize(preferencesResult.data, profileResult.data) })
  } catch (error) {
    next(error)
  }
})

export default router