import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Editor from '../components/Editor'
import ShareDialog from '../components/ShareDialog'

export default function DocumentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [doc, setDoc] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sourceFormat, setSourceFormat] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!id) return
    api.documents.get(Number(id)).then((res) => {
      setDoc(res.document)
      setTitle(res.document.title)
      setContent(res.document.content)
      setSourceFormat(res.document.source_format || '')
    })
    api.upload.list(Number(id)).then((res) => setFiles(res.files))
  }, [id])

  const saveContent = useCallback((json: string) => {
    setContent(json)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.documents.update(Number(id), { content: json })
    }, 1000)
  }, [id])

  const saveTitle = () => {
    api.documents.update(Number(id), { title })
  }

  const handleSave = useCallback(async () => {
    if (!id) return
    setSaving(true)
    await api.documents.update(Number(id), { content })
    setSaving(false)
  }, [id, content])

  const handleDownload = useCallback(async () => {
    if (!id) return
    const userId = localStorage.getItem('userId')
    const params = new URLSearchParams()
    if (userId) params.set('user_id', userId)
    if (sourceFormat) params.set('format', sourceFormat)
    const a = document.createElement('a')
    a.href = `${api.exportDoc.url(Number(id))}?${params.toString()}`
    a.click()
  }, [id, title, sourceFormat])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setUploading(true)
    const res = await api.upload.attach(Number(id), file)
    if (res.document) {
      setContent(res.document.content)
      setSourceFormat(res.document.source_format || '')
    }
    const fileList = await api.upload.list(Number(id))
    setFiles(fileList.files)
    setUploading(false)
  }

  if (!doc || !user) return <div className="loading">Loading...</div>

  const isOwner = doc.owner_id === user.id

  return (
    <div className="document-page">
      <header className="doc-header">
        <button className="btn btn-sm" onClick={() => navigate('/')}>← Back</button>
        <div className="doc-title-bar">
          <input
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
          />
          <span className="doc-status">{doc.owner_name ? `by ${doc.owner_name}` : ''}</span>
        </div>
        <div className="doc-header-actions">
          <button className="btn btn-sm" onClick={() => setShowShare(true)}>
            {isOwner ? 'Share' : 'Shared'}
          </button>
        </div>
      </header>

      <Editor content={content} onChange={saveContent} onSave={handleSave} onDownload={handleDownload} saving={saving} />

      <div className="file-section">
        <h3>Attachments</h3>
        <div className="file-list">
          {files.length === 0 && <p className="empty">No attachments.</p>}
          {files.map((f: any) => (
            <div key={f.id} className="file-row">
              <span>{f.original_name}</span>
              <a className="btn btn-sm" href={api.upload.downloadUrl(f.id)} download>Download</a>
            </div>
          ))}
        </div>
        <div className="file-upload">
          <input
            type="file"
            id="file-input"
            hidden
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <button className="btn btn-sm" onClick={() => document.getElementById('file-input')?.click()}>
            {uploading ? 'Uploading...' : 'Attach a file'}
          </button>
          <span className="file-hint">Supports .txt, .md, .csv</span>
        </div>
      </div>

      {showShare && (
        <ShareDialog
          documentId={Number(id)}
          isOwner={isOwner}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
