import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import mammoth from 'mammoth'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.resolve(__dirname, '../../uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const allowedMimes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const allowedExts = ['.txt', '.md', '.csv', '.docx']

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only .txt, .md, .csv, and .docx files are supported'))
    }
  },
})

const router = Router()

router.use(authMiddleware)

router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const ext = path.extname(file.originalname).toLowerCase()
    let content: string

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: file.path })
      content = result.value
    } else {
      content = fs.readFileSync(file.path, 'utf-8')
    }

    const lines = content.split('\n')
    const paragraphs = lines
      .filter(l => l.trim())
      .map(l => ({ type: 'paragraph', content: l.trim() ? [{ type: 'text', text: l.trim() }] : [] }))

    if (paragraphs.length === 0) {
      paragraphs.push({ type: 'paragraph', content: [] })
    }

    const docContent = JSON.stringify({
      type: 'doc',
      content: paragraphs,
    })

    const title = path.parse(file.originalname).name
    const sourceFormat = ext

    const result = db.prepare(
      'INSERT INTO documents (title, content, owner_id, source_format) VALUES (?, ?, ?, ?)'
    ).run(title, docContent, req.userId, sourceFormat)

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid)

    fs.unlinkSync(file.path)

    res.status(201).json({ document: doc })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Import failed' })
  }
})

async function parseFileContent(filePath: string, ext: string): Promise<string> {
  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  }
  return fs.readFileSync(filePath, 'utf-8')
}

router.post('/:documentId', upload.single('file'), async (req: Request, res: Response) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.documentId) as any
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }

  const file = req.file
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const ext = path.extname(file.originalname).toLowerCase()
  const textExts = ['.txt', '.md', '.csv', '.docx']

  if (textExts.includes(ext)) {
    const rawContent = await parseFileContent(file.path, ext)
    const lines = rawContent.split('\n')
    const newParagraphs = lines
      .filter(l => l.trim())
      .map(l => ({ type: 'paragraph' as const, content: [{ type: 'text' as const, text: l.trim() }] }))

    if (newParagraphs.length > 0) {
      let docContent: any
      try {
        docContent = JSON.parse(doc.content)
      } catch {
        docContent = { type: 'doc', content: [] }
      }
      if (!docContent.content) docContent.content = []
      docContent.content.push(...newParagraphs)

      db.prepare("UPDATE documents SET content = ?, source_format = ?, updated_at = datetime('now') WHERE id = ?")
        .run(JSON.stringify(docContent), ext, req.params.documentId)
    } else {
      db.prepare("UPDATE documents SET source_format = ?, updated_at = datetime('now') WHERE id = ?")
        .run(ext, req.params.documentId)
    }

    fs.unlinkSync(file.path)
    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.documentId)
    res.status(201).json({ document: updated })
    return
  }

  const result = db.prepare(
    'INSERT INTO files (document_id, filename, original_name, mimetype, size) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.documentId, file.filename, file.originalname, file.mimetype, file.size)

  const fileRecord = db.prepare('SELECT * FROM files WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ file: fileRecord })
})

router.get('/:documentId', (req: Request, res: Response) => {
  const files = db.prepare('SELECT * FROM files WHERE document_id = ? ORDER BY uploaded_at DESC').all(req.params.documentId)
  res.json({ files })
})

export { uploadsDir }
export default router
