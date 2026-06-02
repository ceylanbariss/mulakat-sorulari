import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const maxDuration = 60

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { images } = req.body as { images?: string[] }
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'Görsel gerekli.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY tanımlı değil.' })

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const imageParts = images.slice(0, 5).map((img: string) => {
      const [meta, data] = img.split(',')
      const mimeType = (meta.match(/data:(.*?);/) ?? [])[1] ?? 'image/jpeg'
      return { inlineData: { mimeType, data } }
    })

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: 'Bu CV görsellerindeki tüm metni aynen çıkar. Hiçbir şey ekleme veya çıkarma, sadece ham metin döndür.' },
          ...imageParts,
        ],
      }],
    })

    const text = result.response.text().trim()
    if (text.length < 20) {
      return res.status(400).json({ error: 'CV görselinden metin çıkarılamadı.' })
    }

    return res.status(200).json({ text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('CV OCR hatası:', msg)
    return res.status(500).json({ error: msg })
  }
}
