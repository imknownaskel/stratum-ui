import crypto from 'node:crypto'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { requireUser } from '../auth/session.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { enqueuePolicyDocuments } from '../services/policyProcessor.js'
import { isNvidiaConfigured } from '../services/nvidiaService.js'

const router = Router()
const bucket = 'policy-documents'
const maxFileSize = 10 * 1024 * 1024
const maxFiles = 5

const allowedTypes = new Map([
  ['application/pdf', '.pdf'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
])

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

const receiveFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: maxFiles },
  fileFilter: (_request, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(httpError(415, 'Unsupported file type. Upload a PDF, JPG, PNG, DOC, or DOCX file.'))
    }
    callback(null, true)
  },
}).array('files', maxFiles)

const documentIdSchema = z.string().uuid()

router.use(requireUser)

router.get('/', async (request, response, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('policy_documents')
      .select('id, original_name, mime_type, size_bytes, status, summary, extraction_method, page_count, word_count, error_message, created_at, updated_at, processed_at')
      .eq('user_id', request.user.id)
      .order('created_at', { ascending: false })

    if (error) throw httpError(502, 'Unable to load policy documents')
    response.json({ documents: data, aiConfigured: isNvidiaConfigured() })
  } catch (error) {
    next(error)
  }
})

router.post('/', receiveFiles, async (request, response, next) => {
  const uploadedPaths = []
  const insertedIds = []

  try {
    if (!request.files?.length) throw httpError(400, 'Select at least one policy file to upload')

    const documents = []
    for (const file of request.files) {
      if (file.originalname.length > 255) throw httpError(400, 'A filename is too long')

      const expectedExtension = allowedTypes.get(file.mimetype)
      const suppliedExtension = path.extname(file.originalname).toLowerCase()
      const extension = suppliedExtension === '.jpeg' && expectedExtension === '.jpg'
        ? '.jpg'
        : expectedExtension
      const storagePath = `${request.user.id}/${crypto.randomUUID()}${extension}`
      const contentSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex')

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw httpError(502, `Unable to store ${file.originalname}`)
      uploadedPaths.push(storagePath)

      const { data, error: insertError } = await supabaseAdmin
        .from('policy_documents')
        .insert({
          user_id: request.user.id,
          original_name: file.originalname,
          storage_path: storagePath,
          mime_type: file.mimetype,
          size_bytes: file.size,
          content_sha256: contentSha256,
          status: 'uploaded',
        })
        .select('id, original_name, mime_type, size_bytes, status, created_at, updated_at')
        .single()

      if (insertError) throw httpError(502, `Unable to record ${file.originalname}`)
      insertedIds.push(data.id)
      documents.push(data)
    }

    await enqueuePolicyDocuments(insertedIds)
    response.status(201).json({ documents })
  } catch (error) {
    if (uploadedPaths.length) {
      await supabaseAdmin.storage.from(bucket).remove(uploadedPaths)
    }
    if (insertedIds.length) {
      await supabaseAdmin.from('policy_documents').delete().in('id', insertedIds)
    }
    next(error)
  }
})

router.get('/:documentId', async (request, response, next) => {
  try {
    const documentId = documentIdSchema.parse(request.params.documentId)
    const { data: document, error } = await supabaseAdmin
      .from('policy_documents')
      .select('id, original_name, mime_type, size_bytes, status, extracted_text, summary, extraction_method, page_count, word_count, error_message, created_at, updated_at, processed_at')
      .eq('id', documentId)
      .eq('user_id', request.user.id)
      .maybeSingle()

    if (error) throw httpError(502, 'Unable to load policy document')
    if (!document) throw httpError(404, 'Policy document not found')
    response.json({ document })
  } catch (error) {
    next(error)
  }
})

router.post('/:documentId/retry', async (request, response, next) => {
  try {
    const documentId = documentIdSchema.parse(request.params.documentId)
    const { data: document, error } = await supabaseAdmin
      .from('policy_documents')
      .update({ status: 'uploaded', summary: null, error_message: null, processed_at: null })
      .eq('id', documentId)
      .eq('user_id', request.user.id)
      .select('id, original_name, status, updated_at')
      .maybeSingle()

    if (error) throw httpError(502, 'Unable to retry policy processing')
    if (!document) throw httpError(404, 'Policy document not found')
    await enqueuePolicyDocuments([document.id])
    response.status(202).json({ document })
  } catch (error) {
    next(error)
  }
})
router.delete('/:documentId', async (request, response, next) => {
  try {
    const documentId = documentIdSchema.parse(request.params.documentId)
    const { data: document, error: lookupError } = await supabaseAdmin
      .from('policy_documents')
      .select('id, storage_path')
      .eq('id', documentId)
      .eq('user_id', request.user.id)
      .maybeSingle()

    if (lookupError) throw httpError(502, 'Unable to find policy document')
    if (!document) throw httpError(404, 'Policy document not found')

    const { error: storageError } = await supabaseAdmin.storage
      .from(bucket)
      .remove([document.storage_path])
    if (storageError) throw httpError(502, 'Unable to remove policy file')

    const { error: deleteError } = await supabaseAdmin
      .from('policy_documents')
      .delete()
      .eq('id', document.id)
      .eq('user_id', request.user.id)
    if (deleteError) throw httpError(502, 'Unable to remove policy document')

    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

export default router
