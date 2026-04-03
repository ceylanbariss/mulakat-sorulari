import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { OptimizedCvData, CvOptimizeRequest } from '../src/types/cv.js'
import { CV_SYSTEM_PROMPT } from '../src/lib/cvPrompt.js'

export const maxDuration = 60

function cleanMarkdown(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.replace(/\*\*/g, '')
  if (Array.isArray(obj)) return obj.map(cleanMarkdown)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, cleanMarkdown(v)])
    )
  }
  return obj
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { cvText, jobDescription, language, parseOnly } = req.body as CvOptimizeRequest & { parseOnly?: boolean }
  if (!cvText || cvText.length < 20) {
    return res.status(400).json({ error: 'CV metni çok kısa.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY tanımlı değil.' })

  const langNote = language === 'tr'
    ? 'Tüm metin alanlarını TÜRKÇE yaz.'
    : 'Write ALL text fields in ENGLISH.'

  const PARSE_ONLY_PROMPT = `Sen bir CV ayrıştırma uzmanısın. Verilen CV metnini OLDUĞU GİBİ JSON formatına dönüştür. HİÇBİR İÇERİĞİ DEĞİŞTİRME, sadece yapılandır. Eksik alanları boş string veya boş dizi bırak. Sadece JSON döndür.

TEMEL ŞEMA: {"is_valid_cv":true,"name":"","title":"","location":"","phone":"","email":"","linkedin":"","summary_v1":"","summary_v3":"","experience":[{"id":"exp-0","role":"","company":"","date":"","bullets_v1":[],"bullets_v3":[],"bullets":[]}],"education":[{"id":"edu-0","degree":"","school":"","date":"","details":""}],"skills":[],"additional":[],"customLinks":[{"label":"","url":""}],"warnings":[],"analysis":{"scores":{"overall":0,"skills":0,"experience":0,"education":0},"matches":{"hard_skills":[],"soft_skills":[]},"gaps":[],"additions":[]}}

DİNAMİK BÖLÜMLER: CV'deki TÜM başlıkları tara. Şemada karşılığı olmayan başlıklar (Projeler, Sertifikalar, Aktiviteler, İlgi Alanları, Diller, Referanslar, Kurslar, Ödüller vb.) için: başlığı snake_case'e dönüştür (ş→s,ç→c,ö→o,ü→u,ğ→g,ı→i, boşluk→_, küçük harf) ve JSON kökünde string dizisi olarak ekle. Örnekler: "Projeler"→"projeler", "Sertifikalar"→"sertifikalar", "Aktiviteler / İlgi Alanları"→"aktiviteler". Karmaşık maddeler (proje başlığı+açıklama) için "BAŞLIK — açıklama" formatında tek string kullan. GitHub/portfolio URL'leri customLinks'e ekle.`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: parseOnly ? PARSE_ONLY_PROMPT : CV_SYSTEM_PROMPT,
    })

    const privacyReminder = jobDescription
      ? `\n\n🚫 HATIRLATMA: İlan veren şirketin adı, iç programları veya iç sistem adları CV'nin HİÇBİR ALANINDA geçmeyecek. Özet ve deneyim maddeleri evrensel, transferable bir dille yazılacak.`
      : ''

    const adaptationInstruction = jobDescription
      ? `\n\n🎯 UYARLAMA TALİMATI: ADAYIN GERÇEK BİLGİLERİ + İLANIN TERMİNOLOJİSİ = YENİ CV. Ne orijinal CV'yi kopyala ne de ilanı kopyala — ikisinin KESİŞİMİNİ bul. Adayın gerçek deneyimlerini ilanın perspektifinden yeniden anlat. Adayda direkt eşleşme yoksa ama yakın bir beceri varsa, potansiyeli ve hedefi vurgula. Bilgi UYDURMA ama bakış açısını DEĞİŞTİR.`
      : ''
    const userText = parseOnly
      ? `CV:\n${cvText.slice(0, 6000)}`
      : `${langNote}${privacyReminder}${adaptationInstruction}\n\nCV: ${cvText.slice(0, 8000)}\n\nİlan: ${(jobDescription || '').slice(0, 3000)}`
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: parseOnly ? 0.1 : 0.65,
        ...(parseOnly ? { responseMimeType: 'application/json' } : {}),
      },
    })

    let text = result.response.text()
    text = text.replace(/```json/g, '').replace(/```/g, '').trim()

    const parsed = JSON.parse(text) as { is_valid_cv?: boolean; error_message?: string } & OptimizedCvData

    if (parsed.is_valid_cv === false) {
      return res.status(400).json({ error: parsed.error_message })
    }

    if (Array.isArray(parsed.experience)) {
      parsed.experience = parsed.experience.map((e, i) => ({
        ...e,
        id: e.id || `exp-${i}-${Date.now()}`,
        bullets: e.bullets?.length ? e.bullets : (e.bullets_v1 ?? []),
      }))
    }
    if (Array.isArray(parsed.education)) {
      parsed.education = parsed.education.map((e, i) => ({
        ...e,
        id: e.id || `edu-${i}-${Date.now()}`,
      }))
    }

    const clean = cleanMarkdown(parsed) as OptimizedCvData
    return res.status(200).json(clean)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('CV optimize hatası:', msg)
    return res.status(500).json({ error: msg })
  }
}
