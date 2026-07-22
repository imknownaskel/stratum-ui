import { authCookieNames, clearAuthCookies, setAuthCookies } from './cookies.js'
import { createSupabaseAuthClient } from '../lib/supabase.js'

export function publicUser(user) {
  if (!user) return null
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || user.phone || 'User'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials = parts.length > 1
    ? (parts[0][0] + parts.at(-1)[0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()

  return {
    id: user.id,
    name,
    initials,
    email: user.email || null,
    phone: user.phone || null,
  }
}

export function tokenAssuranceLevel(accessToken) {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'))
    return payload.aal || 'aal1'
  } catch {
    return 'aal1'
  }
}

export function hasVerifiedMfa(user) {
  return user.factors?.some((factor) => factor.status === 'verified') || false
}

export async function resolveSession(request, response) {
  const accessToken = request.cookies[authCookieNames.access]
  const refreshToken = request.cookies[authCookieNames.refresh]
  if (!accessToken && !refreshToken) return null

  const supabase = createSupabaseAuthClient()
  if (accessToken) {
    const { data } = await supabase.auth.getUser(accessToken)
    if (data.user) {
      request.authAccessToken = accessToken
      request.authRefreshToken = refreshToken
      return data.user
    }
  }

  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
    if (!error && data.session && data.user) {
      setAuthCookies(response, data.session)
      request.authAccessToken = data.session.access_token
      request.authRefreshToken = data.session.refresh_token
      return data.user
    }
  }

  clearAuthCookies(response)
  return null
}

export async function requireUser(request, response, next) {
  try {
    const user = await resolveSession(request, response)
    if (!user) return response.status(401).json({ error: 'Authentication required' })
    if (!hasVerifiedMfa(user) || tokenAssuranceLevel(request.authAccessToken) !== 'aal2') {
      return response.status(403).json({ error: 'Multi-factor authentication required', code: 'MFA_REQUIRED' })
    }
    request.user = user
    next()
  } catch (error) {
    next(error)
  }
}
