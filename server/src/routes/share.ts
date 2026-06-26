import { Router, Request, Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/:documentId', (req: Request, res: Response) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.documentId) as any
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }
  if (doc.owner_id !== req.userId) {
    res.status(403).json({ error: 'Only owner can view shares' })
    return
  }

  const shares = db.prepare(`
    SELECT s.*, u.name as user_name, u.email as user_email
    FROM shares s
    JOIN users u ON s.user_id = u.id
    WHERE s.document_id = ?
  `).all(req.params.documentId)

  res.json({ shares })
})

router.post('/:documentId', (req: Request, res: Response) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.documentId) as any
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }
  if (doc.owner_id !== req.userId) {
    res.status(403).json({ error: 'Only owner can share' })
    return
  }

  const { email, permission } = req.body
  if (!email) {
    res.status(400).json({ error: 'Email is required' })
    return
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
  if (!targetUser) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  if (targetUser.id === req.userId) {
    res.status(400).json({ error: 'Cannot share with yourself' })
    return
  }

  try {
    db.prepare(
      'INSERT INTO shares (document_id, user_id, permission) VALUES (?, ?, ?)'
    ).run(req.params.documentId, targetUser.id, permission || 'edit')

    const share = db.prepare(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM shares s
      JOIN users u ON s.user_id = u.id
      WHERE s.document_id = ? AND s.user_id = ?
    `).get(req.params.documentId, targetUser.id)

    res.status(201).json({ share })
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'Already shared with this user' })
      return
    }
    throw err
  }
})

router.delete('/:documentId/:userId', (req: Request, res: Response) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.documentId) as any
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }
  if (doc.owner_id !== req.userId) {
    res.status(403).json({ error: 'Only owner can unshare' })
    return
  }

  db.prepare(
    'DELETE FROM shares WHERE document_id = ? AND user_id = ?'
  ).run(req.params.documentId, req.params.userId)

  res.json({ success: true })
})

export default router
