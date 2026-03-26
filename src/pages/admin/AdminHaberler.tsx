import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Newspaper, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { getAll, deleteHaber, haberlerCol } from '../../lib/firestore'
import type { HaberDoc } from '../../lib/firestore'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0f1e', card: '#111827', sidebar: '#0d1117',
  border: 'rgba(255,255,255,0.06)', borderHover: 'rgba(99,102,241,0.3)',
  cyan: '#6366f1', purple: '#8b5cf6',
  t1: '#ffffff', t2: '#94a3b8', t3: '#64748b',
  gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
}

const DURUM_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  taslak: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', label: 'TASLAK' },
  yayinda: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'YAYINDA' },
  zamanlanmis: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'ZAMANLANMIŞ' },
}

const KATEGORI_LABEL: Record<string, string> = {
  'mulakat-ipucu': 'Mülakat İpucu',
  'sektor-haberi': 'Sektör Haberi',
  'platform-guncelleme': 'Platform Güncelleme',
  'basari-hikayesi': 'Başarı Hikayesi',
}

type DurumFilter = 'tumu' | 'taslak' | 'yayinda' | 'zamanlanmis'

function formatDate(ts: unknown): string {
  if (!ts) return '-'
  const ms = (ts as { toMillis?: () => number })?.toMillis?.()
  if (!ms) return '-'
  return new Date(ms).toLocaleDateString('tr-TR')
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

function DeleteConfirm({ open, title, onCancel, onConfirm }: { open: boolean; title: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, width: '100%', maxWidth: 400, padding: 28 }}>
            <h3 style={{ color: C.t1, fontWeight: 700, fontSize: 15, margin: '0 0 10px' }}>Silmek istediğinden emin misin?</h3>
            <p style={{ color: C.t2, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>"{title}" başlıklı haberi silmek üzeresin. Bu işlem geri alınamaz.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', color: C.t2, fontSize: 13, fontWeight: 600 }}>İptal</button>
              <button onClick={onConfirm} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600 }}>Sil</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function AdminHaberler() {
  const navigate = useNavigate()
  const [haberler, setHaberler] = useState<HaberDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [durumFilter, setDurumFilter] = useState<DurumFilter>('tumu')
  const [deleteTarget, setDeleteTarget] = useState<HaberDoc | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const items = await getAll<HaberDoc>(haberlerCol())
      const sorted = (items as HaberDoc[]).sort((a, b) => {
        const ta = (a.olusturmaTarihi as { toMillis?: () => number })?.toMillis?.() ?? 0
        const tb = (b.olusturmaTarihi as { toMillis?: () => number })?.toMillis?.() ?? 0
        return tb - ta
      })
      setHaberler(sorted)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteHaber(deleteTarget._id)
      setHaberler(prev => prev.filter(h => h._id !== deleteTarget._id))
      toast.success('Haber silindi.')
    } catch {
      toast.error('Silinemedi.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const filtered = durumFilter === 'tumu' ? haberler : haberler.filter(h => h.durum === durumFilter)

  return (
    <div style={{ padding: 32, background: C.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: C.t1, fontWeight: 700, fontSize: 24, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Newspaper size={22} style={{ color: C.cyan }} /> Haberler
          </h1>
          <p style={{ color: C.t3, fontSize: 13, margin: '4px 0 0' }}>
            {haberler.filter(h => h.durum === 'yayinda').length} yayında · {haberler.filter(h => h.durum === 'taslak').length} taslak
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/haberler/yeni')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.gradient, color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
        >
          <Plus size={15} /> Yeni Haber
        </button>
      </div>

      {/* Durum filtreleri */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['tumu', 'yayinda', 'taslak', 'zamanlanmis'] as DurumFilter[]).map(key => {
          const label = key === 'tumu' ? 'Tümü' : DURUM_COLOR[key]?.label ?? key
          const count = key === 'tumu' ? haberler.length : haberler.filter(h => h.durum === key).length
          return (
            <button
              key={key}
              onClick={() => setDurumFilter(key)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${durumFilter === key ? C.cyan : C.border}`,
                cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: durumFilter === key ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: durumFilter === key ? C.cyan : C.t3,
              }}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.t3 }}>Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '64px 0', textAlign: 'center', color: C.t3, fontSize: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          Henüz haber yok. İlk haberi ekle!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(haber => {
            const durum = DURUM_COLOR[haber.durum] ?? DURUM_COLOR.taslak
            return (
              <div
                key={haber._id}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.borderHover
                  const actions = e.currentTarget.querySelector('.haber-actions') as HTMLElement
                  if (actions) actions.style.opacity = '1'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border
                  const actions = e.currentTarget.querySelector('.haber-actions') as HTMLElement
                  if (actions) actions.style.opacity = '0'
                }}
              >
                {/* Tip icon */}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Newspaper size={15} style={{ color: C.cyan }} />
                </div>

                {/* Başlık + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{ color: C.t1, fontWeight: 600, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                      {haber.baslik}
                    </h3>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', background: 'rgba(99,102,241,0.1)', color: C.cyan }}>
                      {KATEGORI_LABEL[haber.kategori] ?? haber.kategori}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', background: durum.bg, color: durum.color }}>
                      {durum.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: C.t3, fontSize: 11 }}>{formatDate(haber.olusturmaTarihi)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.t3, fontSize: 11 }}>
                      <Eye size={10} /> {haber.goruntulenme ?? 0}
                    </span>
                  </div>
                </div>

                {/* Aksiyonlar */}
                <div className="haber-actions" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}>
                  <IconBtn onClick={() => navigate(`/admin/haberler/duzenle/${haber._id}`)} hoverColor="#3b82f6">
                    <Pencil size={15} />
                  </IconBtn>
                  <IconBtn onClick={() => setDeleteTarget(haber)} hoverColor="#ef4444">
                    <Trash2 size={15} />
                  </IconBtn>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <DeleteConfirm
        open={!!deleteTarget}
        title={deleteTarget?.baslik ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
