import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, RotateCcw, BookOpen, ChevronRight } from 'lucide-react'
import { IKON_MAP } from './ikon-map'
import { IT_ALANLARI } from './it-kariyer-data'
import { useAppStore } from '../../store/useAppStore'
import './it-kariyer-testi.css'

interface ScoreEntry { id: string; yuzde: number; alan: (typeof IT_ALANLARI)[0] }

function getPuanlar(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem('it_kariyer_puanlar')
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === 'number')
    ) as Record<string, number>
  } catch {
    return {}
  }
}

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 58 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: ['#6366f1', '#06b6d4', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981'][i % 7],
      delay: `${(Math.random() * 2.2).toFixed(2)}s`,
      duration: `${(2.6 + Math.random() * 1.8).toFixed(2)}s`,
      size: `${Math.floor(7 + Math.random() * 7)}px`,
    })),
  [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          className="kt-confetti-piece"
          style={{
            left: p.left, width: p.size, height: p.size,
            background: p.color, animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}

export default function ResultPage() {
  const navigate = useNavigate()
  const [barVisible, setBarVisible] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  useEffect(() => {
    const timer = setTimeout(() => setBarVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const ranked: ScoreEntry[] = useMemo(() => {
    const puanlar = getPuanlar()
    if (Object.keys(puanlar).length === 0) return []
    const total = Object.values(puanlar).reduce((a, b) => a + b, 0) || 1
    return Object.entries(puanlar)
      .map(([id, puan]) => ({
        id,
        yuzde: Math.round((puan / total) * 100),
        alan: IT_ALANLARI.find(a => a.id === id)!,
      }))
      .filter(e => e.alan)
      .sort((a, b) => b.yuzde - a.yuzde)
  }, [])

  if (ranked.length === 0) {
    navigate('/it-kariyer-testi', { replace: true })
    return null
  }

  const top = ranked[0]
  const TopIcon = IKON_MAP[top.alan.ikon]

  const handleShare = async () => {
    const text = `IT Kariyer Testini çözdüm! En uygun alanım: ${top.alan.ad} (%${top.yuzde}). Sen de dene: ${window.location.origin}/it-kariyer-testi`
    if (navigator.share) {
      await navigator.share({ title: 'IT Kariyer Testi Sonucum', text })
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/it-kariyer-testi`)
      setShareMsg('Link kopyalandı!')
      setTimeout(() => setShareMsg(''), 2500)
    }
  }

  const handleRestart = () => {
    sessionStorage.removeItem('it_kariyer_puanlar')
    navigate('/it-kariyer-testi/quiz')
  }

  return (
    <>
      <Confetti />
      <div className="kt-page">
        <div style={{ maxWidth: 720, width: '100%' }}>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p style={{ color: d ? '#94a3b8' : '#475569', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>
              Senin IT Profilin
            </p>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              fontWeight: 800, color: d ? '#f8fafc' : '#0f172a', lineHeight: 1.2,
            }}>
              Sonuçların Hazır! 🎉
            </h1>
          </div>

          {/* Primary Result */}
          <div style={{
            border: `2px solid ${top.alan.renk}40`,
            borderRadius: '20px', padding: '28px',
            background: d
              ? `linear-gradient(135deg, rgba(15,23,42,0.8), ${top.alan.renk}12)`
              : `linear-gradient(135deg, rgba(248,250,252,0.9), ${top.alan.renk}08)`,
            backdropFilter: 'blur(16px)', marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.25rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '14px',
                background: `${top.alan.renk}22`,
                border: `1.5px solid ${top.alan.renk}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {TopIcon && <TopIcon size={26} color={top.alan.renk} strokeWidth={1.8} />}
              </div>
              <div>
                <div style={{ fontSize: '12px', color: d ? '#64748b' : '#475569', fontWeight: 600, marginBottom: '2px' }}>
                  EN UYGUN ALAN
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: d ? '#f1f5f9' : '#0f172a', margin: 0 }}>
                  {top.alan.ad}
                </h2>
              </div>
              <div style={{
                marginLeft: 'auto', fontSize: '2rem', fontWeight: 800,
                color: top.alan.renk, lineHeight: 1,
              }}>
                %{top.yuzde}
              </div>
            </div>

            {/* Score bar */}
            <div className="kt-bar-track" style={{ marginBottom: '1.25rem' }}>
              <div
                className="kt-bar-fill"
                style={{
                  width: barVisible ? `${top.yuzde}%` : '0%',
                  background: `linear-gradient(90deg, ${top.alan.renk}, ${top.alan.renk}bb)`,
                }}
              />
            </div>

            <p style={{ color: d ? '#94a3b8' : '#475569', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              {top.alan.aciklama}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ color: d ? '#64748b' : '#475569', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Güçlü Yönlerin
                </p>
                {top.alan.gucluYonler.map((g, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: top.alan.renk, flexShrink: 0 }} />
                    <span style={{ color: d ? '#cbd5e1' : '#334155', fontSize: '13px' }}>{g}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ color: d ? '#64748b' : '#475569', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Dikkat Et
                </p>
                {top.alan.dikkatEt.map((dk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '5px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: '5px' }} />
                    <span style={{ color: d ? '#cbd5e1' : '#334155', fontSize: '13px', lineHeight: 1.4 }}>{dk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Career path */}
            <div>
              <p style={{ color: d ? '#64748b' : '#475569', fontSize: '11px', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kariyer Yolu
              </p>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 6px' }}>
                {top.alan.kariyerYolu.map((step, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      background: `${top.alan.renk}18`, border: `1px solid ${top.alan.renk}33`,
                      color: top.alan.renk, borderRadius: '8px', padding: '4px 10px',
                      fontSize: '12px', fontWeight: 600,
                    }}>
                      {step}
                    </span>
                    {i < top.alan.kariyerYolu.length - 1 && (
                      <ChevronRight size={12} color={d ? '#475569' : '#94a3b8'} />
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary results */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '2rem' }}>
            {ranked.slice(1, 3).map(({ id, yuzde, alan }) => {
              const Icon = IKON_MAP[alan.ikon]
              return (
                <div key={id} style={{
                  border: `1px solid ${alan.renk}28`,
                  borderRadius: '16px', padding: '18px',
                  background: d ? 'rgba(15,23,42,0.55)' : 'rgba(248,250,252,0.85)',
                  backdropFilter: 'blur(12px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '10px',
                      background: `${alan.renk}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {Icon && <Icon size={20} color={alan.renk} strokeWidth={1.8} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: d ? '#e2e8f0' : '#0f172a', lineHeight: 1.3 }}>{alan.ad}</div>
                      <div style={{ fontSize: '12px', color: alan.renk, fontWeight: 600 }}>%{yuzde}</div>
                    </div>
                  </div>
                  <div className="kt-bar-track">
                    <div
                      className="kt-bar-fill"
                      style={{
                        width: barVisible ? `${yuzde}%` : '0%',
                        background: `linear-gradient(90deg, ${alan.renk}, ${alan.renk}bb)`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => navigate(`/it-kariyer-testi/egitim?alan=${top.id}`)}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', borderRadius: '14px',
                padding: '15px 24px', fontSize: '1rem', fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <BookOpen size={18} /> Eğitim Önerilerine Bak →
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={handleRestart}
                style={{
                  background: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  color: d ? '#94a3b8' : '#475569', borderRadius: '12px', padding: '13px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}
              >
                <RotateCcw size={15} /> Testi Yeniden Başlat
              </button>

              <button
                onClick={handleShare}
                style={{
                  background: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  color: d ? '#94a3b8' : '#475569', borderRadius: '12px', padding: '13px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}
              >
                <Share2 size={15} /> {shareMsg || 'Sonucu Paylaş'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
