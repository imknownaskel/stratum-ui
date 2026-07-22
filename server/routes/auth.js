import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { authCookieNames, clearAuthCookies, setAuthCookies } from '../auth/cookies.js'
import { hydrateAuthClient, prepareMfa, verifyMfa } from '../auth/mfa.js'
import { publicUser, resolveSession } from '../auth/session.js'
import { env } from '../config/env.js'
import { createSupabaseAuthClient } from '../lib/supabase.js'

const router = Router()

const credentialsSchema = z.object({
  contactMethod: z.enum(['email', 'phone']),
  contact: z.string().trim().min(3).max(320),
  password: z.string().min(8).max(128),
})
const signupSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(100) })
const emailSchema = z.object({ email: z.string().trim().email().max(320) })
const sessionSchema = z.object({
  accessToken: z.string().min(20),
  refreshToken: z.string().min(10),
  action: z.enum(['confirmed', 'recovery']).optional(),
})
const passwordUpdateSchema = z.object({ password: z.string().min(8).max(128) })
const mfaVerifySchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the six-digit authenticator code'),
})
const mfaVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Wait before trying again.' },
})

function credentials(body) {
  return body.contactMethod === 'phone'
    ? { phone: body.contact, password: body.password }
    : { email: body.contact.toLowerCase(), password: body.password }
}

function isEmailRateLimitError(error) {
  return error?.status === 429
    || error?.code === 'over_email_send_rate_limit'
    || /email rate limit/i.test(error?.message || '')
}

function sendAuthError(response, error, fallbackStatus = 400) {
  if (isEmailRateLimitError(error)) {
    return response.status(429).json({
      error: 'Too many authentication emails have been requested. Please wait before trying again, or configure custom SMTP in Supabase.',
    })
  }
  return response.status(error?.status || fallbackStatus).json({ error: error.message })
}

async function firstFactorResponse(response, supabase, data, status = 200) {
  setAuthCookies(response, data.session)
  const result = await prepareMfa(supabase, data.session, data.user)
  return response.status(status).json(result)
}

router.post('/signup', async (request, response, next) => {
  try {
    const body = signupSchema.parse(request.body)
    const supabase = createSupabaseAuthClient()
    const signupOptions = { data: { full_name: body.name } }
    if (body.contactMethod === 'email') {
      signupOptions.emailRedirectTo = env.publicAppUrl + '/?auth_action=confirmed'
    }

    const { data, error } = await supabase.auth.signUp({
      ...credentials(body),
      options: signupOptions,
    })

    if (error) return sendAuthError(response, error)
    if (data.session) return firstFactorResponse(response, supabase, data, 201)

    response.status(201).json({
      user: publicUser(data.user),
      authenticated: false,
      requiresVerification: true,
    })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (request, response, next) => {
  try {
    const body = credentialsSchema.parse(request.body)
    const supabase = createSupabaseAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword(credentials(body))

    if (error || !data.session) {
      return response.status(401).json({ error: error?.message || 'Unable to sign in' })
    }
    return firstFactorResponse(response, supabase, data)
  } catch (error) {
    next(error)
  }
})

router.post('/mfa/start', async (request, response, next) => {
  try {
    const hydrated = await hydrateAuthClient(request, response)
    if (!hydrated) return response.status(401).json({ error: 'Your login session expired. Sign in again.' })
    response.json(await prepareMfa(hydrated.supabase, hydrated.session, hydrated.user))
  } catch (error) {
    next(error)
  }
})

router.post('/mfa/verify', mfaVerifyLimiter, async (request, response, next) => {
  try {
    const body = mfaVerifySchema.parse(request.body)
    const result = await verifyMfa(request, response, body.factorId, body.code)
    if (!result) return response.status(401).json({ error: 'Your login session expired. Sign in again.' })
    response.json(result)
  } catch (error) {
    if (error?.status === 401) return response.status(401).json({ error: error.message })
    next(error)
  }
})

router.post('/session/consume', async (request, response, next) => {
  try {
    const body = sessionSchema.parse(request.body)
    const supabase = createSupabaseAuthClient()
    const { data, error } = await supabase.auth.setSession({
      access_token: body.accessToken,
      refresh_token: body.refreshToken,
    })

    if (error || !data.session) {
      return response.status(401).json({ error: error?.message || 'This email link is invalid or has expired' })
    }

    if (body.action === 'recovery') {
      setAuthCookies(response, data.session)
      return response.json({ user: publicUser(data.user), authenticated: true })
    }
    return firstFactorResponse(response, supabase, data)
  } catch (error) {
    next(error)
  }
})

router.post('/password/forgot', async (request, response, next) => {
  try {
    const { email } = emailSchema.parse(request.body)
    const supabase = createSupabaseAuthClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: env.publicAppUrl + '/?auth_action=recovery',
    })

    if (isEmailRateLimitError(error)) return sendAuthError(response, error, 429)
    if (error) console.warn('Password reset request rejected by Supabase:', error.message)
    response.status(202).json({
      message: 'If an account exists for that email, a password reset link is on its way.',
    })
  } catch (error) {
    next(error)
  }
})

router.post('/password/update', async (request, response, next) => {
  try {
    const body = passwordUpdateSchema.parse(request.body)
    const hydrated = await hydrateAuthClient(request, response)
    if (!hydrated) {
      return response.status(401).json({ error: 'This password reset link is invalid or has expired' })
    }

    const { data, error } = await hydrated.supabase.auth.updateUser({ password: body.password })
    if (error) return sendAuthError(response, error)
    const { data: sessionData, error: sessionError } = await hydrated.supabase.auth.getSession()
    if (sessionError || !sessionData.session) {
      return response.status(401).json({ error: 'Unable to continue the updated session' })
    }
    return firstFactorResponse(response, hydrated.supabase, {
      session: sessionData.session,
      user: data.user,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/session', async (request, response, next) => {
  try {
    response.set('Cache-Control', 'no-store')
    const user = await resolveSession(request, response)
    if (!user) return response.json({ user: null, authenticated: false })

    const hydrated = await hydrateAuthClient(request, response)
    if (!hydrated) return response.json({ user: null, authenticated: false })
    response.json(await prepareMfa(hydrated.supabase, hydrated.session, hydrated.user, { allowEnrollment: false }))
  } catch (error) {
    next(error)
  }
})

router.post('/logout', async (request, response) => {
  const accessToken = request.cookies[authCookieNames.access]
  const refreshToken = request.cookies[authCookieNames.refresh]
  if (accessToken && refreshToken) {
    const supabase = createSupabaseAuthClient()
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    await supabase.auth.signOut({ scope: 'local' })
  }
  clearAuthCookies(response)
  response.status(204).end()
})

export default router
