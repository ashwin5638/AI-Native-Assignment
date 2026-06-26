const BASE = '/api'

async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  const userId = localStorage.getItem('userId')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (userId) {
    headers['X-User-Id'] = userId
  }
  if (options?.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const res = await fetch(`${BASE}${url}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  auth: {
    login: (email: string) => request<{ user: { id: number; name: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    me: () => request<{ user: { id: number; name: string; email: string } }>('/auth/me'),
    users: () => request<{ users: { id: number; name: string; email: string }[] }>('/auth/users'),
  },
  documents: {
    list: () => request<{ owned: any[]; shared: any[] }>('/documents'),
    create: (title?: string) => request<{ document: any }>('/documents', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
    get: (id: number) => request<{ document: any }>(`/documents/${id}`),
    update: (id: number, data: { title?: string; content?: string }) => request<{ document: any }>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => request(`/documents/${id}`, { method: 'DELETE' }),
  },
  shares: {
    list: (docId: number) => request<{ shares: any[] }>(`/shares/${docId}`),
    create: (docId: number, email: string, permission?: string) => request<{ share: any }>(`/shares/${docId}`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    }),
    remove: (docId: number, userId: number) => request(`/shares/${docId}/${userId}`, { method: 'DELETE' }),
  },
  exportDoc: {
    url: (id: number) => `${BASE}/documents/${id}/export`,
  },
  upload: {
    import: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<{ document: any }>('/upload/import', { method: 'POST', body: form })
    },
    attach: (docId: number, file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<{ document?: any; file?: any }>(`/upload/${docId}`, { method: 'POST', body: form })
    },
    list: (docId: number) => request<{ files: any[] }>(`/upload/${docId}`),
    downloadUrl: (fileId: number) => `${BASE}/files/${fileId}/download`,
  },
}
