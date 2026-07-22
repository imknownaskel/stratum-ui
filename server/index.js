import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { ZodError } from 'zod'
import { env } from './config/env.js'
import authRoutes from './routes/auth.js'
import policyRoutes from './routes/policies.js'
import preferenceRoutes from './routes/preferences.js'
import { recoverPendingPolicyDocuments, startPolicyProcessor } from './services/policyProcessor.js'
import { getAiConfiguration } from './services/nvidiaService.js'

const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.use('/api', (request, response, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next()
  const origin = request.get('origin')
  if (origin && !env.appOrigins.includes(origin)) {
    return response.status(403).json({ error: 'Untrusted request origin' })
  }
  next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'stratum-api',
    ai: getAiConfiguration(),
  })
})
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/policies', authLimiter, policyRoutes)
app.use('/api/preferences', authLimiter, preferenceRoutes)

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found' })
})

app.use((error, _request, response, _next) => {
  if (error instanceof ZodError) {
    return response.status(400).json({ error: 'Invalid request', details: error.flatten() })
  }
  if (error?.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Each policy file must be 10 MB or smaller'
      : error.code === 'LIMIT_FILE_COUNT'
        ? 'Upload no more than 5 files at once'
        : 'Unable to receive policy files'
    return response.status(400).json({ error: message })
  }
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 600) {
    return response.status(error.status).json({ error: error.message })
  }
  console.error(error)
  response.status(500).json({ error: 'Internal server error' })
})

app.listen(env.port, '127.0.0.1', async () => {
  console.log(`Stratum API listening on http://127.0.0.1:${env.port}`)
  startPolicyProcessor()
  try {
    const recovered = await recoverPendingPolicyDocuments()
    if (recovered) console.log(`Queued ${recovered} pending policy document(s)`)
  } catch (error) {
    console.warn('Policy processing recovery is unavailable:', error.message)
  }
})