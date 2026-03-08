import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Megaphone, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import {
  announcementsCol,
  addDocument, updateDocument, deleteDocument, subscribeCollection,
} from '../../../lib/firestore'
import type { Timestamp } from 'firebase/firestore'

interface Announcement {
  title: string
  content: string
  active: boolean
  createdAt?: Timestamp
}

type AnnDoc = Announcement & { _id: string }

function emptyForm(): Omit<Announcement, 'createdAt'> {
  return { title: '', content: '', active: false }
}

// ─── Shared design tokens ──────────────────────────────────────────────────────
const C = {
  bg: '#0a0f1e', card: '#111827', sidebar: '#0d1117',
  border: 'rgba(255,255,255,0.06)', borderHover: 'rgba(245,158,11,0.3)',
  cyan: '#f59e0b', purple: '#fcd34d', // Amber theme for Announcements
  t1: '#ffffff', t2: '#94a3b8', t3: '#64748b',
  gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
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

function DeleteConfirm({ open, message, onCancel, onConfirm }: { open: boolean; message: string; onCancel: () => void; onConfirm: () => void }) {
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
            <p style={{ color: C.t2, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
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
    <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: C.gradient, color: '#0d1117', fontSize: 13, fontWeight: 700, opacity: disabled ? 0.6 : 1, transition: 'opacity 0.15s' }}>
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

export function AnnouncementsModule() {
  const [announcements, setAnnouncements] = useState<AnnDoc[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AnnDoc | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AnnDoc | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    unsubRef.current = subscribeCollection<Announcement>(
      announcementsCol(),
      (docs) => {
        const sorted = [...docs as AnnDoc[]].sort((a, b) => {
          const ta = (a.createdAt as any)?.seconds ?? 0
          const tb = (b.createdAt as any)?.seconds ?? 0
          return tb - ta
        })
        setAnnouncements(sorted)
      },
    )
    return () => unsubRef.current?.()
  }, [])

  function openAdd() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEdit(ann: AnnDoc) { setEditing(ann); setForm({ title: ann.title, content: ann.content, active: ann.active }); setModalOpen(true) }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Başlık zorunludur.'); return }
    setSaving(true)
    try {
      if (editing) { await updateDocument(announcementsCol(), editing._id, form); toast.success('Duyuru güncellendi.') }
      else { await addDocument(announcementsCol(), form); toast.success('Duyuru eklendi.') }
      setModalOpen(false)
    } catch { toast.error('Kaydedilemedi.') }
    finally { setSaving(false) }
  }

  async function toggleActive(ann: AnnDoc) {
    try { await updateDocument(announcementsCol(), ann._id, { active: !ann.active }); toast.success(ann.active ? 'Duyuru pasife alındı.' : 'Duyuru yayınlandı.') }
    catch { toast.error('Güncellenemedi.') }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try { await deleteDocument(announcementsCol(), deleteTarget._id); toast.success('Duyuru silindi.') }
    catch { toast.error('Silinemedi.') }
    finally { setDeleteTarget(null) }
  }

  function formatDate(ts: Timestamp | undefined) {
    if (!ts) return '-'
    return new Date((ts as any).seconds * 1000).toLocaleDateString('tr-TR')
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
            <Megaphone size={22} style={{ color: C.cyan }} /> Duyurular
          </h1>
          <p style={{ color: C.t3, fontSize: 13, margin: '4px 0 0' }}>{announcements.filter(a => a.active).length} aktif duyuru</p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.gradient, color: '#0d1117', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(245,158,11,0.2)' }}
        >
          <Plus size={15} /> Duyuru Ekle
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {announcements.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: C.t3, fontSize: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
            Henüz duyuru yok. İlk duyuruyu ekle!
          </div>
        ) : (
          announcements.map(ann => (
            <div
              key={ann._id}
              style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = C.borderHover
                el.style.transform = 'translateY(-1px)'
                const actions = el.querySelector('.ann-actions') as HTMLElement
                if (actions) actions.style.opacity = '1'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = C.border
                el.style.transform = 'translateY(0)'
                const actions = el.querySelector('.ann-actions') as HTMLElement
                if (actions) actions.style.opacity = '0'
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: ann.active ? `${C.cyan}15` : 'rgba(255,255,255,0.03)' }}>
                <Megaphone size={16} style={{ color: ann.active ? C.cyan : C.t3 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h3 style={{ color: C.t1, fontWeight: 600, fontSize: 14, margin: 0 }}>{ann.title}</h3>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: ann.active ? '#10b981' : C.t3, background: ann.active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)' }}>
                    {ann.active ? 'YAYINDA' : 'TASLAK'}
                  </span>
                </div>
                <p style={{ color: C.t2, fontSize: 13, margin: '0 0 8px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {ann.content}
                </p>
                <p style={{ color: C.t3, fontSize: 11, margin: 0 }}>{formatDate(ann.createdAt)}</p>
              </div>

              <div className="ann-actions" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}>
                <IconBtn onClick={() => toggleActive(ann)} hoverColor={C.cyan}>
                  {ann.active ? <EyeOff size={15} /> : <Eye size={15} />}
                </IconBtn>
                <IconBtn onClick={() => openEdit(ann)} hoverColor="#3b82f6"><Pencil size={15} /></IconBtn>
                <IconBtn onClick={() => setDeleteTarget(ann)} hoverColor="#ef4444"><Trash2 size={15} /></IconBtn>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Duyuruyu Düzenle' : 'Yeni Duyuru'}
        footer={
          <>
            <CancelBtn onClick={() => setModalOpen(false)} />
            <PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? <Spinner /> : null}{editing ? 'Güncelle' : 'Kaydet'}</PrimaryBtn>
          </>
        }
      >
        <div>
          <label style={LABEL_STYLE}>Başlık *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Harika bir haber!" style={fi('title')} {...fb('title')} />
        </div>

        <div>
          <label style={LABEL_STYLE}>İçerik</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Detaylar..." style={{ ...fi('content'), resize: 'none' }} {...fb('content')} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none', marginTop: 8 }}>
          <div
            onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', transition: 'background 0.2s', background: form.active ? C.cyan : 'rgba(255,255,255,0.1)' }}
          >
            <div style={{ position: 'absolute', top: 2, left: form.active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </div>
          <span style={{ color: form.active ? C.cyan : C.t2, fontSize: 13, fontWeight: 600 }}>
            {form.active ? 'Şu an yayında' : 'Taslak olarak kaydet'}
          </span>
        </label>
      </Modal>

      {/* Delete */}
      <DeleteConfirm
        open={!!deleteTarget}
        message={`"${deleteTarget?.title ?? ''}" duyurusunu silmek istediğinden emin misin?`}
        onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete}
      />
    </div>
  )
}
