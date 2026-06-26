import { Router, Request, Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/login', (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) {
    res.status(400).json({ error: 'Email is required' })
    return
  }

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email) as { id: number, name: string, email: string } | undefined
  if (!user) {
    res.status(401).json({ error: 'User not found' })
    return
  }

  res.json({ user })
})

router.get('/me', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(parseInt(userId as string, 10))
  if (!user) {
    res.status(401).json({ error: 'User not found' })
    return
  }

  res.json({ user })
})

router.get('/users', (req: Request, res: Response) => {
  const users = db.prepare('SELECT id, name, email FROM users').all()
  res.json({ users })
})

export default router
