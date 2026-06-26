import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import documentRoutes from './routes/documents.js'
import shareRoutes from './routes/share.js'
import uploadRoutes, { uploadsDir } from './routes/upload.js'
import db from './db.js'
import './seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/api/files/download', express.static(uploadsDir))

app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/shares', shareRoutes)
app.use('/api/upload', uploadRoutes)

app.get('/api/files/:id/download', (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id) as any
  if (!file) {
    res.status(404).json({ error: 'File not found' })
    return
  }
  const filePath = path.join(uploadsDir, file.filename)
  res.download(filePath, file.original_name)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
