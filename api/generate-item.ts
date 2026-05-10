import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const maxDuration = 30

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
      model: 'gemini-2.5-flash',
      systemInstruction,
    })

    const result = await model.generateContent({
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
