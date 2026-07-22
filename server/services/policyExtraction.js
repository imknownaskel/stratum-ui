import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import WordExtractor from 'word-extractor'
import { createWorker } from 'tesseract.js'
import englishData from '@tesseract.js-data/eng'

const minimumUsefulText = 40
const maxExtractedCharacters = 1_000_000
const maxScannedPdfPages = 25

function normalizeText(value) {
  return value
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function validateText(value) {
  const text = normalizeText(value || '')
  if (text.length < minimumUsefulText) {
    throw new Error('No readable policy text was found in this file')
  }
  if (text.length > maxExtractedCharacters) {
    throw new Error('Extracted policy text exceeds the current processing limit')
  }
  return text
}

async function createEnglishOcrWorker() {
  return createWorker('eng', 1, {
    langPath: englishData.langPath,
    gzip: englishData.gzip,
    cacheMethod: 'none',
    logger: () => {},
  })
}

async function recognizeImages(images) {
  const worker = await createEnglishOcrWorker()
  try {
    const parts = []
    for (const image of images) {
      const { data } = await worker.recognize(image)
      if (data.text?.trim()) parts.push(data.text)
    }
    return parts.join('\n\n')
  } finally {
    await worker.terminate()
  }
}

async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    const directText = normalizeText(result.text || '')
    if (directText.length >= minimumUsefulText) {
      return { text: validateText(directText), method: 'pdf-text', pageCount: result.total || null }
    }

    if (result.total && result.total > maxScannedPdfPages) {
      throw new Error(`Scanned PDFs are currently limited to ${maxScannedPdfPages} pages`)
    }

    const screenshots = await parser.getScreenshot({
      scale: 1.5,
      imageDataUrl: false,
      imageBuffer: true,
    })
    const pageImages = screenshots.pages
      .slice(0, maxScannedPdfPages)
      .map((page) => Buffer.from(page.data))
    const text = await recognizeImages(pageImages)
    return { text: validateText(text), method: 'pdf-ocr', pageCount: screenshots.pages.length }
  } finally {
    await parser.destroy()
  }
}

async function extractDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer })
  return { text: validateText(result.value), method: 'docx-text', pageCount: null }
}

async function extractLegacyWord(buffer) {
  const extractor = new WordExtractor()
  const document = await extractor.extract(buffer)
  const text = [
    document.getHeaders(),
    document.getBody(),
    document.getFootnotes(),
    document.getEndnotes(),
  ].filter(Boolean).join('\n\n')
  return { text: validateText(text), method: 'doc-text', pageCount: null }
}

async function extractImage(buffer) {
  const text = await recognizeImages([buffer])
  return { text: validateText(text), method: 'image-ocr', pageCount: 1 }
}

export async function extractPolicyText(buffer, mimeType) {
  switch (mimeType) {
    case 'application/pdf':
      return extractPdf(buffer)
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocx(buffer)
    case 'application/msword':
      return extractLegacyWord(buffer)
    case 'image/jpeg':
    case 'image/png':
      return extractImage(buffer)
    default:
      throw new Error('This policy file type cannot be processed')
  }
}
