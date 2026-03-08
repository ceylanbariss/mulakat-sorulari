import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { useQuestions } from '../hooks/useQuestions'
import { FlashCardMode } from '../components/training/FlashCard'
import { QuizMode } from '../components/training/QuizMode'
import { WrittenMode } from '../components/training/WrittenMode'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Button } from '../components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export function Training() {
  const { mode } = useParams<{ mode: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const kategori = searchParams.get('kategori') || ''

  const { questions, loading } = useQuestions(kategori)

  if (loading) return null // Veya loading spinner


  if (!questions.length) {
    return (
      <PageWrapper className="py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400 mb-4">Soru bulunamadı.</p>
        <Button variant="outline" onClick={() => navigate('/sorular')}>
          <ArrowLeft size={16} /> Geri Dön
        </Button>
      </PageWrapper>
    )
  }

  return (
    <div className="animate-fade-in">
      {mode === 'flashcard' && <FlashCardMode questions={questions} kategori={kategori} />}
      {mode === 'quiz' && <QuizMode questions={questions} kategori={kategori} />}
      {mode === 'written' && <WrittenMode questions={questions} kategori={kategori} />}
      {!['flashcard', 'quiz', 'written'].includes(mode || '') && (
        <PageWrapper className="py-16 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Geçersiz mod.</p>
          <Button variant="outline" onClick={() => navigate('/sorular')}>
            <ArrowLeft size={16} /> Geri Dön
          </Button>
        </PageWrapper>
      )}
    </div>
  )
}
