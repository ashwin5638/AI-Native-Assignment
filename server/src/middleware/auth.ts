import { Request, Response, NextFunction } from 'express'
import db from '../db.js'

declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ error: 'Missing X-User-Id header' })
    return
  }

  const id = parseInt(userId as string, 10)
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
  if (!user) {
    res.status(401).json({ error: 'Invalid user' })
    return
  }

  req.userId = id
  next()
}
