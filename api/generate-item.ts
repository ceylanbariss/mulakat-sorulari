import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const maxDuration = 30

// Google ucretsiz katmanda yogunlukta 503/429 donebiliyor; kisa aralikla tekrar dene.
async function generateWithRetry(
  model: GenerativeModel,
  request: Parameters<GenerativeModel['generateContent']>[0],
) {
  const startedAt = Date.now()
  for (let attempt = 1; ; attempt++) {
    try {
      return await model.generateContent(request)
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status
      const retryable = status === 503 || status === 429
      if (!retryable || attempt >= 3 || Date.now() - startedAt > 12000) throw err
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt))
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { systemInstruction, userPrompt } = req.body as {
    systemInstruction: string
    userPrompt: string
  }

  if (!systemInstruction?.trim() || !userPrompt?.trim()) {
    return res.status(400).json({ error: 'systemInstruction ve userPrompt gerekli.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY tanımlı değil.' })

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      systemInstruction,
    })

    const result = await generateWithRetry(model, {
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    })

    const text = result.response.text().replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    return res.status(200).json(parsed)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('generate-item hatası:', msg)
    return res.status(500).json({ error: msg })
  }
}
