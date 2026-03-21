import { Users, Code2, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMulakatStore, type InterviewType } from '../../store/useMulakatStore'
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

export function Step2TypeSelect({ d, onStart }: Props) {
  const { interviewType, setInterviewType } = useMulakatStore()

  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <p style={{ textAlign: 'center', fontSize: '15px', color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.75)', marginBottom: '32px', lineHeight: 1.7 }}>
        Hangi tür mülakat yapmak istiyorsunuz? CV'niz ve iş ilanına göre yapay zeka sorularını hazırlayacak.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {types.map(({ key, icon: Icon, color, bg }, i) => {
          const selected = interviewType === key
          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setInterviewType(key)}
              style={{
                padding: '28px 20px',
                borderRadius: '20px',
                border: selected ? `2px solid ${color}` : cardBorder,
                background: selected
                  ? bg
                  : d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: selected ? `0 0 0 4px ${color}20` : '0 4px 24px rgba(0,0,0,0.06)',
                transform: selected ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon size={24} style={{ color }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: d ? 'white' : '#0f172a', marginBottom: '8px' }}>
                {INTERVIEW_TYPE_LABELS[key]}
              </h3>
              <p style={{ fontSize: '13px', color: d ? 'rgba(148,163,184,0.65)' : 'rgba(71,85,105,0.75)', lineHeight: 1.55 }}>
                {INTERVIEW_TYPE_DESCRIPTIONS[key]}
              </p>
              {selected && (
                <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color }}>
                  ✓ Seçildi
                </div>
              )}
            </motion.button>
          )
        })}
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
          disabled={!interviewType}
          className={interviewType ? 'btn-gradient-bg' : ''}
          style={{
            padding: '14px 32px',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 700,
            border: 'none',
            cursor: interviewType ? 'pointer' : 'not-allowed',
            background: interviewType ? undefined : d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            color: interviewType ? undefined : d ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.5)',
            boxShadow: interviewType ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          Mülakata Başla 🚀
        </button>
      </div>
    </div>
  )
}
