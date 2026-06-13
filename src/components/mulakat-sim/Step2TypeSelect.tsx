import { Users, Code2, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMulakatStore, type InterviewType, type InterviewLanguage } from '../../store/useMulakatStore'
import { INTERVIEW_TYPE_LABELS, INTERVIEW_TYPE_DESCRIPTIONS } from '../../config/mulakatConfig'

interface Props {
  d: boolean
  onStart: () => void
}

const types: { key: InterviewType; icon: typeof Users; color: string; bg: string }[] = [
  { key: 'ik', icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'teknik', icon: Code2, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'her-ikisi', icon: Layers, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
]

const LANGUAGES: { key: InterviewLanguage; flag: string; label: string; sub: string }[] = [
  { key: 'tr', flag: '🇹🇷', label: 'Türkçe', sub: 'Mülakat Türkçe yürütülür' },
  { key: 'en', flag: '🇬🇧', label: 'English', sub: 'Interview conducted in English + language score' },
]

export function Step2TypeSelect({ d, onStart }: Props) {
  const { interviewType, setInterviewType, interviewLanguage, setInterviewLanguage } = useMulakatStore()

  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
  const canStart = !!interviewType && !!interviewLanguage

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>

      {/* ── Dil Seçimi ── */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: d ? 'rgba(148,163,184,0.55)' : 'rgba(100,116,139,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Mülakat Dili
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {LANGUAGES.map(({ key, flag, label, sub }, i) => {
            const selected = interviewLanguage === key
            const color = key === 'en' ? '#3b82f6' : '#8b5cf6'
            const bg = key === 'en' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)'
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setInterviewLanguage(key)}
                style={{
                  padding: '16px 18px',
                  borderRadius: '16px',
                  border: selected ? `2px solid ${color}` : cardBorder,
                  background: selected ? bg : d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: selected ? `0 0 0 4px ${color}20` : '0 2px 12px rgba(0,0,0,0.05)',
                  transform: selected ? 'scale(1.02)' : 'scale(1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{flag}</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: selected ? color : d ? 'white' : '#0f172a' }}>
                    {label}
                    {selected && <span style={{ marginLeft: '6px', fontSize: '12px' }}>✓</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: d ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.7)', marginTop: '2px', lineHeight: 1.4 }}>
                    {sub}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Mülakat Türü ── */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: d ? 'rgba(148,163,184,0.55)' : 'rgba(100,116,139,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Mülakat Türü
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {types.map(({ key, icon: Icon, color, bg }, i) => {
            const selected = interviewType === key
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.07 }}
                onClick={() => setInterviewType(key)}
                style={{
                  padding: '22px 18px',
                  borderRadius: '18px',
                  border: selected ? `2px solid ${color}` : cardBorder,
                  background: selected ? bg : d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  boxShadow: selected ? `0 0 0 4px ${color}20` : '0 4px 24px rgba(0,0,0,0.06)',
                  transform: selected ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: d ? 'white' : '#0f172a', marginBottom: '6px' }}>
                  {INTERVIEW_TYPE_LABELS[key]}
                </h3>
                <p style={{ fontSize: '12px', color: d ? 'rgba(148,163,184,0.65)' : 'rgba(71,85,105,0.75)', lineHeight: 1.55 }}>
                  {INTERVIEW_TYPE_DESCRIPTIONS[key]}
                </p>
                {selected && (
                  <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 700, color }}>
                    ✓ Seçildi
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button
          onClick={() => useMulakatStore.getState().goToStep(1)}
          style={{
            padding: '14px 24px',
            borderRadius: '14px',
            border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            background: 'transparent',
            color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.7)',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Geri
        </button>
        <button
          onClick={onStart}
          disabled={!canStart}
          className={canStart ? 'btn-gradient-bg' : ''}
          style={{
            padding: '14px 32px',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 700,
            border: 'none',
            cursor: canStart ? 'pointer' : 'not-allowed',
            background: canStart ? undefined : d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            color: canStart ? undefined : d ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.5)',
            boxShadow: canStart ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          Mülakata Başla 🚀
        </button>
      </div>
    </div>
  )
}
