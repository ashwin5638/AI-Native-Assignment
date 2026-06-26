export interface User {
  id: number
  name: string
  email: string
}

export interface Document {
  id: number
  title: string
  content: string
  owner_id: number
  created_at: string
  updated_at: string
}

export interface Share {
  id: number
  document_id: number
  user_id: number
  permission: string
  user_name?: string
  user_email?: string
}

export interface FileRecord {
  id: number
  document_id: number
  filename: string
  original_name: string
  mimetype: string
  size: number
  uploaded_at: string
}
