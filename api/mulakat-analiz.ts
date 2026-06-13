import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface AnalysisRequest {
  messages: Array<{ role: string; content: string }>
  interviewType: string
  interviewLanguage?: 'tr' | 'en'
  cvText: string
  jobDescription: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, interviewType, interviewLanguage, cvText, jobDescription } = req.body as AnalysisRequest

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

  const isEnglish = interviewLanguage === 'en'

  const englishProficiencySchema = isEnglish ? `,
  "ingilizceYetkinligi": {
    "puan": 0,
    "dilbilgisi": 0,
    "kelimeBilgisi": 0,
    "akicilik": 0,
    "yorum": "1-2 sentence overall English proficiency comment"
  }` : ''

  const englishProficiencyRules = isEnglish ? `
- ingilizceYetkinligi: Evaluate the CANDIDATE's English proficiency based solely on their answers (not the interviewer's questions):
  - puan: Overall English score 1-10 (1=very poor, 5=communicates but makes frequent errors, 8=fluent with minor errors, 10=native-level)
  - dilbilgisi: Grammar & syntax correctness 1-10
  - kelimeBilgisi: Vocabulary range and appropriateness 1-10
  - akicilik: Fluency, sentence structure, and naturalness 1-10
  - yorum: A concise honest assessment of their English (1-2 sentences, in Turkish)
  Note: If the candidate answered in Turkish despite the English interview, score 1-2 and note this in yorum.` : ''

  const prompt = `Sen deneyimli bir İK uzmanı ve kariyer koçusun. Aşağıdaki iş mülakatı konuşmasını derinlemesine analiz et ve CV'yi iş ilanına göre değerlendir.

Mülakat Türü: ${typeLabel}
Mülakat Dili: ${isEnglish ? 'İngilizce' : 'Türkçe'}

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
  "tavsiye": "En kritik ve uygulanabilir tek cümle öneri.",
  "cvAnaliz": {
    "pozisyonUyumPuani": 0,
    "eksikAnahtarKelimeler": ["İlan'da geçen ama CV'de olmayan keyword 1", "keyword 2"],
    "gelistirilmesiGerekenBolumler": [
      { "bolum": "CV'deki bölüm/proje adı", "oneri": "Ne eklenmeli veya nasıl güçlendirilmeli — somut, 1-2 cümle" }
    ],
    "gucluUyumlar": ["CV'deki güçlü eşleşme 1", "güçlü eşleşme 2"],
    "atsDetay": {
      "beceriPuani": 0,
      "deneyimPuani": 0,
      "egitimPuani": 0,
      "eslesenTeknikBeceriler": ["keyword 1", "keyword 2"],
      "eslesenYumusakBeceriler": ["beceri 1", "beceri 2"],
      "stratejikBeklenenKelimeler": ["kelime 1", "kelime 2"]
    }
  }${englishProficiencySchema}
}

Kurallar:
- genelPuan: yukarıdaki formülle hesapla, 5'e yuvarlama, tam sayı ver. Kısa cevap ağırlıklıysa 20-45, karışıksa 45-70, detaylı/doğruysa 70-95 beklenir.
- genelPuan: 0-100, gerçekçi ve spesifik
- gucluYonler: 2-4 madde
- gelisimAlanlari: 2-4 madde, oncelik değerleri yalnızca "yüksek", "orta" veya "düşük" olabilir
- eleyebilecekNoktalar: 1-3 gerçek kırmızı bayrak (varsa)
- avantajliNoktalar: 1-3 gerçek avantaj
- Sadece verilen konuşmaya dayandır, tahmin yapma
- cvAnaliz.pozisyonUyumPuani: CV'nin ilan ile ne kadar örtüştüğünü 0-100 arası bir sayı ile ifade et
- cvAnaliz.eksikAnahtarKelimeler: İlanda geçen ancak CV'de hiç geçmeyen veya çok zayıf kalan teknik/yetkinlik kelimeleri listele (3-6 madde)
- cvAnaliz.gelistirilmesiGerekenBolumler: CV'de var olan ama yetersiz olan bölümlere somut düzeltme önerileri ver (2-4 madde)
- cvAnaliz.gucluUyumlar: CV'deki pozisyonla örtüşen güçlü noktaları listele (2-3 madde)
- cvAnaliz.atsDetay.beceriPuani: 0-100, CV'deki teknik becerilerin ilanla örtüşme oranı
- cvAnaliz.atsDetay.deneyimPuani: 0-100, deneyim yılı ve alan uyumu
- cvAnaliz.atsDetay.egitimPuani: 0-100, eğitim gereksinimiyle CV uyumu
- cvAnaliz.atsDetay.eslesenTeknikBeceriler: CV'de ve ilanda ortak geçen teknik beceriler (4-8 madde, kısa kelime/kelime öbekleri)
- cvAnaliz.atsDetay.eslesenYumusakBeceriler: Ortak yumuşak beceriler (3-6 madde)
- cvAnaliz.atsDetay.stratejikBeklenenKelimeler: İlanda önemli ancak CV'de zayıf/yok olan stratejik kelimeler (3-6 madde)${englishProficiencyRules}`

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1400, temperature: 0.9 },
    })
    const text = result.response.text()
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
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
