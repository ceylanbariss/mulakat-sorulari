import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useMulakatStore } from '../../store/useMulakatStore'
import { INTERVIEW_TYPE_LABELS } from '../../config/mulakatConfig'

interface Props {
  open: boolean
  onClose: () => void
  onSave: () => Promise<void>
  d: boolean
  saving: boolean
}

export function FinishModal({ open, onClose, onSave, d, saving }: Props) {
  const { interviewType, questionCount, messages } = useMulakatStore()

  const cardBg = d ? '#1e293b' : '#ffffff'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 200,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: cardBg,
            border: cardBorder,
            borderRadius: '24px',
            padding: '40px',
            width: '90vw',
            maxWidth: '440px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            zIndex: 201,
            textAlign: 'center',
          }}
        >
          <Dialog.Close asChild>
            <button
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: d ? 'rgba(148,163,184,0.7)' : 'rgba(100,116,139,0.7)',
              }}
            >
              <X size={16} />
            </button>
          </Dialog.Close>

          <div style={{ fontSize: '56px', marginBottom: '16px', lineHeight: 1 }}>🎉</div>
          <Dialog.Title
            style={{ fontSize: '22px', fontWeight: 800, color: d ? 'white' : '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}
          >
            Mülakat Tamamlandı!
          </Dialog.Title>
          <p style={{ fontSize: '14px', color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.75)', lineHeight: 1.65, marginBottom: '28px' }}>
            <strong style={{ color: d ? 'rgba(226,232,240,0.9)' : '#0f172a' }}>{INTERVIEW_TYPE_LABELS[interviewType ?? '']}</strong> mülakatını
            tamamladınız. {questionCount} soru yanıtladınız.
          </p>

          <div
            style={{
              background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '28px',
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1' }}>{questionCount}</p>
              <p style={{ fontSize: '11px', color: d ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.75)', fontWeight: 500 }}>Soru</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>{messages.length}</p>
              <p style={{ fontSize: '11px', color: d ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.75)', fontWeight: 500 }}>Mesaj</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={onSave}
              disabled={saving}
              className="btn-gradient-bg"
              style={{
                padding: '14px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
              }}
            >
              {saving ? 'Kaydediliyor…' : '💾 Geçmişe Kaydet'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '14px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: 600,
                border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                background: 'transparent',
                color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.7)',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              Kaydetmeden Çık
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
