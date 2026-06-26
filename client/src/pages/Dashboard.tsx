import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import FileImport from '../components/FileImport'

interface Doc {
  id: number
  title: string
  owner_id: number
  owner_name: string
  updated_at: string
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [owned, setOwned] = useState<Doc[]>([])
  const [shared, setShared] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  const loadDocs = () => {
    setLoading(true)
    api.documents.list()
      .then((res) => {
        setOwned(res.owned)
        setShared(res.shared)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDocs() }, [])

  const createDoc = async () => {
    const res = await api.documents.create('Untitled Document')
    navigate(`/documents/${res.document.id}`)
  }

  const deleteDoc = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    await api.documents.delete(id)
    loadDocs()
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>CollabDocs</h1>
        <div className="header-right">
          <span className="user-name">{user?.name}</span>
          <button className="btn btn-sm" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-actions">
        <button className="btn btn-primary" onClick={createDoc}>+ New Document</button>
        <FileImport onImport={loadDocs} />
      </div>

      {loading ? <p className="loading">Loading...</p> : (
        <>
          <section className="doc-section">
            <h2>My Documents ({owned.length})</h2>
            {owned.length === 0 ? (
              <p className="empty">No documents yet. Create one!</p>
            ) : (
              <div className="doc-grid">
                {owned.map((doc) => (
                  <div key={doc.id} className="doc-card" onClick={() => navigate(`/documents/${doc.id}`)}>
                    <div className="doc-card-title">{doc.title}</div>
                    <div className="doc-card-meta">
                      <span>Owned by you</span>
                      <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                    </div>
                    <button className="btn btn-danger btn-sm delete-btn" onClick={(e) => deleteDoc(e, doc.id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {shared.length > 0 && (
            <section className="doc-section">
              <h2>Shared with Me ({shared.length})</h2>
              <div className="doc-grid">
                {shared.map((doc) => (
                  <div key={doc.id} className="doc-card shared" onClick={() => navigate(`/documents/${doc.id}`)}>
                    <div className="doc-card-title">{doc.title}</div>
                    <div className="doc-card-meta">
                      <span>Shared by {doc.owner_name}</span>
                      <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
