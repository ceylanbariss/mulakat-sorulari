import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, RotateCcw, BookOpen, ChevronRight, Bot, FileText } from 'lucide-react'
import { IKON_MAP } from './ikon-map'
import { IT_ALANLARI } from './it-kariyer-data'
import { AREA_DESCRIPTIONS } from '../../data/careerTestQuestions'
import type { AreaScores } from '../../data/careerTestQuestions'
import { useAppStore } from '../../store/useAppStore'
import './it-kariyer-testi.css'

// Maps it-kariyer-data keys → careerTestQuestions AreaScores keys
const OLD_TO_NEW: Record<string, keyof AreaScores> = {
  yazilim: 'yazilim',
  veri: 'veri',
  siber: 'siberGuvenlik',
  ag_sistem: 'sistemAg',
  proje: 'projeYonetimi',
  ux: 'uxui',
  devops: 'devops',
  destek: 'itDestek',
}

const MAX_PER_AREA = 60 // 20 sorular × max 3 puan

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
    return Object.entries(puanlar)
      .map(([id, puan]) => ({
        id,
        yuzde: Math.round((puan / MAX_PER_AREA) * 100),
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
  const topDesc = AREA_DESCRIPTIONS[OLD_TO_NEW[top.id]]

  const handleCopyResult = async () => {
    const top3 = ranked.slice(0, 3).map(e => `${e.alan.ad} %${e.yuzde}`).join(' | ')
    const text = `IT Kariyer Testim: ${top3} — mulakatsorulari.com.tr`
    if (navigator.share) {
      await navigator.share({ title: 'IT Kariyer Testi Sonucum', text })
    } else {
      await navigator.clipboard.writeText(text)
      setShareMsg('Kopyalandı!')
      setTimeout(() => setShareMsg(''), 2500)
    }
  }

  const handleRestart = () => {
    sessionStorage.removeItem('it_kariyer_puanlar')
    localStorage.removeItem('careerTest_progress')
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
                <div style={{
                  display: 'inline-block',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                  color: top.alan.renk,
                  background: `${top.alan.renk}18`,
                  border: `1px solid ${top.alan.renk}35`,
                  borderRadius: '6px', padding: '2px 8px', marginBottom: '4px',
                }}>
                  BİRİNCİL EĞİLİM
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: d ? '#f1f5f9' : '#0f172a', margin: 0 }}>
                  {top.alan.ad}
                </h2>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', lineHeight: 1 }}>
                <div style={{ fontSize: '11px', color: d ? '#64748b' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Yakınlık oranı
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: top.alan.renk }}>
                  %{top.yuzde}
                </div>
              </div>
            </div>

            <div className="kt-bar-track" style={{ marginBottom: '1.25rem' }}>
              <div
                className="kt-bar-fill"
                style={{
                  width: barVisible ? `${top.yuzde}%` : '0%',
                  background: `linear-gradient(90deg, ${top.alan.renk}, ${top.alan.renk}bb)`,
                }}
              />
            </div>

            {/* Description from AREA_DESCRIPTIONS */}
            <p style={{ color: d ? '#94a3b8' : '#475569', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              {topDesc}
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

          {/* 2nd & 3rd results */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
            {ranked.slice(1, 3).map(({ id, yuzde, alan }) => {
              const Icon = IKON_MAP[alan.ikon]
              const desc = AREA_DESCRIPTIONS[OLD_TO_NEW[id]]
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: d ? '#e2e8f0' : '#0f172a', lineHeight: 1.3 }}>{alan.ad}</div>
                      <div style={{ fontSize: '11px', color: d ? '#64748b' : '#94a3b8', fontWeight: 600 }}>
                        Yakınlık oranı: <span style={{ color: alan.renk }}>%{yuzde}</span>
                      </div>
                    </div>
                  </div>
                  <div className="kt-bar-track" style={{ marginBottom: '10px' }}>
                    <div
                      className="kt-bar-fill"
                      style={{
                        width: barVisible ? `${yuzde}%` : '0%',
                        background: `linear-gradient(90deg, ${alan.renk}, ${alan.renk}bb)`,
                      }}
                    />
                  </div>
                  {desc && (
                    <p style={{ fontSize: '12px', color: d ? '#64748b' : '#64748b', lineHeight: 1.5, margin: 0 }}>
                      {desc}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* All 8 areas ranked list */}
          <div style={{
            marginBottom: '2rem',
            border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
            borderRadius: '16px',
            overflow: 'hidden',
            background: d ? 'rgba(15,23,42,0.45)' : 'rgba(248,250,252,0.7)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: d ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tüm Alan Yakınlık Oranları
              </h3>
            </div>
            {ranked.map(({ id, yuzde, alan }, idx) => {
              const Icon = IKON_MAP[alan.ikon]
              const isLast = idx === ranked.length - 1
              return (
                <div
                  key={id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 18px',
                    borderBottom: isLast ? 'none' : (d ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'),
                  }}
                >
                  <span style={{ width: '18px', fontSize: '12px', fontWeight: 700, color: d ? '#475569' : '#94a3b8', flexShrink: 0, textAlign: 'right' }}>
                    {idx + 1}
                  </span>
                  <div style={{
                    width: 28, height: 28, borderRadius: '8px',
                    background: `${alan.renk}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {Icon && <Icon size={14} color={alan.renk} strokeWidth={1.8} />}
                  </div>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: d ? '#cbd5e1' : '#334155' }}>
                    {alan.ad}
                  </span>
                  <div style={{ width: 100, height: 6, background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '99px', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{
                      height: '100%', borderRadius: '99px',
                      background: `linear-gradient(90deg, ${alan.renk}, ${alan.renk}bb)`,
                      width: barVisible ? `${yuzde}%` : '0%',
                      transition: `width 0.8s cubic-bezier(0.16,1,0.3,1) ${0.1 + idx * 0.06}s`,
                    }} />
                  </div>
                  <span style={{ width: '36px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: alan.renk, flexShrink: 0 }}>
                    %{yuzde}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Şimdi Ne Yapmalısın? */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: d ? '#f1f5f9' : '#0f172a', margin: '0 0 4px' }}>
                🚀 Şimdi Ne Yapmalısın?
              </h3>
              <p style={{ fontSize: '13px', color: d ? '#64748b' : '#94a3b8', margin: 0 }}>
                Platforma bu alanda hemen başlamak için 3 adım:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              {[
                {
                  icon: BookOpen,
                  color: '#6366f1',
                  title: 'Mülakat Sorularını Çalış',
                  text: `${top.alan.ad} kategorisindeki sorularla kendini test et.`,
                  btn: 'Sorulara Git →',
                  to: '/sorular',
                },
                {
                  icon: Bot,
                  color: '#06b6d4',
                  title: 'AI Mülakat Yap',
                  text: `${top.alan.ad} pozisyonu için yapay zeka ile pratik mülakat yap.`,
                  btn: 'Mülakata Başla →',
                  to: '/mulakat-sim',
                },
                {
                  icon: FileText,
                  color: '#10b981',
                  title: "CV'ni Güncelle",
                  text: `CV'nde ${top.alan.ad} yetkinliklerini öne çıkar.`,
                  btn: 'CV Oluştur →',
                  to: '/cv-olustur',
                },
              ].map(({ icon: Icon, color, title, text, btn, to }) => (
                <div
                  key={to}
                  style={{
                    border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '16px', padding: '18px',
                    background: d ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: `${color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color={color} strokeWidth={1.8} />
                  </div>
                  <p style={{ fontSize: '13.5px', fontWeight: 700, color: d ? '#f1f5f9' : '#0f172a', margin: 0 }}>
                    {title}
                  </p>
                  <p style={{ fontSize: '12px', color: d ? '#94a3b8' : '#64748b', lineHeight: 1.55, margin: 0, flex: 1 }}>
                    {text}
                  </p>
                  <button
                    onClick={() => navigate(to)}
                    style={{
                      padding: '8px 0', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                      background: `${color}14`, border: `1px solid ${color}30`,
                      color, cursor: 'pointer', width: '100%', transition: 'background 0.15s',
                    }}
                  >
                    {btn}
                  </button>
                </div>
              ))}
            </div>

            <div style={{
              borderTop: '1px solid rgba(245,158,11,0.25)',
              borderRight: '1px solid rgba(245,158,11,0.25)',
              borderBottom: '1px solid rgba(245,158,11,0.25)',
              borderLeft: '3px solid #f59e0b',
              borderRadius: '10px', padding: '12px 14px',
              background: 'rgba(245,158,11,0.08)',
            }}>
              <p style={{ fontSize: '13.5px', color: d ? '#fcd34d' : '#92400e', margin: 0, lineHeight: 1.55 }}>
                💡 <strong>İlk odaklanman gereken konu:</strong> {top.alan.dikkatEt[0]}
              </p>
            </div>
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
                <RotateCcw size={15} /> Testi Tekrarla
              </button>

              <button
                onClick={handleCopyResult}
                style={{
                  background: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  color: d ? '#94a3b8' : '#475569', borderRadius: '12px', padding: '13px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                }}
              >
                <Share2 size={15} /> {shareMsg || 'Sonucu Kopyala'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
