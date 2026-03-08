import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react'
import { toast } from 'sonner'
import {
  categoriesCol, questionsCol,
  getAll, setDocument, updateDocument, deleteDocument, subscribeCollection,
} from '../../../lib/firestore'

interface Category {
  id: string
  label: string
  emoji: string
  description: string
  color: string
  bgColor: string
  order?: number
}

type CatDoc = Category & { _id: string }

const PRESET_COLORS = [
  { color: '#3B82F6', bg: '#EFF6FF', name: 'Mavi' },
  { color: '#10B981', bg: '#ECFDF5', name: 'Yeşil' },
  { color: '#F59E0B', bg: '#FFFBEB', name: 'Altın' },
  { color: '#8B5CF6', bg: '#F5F3FF', name: 'Mor' },
  { color: '#EF4444', bg: '#FEF2F2', name: 'Kırmızı' },
  { color: '#EC4899', bg: '#FDF2F8', name: 'Pembe' },
  { color: '#14B8A6', bg: '#F0FDFA', name: 'Teal' },
  { color: '#F97316', bg: '#FFF7ED', name: 'Turuncu' },
]

function emptyForm(): Category {
  return { id: '', label: '', emoji: '📌', description: '', color: '#3B82F6', bgColor: '#EFF6FF', order: 0 }
}

// ─── Shared design tokens ──────────────────────────────────────────────────────
const C = {
  bg: '#0a0f1e', card: '#111827', sidebar: '#0d1117',
  border: 'rgba(255,255,255,0.06)', borderHover: 'rgba(6,182,212,0.35)',
  cyan: '#8b5cf6', purple: '#06b6d4', // Swapped accent to match Categories theme
  t1: '#ffffff', t2: '#94a3b8', t3: '#64748b',
  gradient: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: C.t1, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', color: C.t3, fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
}

function Spinner() {
  return <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
}

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ color: C.t1, fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.t1)} onMouseLeave={e => (e.currentTarget.style.color = C.t3)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
            {footer && <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DeleteConfirm({ open, message, errorMsg, onCancel, onConfirm }: { open: boolean; message: string; errorMsg?: React.ReactNode; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
          >
            <h3 style={{ color: C.t1, fontWeight: 700, fontSize: 15, margin: '0 0 10px' }}>Silmek istediğinden emin misin?</h3>
            <p style={{ color: C.t2, fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>{message}</p>
            {errorMsg && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 24 }}>{errorMsg}</div>}
            {!errorMsg && <div style={{ marginBottom: 24 }} />}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <CancelBtn onClick={onCancel} />
              <button onClick={onConfirm} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600 }}>Sil</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: C.gradient, color: '#fff', fontSize: 13, fontWeight: 600, opacity: disabled ? 0.6 : 1, transition: 'opacity 0.15s' }}>
      {children}
    </button>
  )
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid rgba(255,255,255,0.1)`, cursor: 'pointer', background: hov ? 'rgba(255,255,255,0.06)' : 'transparent', color: C.t2, fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      İptal
    </button>
  )
}

function IconBtn({ onClick, hoverColor, children }: { onClick: () => void; hoverColor: string; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} style={{ padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: hov ? `${hoverColor}18` : 'transparent', color: hov ? hoverColor : '#64748b', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CategoriesModule() {
  const [categories, setCategories] = useState<CatDoc[]>([])
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CatDoc | null>(null)
  const [form, setForm] = useState<Category>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CatDoc | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    unsubRef.current = subscribeCollection<Category>(
      categoriesCol(),
      (docs) => {
        const sorted = [...docs as CatDoc[]].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        setCategories(sorted)
      },
    )
    getAll<{ category: string }>(questionsCol()).then(qs => {
      const counts: Record<string, number> = {}
      qs.forEach(q => { counts[q.category] = (counts[q.category] ?? 0) + 1 })
      setQuestionCounts(counts)
    })
    return () => unsubRef.current?.()
  }, [])

  function openAdd() { setEditing(null); setForm({ ...emptyForm(), order: categories.length }); setModalOpen(true) }
  function openEdit(cat: CatDoc) { setEditing(cat); setForm({ ...cat }); setModalOpen(true) }

  async function handleSave() {
    if (!form.id.trim() || !form.label.trim()) { toast.error('ID ve isim zorunludur.'); return }
    setSaving(true)
    try {
      if (editing) { await updateDocument(categoriesCol(), editing._id, form); toast.success('Kategori güncellendi.') }
      else { await setDocument(categoriesCol(), form.id, form); toast.success('Kategori eklendi.') }
      setModalOpen(false)
    } catch (e: any) { toast.error('Kaydedilemedi.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const count = questionCounts[deleteTarget.id] ?? 0
    if (count > 0) {
      toast.error(`Bu kategoride ${count} soru var. Önce soruları taşı veya sil.`)
      setDeleteTarget(null)
      return
    }
    try { await deleteDocument(categoriesCol(), deleteTarget._id); toast.success('Kategori silindi.') }
    catch { toast.error('Silinemedi.') }
    finally { setDeleteTarget(null) }
  }

  const [fc, setFc] = useState<Record<string, boolean>>({})
  const fi = (name: string): React.CSSProperties => ({ ...INPUT_STYLE, borderColor: fc[name] ? C.cyan : 'rgba(255,255,255,0.08)' })
  const fb = (name: string) => ({ onFocus: () => setFc(s => ({ ...s, [name]: true })), onBlur: () => setFc(s => ({ ...s, [name]: false })) })

  return (
    <div style={{ padding: 32, background: C.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: C.t1, fontWeight: 700, fontSize: 24, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag size={22} style={{ color: C.cyan }} /> Kategoriler
          </h1>
          <p style={{ color: C.t3, fontSize: 13, margin: '4px 0 0' }}>{categories.length} kategori</p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.gradient, color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 14px rgba(139,92,246,0.25)' }}
        >
          <Plus size={15} /> Kategori Ekle
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {categories.map(cat => (
          <CatCard
            key={cat._id} cat={cat} count={questionCounts[cat.id] ?? 0}
            onEdit={() => openEdit(cat)} onDelete={() => setDeleteTarget(cat)}
          />
        ))}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Kategori Düzenle' : 'Yeni Kategori'}
        footer={
          <>
            <CancelBtn onClick={() => setModalOpen(false)} />
            <PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? <Spinner /> : null}{editing ? 'Güncelle' : 'Kaydet'}</PrimaryBtn>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>ID * <span style={{ fontWeight: 400, textTransform: 'none' }}>(slug)</span></label>
            <input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} disabled={!!editing} placeholder="yazilim" style={{ ...fi('id'), opacity: editing ? 0.5 : 1 }} {...fb('id')} />
          </div>
          <div>
            <label style={LABEL_STYLE}>İsim *</label>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Yazılım" style={fi('label')} {...fb('label')} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Emoji</label>
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="💻" style={fi('emoji')} {...fb('emoji')} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Sıra</label>
            <input type="number" value={form.order ?? 0} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} style={fi('order')} {...fb('order')} />
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Açıklama</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Kısa açıklama..." style={{ ...fi('desc'), resize: 'none' }} {...fb('desc')} />
        </div>

        <div>
          <label style={LABEL_STYLE}>Renk</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_COLORS.map(({ color, bg, name }) => (
              <button
                key={color} type="button" title={name} onClick={() => setForm(f => ({ ...f, color, bgColor: bg }))}
                style={{
                  width: 28, height: 28, borderRadius: 8, background: color, border: 'none', cursor: 'pointer',
                  boxShadow: form.color === color ? `0 0 0 2px ${C.card}, 0 0 0 4px ${color}` : 'none',
                  transform: form.color === color ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.15s'
                }}
              />
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete */}
      <DeleteConfirm
        open={!!deleteTarget}
        message={`"${deleteTarget?.label ?? ''}" kategorisini silmek istediğinden emin misin?`}
        errorMsg={(questionCounts[deleteTarget?.id ?? ''] ?? 0) > 0 ? `Bu kategoride ${questionCounts[deleteTarget?.id ?? '']} soru var! Önce onları silmelisin.` : null}
        onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
      />
    </div>
  )
}

function CatCard({ cat, count, onEdit, onDelete }: { cat: CatDoc; count: number; onEdit: () => void; onDelete: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'all 0.15s', transform: hov ? 'translateY(-2px)' : 'none', boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.3)` : 'none',
        borderColor: hov ? C.borderHover : C.border
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: cat.color + '20' }}>
            {cat.emoji}
          </div>
          <div>
            <p style={{ color: C.t1, fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>{cat.label}</p>
            <p style={{ color: C.t3, fontSize: 11, margin: 0, fontFamily: 'monospace' }}>{cat.id}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
          <IconBtn onClick={onEdit} hoverColor={C.cyan}><Pencil size={14} /></IconBtn>
          <IconBtn onClick={onDelete} hoverColor="#ef4444"><Trash2 size={14} /></IconBtn>
        </div>
      </div>

      <p style={{ color: C.t2, fontSize: 12, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {cat.description || 'Açıklama yok.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color }} />
          <span style={{ color: C.t3, fontSize: 11, fontFamily: 'monospace' }}>{cat.color}</span>
        </div>
        <span style={{ color: C.t1, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6 }}>
          {count} Soru
        </span>
      </div>
    </div>
  )
}
