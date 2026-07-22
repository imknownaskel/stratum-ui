import crypto from 'node:crypto'
import os from 'node:os'
import { env } from '../config/env.js'
import { normalizeLanguage } from '../config/languages.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { isNvidiaConfigured, summarizePolicyText } from './nvidiaService.js'
import { extractPolicyText } from './policyExtraction.js'
import { translatePolicySummary } from './translationService.js'

const bucket = 'policy-documents'
const workerName = os.hostname() + ':' + process.pid + ':' + crypto.randomUUID().slice(0, 8)
let polling = false
let pollTimer

function errorMessage(error) {
  return (error instanceof Error ? error.message : 'Policy processing failed').slice(0, 500)
}

async function updateDocument(documentId, values) {
  const { error } = await supabaseAdmin.from('policy_documents').update(values).eq('id', documentId)
  if (error) throw new Error('Unable to update policy processing status')
}

async function enqueueJob(documentId) {
  const { error } = await supabaseAdmin.from('policy_processing_jobs').upsert({
    document_id: documentId,
    status: 'queued',
    attempts: 0,
    available_at: new Date().toISOString(),
    locked_at: null,
    locked_by: null,
    last_error: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'document_id' })
  if (error) throw new Error('Unable to queue policy processing')
}

export async function enqueuePolicyDocuments(documentIds) {
  await Promise.all(documentIds.map(enqueueJob))
  setImmediate(() => void pollForWork())
}

async function claimJob() {
  const { data, error } = await supabaseAdmin.rpc('claim_policy_processing_job', { worker_name: workerName })
  if (error) throw new Error('Unable to claim policy processing job')
  return data?.[0] || null
}

async function completeJob(jobId) {
  const { error } = await supabaseAdmin.from('policy_processing_jobs').update({
    status: 'completed',
    locked_at: null,
    locked_by: null,
    last_error: null,
    updated_at: new Date().toISOString(),
  }).eq('id', jobId)
  if (error) throw new Error('Unable to complete policy processing job')
}

async function failJob(job, error) {
  const message = errorMessage(error)
  const retryable = job.attempts < job.max_attempts
  const delaySeconds = Math.min(300, 15 * (2 ** Math.max(0, job.attempts - 1)))
  const { error: jobError } = await supabaseAdmin.from('policy_processing_jobs').update({
    status: retryable ? 'queued' : 'failed',
    available_at: new Date(Date.now() + delaySeconds * 1000).toISOString(),
    locked_at: null,
    locked_by: null,
    last_error: message,
    updated_at: new Date().toISOString(),
  }).eq('id', job.id)
  if (jobError) console.error('Unable to persist job failure:', jobError.message)

  await updateDocument(job.document_id, {
    status: retryable ? 'uploaded' : 'failed',
    error_message: retryable ? 'AI provider temporarily unavailable. Stratum will retry automatically.' : message,
    processed_at: retryable ? null : new Date().toISOString(),
  })
}

async function extractDocument(document) {
  await updateDocument(document.id, {
    status: 'processing',
    error_message: null,
    processing_started_at: new Date().toISOString(),
    processed_at: null,
  })

  const { data: storedFile, error: downloadError } = await supabaseAdmin.storage.from(bucket).download(document.storage_path)
  if (downloadError || !storedFile) throw new Error('Unable to download policy file for processing')

  const buffer = Buffer.from(await storedFile.arrayBuffer())
  const result = await extractPolicyText(buffer, document.mime_type)
  const wordCount = result.text.split(/\s+/).filter(Boolean).length
  const contentSha256 = document.content_sha256 || crypto.createHash('sha256').update(buffer).digest('hex')

  await updateDocument(document.id, {
    status: 'processing',
    extracted_text: result.text,
    extraction_method: result.method,
    page_count: result.pageCount,
    word_count: wordCount,
    content_sha256: contentSha256,
    summary: null,
    error_message: null,
  })
  return { text: result.text, contentSha256 }
}

async function getAnalysisPreferences(userId) {
  const [preferencesResult, profileResult] = await Promise.all([
    supabaseAdmin.from('user_preferences').select('response_style').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('profiles').select('preferred_language').eq('id', userId).maybeSingle(),
  ])
  if (preferencesResult.error || profileResult.error) throw new Error('Unable to load AI preferences')
  return {
    responseStyle: preferencesResult.data?.response_style ?? 50,
    language: normalizeLanguage(profileResult.data?.preferred_language),
  }
}

async function findCachedSummary(document, { responseStyle, language, translationProvider }) {
  if (!document.content_sha256) return null
  const { data, error } = await supabaseAdmin.from('policy_documents')
    .select('id, summary')
    .eq('user_id', document.user_id)
    .eq('content_sha256', document.content_sha256)
    .eq('status', 'ready')
    .neq('id', document.id)
    .not('summary', 'is', null)
    .order('processed_at', { ascending: false })
    .limit(5)
  if (error) throw new Error('Unable to check policy analysis cache')
  return data?.find((candidate) =>
    candidate.summary?._meta?.prompt_version === env.aiPromptVersion
    && candidate.summary?._meta?.provider === 'nvidia-nim'
    && candidate.summary?._meta?.response_style === responseStyle
    && candidate.summary?._meta?.language === language
    && candidate.summary?._meta?.translation_provider === translationProvider
  ) || null
}

async function recordAiRuns(documentId, jobId, meta) {
  if (!meta.runs?.length) return
  const rows = meta.runs.map((run) => ({
    document_id: documentId,
    job_id: jobId,
    provider: meta.provider,
    model: run.model,
    role: run.role,
    prompt_version: meta.promptVersion,
    status: 'completed',
    latency_ms: run.latencyMs,
    input_tokens: run.inputTokens,
    output_tokens: run.outputTokens,
    confidence: null,
    escalated: meta.escalated,
  }))
  rows[rows.length - 1].confidence = meta.confidence
  const { error } = await supabaseAdmin.from('policy_ai_runs').insert(rows)
  if (error) console.warn('Unable to record AI run metrics:', error.message)
}

async function processJob(job) {
  const { data: document, error } = await supabaseAdmin.from('policy_documents')
    .select('id, user_id, storage_path, mime_type, status, extracted_text, content_sha256')
    .eq('id', job.document_id)
    .maybeSingle()
  if (error) throw new Error('Unable to load policy document for processing')
  if (!document) {
    await completeJob(job.id)
    return
  }

  let text = document.extracted_text
  if (!text) {
    const extracted = await extractDocument(document)
    text = extracted.text
    document.content_sha256 = extracted.contentSha256
  } else {
    await updateDocument(document.id, { status: 'processing', error_message: null })
  }

  if (!isNvidiaConfigured()) {
    await updateDocument(document.id, { status: 'ready', processed_at: new Date().toISOString(), error_message: null })
    await completeJob(job.id)
    return
  }

  const { responseStyle, language } = await getAnalysisPreferences(document.user_id)
  const translationProvider = language === 'en' ? 'none' : env.translationProvider === 'google' ? 'google-cloud-translation' : 'nvidia-nim'
  const cached = await findCachedSummary(document, { responseStyle, language, translationProvider })
  if (cached) {
    const completedAt = new Date().toISOString()
    await updateDocument(document.id, {
      status: 'ready',
      summary: {
        ...cached.summary,
        _meta: { ...cached.summary._meta, generated_at: completedAt, cache_hit: true, cached_from: cached.id },
      },
      processed_at: completedAt,
      error_message: null,
    })
    await supabaseAdmin.from('policy_ai_runs').insert({
      document_id: document.id,
      job_id: job.id,
      provider: 'nvidia-nim',
      model: cached.summary._meta.model,
      role: 'cache',
      prompt_version: env.aiPromptVersion,
      status: 'completed',
      confidence: cached.summary.confidence ?? null,
      escalated: false,
    })
    await completeJob(job.id)
    return
  }

  const analysisLanguage = env.translationProvider === 'google' && language !== 'en' ? 'en' : language
  const result = await summarizePolicyText(text, { responseStyle, language: analysisLanguage })
  const localized = await translatePolicySummary(result.summary, language)
  const completedAt = new Date().toISOString()
  result.meta.confidence = localized.summary.confidence
  await updateDocument(document.id, {
    status: 'ready',
    summary: {
      ...localized.summary,
      _meta: {
        provider: result.meta.provider,
        model: result.meta.model,
        prompt_version: result.meta.promptVersion,
        generated_at: completedAt,
        escalated: result.meta.escalated,
        escalation_reasons: result.meta.escalationReasons,
        evidence_block_count: result.meta.evidenceBlockCount,
        chunk_count: result.meta.chunkCount,
        cache_hit: false,
        response_style: responseStyle,
        language,
        translation_provider: localized.meta.provider,
        translated_field_count: localized.meta.translatedFieldCount,
      },
    },
    processed_at: completedAt,
    error_message: null,
  })
  await recordAiRuns(document.id, job.id, result.meta)
  await completeJob(job.id)
}

async function pollForWork() {
  if (polling) return
  polling = true
  try {
    while (true) {
      const job = await claimJob()
      if (!job) break
      try {
        await processJob(job)
      } catch (error) {
        console.error('Policy processing failed for ' + job.document_id + ':', error.message)
        try { await failJob(job, error) } catch (statusError) {
          console.error('Unable to persist processing failure:', statusError.message)
        }
      }
    }
  } catch (error) {
    console.warn('Policy worker poll unavailable:', error.message)
  } finally {
    polling = false
  }
}

export async function recoverPendingPolicyDocuments() {
  const statuses = isNvidiaConfigured() ? ['uploaded', 'processing', 'ready'] : ['uploaded', 'processing']
  const { data, error } = await supabaseAdmin.from('policy_documents')
    .select('id, status, summary')
    .in('status', statuses)
    .order('created_at', { ascending: true })
  if (error) throw new Error('Unable to recover pending policy documents')
  const pending = data.filter((document) => document.status !== 'ready' || !document.summary)
  await enqueuePolicyDocuments(pending.map((document) => document.id))
  return pending.length
}

export function startPolicyProcessor() {
  if (pollTimer) return
  setImmediate(() => void pollForWork())
  pollTimer = setInterval(() => void pollForWork(), env.policyWorkerPollMs)
  pollTimer.unref()
}
