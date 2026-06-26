import { Router, Request, Response } from 'express'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LevelFormat } from 'docx'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// export route handles its own auth via query param, must be before authMiddleware
router.get('/:id/export', async (req: Request, res: Response) => {
  try {
    const userId = Number(req.query.user_id) || (req as any).userId
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId)
    if (!user) {
      res.status(401).json({ error: 'Invalid user' })
      return
    }

    const doc = db.prepare(`
      SELECT d.*, u.name as owner_name
      FROM documents d
      JOIN users u ON d.owner_id = u.id
      WHERE d.id = ?
    `).get(req.params.id) as any

    if (!doc) {
      res.status(404).json({ error: 'Document not found' })
      return
    }

    const isShared = db.prepare(
      'SELECT 1 FROM shares WHERE document_id = ? AND user_id = ?'
    ).get(req.params.id, userId)

    if (doc.owner_id !== userId && !isShared) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    const format = req.query.format as string || doc.source_format || '.md'
    const filename = doc.title.replace(/[/\\?%*:|"<>]/g, '_')
    let content: any
    try { content = JSON.parse(doc.content) } catch { content = { type: 'doc', content: [] } }

    if (format === '.docx') {
      const docx = new Document({
        title: doc.title,
        numbering: {
          config: [{
            reference: 'ordered',
            levels: [{
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.START,
            }],
          }],
        },
        sections: [{ children: tiptapToDocxChildren(content) }],
      })
      const buffer = await Packer.toBuffer(docx)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`)
      res.send(buffer)
    } else if (format === '.txt') {
      const text = tiptapToText(content)
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`)
      res.send(text)
    } else {
      const text = tiptapToText(content)
      res.setHeader('Content-Type', 'text/markdown')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`)
      res.send(text)
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Export failed' })
  }
})

router.use(authMiddleware)

router.get('/', (req: Request, res: Response) => {
  const owned = db.prepare(`
    SELECT d.*, u.name as owner_name
    FROM documents d
    JOIN users u ON d.owner_id = u.id
    WHERE d.owner_id = ?
    ORDER BY d.updated_at DESC
  `).all(req.userId)

  const shared = db.prepare(`
    SELECT d.*, u.name as owner_name
    FROM documents d
    JOIN shares s ON s.document_id = d.id
    JOIN users u ON d.owner_id = u.id
    WHERE s.user_id = ? AND d.owner_id != ?
    ORDER BY d.updated_at DESC
  `).all(req.userId, req.userId)

  res.json({ owned, shared })
})

router.post('/', (req: Request, res: Response) => {
  const { title } = req.body

  const defaultContent = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  })

  const result = db.prepare(
    'INSERT INTO documents (title, content, owner_id, source_format) VALUES (?, ?, ?, ?)'
  ).run(title || 'Untitled Document', defaultContent, req.userId, '.md')

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ document: doc })
})

router.get('/:id', (req: Request, res: Response) => {
  const doc = db.prepare(`
    SELECT d.*, u.name as owner_name
    FROM documents d
    JOIN users u ON d.owner_id = u.id
    WHERE d.id = ?
  `).get(req.params.id) as any

  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }

  const isShared = db.prepare(
    'SELECT 1 FROM shares WHERE document_id = ? AND user_id = ?'
  ).get(req.params.id, req.userId)

  if (doc.owner_id !== req.userId && !isShared) {
    res.status(403).json({ error: 'Access denied' })
    return
  }

  res.json({ document: doc })
})

router.put('/:id', (req: Request, res: Response) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }

  const canEdit = doc.owner_id === req.userId ||
    db.prepare('SELECT 1 FROM shares WHERE document_id = ? AND user_id = ?').get(req.params.id, req.userId)

  if (!canEdit) {
    res.status(403).json({ error: 'Access denied' })
    return
  }

  const { title, content } = req.body

  if (title !== undefined && title !== null) {
    db.prepare('UPDATE documents SET title = ?, updated_at = datetime(\'now\') WHERE id = ?').run(title, req.params.id)
  }
  if (content !== undefined && content !== null) {
    db.prepare('UPDATE documents SET content = ?, updated_at = datetime(\'now\') WHERE id = ?').run(content, req.params.id)
  }

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id)
  res.json({ document: updated })
})

router.delete('/:id', (req: Request, res: Response) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }

  if (doc.owner_id !== req.userId) {
    res.status(403).json({ error: 'Only the owner can delete' })
    return
  }

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

function tiptapToText(content: any): string {
  if (!content?.content) return ''
  let text = ''
  for (const node of content.content) {
    if (node.type === 'paragraph') {
      const line = node.content?.map((c: any) => c.text || '').join('') || ''
      text += line + '\n\n'
    } else if (node.type === 'heading') {
      const level = node.attrs?.level || 1
      const line = node.content?.map((c: any) => c.text || '').join('') || ''
      text += '#'.repeat(level) + ' ' + line + '\n\n'
    } else if (node.type === 'bulletList') {
      for (const item of node.content || []) {
        const line = item.content?.map((c: any) =>
          c.content?.map((s: any) => s.text).join('') || c.text || ''
        ).join('') || ''
        text += '- ' + line + '\n'
      }
      text += '\n'
    } else if (node.type === 'orderedList') {
      let idx = 1
      for (const item of node.content || []) {
        const line = item.content?.map((c: any) =>
          c.content?.map((s: any) => s.text).join('') || c.text || ''
        ).join('') || ''
        text += idx + '. ' + line + '\n'
        idx++
      }
      text += '\n'
    }
  }
  return text.trim()
}

function makeDocxParagraph(node: any): Paragraph {
  const runs = node.content?.map((c: any) =>
    new TextRun({
      text: c.text || '',
      bold: c.marks?.some((m: any) => m.type === 'bold'),
      italics: c.marks?.some((m: any) => m.type === 'italic'),
      underline: c.marks?.some((m: any) => m.type === 'underline'),
    })
  ) || [new TextRun({ text: '' })]

  return new Paragraph({ children: runs })
}

function tiptapToDocxChildren(content: any): Paragraph[] {
  if (!content?.content) return [new Paragraph({ children: [new TextRun({ text: '' })] })]
  const children: Paragraph[] = []

  for (const node of content.content) {
    if (node.type === 'paragraph') {
      children.push(makeDocxParagraph(node))
    } else if (node.type === 'heading') {
      const level = node.attrs?.level || 1
      const h = level <= 1 ? HeadingLevel.HEADING_1
        : level === 2 ? HeadingLevel.HEADING_2
        : level === 3 ? HeadingLevel.HEADING_3
        : level === 4 ? HeadingLevel.HEADING_4
        : level === 5 ? HeadingLevel.HEADING_5
        : HeadingLevel.HEADING_6
      const runs = node.content?.map((c: any) =>
        new TextRun({
          text: c.text || '',
          bold: c.marks?.some((m: any) => m.type === 'bold'),
          italics: c.marks?.some((m: any) => m.type === 'italic'),
          underline: c.marks?.some((m: any) => m.type === 'underline'),
        })
      ) || [new TextRun({ text: '' })]
      children.push(new Paragraph({ children: runs, heading: h }))
    } else if (node.type === 'bulletList') {
      for (const item of node.content || []) {
        const runs = item.content?.map((c: any) =>
          new TextRun({
            text: c.content?.map((s: any) => s.text).join('') || c.text || '',
            bold: (c.content || c)?.marks?.some((m: any) => m.type === 'bold'),
            italics: (c.content || c)?.marks?.some((m: any) => m.type === 'italic'),
          })
        ) || [new TextRun({ text: '' })]
        children.push(new Paragraph({ children: runs, bullet: { level: 0 } }))
      }
    } else if (node.type === 'orderedList') {
      for (const item of node.content || []) {
        const runs = item.content?.map((c: any) =>
          new TextRun({
            text: c.content?.map((s: any) => s.text).join('') || c.text || '',
            bold: (c.content || c)?.marks?.some((m: any) => m.type === 'bold'),
            italics: (c.content || c)?.marks?.some((m: any) => m.type === 'italic'),
          })
        ) || [new TextRun({ text: '' })]
        children.push(new Paragraph({ children: runs, numbering: { reference: 'ordered', level: 0 } }))
      }
    }
  }

  return children
}

export default router
