import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useEffect, useRef } from 'react'
import MenuBar from './MenuBar'

interface EditorProps {
  content: string
  onChange: (json: string) => void
  editable?: boolean
  onSave?: () => void
  onDownload?: () => void
  saving?: boolean
}

export default function Editor({ content, onChange, editable = true, onSave, onDownload, saving }: EditorProps) {
  const prevContent = useRef(content)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: content ? JSON.parse(content) : { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
    editable,
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON())
      onChange(json)
    },
  })

  useEffect(() => {
    if (editor && content && content !== prevContent.current) {
      try {
        const parsed = JSON.parse(content)
        if (parsed.type) {
          editor.commands.setContent(parsed)
        }
      } catch {}
      prevContent.current = content
    }
  }, [editor, content])

  if (!editor) return null

  return (
    <div className="editor-wrapper">
      <MenuBar editor={editor} onSave={onSave} onDownload={onDownload} saving={saving} />
      <EditorContent editor={editor} className="editor-content" />
    </div>
  )
}
