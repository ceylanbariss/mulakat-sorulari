import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Undo, Redo } from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  border: 'rgba(255,255,255,0.08)',
  borderFocus: 'rgba(99,102,241,0.4)',
  bg: 'rgba(255,255,255,0.03)',
  t1: '#ffffff',
  t2: '#94a3b8',
  t3: '#64748b',
}

interface HaberEditorProps {
  value: string
  onChange: (html: string) => void
  mode: 'makale' | 'post'
}

function ToolbarBtn({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '6px 8px',
        borderRadius: 6,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
        color: active ? '#818cf8' : C.t2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(99,102,241,0.25)' : 'transparent'
      }}
    >
      {children}
    </button>
  )
}

export function HaberEditor({ value, onChange, mode }: HaberEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: [
          'min-height: 300px',
          'outline: none',
          'color: #e2e8f0',
          'font-size: 14px',
          'line-height: 1.7',
          'padding: 16px',
        ].join(';'),
      },
    },
  })

  if (mode === 'post') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Gönderi içeriğini yaz..."
        rows={8}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 8,
          background: C.bg,
          border: `1px solid ${C.border}`,
          color: C.t1,
          fontSize: 14,
          lineHeight: 1.7,
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = C.borderFocus)}
        onBlur={e => (e.currentTarget.style.borderColor = C.border)}
      />
    )
  }

  if (!editor) return null

  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        background: C.bg,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '8px 12px',
          borderBottom: `1px solid ${C.border}`,
          flexWrap: 'wrap',
        }}
      >
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Başlık 2"
        >
          <Heading2 size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Başlık 3"
        >
          <Heading3 size={15} />
        </ToolbarBtn>
        <div style={{ width: 1, height: 18, background: C.border, margin: '0 4px' }} />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Kalın"
        >
          <Bold size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="İtalik"
        >
          <Italic size={15} />
        </ToolbarBtn>
        <div style={{ width: 1, height: 18, background: C.border, margin: '0 4px' }} />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Madde listesi"
        >
          <List size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numaralı liste"
        >
          <ListOrdered size={15} />
        </ToolbarBtn>
        <div style={{ width: 1, height: 18, background: C.border, margin: '0 4px' }} />
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Geri al"
        >
          <Undo size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Yeniden yap"
        >
          <Redo size={15} />
        </ToolbarBtn>
      </div>

      {/* Editor Content */}
      <style>{`
        .tiptap-editor h2 { font-size: 1.3em; font-weight: 700; margin: 1em 0 0.5em; color: #f1f5f9; }
        .tiptap-editor h3 { font-size: 1.1em; font-weight: 600; margin: 1em 0 0.4em; color: #e2e8f0; }
        .tiptap-editor p { margin: 0.4em 0; }
        .tiptap-editor ul, .tiptap-editor ol { padding-left: 1.5em; margin: 0.4em 0; }
        .tiptap-editor li { margin: 0.2em 0; }
        .tiptap-editor strong { font-weight: 700; }
        .tiptap-editor em { font-style: italic; }
        .tiptap-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #64748b;
          pointer-events: none;
          height: 0;
        }
      `}</style>
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
