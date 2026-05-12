import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Lock, Gift, Brain, Shield, X, Compass } from 'lucide-react'
import { IKON_MAP } from './ikon-map'
import { IT_ALANLARI, type ITAlani } from './it-kariyer-data'
import { useAppStore } from '../../store/useAppStore'
import './it-kariyer-testi.css'

function AlanModal({ alan, onClose, onStart }: { alan: ITAlani; onClose: () => void; onStart: () => void }) {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const IconComp = IKON_MAP[alan.ikon]

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="kt-card"
        style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '24px', position: 'relative' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            width: '32px', height: '32px', borderRadius: '50%',
            border: d ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
            background: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: d ? '#94a3b8' : '#64748b',
          }}
        >
          <X size={16} />
        </button>

        {/* Two-column body */}
        <div className="kt-modal-body">
          {/* Left */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1rem' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: `${alan.renk}20`, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {IconComp && <IconComp size={26} color={alan.renk} strokeWidth={1.8} />}
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: d ? '#f1f5f9' : '#0f172a', lineHeight: 1.2, margin: 0 }}>
                {alan.ad}
              </h2>
            </div>

            <p style={{ fontSize: '13.5px', color: d ? '#94a3b8' : '#475569', lineHeight: 1.65, marginBottom: '1rem' }}>
              {alan.aciklamaDetay}
            </p>

            <div style={{
              background: d ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)',
              border: `1px solid ${d ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)'}`,
              borderRadius: '12px', padding: '12px 14px',
              fontSize: '12.5px', color: d ? '#a5b4fc' : '#4f46e5',
              lineHeight: 1.65, marginBottom: '1.25rem',
              display: 'flex', gap: '8px', alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0 }}>ℹ️</span>
              <span>{alan.idealKisi}</span>
            </div>

            <p style={{ fontSize: '12.5px', fontWeight: 600, color: d ? '#e2e8f0' : '#334155', marginBottom: '10px' }}>
              Kimler İçin Uygun?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alan.kimlerIcin.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '5px',
                    background: `${alan.renk}18`, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 3.5L3.8 6.5L9 1" stroke={alan.renk} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '13px', color: d ? '#cbd5e1' : '#334155' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '12.5px', fontWeight: 600, color: d ? '#e2e8f0' : '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚙️</span> Kullanılan Teknolojiler
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {alan.teknolojiler.map((tag, i) => (
                  <span key={i} style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                    background: d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                    color: d ? '#cbd5e1' : '#475569',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '12.5px', fontWeight: 600, color: d ? '#e2e8f0' : '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📊</span> Kariyer Örnekleri
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {alan.unvanlar.map((unvan, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: alan.renk, flexShrink: 0 }} />
                    <span style={{ fontSize: '12.5px', color: d ? '#cbd5e1' : '#475569' }}>{unvan}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Neler Ölçüyoruz */}
        <div style={{
          background: d ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
          border: d ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
          borderRadius: '14px', padding: '14px 16px', marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '12.5px', fontWeight: 600, color: d ? '#e2e8f0' : '#334155', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📈</span> Bu Testte Neler Ölçüyoruz?
          </p>
          <p style={{ fontSize: '13px', color: d ? '#94a3b8' : '#475569', lineHeight: 1.65, margin: 0 }}>
            {alan.neOlcuyoruz}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '11px 18px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 600,
              border: d ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
              background: 'transparent', cursor: 'pointer',
              color: d ? '#94a3b8' : '#475569',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}
          >
            <Compass size={15} /> Diğer Alanlara Göz At
          </button>
          <button
            onClick={onStart}
            style={{
              padding: '11px 22px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(99,102,241,0.35)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            🚀 Teste Başla →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ITKariyerTesti() {
  const navigate = useNavigate()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const [modalAlan, setModalAlan] = useState<ITAlani | null>(null)

  const infoCards = [
    {
      icon: Gift,
      title: 'Ne Kazanacaksın?',
      text: 'Sana en uygun 1-3 IT alanını, güçlü yönlerin ve gelişim alanlarınla birlikte öğreneceksin.',
      color: '#6366f1',
    },
    {
      icon: Brain,
      title: 'Nasıl Cevaplamalısın?',
      text: 'Doğru ya da yanlış cevap yoktur. Seni en iyi yansıtan seçeneği işaretlemen yeterlidir.',
      color: '#06b6d4',
    },
    {
      icon: Shield,
      title: 'Gizlilik',
      text: 'Cevapların sadece anlık analiz için kullanılır, hiçbir şekilde saklanmaz veya paylaşılmaz.',
      color: '#10b981',
    },
  ]

  return (
    <div className="kt-page">
      {modalAlan && (
        <AlanModal
          alan={modalAlan}
          onClose={() => setModalAlan(null)}
          onStart={() => navigate('/it-kariyer-testi/quiz')}
        />
      )}

      <div style={{ maxWidth: 960, width: '100%' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 48px rgba(99,102,241,0.4)',
          }}>
            <Target size={32} color="white" strokeWidth={2.2} />
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
            color: d ? '#f8fafc' : '#0f172a', marginBottom: '0.75rem', lineHeight: 1.2,
          }}>
            Hangi IT Alanına Uygunsun?
          </h1>

          <p style={{ color: d ? '#94a3b8' : '#475569', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
            20 soru · yaklaşık 5 dakika · tamamen kişisel
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: d ? '#64748b' : '#94a3b8', fontSize: '0.875rem' }}>
            <Lock size={12} /> Veriler kaydedilmez.
          </div>
        </div>

        {/* Info cards */}
        <div className="kt-grid-3" style={{ marginBottom: '1.25rem' }}>
          {infoCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className="kt-card" style={{ padding: '20px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: `${card.color}15`, marginBottom: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={22} color={card.color} strokeWidth={1.8} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: d ? '#f1f5f9' : '#0f172a', marginBottom: '6px' }}>
                  {card.title}
                </p>
                <p style={{ fontSize: '12.5px', color: d ? '#94a3b8' : '#64748b', lineHeight: 1.65, margin: 0 }}>
                  {card.text}
                </p>
              </div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="kt-grid-2" style={{ marginBottom: '2rem' }}>
          {[
            { icon: '⏱', label: 'Ortalama tamamlama süresi', value: '4 dk 32 sn' },
            { icon: '👥', label: 'test sonucunu faydalı buldu.', value: "Kullanıcıların %92'si" },
          ].map((stat, i) => (
            <div key={i} className="kt-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{stat.icon}</span>
              <div>
                {i === 0 && (
                  <>
                    <p style={{ fontSize: '11.5px', color: d ? '#64748b' : '#94a3b8', margin: '0 0 2px' }}>{stat.label}</p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: d ? '#f1f5f9' : '#0f172a', margin: 0 }}>{stat.value}</p>
                  </>
                )}
                {i === 1 && (
                  <>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: d ? '#f1f5f9' : '#0f172a', margin: '0 0 2px' }}>{stat.value}</p>
                    <p style={{ fontSize: '11.5px', color: d ? '#64748b' : '#94a3b8', margin: 0 }}>{stat.label}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Area cards grid */}
        <div className="kt-grid-4" style={{ marginBottom: '2.5rem' }}>
          {IT_ALANLARI.map(alan => {
            const IconComp = IKON_MAP[alan.ikon]
            return (
              <div key={alan.id} className="kt-area-card">
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: `${alan.renk}18`, marginBottom: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {IconComp && <IconComp size={22} color={alan.renk} strokeWidth={1.8} />}
                </div>
                <p style={{ fontSize: '13.5px', fontWeight: 700, color: d ? '#f1f5f9' : '#0f172a', marginBottom: '4px', lineHeight: 1.3 }}>
                  {alan.ad}
                </p>
                <p style={{ fontSize: '11.5px', color: d ? '#94a3b8' : '#64748b', lineHeight: 1.55, margin: 0 }}>
                  {alan.aciklama}
                </p>
                <button className="kt-info-btn" onClick={() => setModalAlan(alan)}>
                  i
                </button>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/it-kariyer-testi/quiz')}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', borderRadius: '16px',
              padding: '18px 52px', fontSize: '1.1rem', fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 28px rgba(99,102,241,0.38)',
              transition: 'opacity 0.2s, transform 0.2s', display: 'inline-block', marginBottom: '14px',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            🚀 Teste Başla →
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: d ? '#475569' : '#94a3b8', fontSize: '12px' }}>
            <Lock size={11} /> Cevaplarınız sadece anlık analiz için kullanılır ve hiçbir şekilde kaydedilmez.
          </div>
        </div>

      </div>
    </div>
  )
}
