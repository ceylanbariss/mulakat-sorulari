import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Trash2, Send, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore, useIsAdmin } from '../../store/useAuthStore'
import { useAppStore } from '../../store/useAppStore'
import { addYorum, getYorumlar, deleteYorum } from '../../lib/firestore'
import type { YorumDoc } from '../../lib/firestore'

interface YorumBolumuProps {
  haberFirestoreId: string
}

function formatDate(ts: unknown): string {
  if (!ts) return ''
  const ms = (ts as { toMillis?: () => number })?.toMillis?.()
  if (!ms) return ''
  return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function YorumBolumu({ haberFirestoreId }: YorumBolumuProps) {
  const { user } = useAuthStore()
  const isAdmin = useIsAdmin()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const [yorumlar, setYorumlar] = useState<YorumDoc[]>([])
  const [metin, setMetin] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
  const textColor = d ? '#f1f5f9' : '#0f172a'
  const mutedColor = d ? '#64748b' : '#94a3b8'
  const inputBg = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const inputBorder = d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'

  useEffect(() => {
    if (!haberFirestoreId) return
    setLoading(true)
    getYorumlar(haberFirestoreId)
      .then(setYorumlar)
      .finally(() => setLoading(false))
  }, [haberFirestoreId])

  async function handleGonder() {
    if (!metin.trim() || !user) return
    setSending(true)
    try {
      await addYorum(haberFirestoreId, {
        userId: user.uid,
        kullaniciAdi: user.displayName ?? user.email ?? 'Kullanıcı',
        metin: metin.trim(),
      })
      const updated = await getYorumlar(haberFirestoreId)
      setYorumlar(updated)
      setMetin('')
    } catch (err) {
      console.error('Yorum gönderilemedi:', err)
    } finally {
      setSending(false)
    }
  }

  async function handleSil(yorumId: string) {
    try {
      await deleteYorum(haberFirestoreId, yorumId)
      setYorumlar(prev => prev.filter(y => y._id !== yorumId))
    } catch (err) {
      console.error('Yorum silinemedi:', err)
    }
  }

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ marginTop: 48 }}>
      {/* Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <MessageSquare size={20} style={{ color: '#6366f1' }} />
        <h3 style={{ color: textColor, fontWeight: 700, fontSize: 18, margin: 0 }}>
          Yorumlar ({yorumlar.length})
        </h3>
      </div>

      {/* Yorum formu */}
      {user ? (
        <div style={{ marginBottom: 24, background: cardBg, border: cardBorder, borderRadius: 16, padding: 20 }}>
          <textarea
            value={metin}
            onChange={e => setMetin(e.target.value)}
            placeholder="Düşüncelerini paylaş..."
            rows={3}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              background: inputBg, border: `1px solid ${inputBorder}`,
              color: textColor, fontSize: 14, outline: 'none',
              resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={handleGonder}
              disabled={sending || !metin.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 8, border: 'none', cursor: sending || !metin.trim() ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                opacity: sending || !metin.trim() ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <Send size={14} /> Gönder
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24, background: cardBg, border: cardBorder, borderRadius: 16, padding: 24, textAlign: 'center' }}>
          <LogIn size={24} style={{ color: mutedColor, marginBottom: 8 }} />
          <p style={{ color: mutedColor, fontSize: 14, margin: '0 0 12px' }}>Yorum yapmak için giriş yapman gerekiyor.</p>
          <Link to="/giris" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            Giriş Yap
          </Link>
        </div>
      )}

      {/* Yorum listesi */}
      {loading ? (
        <div style={{ textAlign: 'center', color: mutedColor, padding: '24px 0', fontSize: 14 }}>Yorumlar yükleniyor...</div>
      ) : yorumlar.length === 0 ? (
        <div style={{ textAlign: 'center', color: mutedColor, padding: '32px 0', fontSize: 14 }}>
          Henüz yorum yok. İlk yorumu sen yap!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {yorumlar.map(yorum => (
              <motion.div
                key={yorum._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ background: cardBg, border: cardBorder, borderRadius: 14, padding: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {initials(yorum.kullaniciAdi)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: textColor, fontWeight: 600, fontSize: 13 }}>{yorum.kullaniciAdi}</span>
                        <span style={{ color: mutedColor, fontSize: 11 }}>{formatDate(yorum.olusturmaTarihi)}</span>
                      </div>
                      {(isAdmin || user?.uid === yorum.userId) && (
                        <button
                          onClick={() => handleSil(yorum._id)}
                          style={{ padding: 4, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'transparent', color: mutedColor, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = mutedColor)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p style={{ color: d ? '#cbd5e1' : '#334155', fontSize: 14, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {yorum.metin}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
