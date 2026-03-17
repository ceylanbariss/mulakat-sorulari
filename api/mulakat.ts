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

  const roleDescription: Record<InterviewType, string> = {
    ik: `Sen deneyimli bir İnsan Kaynakları uzmanısın. Adayın iletişim becerilerini, motivasyonunu, kültürel uyumunu ve davranışsal yetkinliklerini ölçüyorsun. İlk soruda kendini tanıtmasını iste, sonra deneyim, motivasyon ve değerlerine geç.`,
    teknik: `Sen deneyimli bir Teknik Takım Liderisisin. Adayın teknik derinliğini, problem çözme yaklaşımını ve gerçek proje deneyimlerini ölçüyorsun. CV'deki teknoloji ve projeleri referans al.`,
    'her-ikisi': `Sen hem İK hem de Teknik Takım Lideri rolündesin. Soru ${questionNumber} tek sayılıysa davranışsal (motivasyon, ekip, liderlik), çift sayılıysa teknik (kod, mimari, problem çözme) sor.`,
  }

  const closingHint = isLast
    ? '\n\nBu SON sorudur. Kapanış yap: adaya eklemek istediği bir şey olup olmadığını sor.'
    : ''

  return `${roleDescription[type]}${closingHint}

Aşağıdaki aday bilgilerini kullanarak mülakatı yürüt:
${context}

═══ ZORUNLU KURALLAR ═══

1. CEVABI GERÇEKTEN OKU: Adayın son cevabında geçen spesifik bir kelime, proje adı,
   teknoloji veya durumu mutlaka referans al. Genel sorular sorma.
   YANLIŞ: "Bir zorlukla karşılaştığınızda ne yaparsınız?"
   DOĞRU: "Az önce bahsettiğiniz [X projesi/durumu] sürecinde ekiple nasıl koordine oldunuz?"

2. KISA/YÜZEYSEL CEVAP (50 kelimeden az veya "bilmiyorum", "iyi", "kendimce"):
   Yeni soruya GEÇME. CV'den somut bir detay göstererek derinleştir.
   Örnek: "Bunu biraz açar mısınız? CV'nizde [X] yazmış, o deneyimden bahseder misiniz?"
   → isFollowUp: true

3. YETERLİ CEVAP (detaylı, somut, konuyla ilgili):
   Cevaptaki en ilginç 1 noktayı kısa acknowledge et (max 1 cümle), ardından o
   noktayı derinleştiren veya farklı bir açıdan ilerleyen yeni soru sor.
   → isFollowUp: false

4. TEKRARİ OLMA: Her soru farklı bir yetkinlik/deneyim alanını açmalı.
   Daha önce sorulan konuları tekrarlama.

5. DOĞAL TON: Robotik değil, gerçek bir mülakat havası yarat. Gerektiğinde
   adayın adını (CV'den al) ara ara kullan.

6. SORU SAYACI: isFollowUp: false olduğunda sayaç ilerler (şu an: ${questionNumber}/${MAX_QUESTIONS}).

ÇIKTI FORMATI — SADECE bu JSON'u döndür, başka hiçbir şey yazma:
{"question": "Yanıt metni burada", "isLastQuestion": false, "isFollowUp": false}`
}

async function callGemini(
  req: MulakatRequest,
  _retryCount = 0
): Promise<{ question: string; isLastQuestion: boolean; isFollowUp: boolean }> {
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
    model: 'gemini-2.5-flash-lite',
    systemInstruction,
  })

  const result = await model.generateContent({
    contents,
    generationConfig: {
      maxOutputTokens: 800,
      temperature: 0.8,
    },
  })

  const text = result.response.text()
  // Markdown code fences temizle
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let question = ''
  let isLastQuestion = req.questionNumber >= MAX_QUESTIONS
  let isFollowUp = false

  try {
    const parsed = JSON.parse(clean)
    question = parsed.question ?? clean
    isLastQuestion = isLastQuestion || Boolean(parsed.isLastQuestion)
    // İlk soruda (action=start) veya son soruda follow-up olmaz
    isFollowUp = req.action === 'answer' && !isLastQuestion && Boolean(parsed.isFollowUp)
  } catch {
    question = clean
  }

  if (!question) throw new Error('Boş yanıt alındı')

  return { question, isLastQuestion, isFollowUp }
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
      console.error('Gemini API hatası:', error?.message ?? err)
      return res.status(500).json({ error: 'AI servisi geçici olarak kullanılamıyor. Lütfen tekrar deneyin.' })
    }
  }
}
