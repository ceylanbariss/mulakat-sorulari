import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface AnalysisRequest {
  messages: Array<{ role: string; content: string }>
  interviewType: string
  cvText: string
  jobDescription: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, interviewType, cvText, jobDescription } = req.body as AnalysisRequest

  if (!messages || messages.length < 2) {
    return res.status(400).json({ error: 'Analiz için yeterli konuşma verisi yok' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY tanımlı değil' })

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const typeLabel =
    interviewType === 'ik'
      ? 'İnsan Kaynakları'
      : interviewType === 'teknik'
        ? 'Teknik'
        : 'Karma (İK + Teknik)'

  const conversationText = messages
    .map((m) => `${m.role === 'interviewer' ? 'Mülakat Yapan' : 'Aday'}: ${m.content}`)
    .join('\n\n')

  const prompt = `Sen deneyimli bir İK uzmanı ve kariyer koçusun. Aşağıdaki iş mülakatı konuşmasını derinlemesine analiz et.

Mülakat Türü: ${typeLabel}

CV Özeti (ilk 2000 karakter):
${cvText.slice(0, 2000)}

Pozisyon Tanımı:
${jobDescription.slice(0, 800)}

Konuşma Geçmişi:
${conversationText}

---

SADECE aşağıdaki JSON formatında yanıt ver. Başka hiçbir şey yazma, hesaplama metni yazma.
Sayısal değerleri hesaplarken: her kullanıcı cevabını 1-10 arasında puanla ("bilmiyorum"/boş=1-3, tek cümle=4-5, yüzeysel=5-6, detaylı=7-8, somut örnek+detay=9-10), ortalamayı al, 10 ile çarp → genelPuan. Kod/SQL doğruysa +10, yanlışsa -10 bonus. Aşağıdaki sayısal değerler yalnızca FORMAT örneğidir:

{
  "genelPuan": 0,
  "ozet": "2-3 cümle genel değerlendirme. Adayın mülakattaki genel performansını özetle.",
  "gucluYonler": [
    { "baslik": "Kısa başlık", "aciklama": "1-2 cümle açıklama" },
    { "baslik": "Kısa başlık", "aciklama": "1-2 cümle açıklama" }
  ],
  "gelisimAlanlari": [
    { "baslik": "Kısa başlık", "aciklama": "1-2 cümle açıklama ve öneri", "oncelik": "yüksek" },
    { "baslik": "Kısa başlık", "aciklama": "1-2 cümle açıklama ve öneri", "oncelik": "orta" }
  ],
  "kendiniIfadeEtme": { "puan": 0, "yorum": "1 cümle" },
  "teknikYetkinlik": { "puan": 0, "yorum": "1 cümle" },
  "eleyebilecekNoktalar": ["Kısa madde 1", "Kısa madde 2"],
  "avantajliNoktalar": ["Kısa madde 1", "Kısa madde 2"],
  "tavsiye": "En kritik ve uygulanabilir tek cümle öneri."
}

Kurallar:
- genelPuan: yukarıdaki formülle hesapla, 5'e yuvarlama, tam sayı ver. Kısa cevap ağırlıklıysa 20-45, karışıksa 45-70, detaylı/doğruysa 70-95 beklenir.
- genelPuan: 0-100, gerçekçi ve spesifik
- gucluYonler: 2-4 madde
- gelisimAlanlari: 2-4 madde, oncelik değerleri yalnızca "yüksek", "orta" veya "düşük" olabilir
- eleyebilecekNoktalar: 1-3 gerçek kırmızı bayrak (varsa)
- avantajliNoktalar: 1-3 gerçek avantaj
- Sadece verilen konuşmaya dayandır, tahmin yapma`

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1200, temperature: 0.9 },
    })
    const text = result.response.text()
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    // JSON'dan önce hesaplama metni yazılmış olabilir, ilk { ... } bloğunu çıkar
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON bulunamadı')
    const analysis = JSON.parse(jsonMatch[0])
    return res.status(200).json(analysis)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Analiz hatası:', msg)
    return res.status(500).json({ error: 'Analiz yapılamadı. Lütfen tekrar deneyin.' })
  }
}
