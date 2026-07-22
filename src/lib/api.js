export class ApiError extends Error {
  constructor(message, status, details, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.code = code
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  })

  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    if (payload?.code === 'MFA_REQUIRED') {
      window.dispatchEvent(new CustomEvent('stratum:mfa-required'))
    }
    throw new ApiError(payload?.error || 'Request failed', response.status, payload?.details, payload?.code)
  }
  return payload
}

export const authApi = {
  session: () => request('/api/auth/session'),
  login: (values) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(values),
  }),
  startMfa: () => request('/api/auth/mfa/start', { method: 'POST' }),
  verifyMfa: (values) => request('/api/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify(values),
  }),
  signup: (values) => request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(values),
  }),
  consumeSession: (tokens) => request('/api/auth/session/consume', {
    method: 'POST',
    body: JSON.stringify(tokens),
  }),
  forgotPassword: (email) => request('/api/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  updatePassword: (values) => request('/api/auth/password/update', {
    method: 'POST',
    body: JSON.stringify(values),
  }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
}
export const preferencesApi = {
  get: () => request('/api/preferences'),
  update: (values) => request('/api/preferences', {
    method: 'PATCH',
    body: JSON.stringify(values),
  }),
}
export const policyApi = {
  list: () => request('/api/policies'),
  get: (documentId) => request(`/api/policies/${documentId}`),
  upload: (files) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return request('/api/policies', {
      method: 'POST',
      body: formData,
    })
  },
  retry: (documentId) => request(`/api/policies/${documentId}/retry`, {
    method: 'POST',
  }),
  remove: (documentId) => request(`/api/policies/${documentId}`, {
    method: 'DELETE',
  }),
}