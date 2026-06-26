import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface Share {
  id: number
  document_id: number
  user_id: number
  permission: string
  user_name: string
  user_email: string
}

interface Props {
  documentId: number
  isOwner: boolean
  onClose: () => void
}

export default function ShareDialog({ documentId, isOwner, onClose }: Props) {
  const [shares, setShares] = useState<Share[]>([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOwner) {
      api.shares.list(documentId).then((res) => setShares(res.shares))
    }
  }, [documentId, isOwner])

  const addShare = async () => {
    setError('')
    try {
      const res = await api.shares.create(documentId, email)
      setShares([...shares, res.share])
      setEmail('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const removeShare = async (userId: number) => {
    await api.shares.remove(documentId, userId)
    setShares(shares.filter((s) => s.user_id !== userId))
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Share Document</h3>
          <button className="btn btn-sm" onClick={onClose}>X</button>
        </div>

        {isOwner ? (
          <>
            <div className="share-input">
              <input
                type="text"
                placeholder="Enter email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addShare()}
              />
              <button className="btn btn-primary btn-sm" onClick={addShare}>Share</button>
            </div>
            {error && <p className="error">{error}</p>}

            <div className="share-list">
              {shares.length === 0 ? (
                <p className="empty">Not shared with anyone yet.</p>
              ) : (
                shares.map((s) => (
                  <div key={s.id} className="share-row">
                    <div>
                      <strong>{s.user_name}</strong>
                      <span className="email">{s.user_email}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => removeShare(s.user_id)}>Remove</button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <p>You are a collaborator on this document.</p>
        )}
      </div>
    </div>
  )
}
