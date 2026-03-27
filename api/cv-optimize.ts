import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { CvOptimizeRequest, CvOptimizeResponse, CvData } from '../src/types/cv'

const MAX_CV_TEXT = 8000
const MAX_JD_TEXT = 2000

function buildSystemPrompt(hasJD: boolean, language: 'tr' | 'en'): string {
  const langRule = language === 'tr'
    ? 'Çıktıdaki TÜM metin alanları Türkçe olmalı (CV Türkçe ise).'
    : 'All text fields in the output must be in English (since the CV is in English).'

  const atsShape = hasJD ? `"atsAnalysis": {
    "genelSkor": number (0-100),
    "deneyimSkor": number (0-100),
    "egitimSkor": number (0-100),
    "beceriSkor": number (0-100),
    "eslesen": {
      "teknikBeceriler": string[],
      "yazilimlar": string[],
      "anahterKelimeler": string[]
    },
    "eksik": string[],
    "oneriler": string[]
  }` : '"atsAnalysis": null'

  return `Sen profesyonel bir CV yazım uzmanı ve İK danışmanısın.
Sana ham CV metni ${hasJD ? 've iş ilanı metni ' : ''}verilecek.
SADECE aşağıdaki JSON yapısını döndür — başka hiçbir şey yazma:

{
  "cvData": {
    "kisiselBilgiler": {
      "ad": string,
      "unvan": string,
      "email": string,
      "telefon": string,
      "konum": string,
      "linkedin": string,
      "github": string,
      "website": string,
      "ozet": string
    },
    "deneyim": [
      {
        "id": string,
        "sirket": string,
        "pozisyon": string,
        "baslangic": string,
        "bitis": string,
        "halen": boolean,
        "aciklama": string[]
      }
    ],
    "egitim": [
      {
        "id": string,
        "okul": string,
        "derece": string,
        "alan": string,
        "baslangic": string,
        "bitis": string,
        "gpa": string
      }
    ],
    "beceriler": {
      "teknik": string[],
      "diger": string[]
    },
    "diller": [
      { "id": string, "dil": string, "seviye": string }
    ],
    "sertifikalar": [
      { "id": string, "ad": string, "kurum": string, "tarih": string, "url": string }
    ]
  },
  ${atsShape}
}

KURALLAR:
1. CV'de bulunmayan bilgileri UYDURMA. Bilgi yoksa boş string veya boş dizi kullan.
2. Deneyim bullet'larını güçlü eylem fiilleriyle başlat; mümkünse sayısal sonuçlar ekle.
3. "ozet" alanını ATS uyumlu, anahtar kelime zengin şekilde yeniden yaz (3-4 cümle).
4. Beceriler listesini CV'den çıkar; ${hasJD ? 'iş ilanındaki eşleşenleri öne al.' : 'kategorize et.'}
5. ${langRule}
6. Tarih formatı tutarlı olsun (örn: "Ocak 2021" veya "2021-01").
7. Her dizi öğesi için "id" alanı üret (örn: "exp-1", "edu-1", "lang-1").${hasJD ? '\n8. ATS skorlarını gerçekçi hesapla; iş ilanı gereksinimleriyle CV içeriğini karşılaştır.' : ''}`
}

function normalizeCvData(raw: CvData): CvData {
  return {
    ...raw,
    kisiselBilgiler: {
      ad: '', unvan: '', email: '', telefon: '', konum: '',
      linkedin: '', github: '', website: '', ozet: '',
      ...raw.kisiselBilgiler,
    },
    deneyim: (raw.deneyim ?? []).map((e, i) => ({
      halen: false, aciklama: [],
      ...e,
      id: e.id || `exp-${i}`,
    })),
    egitim: (raw.egitim ?? []).map((e, i) => ({
      gpa: '',
      ...e,
      id: e.id || `edu-${i}`,
    })),
    beceriler: {
      teknik: raw.beceriler?.teknik ?? [],
      diger: raw.beceriler?.diger ?? [],
    },
    diller: (raw.diller ?? []).map((l, i) => ({ ...l, id: l.id || `lang-${i}` })),
    sertifikalar: (raw.sertifikalar ?? []).map((c, i) => ({ url: '', ...c, id: c.id || `cert-${i}` })),
  }
}

async function callGemini(body: CvOptimizeRequest, retry = 0): Promise<CvOptimizeResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY tanımlı değil')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: buildSystemPrompt(!!body.jobDescription, body.language),
  })

  const userContent = [
    '=== CV METNİ ===',
    body.cvText.slice(0, MAX_CV_TEXT),
    body.jobDescription ? `\n=== İŞ İLANI ===\n${body.jobDescription.slice(0, MAX_JD_TEXT)}` : '',
  ].filter(Boolean).join('\n\n')

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
  })

  const text = result.response.text()
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON bulunamadı')

  const parsed = JSON.parse(match[0]) as CvOptimizeResponse
  if (!parsed.cvData?.kisiselBilgiler) throw new Error('cvData eksik')

  return {
    cvData: normalizeCvData(parsed.cvData),
    atsAnalysis: parsed.atsAnalysis ?? null,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = req.body as CvOptimizeRequest
  if (!body?.cvText || body.cvText.length < 50) {
    return res.status(400).json({ error: 'CV metni çok kısa' })
  }

  let retries = 0
  while (retries <= 2) {
    try {
      const result = await callGemini(body)
      return res.status(200).json(result)
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if ((e?.status === 503 || e?.status === 429) && retries < 2) {
        retries++
        await new Promise(r => setTimeout(r, 1500 * retries))
        continue
      }
      console.error('CV optimize hatası:', e?.message ?? err)
      return res.status(500).json({ error: 'AI servisi geçici olarak kullanılamıyor.' })
    }
  }
}
