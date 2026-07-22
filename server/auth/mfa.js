import { authCookieNames, clearAuthCookies, setAuthCookies } from './cookies.js'
import { publicUser } from './session.js'
import { createSupabaseAuthClient } from '../lib/supabase.js'

export async function hydrateAuthClient(request, response) {
  const accessToken = request.authAccessToken || request.cookies[authCookieNames.access]
  const refreshToken = request.authRefreshToken || request.cookies[authCookieNames.refresh]
  if (!accessToken || !refreshToken) return null

  const supabase = createSupabaseAuthClient()
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  if (error || !data.session || !data.user) {
    clearAuthCookies(response)
    return null
  }
  setAuthCookies(response, data.session)
  return { supabase, session: data.session, user: data.user }
}

export async function prepareMfa(supabase, session, user, { allowEnrollment = true } = {}) {
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa
    .getAuthenticatorAssuranceLevel(session.access_token)
  if (assuranceError) throw assuranceError
  if (assurance.currentLevel === 'aal2') {
    return { user: publicUser(user), authenticated: true }
  }

  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
  if (factorsError) throw factorsError
  const verifiedFactor = factors.totp[0]
  if (verifiedFactor) {
    return {
      user: publicUser(user),
      authenticated: false,
      requiresMfa: true,
      mfa: {
        mode: 'challenge',
        factorId: verifiedFactor.id,
        factorType: verifiedFactor.factor_type,
        message: 'Enter the one-time code from your authenticator to continue.',
      },
    }
  }

  if (!allowEnrollment) {
    return {
      user: publicUser(user),
      authenticated: false,
      requiresMfa: true,
      mfa: {
        mode: 'start-enroll',
        message: 'Set up an authenticator for your first secure sign-in.',
      },
    }
  }

  for (const factor of factors.all.filter((item) => item.status !== 'verified')) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id })
  }

  const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `Stratum ${new Date().toISOString().slice(0, 10)}`,
  })
  if (enrollmentError) throw enrollmentError

  return {
    user: publicUser(user),
    authenticated: false,
    requiresMfa: true,
    mfa: {
      mode: 'enroll',
      factorId: enrollment.id,
      factorType: enrollment.type,
      qrCode: enrollment.totp.qr_code,
      secret: enrollment.totp.secret,
      message: 'Set up an authenticator for your first secure sign-in.',
    },
  }
}

export async function verifyMfa(request, response, factorId, code) {
  const hydrated = await hydrateAuthClient(request, response)
  if (!hydrated) return null

  const { data: factors, error: factorsError } = await hydrated.supabase.auth.mfa.listFactors()
  if (factorsError) throw factorsError
  const factor = factors.all.find((item) => item.id === factorId)
  if (!factor) throw new Error('This authentication factor is no longer available')

  const { data, error } = await hydrated.supabase.auth.mfa.challengeAndVerify({ factorId, code })
  if (error || !data?.access_token || !data?.refresh_token) {
    const verificationError = new Error(error?.message || 'The verification code is invalid or expired')
    verificationError.status = 401
    throw verificationError
  }

  setAuthCookies(response, data)
  return { user: publicUser(data.user), authenticated: true }
}
