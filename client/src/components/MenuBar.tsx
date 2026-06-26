import { Editor } from '@tiptap/core'

interface MenuBarProps {
  editor: Editor
  onSave?: () => void
  onDownload?: () => void
  saving?: boolean
}

export default function MenuBar({ editor, onSave, onDownload, saving }: MenuBarProps) {
  const buttons = [
    { label: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), icon: 'B' },
    { label: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), icon: 'I' },
    { label: 'Underline', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), icon: 'U' },
    { type: 'divider' },
    { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }), icon: 'H1' },
    { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), icon: 'H2' },
    { label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), icon: 'H3' },
    { type: 'divider' },
    { label: 'Bullet List', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), icon: '•' },
    { label: 'Ordered List', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), icon: '1.' },
    { type: 'divider' },
    { label: 'Undo', action: () => editor.chain().focus().undo().run(), active: false, icon: '↩' },
    { label: 'Redo', action: () => editor.chain().focus().redo().run(), active: false, icon: '↪' },
    { type: 'divider' },
    { label: 'Save', action: () => onSave?.(), active: false, icon: saving ? '...' : '💾' },
    { label: 'Download', action: () => onDownload?.(), active: false, icon: '⬇' },
  ]

  return (
    <div className="menubar">
      {buttons.map((btn, i) => {
        if (btn.type === 'divider') return <span key={i} className="divider" />
        return (
          <button
            key={i}
            title={btn.label}
            onClick={btn.action}
            className={btn.active ? 'active' : ''}
          >
            {btn.icon}
          </button>
        )
      })}
    </div>
  )
}
