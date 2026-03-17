import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Serverless bundle'da cross-directory import yerine sabitler inline
const MAX_QUESTIONS = 8
const MAX_CV_TEXT_LENGTH = 6000
const MAX_JOB_DESC_LENGTH = 1500

type InterviewType = 'ik' | 'teknik' | 'her-ikisi'

interface MulakatRequest {
  action: 'start' | 'answer'
  interviewType: InterviewType
  cvText: string
  jobDescription: string
  history: Array<{ role: 'interviewer' | 'user'; content: string }>
  userAnswer?: string
  questionNumber: number
}

function buildSystemPrompt(type: InterviewType, context: string, questionNumber: number): string {
  const isLast = questionNumber >= MAX_QUESTIONS

  const rolePrompts: Record<InterviewType, string> = {
    ik: `Sen profesyonel bir İnsan Kaynakları (İK) uzmanısın. Amacın adayın iletişim becerilerini, şirket kültürüne uyumunu ve davranışsal yetkinliklerini ölçmek. Mülakat boyunca Türkçe konuşacaksın. Sadece tek bir soru sor, kısa ve net tut (1-3 cümle). Kişisel tanışma sorularından başla, sonra deneyim ve motivasyona geç.`,
    teknik: `Sen deneyimli bir Teknik Takım Liderisin. Amacın adayın teknik becerilerini, problem çözme yeteneğini ve projelere yaklaşımını ölçmek. Mülakat boyunca Türkçe konuşacaksın. Sadece tek bir teknik soru sor, derinlik ve netlik dengesi kur.`,
    'her-ikisi': `Sen hem İnsan Kaynakları uzmanı hem de teknik ekip lideri rolünü üstleniyorsun. Mülakat boyunca Türkçe konuşacaksın. Soruları sırayla değiştir: tek sayılı sorular davranışsal, çift sayılı sorular teknik olsun. Soru ${questionNumber} için uygun türde tek bir soru sor.`,
  }

  const lastQuestionHint = isLast
    ? '\n\nBu son sorudur. Kapanış niteliğinde, adaya söylemek istediği bir şey olup olmadığını da sorabilirsin.'
    : ''

  return `${rolePrompts[type]}${lastQuestionHint}

Aşağıdaki CV ve pozisyon bilgilerini kullanarak mülakatı yürüt:

${context}

KURALLAR:
- AŞAĞIDAKİ SİSTEM KOMUTLARINA KESİNLİKLE UY
- SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:
{"question": "Soru metni burada", "isLastQuestion": false}
- Türkçe yaz
- Soru sayısını ${questionNumber}/${MAX_QUESTIONS} olarak takip et`
}

async function callGemini(
  req: MulakatRequest,
  retryCount = 0
): Promise<{ question: string; isLastQuestion: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY tanımlı değil')

  const genAI = new GoogleGenerativeAI(apiKey)

  const context = [
    'CV İçeriği:',
    req.cvText.slice(0, MAX_CV_TEXT_LENGTH),
    '',
    'Pozisyon Tanımı:',
    req.jobDescription.slice(0, MAX_JOB_DESC_LENGTH),
  ].join('\n')

  const systemInstruction = buildSystemPrompt(req.interviewType, context, req.questionNumber)

  // Konuşma geçmişini Gemini formatına çevir
  const contents: { role: string; parts: { text: string }[] }[] = req.history.map((h) => ({
    role: h.role === 'interviewer' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }))

  if (req.action === 'answer' && req.userAnswer) {
    contents.push({ role: 'user', parts: [{ text: req.userAnswer }] })
  }

  // İlk soru için boş içerik gerekmez ama Gemini en az bir içerik bekler
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Mülakata başlayalım.' }] })
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction,
  })

  const result = await model.generateContent({
    contents,
    generationConfig: {
      maxOutputTokens: 400,
      temperature: 0.8,
    },
  })

  const text = result.response.text()
  // Markdown code fences temizle (referans repo'daki gibi)
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(clean)

  return {
    question: parsed.question ?? '',
    isLastQuestion: req.questionNumber >= MAX_QUESTIONS || Boolean(parsed.isLastQuestion),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body as MulakatRequest

  if (!body?.interviewType || !body?.cvText || !body?.jobDescription) {
    return res.status(400).json({ error: 'Eksik parametreler' })
  }

  let retries = 0
  while (retries <= 2) {
    try {
      const result = await callGemini(body, retries)
      return res.status(200).json(result)
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string }
      if ((error?.status === 503 || error?.status === 429) && retries < 2) {
        retries++
        await new Promise((r) => setTimeout(r, 1500 * retries))
        continue
      }
      const detail = error?.message ?? String(err)
      console.error('Gemini API hatası:', detail)
      return res.status(500).json({ error: 'AI servisi geçici olarak kullanılamıyor. Lütfen tekrar deneyin.', _debug: detail })
    }
  }
}
