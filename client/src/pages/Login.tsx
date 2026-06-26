import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const [users, setUsers] = useState<{ id: number; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.auth.users()
      .then((res) => setUsers(res.users))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="login-page"><p>Loading...</p></div>
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>CollabDocs</h1>
        <p className="login-subtitle">Choose a user to sign in</p>
        <div className="user-list">
          {users.map((u) => (
            <button key={u.id} className="user-btn" onClick={() => login(u.email)}>
              <strong>{u.name}</strong>
              <span className="email">{u.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
