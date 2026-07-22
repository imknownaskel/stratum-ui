import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.API_PORT || 3001),
  publicAppUrl: (process.env.APP_PUBLIC_URL || 'http://127.0.0.1:5173').replace(/\/$/, ''),
  appOrigins: (process.env.APP_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((value) => value.trim()),
  supabaseUrl: required('SUPABASE_URL'),
  supabasePublishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
  supabaseSecretKey: required('SUPABASE_SECRET_KEY'),
  nvidiaApiKey: process.env.NVIDIA_NIM_API_KEY || '',
  nvidiaBaseUrl: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  nvidiaFastModel: process.env.NVIDIA_NIM_FAST_MODEL || process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3-nano-30b-a3b',
  nvidiaReasoningModel: process.env.NVIDIA_NIM_REASONING_MODEL || 'nvidia/nemotron-3-super-120b-a12b',
  nvidiaChallengerModel: process.env.NVIDIA_NIM_CHALLENGER_MODEL || 'google/gemma-4-31b-it',
  nvidiaTimeoutMs: Number(process.env.NVIDIA_NIM_TIMEOUT_MS || 180_000),
  translationProvider: process.env.TRANSLATION_PROVIDER || (process.env.GOOGLE_TRANSLATE_API_KEY ? 'google' : 'nvidia'),
  googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
  translationTimeoutMs: Number(process.env.TRANSLATION_TIMEOUT_MS || 30_000),
  aiPromptVersion: process.env.AI_PROMPT_VERSION || 'policy-v3',
  aiEscalationThreshold: Number(process.env.AI_ESCALATION_THRESHOLD || 0.78),
  aiChunkCharacters: Number(process.env.AI_CHUNK_CHARACTERS || 80_000),
  aiChunkConcurrency: Math.max(1, Number(process.env.AI_CHUNK_CONCURRENCY || 2)),
  policyWorkerPollMs: Math.max(1_000, Number(process.env.POLICY_WORKER_POLL_MS || 3_000)),
})