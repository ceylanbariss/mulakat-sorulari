import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Send, StopCircle, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useMulakatStore } from '../../store/useMulakatStore'
import { MAX_QUESTIONS, INTERVIEW_TYPE_LABELS } from '../../config/mulakatConfig'
import { ChatMessage } from './ChatMessage'
import { FinishModal } from './FinishModal'
import { AnalysisReport } from './AnalysisReport'
// import { saveMulakatSession } from '../../lib/firestore' // GEÇİCİ: Firestore kayıt devre dışı

interface Props {
  d: boolean
  userId: string
  onFinished: (saved?: boolean) => void
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
    // cvFileName, // GEÇİCİ: Firestore kayıt devre dışı
    addMessage,
    setCurrentAnswer,
    setLoading,
    setFinished,
    incrementQuestion,
    resetSession,
  } = useMulakatStore()

  const [showFinishModal, setShowFinishModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isTerminated, setIsTerminated] = useState(false)
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentTaskType, setCurrentTaskType] = useState<'normal' | 'code' | 'sql' | 'algorithm'>('normal')
  const [codeAnswer, setCodeAnswer] = useState('')
  const [codeExplanation, setCodeExplanation] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'

  // İlk soruyu al (component mount'ta)
  useEffect(() => {
    if (messages.length === 0) {
      fetchNextQuestion()
    }
  }, [])

  // Yeni mesajda chat container'ı alta kaydır (sayfayı değil)
  useEffect(() => {
    const el = chatContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isLoading])

  // Mülakat bitince analiz başlat
  useEffect(() => {
    if (isFinished) {
      runAnalysis()
    }
  }, [isFinished])

  async function runAnalysis() {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/mulakat-analiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          interviewType,
          cvText,
          jobDescription,
        }),
      })
      if (!res.ok) throw new Error('Analiz alınamadı')
      const data = await res.json()
      setAnalysisData(data)
    } catch {
      toast.error('Analiz yapılamadı. Sonuç kaydedilebilir.')
      setShowFinishModal(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

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

      const data: { question: string; isLastQuestion: boolean; isFollowUp: boolean; taskType?: 'normal' | 'code' | 'sql' | 'algorithm'; terminated?: boolean } = await res.json()

      addMessage({ role: 'interviewer', content: data.question })
      setCurrentTaskType(data.taskType ?? 'normal')

      if (data.terminated) {
        setIsTerminated(true)
        try {
          // GEÇİCİ: Firestore kayıt devre dışı — geri almak için bu yorumu kaldır
          // await saveMulakatSession({ userId, interviewType: ..., terminated: true, ... })
          void userId // kullanılmayan değişken uyarısını önle
        } catch { /* sessiz hata */ }
        return
      }

      if (!data.isFollowUp) incrementQuestion()
      if (data.isLastQuestion) setFinished(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bir hata oluştu'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendAnswer() {
    let answer: string
    if (currentTaskType !== 'normal') {
      const code = codeAnswer.trim()
      if (!code || isLoading) return
      answer = codeExplanation.trim()
        ? `KOD:\n${code}\n\nACIKLAMA:\n${codeExplanation.trim()}`
        : `KOD:\n${code}`
      setCodeAnswer('')
      setCodeExplanation('')
    } else {
      answer = currentAnswer.trim()
      if (!answer || isLoading) return
      setCurrentAnswer('')
    }
    setCurrentTaskType('normal')
    addMessage({ role: 'user', content: answer })
    await fetchNextQuestion(answer)
  }

  function handleCodeTabKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const t = e.target as HTMLTextAreaElement
      const s = t.selectionStart
      const newVal = codeAnswer.substring(0, s) + '  ' + codeAnswer.substring(t.selectionEnd)
      setCodeAnswer(newVal)
      setTimeout(() => { t.selectionStart = t.selectionEnd = s + 2 }, 0)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault()
      handleSendAnswer()
    }
    // Ctrl+Enter veya Shift+Enter → alt satır (default davranış)
  }

  async function handleSaveWithAnalysis() {
    setSaving(true)
    try {
      // GEÇİCİ: Firestore kayıt devre dışı — geri almak için bu yorumu kaldır
      // const lastQuestion = messages.filter((m) => m.role === 'interviewer').slice(-1)[0]?.content ?? ''
      // await saveMulakatSession({ userId, ..., analysis: analysisData ?? undefined })
      // toast.success('Mülakat geçmişe kaydedildi!')
      resetSession()
      onFinished(false)
    } catch {
      toast.error('Kaydetme sırasında bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveSession() {
    setSaving(true)
    try {
      // GEÇİCİ: Firestore kayıt devre dışı — geri almak için bu yorumu kaldır
      // const lastQuestion = messages.filter((m) => m.role === 'interviewer').slice(-1)[0]?.content ?? ''
      // await saveMulakatSession({ userId, ..., messages: [...] })
      // toast.success('Mülakat geçmişe kaydedildi!')
      setShowFinishModal(false)
      resetSession()
      onFinished(true)
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

  // Analysis screen — portal kullanarak Framer Motion transform context'inden çık
  if (analysisData) {
    return createPortal(
      <AnalysisReport
        analysis={analysisData as unknown as Parameters<typeof AnalysisReport>[0]['analysis']}
        d={d}
        saving={saving}
        onSave={handleSaveWithAnalysis}
        onExit={() => { resetSession(); onFinished() }}
      />,
      document.body
    )
  }

  // Analyzing overlay
  if (isAnalyzing) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '80px 20px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          border: '4px solid rgba(99,102,241,0.15)',
          borderTopColor: '#6366f1',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px',
        }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: d ? 'rgba(226,232,240,0.85)' : '#334155' }}>
          Mülakat analiz ediliyor…
        </p>
        <p style={{ fontSize: 13, color: d ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.7)', marginTop: 6 }}>
          AI performansınızı değerlendiriyor
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Başlık çubuğu */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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
        ref={chatContainerRef}
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: '20px',
          padding: '16px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          marginBottom: '12px',
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

      </div>

      {/* Cevap Girişi */}
      {!isFinished && !isTerminated && (
        currentTaskType !== 'normal' ? (
          <div>
            {/* Görev badge */}
            <div style={{ marginBottom: '8px' }}>
              <span style={{
                padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                background: currentTaskType === 'sql' ? 'rgba(59,130,246,0.15)' : currentTaskType === 'algorithm' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                color: currentTaskType === 'sql' ? '#60a5fa' : currentTaskType === 'algorithm' ? '#fbbf24' : '#34d399',
              }}>
                {currentTaskType === 'sql' ? '💾 SQL Görevi' : currentTaskType === 'algorithm' ? '⚡ Algoritma Görevi' : '💻 Kod Görevi'}
              </span>
            </div>
            {/* Kod editörü */}
            <textarea
              value={codeAnswer}
              onChange={(e) => setCodeAnswer(e.target.value)}
              onKeyDown={handleCodeTabKey}
              placeholder={
                currentTaskType === 'sql'
                  ? 'SELECT * FROM ...'
                  : currentTaskType === 'algorithm'
                  ? 'function solution(input) {\n  // kodunuzu yazın\n}'
                  : '// Kodunuzu buraya yazın'
              }
              disabled={isLoading}
              style={{
                width: '100%', boxSizing: 'border-box',
                minHeight: '160px', resize: 'vertical',
                background: '#0d1117', color: '#e6edf3',
                border: '1px solid #30363d', borderRadius: '10px',
                padding: '12px 14px', fontSize: '13px',
                fontFamily: '"JetBrains Mono", "Courier New", monospace',
                lineHeight: 1.6, outline: 'none',
                marginBottom: '8px', opacity: isLoading ? 0.5 : 1,
              }}
            />
            {/* Açıklama + gönder */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea
                value={codeExplanation}
                onChange={(e) => setCodeExplanation(e.target.value)}
                placeholder="Yaklaşımınızı kısaca açıklayın (opsiyonel)"
                rows={2}
                disabled={isLoading}
                style={{
                  flex: 1, background: 'transparent', border: cardBorder, borderRadius: '10px',
                  padding: '8px 12px', fontSize: '13px',
                  color: d ? 'rgba(226,232,240,0.9)' : '#0f172a',
                  fontFamily: 'inherit', resize: 'none', outline: 'none',
                  opacity: isLoading ? 0.5 : 1,
                }}
              />
              <button
                onClick={handleSendAnswer}
                disabled={!codeAnswer.trim() || isLoading}
                style={{
                  width: '40px', height: '40px', borderRadius: '12px', border: 'none', flexShrink: 0,
                  background: codeAnswer.trim() && !isLoading ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  cursor: codeAnswer.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: codeAnswer.trim() && !isLoading ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                }}
              >
                <Send size={16} style={{ color: codeAnswer.trim() && !isLoading ? '#fff' : d ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.4)' }} />
              </button>
            </div>
          </div>
        ) : (
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
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cevabınızı yazın… (Enter ile gönderin, Ctrl+Enter alt satır)"
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
        )
      )}

      {isTerminated && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          padding: '20px', borderRadius: '14px', textAlign: 'center',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <ShieldAlert size={28} color="#f87171" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#f87171' }}>
            Mülakat Sonlandırıldı
          </span>
          <span style={{ fontSize: '13px', color: d ? 'rgba(148,163,184,0.7)' : 'rgba(100,116,139,0.7)' }}>
            Uygunsuz içerik nedeniyle mülakat sona erdirildi.
          </span>
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
