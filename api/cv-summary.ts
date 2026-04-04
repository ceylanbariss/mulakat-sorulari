import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const maxDuration = 30

const SYSTEM_INSTRUCTION = `You are a CV editor, not a writer. Your job is to EDIT the existing summary, not rewrite it.

Step 1: Take Input 1 word by word. Keep every proper noun, institution name, year, role title, and tool name exactly as written.
Step 2: Identify keywords in Input 2 that are missing from Input 1.
Step 3: Weave those missing keywords into the existing text by replacing weak phrases or adding 1-2 sentences.
Step 4: The output MUST contain every specific detail from Input 1 that is professional or personal:
- All institution/company/organization names
- All role titles and positions
- All tools, technologies, languages mentioned
- All personal motivations and background stories that sound professional
- All years, durations, academic program names
Do NOT remove any of these even if they seem unrelated to Input 2.
Only remove filler phrases like 'hedefliyorum', 'amaçlamaktayım' when replacing with stronger job-aligned versions.
Step 5: Never mention company name or program title from Input 2.

Output: The edited summary only, 4-5 sentences, same language as Input 1.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { currentSummary, jobDescription } = req.body as {
    currentSummary: string
    jobDescription: string
  }

  if (!currentSummary?.trim()) return res.status(400).json({ error: 'Mevcut özet eksik.' })
  if (!jobDescription?.trim()) return res.status(400).json({ error: 'İş ilanı metni eksik.' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY tanımlı değil.' })

  const userText = `Input 1 - Current summary:
${currentSummary.slice(0, 1500)}

Input 2 - Job description:
${jobDescription.slice(0, 3000)}

IMPORTANT: Preserve every personal detail from Input 1 exactly as stated.
Only reframe the emphasis and ordering to align with Input 2.
Do not generalize or remove specific facts.`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
    })

    const text = result.response.text().replace(/\*\*/g, '').trim()
    if (!text) return res.status(500).json({ error: 'Geçersiz AI yanıtı.' })

    return res.status(200).json({ text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('cv-summary hatası:', msg)
    return res.status(500).json({ error: msg })
  }
}
