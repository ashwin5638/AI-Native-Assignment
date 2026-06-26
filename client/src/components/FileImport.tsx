import { useRef, useState } from 'react'
import { api } from '../api/client'

interface Props {
  onImport: () => void
}

export default function FileImport({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError('')
    try {
      await api.upload.import(file)
      onImport()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="file-import">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.csv,.docx"
        onChange={handleFile}
        hidden
      />
      <button
        className="btn"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
      >
        {importing ? 'Importing...' : 'Import .txt / .md / .csv / .docx'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
