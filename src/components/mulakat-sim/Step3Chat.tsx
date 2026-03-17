import { useEffect, useRef, useState } from 'react'
import { Send, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useMulakatStore } from '../../store/useMulakatStore'
import { MAX_QUESTIONS, INTERVIEW_TYPE_LABELS } from '../../config/mulakatConfig'
import { ChatMessage } from './ChatMessage'
import { FinishModal } from './FinishModal'
import { saveMulakatSession } from '../../lib/firestore'

interface Props {
  d: boolean
  userId: string
  onFinished: () => void
}

export function Step3Chat({ d, userId, onFinished }: Props) {
  const {
    messages,
    currentAnswer,
    isLoading,
    isFinished,
    questionCount,
    interviewType,
    cvText,
    jobDescription,
    cvFileName,
    addMessage,
    setCurrentAnswer,
    setLoading,
    setFinished,
    incrementQuestion,
    resetSession,
  } = useMulakatStore()

  const [showFinishModal, setShowFinishModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'

  // İlk soruyu al (component mount'ta)
  useEffect(() => {
    if (messages.length === 0) {
      fetchNextQuestion()
    }
  }, [])

  // Yeni mesajda en alta kaydır
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Mülakat bitince modal aç
  useEffect(() => {
    if (isFinished) setShowFinishModal(true)
  }, [isFinished])

  async function fetchNextQuestion(userAnswer?: string) {
    setLoading(true)
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const body = {
        action: userAnswer ? 'answer' : 'start',
        interviewType,
        cvText,
        jobDescription,
        history,
        userAnswer,
        questionNumber: questionCount + 1,
      }

      const res = await fetch('/api/mulakat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Sunucu hatası')
      }

      const data: { question: string; isLastQuestion: boolean } = await res.json()

      addMessage({ role: 'interviewer', content: data.question })
      incrementQuestion()

      if (data.isLastQuestion) {
        setFinished(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bir hata oluştu'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendAnswer() {
    const answer = currentAnswer.trim()
    if (!answer || isLoading) return

    addMessage({ role: 'user', content: answer })
    setCurrentAnswer('')
    await fetchNextQuestion(answer)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSendAnswer()
    }
  }

  async function handleSaveSession() {
    setSaving(true)
    try {
      const lastQuestion = messages.filter((m) => m.role === 'interviewer').slice(-1)[0]?.content ?? ''
      await saveMulakatSession({
        userId,
        interviewType: interviewType ?? 'ik',
        jobDescription: jobDescription.slice(0, 500),
        cvFileName,
        questionCount,
        summary: lastQuestion.slice(0, 200),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      })
      toast.success('Mülakat geçmişe kaydedildi!')
      setShowFinishModal(false)
      resetSession()
      onFinished()
    } catch {
      toast.error('Kaydetme sırasında bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  function handleExitWithoutSave() {
    setShowFinishModal(false)
    resetSession()
    onFinished()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Başlık çubuğu */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: 'rgba(99,102,241,0.15)',
            color: '#818cf8',
          }}>
            {INTERVIEW_TYPE_LABELS[interviewType ?? '']}
          </span>
          <span style={{ fontSize: '13px', color: d ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.75)', fontWeight: 500 }}>
            {questionCount} / {MAX_QUESTIONS} soru
          </span>
        </div>
        <button
          onClick={() => setShowFinishModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(239,68,68,0.3)',
            background: d ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
            color: '#f87171',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <StopCircle size={14} /> Mülakatı Bitir
        </button>
      </div>

      {/* Chat alanı */}
      <div
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: '20px',
          padding: '24px',
          minHeight: '400px',
          maxHeight: '50vh',
          overflowY: 'auto',
          marginBottom: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}
      >
        {messages.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: d ? 'rgba(100,116,139,0.5)' : 'rgba(100,116,139,0.6)', fontSize: '14px' }}>
            Mülakat hazırlanıyor…
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} d={d} />
        ))}

        {/* Yükleniyor - üç nokta animasyonu */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
              🎤
            </div>
            <div style={{
              padding: '12px 16px',
              borderRadius: '4px 18px 18px 18px',
              background: d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
            }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#6366f1',
                    opacity: 0.5,
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Cevap Girişi */}
      {!isFinished && (
        <div style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: '16px',
          padding: '12px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}>
          <textarea
            ref={textareaRef}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cevabınızı yazın… (Ctrl+Enter ile gönderin)"
            rows={2}
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '14px',
              lineHeight: 1.65,
              color: d ? 'rgba(226,232,240,0.9)' : '#0f172a',
              fontFamily: 'inherit',
              opacity: isLoading ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleSendAnswer}
            disabled={!currentAnswer.trim() || isLoading}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: 'none',
              background: currentAnswer.trim() && !isLoading
                ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                : d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              cursor: currentAnswer.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
              boxShadow: currentAnswer.trim() && !isLoading ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            <Send size={16} style={{ color: currentAnswer.trim() && !isLoading ? '#fff' : d ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.4)' }} />
          </button>
        </div>
      )}

      {isFinished && (
        <div style={{ textAlign: 'center', padding: '16px', fontSize: '14px', color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.7)' }}>
          Mülakat tamamlandı. Sonucu kaydetmek ister misiniz?
        </div>
      )}

      <FinishModal
        open={showFinishModal}
        onClose={handleExitWithoutSave}
        onSave={handleSaveSession}
        d={d}
        saving={saving}
      />
    </div>
  )
}
