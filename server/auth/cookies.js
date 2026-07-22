import { env } from '../config/env.js'

const production = env.nodeEnv === 'production'

export const authCookieNames = {
  access: production ? '__Host-stratum-access' : 'stratum_access',
  refresh: production ? '__Host-stratum-refresh' : 'stratum_refresh',
}

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: production,
  path: '/',
}

export function setAuthCookies(response, session) {
  const accessMaxAge = session.expires_at
    ? Math.max(session.expires_at * 1000 - Date.now(), 60_000)
    : 60 * 60 * 1000

  response.cookie(authCookieNames.access, session.access_token, {
    ...baseCookieOptions,
    maxAge: accessMaxAge,
  })
  response.cookie(authCookieNames.refresh, session.refresh_token, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
}

export function clearAuthCookies(response) {
  response.clearCookie(authCookieNames.access, baseCookieOptions)
  response.clearCookie(authCookieNames.refresh, baseCookieOptions)
}