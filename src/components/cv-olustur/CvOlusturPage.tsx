import { useRef, useState } from 'react'
// import { Link } from 'react-router-dom' // GEÇİCİ: auth guard kaldırıldı
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, AlertCircle, ChevronDown, ChevronUp, Download, RotateCcw, ArrowLeft, PenLine, FileEdit, Sparkles } from 'lucide-react'
import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useCvStore } from '../../store/useCvStore'
import { CV_SYSTEM_PROMPT } from '../../lib/cvPrompt'
import { CvPreview, type CvPreviewHandle } from './CvPreview'
import type { TemplateId, PhotoShapeClass, OptimizedCvData } from '../../types/cv'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

const PRESET_COLORS = ['#c8c4bc', '#9e9b94', '#6b6760', '#37342f', '#111111']

const PHOTO_SHAPES: { value: PhotoShapeClass; label: string }[] = [
  { value: 'rounded-none', label: 'Kare' },
  { value: 'rounded-lg', label: 'Yuvarlatılmış' },
  { value: 'rounded-full', label: 'Daire' },
]

// ── Score color ────────────────────────────────────────────────────────────────
function scoreColor(n: number) {
  return n >= 70 ? '#10b981' : n >= 45 ? '#f59e0b' : '#ef4444'
}

// ── Sıfırdan ATS hesaplama ────────────────────────────────────────────────────
function computeSifirdanAts(data: OptimizedCvData): { score: number; checks: { label: string; passed: boolean }[] } {
  const checks: { label: string; passed: boolean }[] = []
  let score = 0

  const hasName = !!(data.name && data.name !== 'Ad Soyad')
  checks.push({ label: 'Ad soyad dolu', passed: hasName })
  if (hasName) score += 10

  const hasTitle = !!(data.title && data.title !== 'Pozisyon / Unvan')
  checks.push({ label: 'Unvan / Pozisyon dolu', passed: hasTitle })
  if (hasTitle) score += 5

  const hasEmail = !!data.email
  checks.push({ label: 'E-posta adresi dolu', passed: hasEmail })
  if (hasEmail) score += 5

  const hasPhone = !!data.phone
  checks.push({ label: 'Telefon numarası dolu', passed: hasPhone })
  if (hasPhone) score += 5

  const summary = data.summary_v1 || data.summary_v3 || ''
  const summaryWords = summary.trim().split(/\s+/).filter(Boolean).length
  const hasSummary = summaryWords > 0
  checks.push({ label: 'Kişisel özet eklendi', passed: hasSummary })
  if (hasSummary) {
    score += 10
    if (summaryWords >= 50) {
      score += 5
      checks.push({ label: '50+ kelime özet (bonus)', passed: true })
    }
    if (summaryWords >= 150) {
      score -= 5
      checks.push({ label: 'Özet çok uzun — 150+ kelime kısaltın', passed: false })
    }
  }

  const expArr = data.experience ?? []
  const hasExp = expArr.length > 0
  checks.push({ label: 'En az 1 iş deneyimi', passed: hasExp })
  if (hasExp) {
    score += 10
    const allHaveBullets = expArr.every(e => (e.bullets_v1?.length ?? 0) > 0)
    checks.push({ label: 'Deneyim açıklamaları dolu', passed: allHaveBullets })
    if (allHaveBullets) score += 5
    const allHaveDates = expArr.every(e => !!e.date)
    checks.push({ label: 'Deneyim tarihleri dolu', passed: allHaveDates })
    if (allHaveDates) score += 5
  }

  const hasEdu = (data.education?.length ?? 0) > 0
  checks.push({ label: 'En az 1 eğitim girişi', passed: hasEdu })
  if (hasEdu) score += 10

  const skillCount = data.skills?.length ?? 0
  const hasFiveSkills = skillCount >= 5
  checks.push({ label: `En az 5 beceri (şu an: ${skillCount})`, passed: hasFiveSkills })
  if (hasFiveSkills) {
    score += 10
    if (skillCount >= 10) {
      score += 5
      checks.push({ label: '10+ beceri (bonus)', passed: true })
    }
  }

  const hasAdditional = (data.additional?.length ?? 0) > 0
  checks.push({ label: 'Ek bilgiler dolu', passed: hasAdditional })
  if (hasAdditional) score += 5

  const hasContact = !!(data.linkedin || data.location)
  checks.push({ label: 'LinkedIn veya konum bilgisi', passed: hasContact })
  if (hasContact) score += 5

  const isComplete = hasName && hasTitle && hasEmail && hasPhone && hasSummary && hasExp && hasEdu && hasFiveSkills && hasAdditional && hasContact
  if (isComplete) {
    score += 5
    checks.push({ label: 'Tüm bölümler dolu (bonus)', passed: true })
  }

  return { score: Math.min(100, Math.max(0, score)), checks }
}

// ── PDF page image renderer ───────────────────────────────────────────────────
async function renderPdfToImages(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const images: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    await page.render({ canvasContext: ctx, canvas, viewport }).promise
    images.push(canvas.toDataURL('image/jpeg', 0.92))
  }
  return images
}

// ── File text extractor ───────────────────────────────────────────────────────
async function extractFileText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) throw new Error('Desteklenmeyen format. PDF, Word veya TXT yükleyin.')
  if (file.size > MAX_FILE_BYTES) throw new Error('Dosya 5 MB\'dan büyük. Daha küçük bir dosya deneyin.')

  if (ext === 'pdf') {
    const buf = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise
    const parts: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      parts.push(content.items.map(it => ('str' in it ? it.str : '')).join(' '))
    }
    const text = parts.join('\n\n').trim()
    if (text.length < 20) throw new Error('PDF okunamadı (taranmış görsel olabilir). Word veya TXT deneyin.')
    return text
  }

  if (ext === 'docx' || ext === 'doc') {
    const buf = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buf })
    const text = result.value.trim()
    if (text.length < 20) throw new Error('Word dosyası okunamadı. PDF veya TXT formatında deneyin.')
    return text
  }

  // txt
  const text = (await file.text()).trim()
  if (text.length < 20) throw new Error('Dosyadan metin çıkarılamadı.')
  return text
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function CvOlusturPage() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  // GEÇİCİ: user auth guard kaldırıldı — geri almak için bu yorumu aç
  // const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)

  const {
    originalCV, cvFileName, jobDescription, optimizedData, cvLanguage, isLoading, error,
    activeTemplate, themeColor, narrativeVoice, textAlign, profileImage, photoShape,
    photoSize, photoObjectX, photoObjectY, photoScale, photoPosX, photoPosY,
    showIcons, sectionsOrder, customHeadings,
    setOriginalCV, setJobDescription, setOptimizedData, updateOptimizedData, setCvLanguage,
    setLoading, setError, setActiveTemplate, setThemeColor, setNarrativeVoice, setTextAlign,
    setProfileImage, setPhotoShape, setPhotoTransform, setPhotoPosition, resetSession,
    setSectionsOrder, setCustomHeadings,
  } = useCvStore()

  const cvPreviewRef = useRef<CvPreviewHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [mod, setMod] = useState<null | 'sifirdan' | 'duzenle' | 'ilana-gore'>(null)
  const [hoveredCard, setHoveredCard] = useState<null | 'sifirdan' | 'duzenle' | 'ilana-gore'>(null)

  const [pasteText, setPasteText] = useState('')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [fileError, setFileError] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [originalPageImages, setOriginalPageImages] = useState<string[]>([])
  const [originalDocHtml, setOriginalDocHtml] = useState<string>('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // ── Undo toast ────────────────────────────────────────────────────────────────
  const [undoSnapshot, setUndoSnapshot] = useState<{ data: OptimizedCvData; label: string } | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function deleteWithUndo(label: string, deleteFn: (prev: OptimizedCvData) => OptimizedCvData) {
    if (!optimizedData) return
    const snapshot = JSON.parse(JSON.stringify(optimizedData)) as OptimizedCvData
    updateOptimizedData(deleteFn)
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setUndoSnapshot({ data: snapshot, label })
    undoTimerRef.current = setTimeout(() => setUndoSnapshot(null), 5000)
  }

  function handleUndo() {
    if (!undoSnapshot) return
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setOptimizedData(undoSnapshot.data)
    setUndoSnapshot(null)
  }

  // Feature 1: Bulk Gap Integration
  const [selectedGaps, setSelectedGaps] = useState<string[]>([])
  const [isIntegratingGaps, setIsIntegratingGaps] = useState(false)

  // Feature 2: AI Item Adding
  const [addItemSection, setAddItemSection] = useState('experience')
  const [addItemInput, setAddItemInput] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [customSectionTitle, setCustomSectionTitle] = useState('')
  const [customLinkLabel, setCustomLinkLabel] = useState('')
  const [customLinkUrl, setCustomLinkUrl] = useState('')

  // Feature 3: Summary Optimization — UI'dan kaldırıldı, state'ler temizlendi

  // ── Item add / delete ─────────────────────────────────────────────────────────
  function addExperience() {
    updateOptimizedData(prev => ({
      ...prev,
      experience: [...(prev.experience || []), {
        id: `exp-${Date.now()}`, role: 'Yeni Pozisyon', company: 'Şirket', date: '',
        bullets_v1: ['Görev açıklaması ekleyin.'], bullets_v3: ['Görev açıklaması ekleyin.'], bullets: [],
      }],
    }))
  }
  function deleteExperience(id: string) {
    updateOptimizedData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) }))
  }
  function addEducation() {
    updateOptimizedData(prev => ({
      ...prev,
      education: [...(prev.education || []), {
        id: `edu-${Date.now()}`, degree: 'Bölüm / Sertifika', school: 'Okul / Kurum', date: '', details: '',
      }],
    }))
  }
  function deleteEducation(id: string) {
    updateOptimizedData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }))
  }
  function addSkill() {
    updateOptimizedData(prev => ({ ...prev, skills: [...(prev.skills || []), 'Yeni Beceri'] }))
  }
  function deleteSkill(idx: number) {
    updateOptimizedData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }))
  }
  function addAdditional() {
    updateOptimizedData(prev => ({ ...prev, additional: [...(prev.additional || []), 'Yeni Bilgi'] }))
  }
  function deleteAdditional(idx: number) {
    updateOptimizedData(prev => ({ ...prev, additional: prev.additional.filter((_, i) => i !== idx) }))
  }
  function handleAddBullet(expId: string) {
    updateOptimizedData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id !== expId ? exp : {
        ...exp,
        bullets_v1: [...exp.bullets_v1, 'Yeni görev maddesi.'],
        bullets_v3: [...exp.bullets_v3, 'Yeni görev maddesi.'],
      }),
    }))
  }
  // ── Feature 1: Bulk Gap Integration ─────────────────────────────────────────
  function toggleGapSelection(gap: string) {
    setSelectedGaps(prev =>
      prev.includes(gap) ? prev.filter(g => g !== gap) : [...prev, gap]
    )
  }

  async function handleIntegrateBatchGaps() {
    if (selectedGaps.length === 0 || !optimizedData) return
    setIsIntegratingGaps(true)

    const langText = cvLanguage === 'tr' ? 'TÜRKÇE' : 'İNGİLİZCE'
    const systemInstruction = `Sen profesyonel ve üst düzey bir CV yazarısın. Adayın CV'sinde ilan gereksinimlerine göre şu eksikler tespit edildi:
EKSİKLER LİSTESİ: ${JSON.stringify(selectedGaps)}

Amacın bu eksik maddelerin HER BİRİNİ mantıksal olarak analiz edip profesyonel bir dille adayın CV'sine "yedirmek".

KURALLAR:
1. Listede yer alan her bir madde için düşün: Bu bir YETENEK (Araç, yazılım, dil) mi, yoksa DENEYİM (Görev, sorumluluk) mi?
2. Eğer YETENEK ise: "targetSection" olarak "skills" seç ve "skill_content" alanına maksimum 3 kelimelik temiz bir teknoloji/yetenek adı yaz.
3. Eğer DENEYİM ise: "targetSection" olarak "experience" seç. "eksikliği" veya "uyumsuzluk" gibi kelimeleri ASLA kullanma. Aday sanki bunu gerçekten başarmış gibi güçlü, olumlu ve kurumsal bir iş tecrübesi cümlesi kur.
4. Sadece geçerli bir JSON Dizisi (Array) döndür.

ÇIKTI FORMATI:
[
  {
     "original_gap": "Listenin içindeki orijinal eksik metnini BİREBİR AYNI YAZ",
     "targetSection": "skills" veya "experience",
     "skill_content": "Sadece targetSection skills ise doldur",
     "exp_content_v1": "Sadece targetSection experience ise doldur. 1. Tekil (Ben) diliyle",
     "exp_content_v3": "Sadece targetSection experience ise doldur. 3. Tekil (O/Edilgen) diliyle"
  }
]`

    try {
      let parsedArray: any[]

      if (import.meta.env.DEV) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey) throw new Error('VITE_GEMINI_API_KEY tanımlı değil')
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction,
        })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: `Dil: ${langText}. Yukarıdaki eksikleri analiz et ve istenen JSON dizisi formatında sonuç üret.` }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
        })
        const text = result.response.text().replace(/```json|```/g, '').trim()
        parsedArray = JSON.parse(text)
      } else {
        const res = await fetch('/api/cv-optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cvText: systemInstruction,
            jobDescription: `Dil: ${langText}. Yukarıdaki eksikleri analiz et.`,
            language: cvLanguage,
          }),
        })
        const data = await res.json()
        parsedArray = Array.isArray(data) ? data : [data]
      }

      if (!Array.isArray(parsedArray)) parsedArray = [parsedArray]

      updateOptimizedData(prev => {
        const newData = JSON.parse(JSON.stringify(prev)) as OptimizedCvData
        let skillsBoost = 0
        let expBoost = 0
        const processed = new Set<string>()

        if (!newData.analysis.gap_mapping) newData.analysis.gap_mapping = {}

        parsedArray.forEach((parsed: any) => {
          const originalGap = parsed.original_gap
          const uniqueKey = parsed.skill_content || parsed.exp_content_v1
          if (!originalGap || !uniqueKey || processed.has(originalGap)) return
          processed.add(originalGap)

          if (parsed.targetSection === 'skills' && parsed.skill_content) {
            if (!newData.skills) newData.skills = []
            if (!newData.skills.includes(parsed.skill_content)) {
              newData.skills.push(parsed.skill_content)
            }
            newData.analysis.gap_mapping![parsed.skill_content] = originalGap
            skillsBoost += 4
          } else if (parsed.targetSection === 'experience' && parsed.exp_content_v1) {
            if (newData.experience?.length > 0) {
              if (!newData.experience[0].bullets_v1) newData.experience[0].bullets_v1 = []
              if (!newData.experience[0].bullets_v3) newData.experience[0].bullets_v3 = []
              if (!newData.experience[0].bullets) newData.experience[0].bullets = []
              newData.experience[0].bullets_v1.push(parsed.exp_content_v1)
              newData.experience[0].bullets_v3.push(parsed.exp_content_v3 || parsed.exp_content_v1)
              newData.experience[0].bullets.push(parsed.exp_content_v1)
            }
            newData.analysis.gap_mapping![parsed.exp_content_v1] = originalGap
            if (parsed.exp_content_v3) newData.analysis.gap_mapping![parsed.exp_content_v3] = originalGap
            expBoost += 5
          }

          if (newData.analysis.gaps) {
            newData.analysis.gaps = newData.analysis.gaps.filter(
              g => g.trim().toLowerCase() !== originalGap.trim().toLowerCase()
            )
          }
          if (!newData.analysis.additions) newData.analysis.additions = []
          if (!newData.analysis.additions.includes(uniqueKey)) {
            newData.analysis.additions.push(uniqueKey)
          }
        })

        if (newData.analysis.scores) {
          newData.analysis.scores.skills = Math.min(100, (newData.analysis.scores.skills || 70) + skillsBoost)
          newData.analysis.scores.experience = Math.min(100, (newData.analysis.scores.experience || 70) + expBoost)
          newData.analysis.scores.overall = Math.round(
            ((newData.analysis.scores.skills || 0) +
             (newData.analysis.scores.experience || 0) +
             (newData.analysis.scores.education || 70)) / 3
          )
        }

        return newData
      })

      setSelectedGaps([])
    } catch (err) {
      console.error('Gap yedirme hatası:', err)
      setError('Eksikler giderilirken bir hata oluştu.')
    } finally {
      setIsIntegratingGaps(false)
    }
  }

  // ── Feature 2: AI Item Adding ─────────────────────────────────────────────────
  const toSectionKey = (title: string) =>
    title.trim().toLowerCase()
      .replace(/[şŞ]/g, 's').replace(/[çÇ]/g, 'c').replace(/[öÖ]/g, 'o')
      .replace(/[üÜ]/g, 'u').replace(/[ğĞ]/g, 'g').replace(/[ıİ]/g, 'i')
      .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 40)
    || 'ozel_alan'

  async function handleAddItem() {
    if (!addItemInput.trim() || !optimizedData) return
    if (addItemSection === 'customSection' && !customSectionTitle.trim()) return
    setIsAddingItem(true)

    const langText = cvLanguage === 'tr' ? 'TÜRKÇE' : 'İNGİLİZCE'
    let systemInstruction = ''
    let userPrompt = `Girdi: ${addItemInput}`

    if (addItemSection === 'summary') {
      const currentSummary = narrativeVoice === 'first' ? optimizedData.summary_v1 : optimizedData.summary_v3
      userPrompt = `Mevcut Özet: "${currentSummary}"\n\nEklenecek Bilgi: "${addItemInput}"\n\nGörev: Eklenecek bilgiyi mevcut özete profesyonelce yedir, akışı bozma ve bütünlüklü tek bir paragraf olarak yeniden yaz.`
      systemInstruction = `Sen profesyonel bir CV yazarısın. Çıktı formatı JSON: {"summary_v1": "Ben diliyle yazılmış yeni özet", "summary_v3": "O diliyle yazılmış yeni özet"}. Markdown kullanma. Sadece JSON döndür. Dili: ${langText}.`
    } else if (addItemSection === 'education') {
      systemInstruction = `Sen profesyonel bir CV yazarısın. Kullanıcı girdisinden bir Eğitim maddesi oluştur. Çıktı formatı JSON: {"entry": {"degree": "Bölüm/Sertifika Adı", "school": "Okul/Kurum", "date": "Tarih", "details": "Kısa açıklama"}}. Markdown kullanma. Dili: ${langText}. Sadece JSON döndür.`
    } else if (addItemSection === 'experience') {
      systemInstruction = `Sen profesyonel bir CV yazarısın. Kullanıcı girdisinden bir İş Deneyimi maddesi oluştur. Çıktı formatı JSON: {"entry": {"role": "Pozisyon", "company": "Şirket", "date": "Tarih", "bullets_v1": ["Ben diliyle madde"], "bullets_v3": ["O diliyle madde"]}}. Markdown kullanma. Dili: ${langText}. Sadece JSON döndür.`
    } else if (addItemSection === 'customSection') {
      systemInstruction = `Sen üst düzey bir CV yazarısın. Kullanıcının ham açıklamasını "${customSectionTitle.trim()}" başlıklı CV bölümü için tek yapılandırılmış giriş olarak işle. Çıktı formatı kesinlikle şu JSON olmalı:\n{"entry": {"title": "Başlık/Proje Adı", "subtitle": "Teknoloji/Şirket/Kurum (varsa, yoksa boş string)", "date": "Tarih veya bağlantı (varsa, yoksa boş string)", "details_v1": ["Ben diliyle, güçlü aksiyon fiiliyle başlayan, ölçülebilir sonuç içeren madde"], "details_v3": ["O diliyle, güçlü aksiyon fiiliyle başlayan, ölçülebilir sonuç içeren madde"]}}\nKURALLAR: Maddeler güçlü aksiyon fiilleriyle başlamalı (Geliştirdim/Geliştirdi, Tasarladım/Tasarladı vb.), ölçülebilir sonuç veya somut teknik detay içermeli. Markdown kullanma, sadece JSON döndür. Dili: ${langText}.`
    } else {
      systemInstruction = `Sen profesyonel bir CV yazarısın. Kullanıcının girdisini ${addItemSection === 'skills' ? 'Teknik Yetenek' : 'Ek Bilgi'} formatına çevir. Çıktı formatı JSON: {"items": ["Madde 1"]}. Markdown kullanma. Dili: ${langText}. Sadece JSON döndür.`
    }

    try {
      let parsed: any

      if (import.meta.env.DEV) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey) throw new Error('VITE_GEMINI_API_KEY tanımlı değil')
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction,
        })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
        })
        const text = result.response.text().replace(/```json|```/g, '').trim()
        parsed = JSON.parse(text)
      } else {
        const res = await fetch('/api/generate-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction, userPrompt }),
        })
        parsed = await res.json()
        if (parsed.error) throw new Error(parsed.error)
      }

      const uniqueId = `${addItemSection}-${Date.now()}`

      updateOptimizedData(prev => {
        const newData = { ...prev }

        if (addItemSection === 'summary') {
          if (parsed.summary_v1) newData.summary_v1 = parsed.summary_v1
          if (parsed.summary_v3) newData.summary_v3 = parsed.summary_v3
        } else if (addItemSection === 'experience' && parsed.entry) {
          newData.experience = [
            { ...parsed.entry, id: uniqueId, bullets: parsed.entry.bullets_v1 || [] },
            ...(newData.experience || []),
          ]
        } else if (addItemSection === 'education' && parsed.entry) {
          newData.education = [
            { ...parsed.entry, id: uniqueId },
            ...(newData.education || []),
          ]
        } else if ((addItemSection === 'skills' || addItemSection === 'additional') && parsed.items) {
          newData[addItemSection as 'skills' | 'additional'] = [...((newData as any)[addItemSection] || []), ...parsed.items]
        } else if (addItemSection === 'customSection' && parsed.entry) {
          const sKey = toSectionKey(customSectionTitle)
          const existing = ((newData as Record<string, unknown>)[sKey] as unknown[]) || []
          ;(newData as Record<string, unknown>)[sKey] = [...existing, parsed.entry]
        }

        return newData
      })

      if (addItemSection === 'customSection') {
        const sKey = toSectionKey(customSectionTitle)
        if (!sectionsOrder.includes(sKey)) setSectionsOrder([...sectionsOrder, sKey])
        setCustomHeadings({ ...customHeadings, [sKey]: customSectionTitle.trim() })
      }

      setAddItemInput('')
    } catch (err) {
      setError('Öğe eklenirken hata oluştu: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsAddingItem(false)
    }
  }

  function handleAddCustomLink() {
    const label = customLinkLabel.trim()
    const url = customLinkUrl.trim()
    if (!label || !url || !optimizedData) return
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    updateOptimizedData(prev => ({
      ...prev,
      customLinks: [...(prev.customLinks ?? []), { label, url: normalizedUrl }],
    }))
    setCustomLinkLabel('')
    setCustomLinkUrl('')
  }

  function deleteCustomLink(idx: number) {
    updateOptimizedData(prev => ({
      ...prev,
      customLinks: (prev.customLinks ?? []).filter((_, i) => i !== idx),
    }))
  }

  // ── Feature 3: Summary Optimization — UI'dan kaldırıldığı için devre dışı ─────

  // ── Style vars ───────────────────────────────────────────────────────────────
  const bg       = d ? '#0d1117' : '#f8fafc'
  const surface  = d ? 'rgba(255,255,255,0.04)' : '#ffffff'
  const border   = d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const text      = d ? '#f1f5f9' : '#0f172a'
  const muted    = d ? '#64748b' : '#94a3b8'
  const inputBg  = d ? 'rgba(255,255,255,0.05)' : '#ffffff'
  const inputBdr = d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'

  // ── File upload handler ──────────────────────────────────────────────────────
  async function handleFile(file: File) {
    setFileError('')
    setExtracting(true)
    setPasteText('')
    setUploadedFile(file)
    try {
      const text = await extractFileText(file)
      setOriginalCV(text, file.name)
    } catch (e) {
      setFileError(e instanceof Error ? e.message : String(e))
    } finally {
      setExtracting(false)
    }
  }

  // Parsed verideki standart dışı string-array bölümlerini sectionsOrder'a ekle
  const STANDARD_CV_KEYS = new Set(['name','title','location','phone','email','linkedin','summary_v1','summary_v3','experience','education','skills','additional','customLinks','warnings','analysis','is_valid_cv','error_message','sertifikalar','kurslar','certifications','courses'])
  function applyDynamicSections(data: Record<string, unknown>) {
    const baseKeys = new Set<string>()
    for (const [k, v] of Object.entries(data)) {
      if (STANDARD_CV_KEYS.has(k)) continue
      // _v1/_v3 suffix'li key'lerden base key'i çıkar
      if (k.endsWith('_v1') || k.endsWith('_v3')) {
        const base = k.slice(0, -3)
        if (!STANDARD_CV_KEYS.has(base)) baseKeys.add(base)
        continue
      }
      if (Array.isArray(v) && (v as unknown[]).length > 0) baseKeys.add(k)
    }
    if (baseKeys.size === 0) return
    const existing = new Set(sectionsOrder)
    const newExtras = [...baseKeys].filter(k => !existing.has(k))
    if (newExtras.length > 0) setSectionsOrder([...sectionsOrder, ...newExtras])
  }

  // Mevcut customLinks'i yeni sonuçla birleştirir (URL bazlı deduplicate)
  function mergeCustomLinks(newData: Record<string, unknown>): Record<string, unknown> {
    const existing = (optimizedData?.customLinks ?? []) as { label: string; url: string }[]
    const incoming = (Array.isArray(newData.customLinks) ? newData.customLinks : []) as { label: string; url: string }[]
    const normalize = (l: { url?: string }) => (l.url || '').replace(/^https?:\/\/(www\.)?/, '')
    const incomingUrls = new Set(incoming.map(normalize))
    const kept = existing.filter((l) => !incomingUrls.has(normalize(l)))
    return { ...newData, customLinks: [...incoming, ...kept].filter(l => l.url) }
  }

  // ── Duzenle modu: CV'yi parse et, editörü aç (optimizasyon yok) ──────────────
  async function handleParseAndEdit() {
    const cvText = originalCV || pasteText
    if (cvText.length < 20) { setError('CV metni çok kısa.'); return }
    if (!originalCV && pasteText.length >= 20) setOriginalCV(pasteText, 'Manuel giriş')
    setLoading(true)
    setError(null)

    // Orijinal görsel render (mevcut template için)
    if (uploadedFile) {
      const ext = uploadedFile.name.split('.').pop()?.toLowerCase() ?? ''
      if (ext === 'pdf') {
        try {
          const imgs = await renderPdfToImages(uploadedFile)
          setOriginalPageImages(imgs)
          setOriginalDocHtml('')
        } catch { /* görsel render başarısız olursa sessizce devam et */ }
      } else if (ext === 'docx' || ext === 'doc') {
        try {
          const buf = await uploadedFile.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer: buf })
          setOriginalDocHtml(result.value)
          setOriginalPageImages([])
        } catch { /* sessizce devam et */ }
      }
    }

    const parseSystemPrompt = `Sen bir CV ayrıştırma uzmanısın. Verilen CV metnini OLDUĞU GİBİ JSON formatına dönüştür. HİÇBİR İÇERİĞİ DEĞİŞTİRME, sadece yapılandır.

TEMEL ŞEMA (sabit alanlar):
{
  "is_valid_cv": true,
  "name": "", "title": "", "location": "", "phone": "", "email": "", "linkedin": "",
  "summary_v1": "", "summary_v3": "",
  "experience": [{"id":"exp-0","role":"","company":"","date":"","bullets_v1":[],"bullets_v3":[],"bullets":[]}],
  "education": [{"id":"edu-0","degree":"","school":"","date":"","details":""}],
  "skills": [], "additional": [],
  "customLinks": [{"label":"","url":""}],
  "warnings": [],
  "analysis": {"scores":{"overall":0,"skills":0,"experience":0,"education":0},"matches":{"hard_skills":[],"soft_skills":[]},"gaps":[],"additions":[]}
}

DİNAMİK BÖLÜMLER (ÖNEMLİ):
CV'deki TÜM başlıkları tara. Şemada karşılığı olmayan bir başlık bulursan (örn: Projeler, Sertifikalar, Aktiviteler, İlgi Alanları, Diller, Referanslar, Gönüllü Çalışmalar, Kurslar, Yayınlar, Ödüller vb.) o başlığı JSON kökünde ayrı bir dizi alanı olarak ekle:
- Türkçe karakterleri dönüştür: ş→s, ç→c, ö→o, ü→u, ğ→g, ı→i
- Boşlukları alt çizgi yap, küçük harf kullan
- Örnekler: "Projeler"→"projeler", "Sertifikalar"→"sertifikalar", "Aktiviteler / İlgi Alanları"→"aktiviteler", "Diller"→"diller"
- Altındaki her madde veya paragraf string dizisi elemanı olur
- Karmaşık maddeler (proje başlığı + URL + açıklama) için format: "BAŞLIK — açıklama" (tek string)
- GitHub/portfolio URL'leri customLinks'e ekle

SES TONU VARYANTları (PARSE MODUNDA):
- String dizisi olan dinamik bölümler için aynı içeriği hem "_v1" hem "_v3" key'iyle döndür (parse modunda ikisi aynı olabilir).
  Örn: "gonullu_calismalar": [...], "gonullu_calismalar_v1": [...], "gonullu_calismalar_v3": [...]
- Nesne dizisi olan dinamik bölümler için her nesneye "details_v1" ve "details_v3" ekle (parse modunda details ile aynı olabilir).
- education'daki "details" alanı doluysa "details_v1" ve "details_v3" de aynı içerikle döndür.

KURALLAR:
- İçeriği olduğu gibi aktar, optimize etme
- bullets_v1 ve bullets_v3 aynı içerik olabilir
- Eksik alanları boş string veya boş dizi bırak
- Sadece JSON döndür, başka metin ekleme`

    try {
      if (import.meta.env.DEV) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey) throw new Error('VITE_GEMINI_API_KEY tanımlı değil')
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: parseSystemPrompt,
        })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: `CV:\n${cvText.slice(0, 6000)}` }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.1, responseMimeType: 'application/json' },
        })
        let text = result.response.text().replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(text) as Record<string, unknown>
        if (parsed.is_valid_cv === false) throw new Error(parsed.error_message as string)
        if (Array.isArray(parsed.experience)) {
          parsed.experience = (parsed.experience as Record<string, unknown>[]).map((e, i) => ({
            ...e, id: e.id || `exp-${i}-${Date.now()}`,
            bullets: Array.isArray(e.bullets_v1) ? e.bullets_v1 : [],
          }))
        }
        if (Array.isArray(parsed.education)) {
          parsed.education = (parsed.education as Record<string, unknown>[]).map((e, i) => ({ ...e, id: e.id || `edu-${i}-${Date.now()}` }))
        }
        const merged = mergeCustomLinks(parsed)
        setOptimizedData(merged as never)
        applyDynamicSections(merged)
        setActiveTemplate('mevcut')
      } else {
        // Production: cv-optimize endpoint'ini parse modu ile kullan (jobDescription yok = sadece ayrıştır)
        const res = await fetch('/api/cv-optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cvText, jobDescription: '', language: cvLanguage, parseOnly: true }),
        })
        const rawText = await res.text()
        let json: Record<string, unknown>
        try { json = JSON.parse(rawText) } catch { throw new Error(`Sunucu geçersiz yanıt döndürdü (HTTP ${res.status}).`) }
        if (!res.ok) throw new Error((json.error as string) || 'Ayrıştırma başarısız.')
        const merged = mergeCustomLinks(json)
        setOptimizedData(merged as never)
        applyDynamicSections(merged)
        setActiveTemplate('mevcut')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // ── Optimize ─────────────────────────────────────────────────────────────────
  async function handleOptimize() {
    const cvText = originalCV || pasteText
    if (cvText.length < 20) { setError('CV metni çok kısa.'); return }
    if (!originalCV && pasteText.length >= 20) setOriginalCV(pasteText, 'Manuel giriş')
    setLoading(true)
    setError(null)
    try {
      // DEV MODE: tarayıcıdan doğrudan Gemini çağrısı (sunucu gerekmez)
      if (import.meta.env.DEV) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey) throw new Error('VITE_GEMINI_API_KEY .env dosyasına eklenmemiş. GEMINI_API_KEY değerini VITE_ önekiyle kopyalayın.')
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: CV_SYSTEM_PROMPT,
        })
        const langNote = cvLanguage === 'tr' ? 'Tüm metin alanlarını TÜRKÇE yaz.' : 'Write ALL text fields in ENGLISH.'
        const adaptNote = jobDescription
          ? '\n\n🎯 UYARLAMA: ADAYIN GERÇEK BİLGİLERİ + İLANIN TERMİNOLOJİSİ = YENİ CV. İkisinin KESİŞİMİNİ bul. Ne CV\'yi ne ilanı kopyala.'
          : ''
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: `${langNote}${adaptNote}\n\nCV: ${cvText.slice(0, 8000)}\n\nİlan: ${(jobDescription || '').slice(0, 3000)}` }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.65, responseMimeType: 'application/json' },
        })
        let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
        let parsed = JSON.parse(text) as Record<string, unknown>
        if (parsed.is_valid_cv === false) throw new Error(parsed.error_message as string)
        if (Array.isArray(parsed.experience)) {
          parsed.experience = (parsed.experience as Record<string, unknown>[]).map((e, i) => ({
            ...e, id: e.id || `exp-${i}-${Date.now()}`,
            bullets: Array.isArray(e.bullets) && (e.bullets as unknown[]).length ? e.bullets : (e.bullets_v1 ?? []),
          }))
        }
        if (Array.isArray(parsed.education)) {
          parsed.education = (parsed.education as Record<string, unknown>[]).map((e, i) => ({ ...e, id: e.id || `edu-${i}-${Date.now()}` }))
        }
        const merged1 = mergeCustomLinks(parsed)
        setOptimizedData(merged1 as never)
        applyDynamicSections(merged1)
        return
      }

      // PRODUCTION: Vercel serverless API route
      const res = await fetch('/api/cv-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobDescription: jobDescription || '', language: cvLanguage }),
      })
      const rawText = await res.text()
      let json: Record<string, unknown>
      try {
        json = JSON.parse(rawText)
      } catch {
        throw new Error(`Sunucu geçersiz yanıt döndürdü (HTTP ${res.status}). Lütfen tekrar deneyin.`)
      }
      if (!res.ok) throw new Error((json.error as string) || 'Optimizasyon başarısız.')
      const merged2 = mergeCustomLinks(json)
      setOptimizedData(merged2 as never)
      applyDynamicSections(merged2)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // ── Translate CV ─────────────────────────────────────────────────────────────
  async function handleTranslateCV(targetLang: 'tr' | 'en') {
    if (!optimizedData) return
    if (targetLang === cvLanguage) return
    setIsTranslating(true)
    setCvLanguage(targetLang)
    try {
      const systemInstruction = `Sen profesyonel bir CV çevirmenisin. Verilen JSON formatındaki CV verisini BİREBİR ${targetLang === 'tr' ? 'TÜRKÇE' : 'İNGİLİZCE'} diline çevir.
JSON yapısını (key'leri) ASLA değiştirme. Sadece değerleri (metinleri) hedef dile çevir.
ID'leri, URL'leri veya email adreslerini çevirme. İsim ve iletişim bilgilerini olduğu gibi bırak.
"is_valid_cv", "error_message" gibi meta verileri çevirebilirsin.`

      const userPrompt = JSON.stringify(optimizedData)
      let newJson: OptimizedCvData

      if (import.meta.env.DEV) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey) throw new Error('VITE_GEMINI_API_KEY bulunamadı.')
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction,
        })
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.2, responseMimeType: 'application/json' },
        })
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
        newJson = JSON.parse(text)
      } else {
        const res = await fetch('/api/generate-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction, userPrompt }),
        })
        const rawText = await res.text()
        if (!res.ok) throw new Error('Çeviri başarısız oldu.')
        newJson = JSON.parse(rawText)
      }

      setOptimizedData(newJson as never)
      applyDynamicSections(newJson)
    } catch (e) {
      alert(`Çeviri hatası: ${e instanceof Error ? e.message : String(e)}`)
      setCvLanguage(cvLanguage)
    } finally {
      setIsTranslating(false)
    }
  }

  // ── PDF download ─────────────────────────────────────────────────────────────
  async function handleDownload() {
    if (!cvPreviewRef.current) { alert('Önizleme yüklenemedi, lütfen sayfayı yenileyin.'); return }
    setDownloading(true)
    try {
      await cvPreviewRef.current.downloadPdf()
    } catch (err) {
      console.error('PDF hatası:', err)
      alert(`PDF oluşturulamadı: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDownloading(false)
    }
  }

  // ── Photo upload ─────────────────────────────────────────────────────────────
  function handlePhotoFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => setProfileImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── Sıfırdan oluştur — placeholder içerikli CV ile editöre aç ────────────────
  function handleSifirdan() {
    const placeholderCV: OptimizedCvData = {
      name: 'Ad Soyad',
      title: 'Pozisyon / Unvan',
      location: 'Şehir, Türkiye',
      phone: '+90 5XX XXX XX XX',
      email: 'eposta@ornek.com',
      linkedin: 'linkedin.com/in/kullanici',
      summary_v1: 'Kişisel özetinizi buraya yazın. Kendinizi, güçlü yönlerinizi ve kariyer hedeflerinizi kısaca tanıtın. Bu alan işe alım uzmanlarının dikkatini çeken ilk bölümdür.',
      summary_v3: 'Kişisel özetinizi buraya yazın. Kendinizi, güçlü yönlerinizi ve kariyer hedeflerinizi kısaca tanıtın. Bu alan işe alım uzmanlarının dikkatini çeken ilk bölümdür.',
      experience: [
        {
          id: 'exp-placeholder-1',
          role: 'Pozisyon Adı',
          company: 'Şirket Adı',
          date: 'Oca 2022 – Halen',
          bullets_v1: [
            'Görev ve sorumluluklarınızı buraya ekleyin.',
            'Başardığınız projeleri ve sonuçlarını yazın.',
          ],
          bullets_v3: [
            'Görev ve sorumluluklarını buraya ekleyin.',
            'Başardığı projeleri ve sonuçlarını yazın.',
          ],
          bullets: [],
        },
        {
          id: 'exp-placeholder-2',
          role: 'Önceki Pozisyon',
          company: 'Önceki Şirket',
          date: 'Mar 2019 – Ara 2021',
          bullets_v1: [
            'Önceki pozisyonunuzdaki görevlerinizi ekleyin.',
          ],
          bullets_v3: [
            'Önceki pozisyonundaki görevlerini ekleyin.',
          ],
          bullets: [],
        },
      ],
      education: [
        {
          id: 'edu-placeholder-1',
          degree: 'Bölüm Adı',
          school: 'Üniversite / Okul Adı',
          date: '2015 – 2019',
          details: 'Bölüm detayları, not ortalaması veya önemli dersler.',
        },
      ],
      skills: ['Beceri 1', 'Beceri 2', 'Beceri 3', 'Beceri 4', 'Beceri 5', 'Beceri 6'],
      additional: ['Dil: Türkçe (Anadil)', 'Dil: İngilizce (B2)', 'Sürücü Belgesi: B'],
      customLinks: [],
      warnings: [],
      analysis: {
        scores: { overall: 0, skills: 0, experience: 0, education: 0 },
        matches: { hard_skills: [], soft_skills: [] },
        gaps: [],
        additions: [],
      },
    }
    setOptimizedData(placeholderCV)
    setMod('sifirdan')
  }

  // ── Auth guards ───────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: bg }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )

  // GEÇİCİ: Giriş yapılmamış guard devre dışı — geri almak için bu yorumu kaldır
  // if (!user) return (...)

  // ── Back button (fixed overlay, tüm ekranlarda görünür) ───────────────────────
  const backBtn = mod !== null ? (
    <button
      onClick={() => { setMod(null); resetSession(); setPasteText('') }}
      style={{
        position: 'fixed', top: 76, left: 16, zIndex: 300,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 8,
        border: `1px solid ${border}`, background: d ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)',
        color: text, cursor: 'pointer', fontSize: 13, fontWeight: 600,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)',
        transition: 'all 0.15s',
      }}
    >
      <ArrowLeft size={14} /> Geri
    </button>
  ) : null

  // ── Mod seçim ekranı ──────────────────────────────────────────────────────────
  if (mod === null) {
    const cards = [
      {
        id: 'sifirdan' as const,
        icon: <PenLine size={36} color='#6366f1' />,
        title: 'Sıfırdan Oluştur',
        desc: 'Boş şablonla başlayın, adım adım kendi CV\'nizi oluşturun.',
        accent: '#6366f1',
        accentBg: d ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)',
        onClick: handleSifirdan,
        badge: null,
      },
      {
        id: 'duzenle' as const,
        icon: <FileEdit size={36} color='#3b82f6' />,
        title: "CV'mi Düzenle",
        desc: "Mevcut CV'nizi yükleyin, şablon ve içeriği düzenleyin.",
        accent: '#3b82f6',
        accentBg: d ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)',
        onClick: () => { resetSession(); setPasteText(''); setUploadedFile(null); setOriginalPageImages([]); setOriginalDocHtml(''); setMod('duzenle') },
        badge: null,
      },
      {
        id: 'ilana-gore' as const,
        icon: <Sparkles size={36} color='#10b981' />,
        title: 'İş İlanına Göre Hazırla',
        desc: "CV'nizi ve iş ilanını yükleyin, AI ile optimize edilmiş CV alın.",
        accent: '#10b981',
        accentBg: d ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)',
        onClick: () => { resetSession(); setPasteText(''); setUploadedFile(null); setOriginalPageImages([]); setOriginalDocHtml(''); setMod('ilana-gore') },
        badge: '✨ AI Destekli',
      },
    ]

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-transparent"
        style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}
      >
        <div style={{ maxWidth: 860, width: '100%' }}>
          {/* Başlık */}
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 18, background: d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', marginBottom: 16 }}>
              <span style={{ fontSize: 26 }}>📄</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: text, marginBottom: 8 }}>Nasıl devam etmek istersiniz?</h1>
            <p style={{ fontSize: 14, color: muted }}>Size en uygun seçeneği belirleyin</p>
          </div>

          {/* Kartlar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {cards.map(card => {
              const hovered = hoveredCard === card.id
              return (
                <button
                  key={card.id}
                  onClick={card.onClick}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    position: 'relative', textAlign: 'left', cursor: 'pointer',
                    padding: '32px 28px', borderRadius: 20,
                    border: `1.5px solid ${hovered ? card.accent : (d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                    background: hovered ? card.accentBg : (d ? 'rgba(255,255,255,0.03)' : '#ffffff'),
                    boxShadow: hovered ? `0 8px 32px ${card.accent}28` : '0 2px 8px rgba(0,0,0,0.06)',
                    transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                >
                  {/* Badge */}
                  {card.badge && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      background: d ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                      color: '#10b981', border: '1px solid rgba(16,185,129,0.25)',
                    }}>
                      {card.badge}
                    </div>
                  )}
                  {/* İkon */}
                  <div style={{
                    width: 60, height: 60, borderRadius: 16, marginBottom: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: card.accentBg, border: `1px solid ${card.accent}30`,
                  }}>
                    {card.icon}
                  </div>
                  {/* Başlık */}
                  <div style={{ fontSize: 17, fontWeight: 700, color: hovered ? card.accent : text, marginBottom: 8, transition: 'color 0.15s' }}>
                    {card.title}
                  </div>
                  {/* Açıklama */}
                  <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>
                    {card.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    )
  }

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (isLoading) return (
    <>{backBtn}<motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16, background: bg }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.12)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#6366f1', borderRightColor: 'rgba(99,102,241,0.4)', animation: 'spin 0.9s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#8b5cf6', animation: 'spin 0.6s linear infinite reverse' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{mod === 'duzenle' ? 'CV yükleniyor…' : 'CV optimize ediliyor…'}</p>
        <p style={{ color: muted, fontSize: 13 }}>{mod === 'duzenle' ? 'CV içeriği ayrıştırılıyor, birkaç saniye sürebilir.' : "Yapay zeka CV'nizi analiz ediyor, bu 15–30 saniye sürebilir."}</p>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {[0, 0.2, 0.4].map(delay => (
          <div key={delay} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', animation: `pulse 1.2s ease-in-out ${delay}s infinite` }} />
        ))}
      </div>
    </motion.div></>
  )

  // ── Upload screen ──────────────────────────────────────────────────────────────
  if (!optimizedData) {
    const effectiveCv = originalCV || pasteText
    const canOptimize = effectiveCv.length >= 20

    return (
      <>{backBtn}<motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ minHeight: 'calc(100vh - 64px)', background: bg, padding: '32px 16px' }}
      >
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ maxWidth: mod === 'duzenle' ? 480 : 640, margin: '0 auto' }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 16, background: mod === 'duzenle' ? (d ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)') : (d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)'), marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>{mod === 'duzenle' ? '✏️' : '✨'}</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: text, marginBottom: 8 }}>
              {mod === 'duzenle' ? "CV'mi Düzenle" : 'İş İlanına Göre Hazırla'}
            </h1>
            <p style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>
              {mod === 'duzenle'
                ? "CV dosyanızı yükleyin, içerik otomatik doldurulsun. Ardından şablon ve alanları düzenleyebilirsiniz."
                : "CV'nizi yükleyin, opsiyonel iş ilanı ekleyin. Yapay zeka analiz edip ATS skoru ve optimize edilmiş CV hazırlasın."}
            </p>
          </div>

          {/* CV Upload area */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 8 }}>CV Dosyanız <span style={{ color: '#ef4444' }}>*</span></label>
            <div
              onClick={() => !extracting && fileInputRef.current?.click()}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDragEnd={() => setIsDragging(false)}
              style={{
                border: isDragging
                  ? '2px dashed #6366f1'
                  : originalCV
                  ? '2px solid #10b981'
                  : fileError
                  ? '2px dashed #ef4444'
                  : `2px dashed ${border}`,
                borderRadius: 14,
                padding: 24,
                textAlign: 'center',
                cursor: extracting ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                background: isDragging
                  ? d ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)'
                  : originalCV
                  ? d ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.03)'
                  : surface,
                transform: isDragging ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {extracting ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ fontSize: 13, color: muted }}>CV okunuyor…</p>
                </div>
              ) : originalCV ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 28 }}>✅</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{cvFileName || 'CV yüklendi'}</p>
                  <p style={{ fontSize: 12, color: muted }}>{originalCV.length.toLocaleString('tr-TR')} karakter</p>
                  <button onClick={e => { e.stopPropagation(); setOriginalCV('', ''); setFileError('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <X size={14} /> Kaldır
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={20} style={{ color: '#6366f1' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 2 }}>CV'nizi sürükleyin veya seçin</p>
                    <p style={{ fontSize: 12, color: muted }}>PDF, Word (.docx) veya TXT • Maks. 5 MB</p>
                  </div>
                </div>
              )}
            </div>
            {fileError && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, color: '#ef4444' }}><AlertCircle size={14} />{fileError}</div>}
          </div>

          {/* Paste toggle — sadece ilana-gore modunda */}
          {mod !== 'duzenle' && <div style={{ marginBottom: 20 }}>
            <button onClick={() => setPasteOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: muted, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              {pasteOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} CV metnini yapıştırmak istiyorum
            </button>
            {pasteOpen && (
              <div style={{ marginTop: 8 }}>
                <textarea value={pasteText} onChange={e => { setPasteText(e.target.value); if (originalCV) setOriginalCV('', '') }}
                  placeholder="CV içeriğinizi buraya yapıştırın…"
                  rows={6}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: `1px solid ${inputBdr}`, background: inputBg, color: text, fontSize: 13, lineHeight: 1.65, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                {pasteText.length > 0 && <p style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>✓ {pasteText.length.toLocaleString('tr-TR')} karakter</p>}
              </div>
            )}
          </div>}

          {/* Job description (optional) — sadece ilana-gore modunda */}
          {mod !== 'duzenle' && <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 4 }}>
              İş İlanı <span style={{ fontSize: 12, fontWeight: 400, color: muted }}>(opsiyonel — ATS skoru için)</span>
            </label>
            <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value.slice(0, 3000))}
              placeholder="Başvurduğunuz pozisyona ait iş tanımını yapıştırın…"
              rows={4}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: `1px solid ${inputBdr}`, background: inputBg, color: text, fontSize: 13, lineHeight: 1.65, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 12, color: muted, marginTop: 4 }}>{jobDescription.length} / 3000</div>
          </div>}

          {/* Optimize Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={mod === 'duzenle' ? handleParseAndEdit : handleOptimize} disabled={!canOptimize}
              style={{ flex: 1, minWidth: 200, padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: canOptimize ? 'pointer' : 'not-allowed', background: canOptimize ? (mod === 'duzenle' ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)') : (d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: canOptimize ? '#fff' : muted, boxShadow: canOptimize ? (mod === 'duzenle' ? '0 8px 24px rgba(59,130,246,0.3)' : '0 8px 24px rgba(99,102,241,0.3)') : 'none', transition: 'all 0.2s' }}>
              {mod === 'duzenle' ? '✏️ Düzenleyiciyi Aç' : '✨ CV Optimize Et'}
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: d ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div></>
    )
  }

  // ── Editor layout ──────────────────────────────────────────────────────────────
  const analysis = optimizedData.analysis

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
      style={{ height: '100vh', paddingTop: 64, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {backBtn}
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:768px){.cv-right-sidebar{display:none!important}}
      `}</style>

      {/* Two panels */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left panel ── */}
        <div style={{ width: 320, flexShrink: 0, background: surface, borderRight: `1px solid ${border}`, overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Fotoğraf */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Fotoğraf</p>
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handlePhotoFile(e.target.files[0])} />
              {profileImage ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <img src={profileImage} alt="" style={{ width: 40, height: 40, borderRadius: photoShape === 'rounded-full' ? '50%' : photoShape === 'rounded-none' ? 4 : 8, objectFit: 'cover', border: `1px solid ${border}` }} />
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
                    <button onClick={() => photoInputRef.current?.click()} style={{ fontSize: 10, color: '#6366f1', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, textAlign: 'left' as const }}>Değiştir</button>
                    <button onClick={() => setProfileImage(null)} style={{ fontSize: 10, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>Kaldır</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => photoInputRef.current?.click()}
                  style={{ width: '100%', padding: '9px', borderRadius: 9, border: `1.5px dashed ${border}`, background: 'transparent', color: muted, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 8 }}>
                  + Fotoğraf Ekle
                </button>
              )}
              {(activeTemplate === 'modern' || activeTemplate === 'professional') && (
                <>
                  <div style={{ display: 'flex', gap: 5, marginBottom: profileImage ? 10 : 0 }}>
                    {PHOTO_SHAPES.map(s => (
                      <button key={s.value} onClick={() => setPhotoShape(s.value)}
                        style={{ flex: 1, padding: '5px 2px', fontSize: 10, fontWeight: 600, borderRadius: 6, border: `1.5px solid ${photoShape === s.value ? '#6366f1' : border}`, background: photoShape === s.value ? (d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)') : 'transparent', color: photoShape === s.value ? '#6366f1' : muted, cursor: 'pointer' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {profileImage && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: muted }}>Boyut</span>
                        <span style={{ fontSize: 10, color: muted }}>{Math.round(photoSize)}px</span>
                      </div>
                      <input type="range" min={50} max={150} step={1} value={photoSize}
                        onChange={e => setPhotoTransform(Number(e.target.value), photoObjectX, photoObjectY, photoScale)}
                        style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }} />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Şablon */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>Şablon</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  ...(activeTemplate === 'mevcut' || mod === 'duzenle' ? [{ id: 'mevcut' as TemplateId, label: 'Mevcut CV', desc: 'Orijinal içerik' }] : []),
                  { id: 'modern' as TemplateId,       label: 'Modern',       desc: 'Çağdaş & dinamik' },
                  { id: 'classic' as TemplateId,      label: 'Klasik',       desc: 'Geleneksel & güvenilir' },
                  { id: 'professional' as TemplateId, label: 'Profesyonel',  desc: 'Kurumsal & güçlü' },
                ] as const).map(({ id, label, desc }) => {
                  const active = activeTemplate === id
                  // Mevcut CV thumbnail
                  if (id === 'mevcut') {
                    return (
                      <button key={id} onClick={() => setActiveTemplate(id)} style={{
                        padding: 0, borderRadius: 10,
                        border: `2px solid ${active ? '#6366f1' : (d ? '#2d3748' : '#e2e8f0')}`,
                        background: 'transparent', cursor: 'pointer',
                        transition: 'all 0.15s', textAlign: 'left' as const,
                        boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                        position: 'relative' as const, overflow: 'hidden',
                      }}>
                        <div style={{ height: 130, overflow: 'hidden', borderRadius: '8px 8px 0 0', background: d ? '#1e2433' : '#f9fafb', padding: '8px 9px' }}>
                          {/* Simüle edilmiş düz metin CV */}
                          <div style={{ height: 5, width: '62%', borderRadius: 1, background: d ? '#e2e8f0' : '#1e293b', marginBottom: 2 }} />
                          <div style={{ height: 2, width: '40%', borderRadius: 1, background: d ? '#6b7280' : '#64748b', marginBottom: 5 }} />
                          {[['İŞ DENEYİMİ', 80, 70, 60], ['EĞİTİM', 72], ['BECERİLER', 85, 50, 65]].map((group, gi) => (
                            <div key={gi} style={{ marginBottom: 5 }}>
                              <div style={{ height: 1.5, width: '38%', borderRadius: 1, background: d ? '#94a3b8' : '#475569', marginBottom: 2 }} />
                              {(group.slice(1) as number[]).map((w, i) => <div key={i} style={{ height: 1.5, width: `${w}%`, borderRadius: 1, background: d ? '#374151' : '#d1d5db', marginBottom: 1.5 }} />)}
                            </div>
                          ))}
                        </div>
                        {active && (
                          <div style={{ position: 'absolute' as const, top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>
                          </div>
                        )}
                        <div style={{ padding: '6px 8px 7px', borderTop: `1px solid ${d ? '#2d3748' : '#f1f5f9'}` }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: active ? '#6366f1' : text, marginBottom: 1 }}>Mevcut CV</div>
                          <div style={{ fontSize: 9.5, color: muted }}>Orijinal içerik</div>
                        </div>
                      </button>
                    )
                  }
                  // Shared mini-section renderer
                  const miniSection = (_label: string, rows: number[], accent: string, center = false) => (
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ height: 1.5, width: '33%', borderRadius: 1, background: accent, marginBottom: 2, marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0 }} />
                      {rows.map((w, i) => <div key={i} style={{ height: 1.5, width: `${w}%`, borderRadius: 1, background: d ? '#374151' : '#d1d5db', marginBottom: 1.5, marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0 }} />)}
                    </div>
                  )
                  const miniChips = (accent: string) => (
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' as const, marginBottom: 2 }}>
                      {['React','Python','SQL','AWS'].map(s => (
                        <div key={s} style={{ padding: '0.5px 3px', borderRadius: 3, background: `${accent}22`, border: `0.5px solid ${accent}55`, fontSize: 5, color: accent, lineHeight: 1.6 }}>{s}</div>
                      ))}
                    </div>
                  )
                  const mockup = (() => {
                    if (id === 'modern') return (
                      <div style={{ width: '100%', height: '100%', background: d ? '#1e2433' : '#f8f9fb', borderRadius: '4px 4px 0 0', overflow: 'hidden', position: 'relative' as const }}>
                        <div style={{ position: 'absolute' as const, left: 0, top: 0, bottom: 0, width: 3, background: themeColor }} />
                        <div style={{ padding: '6px 6px 4px 10px' }}>
                          <div style={{ height: 5, width: '55%', borderRadius: 2, background: themeColor, marginBottom: 2 }} />
                          <div style={{ height: 2.5, width: '38%', borderRadius: 1, background: d ? '#4b5563' : '#94a3b8', marginBottom: 1.5 }} />
                          <div style={{ height: 1, background: d ? '#2d3748' : '#e2e8f0', marginBottom: 4 }} />
                          {miniSection('ÖZET', [90, 75, 60], themeColor)}
                          {miniSection('DENEYİM', [80, 70, 65, 55], themeColor)}
                          {miniSection('EĞİTİM', [70], themeColor)}
                          {miniChips(themeColor)}
                        </div>
                      </div>
                    )
                    if (id === 'classic') return (
                      <div style={{ width: '100%', height: '100%', background: d ? '#1e2433' : '#fafafa', borderRadius: '4px 4px 0 0', overflow: 'hidden', padding: '6px 7px' }}>
                        <div style={{ height: 5, width: '52%', borderRadius: 2, background: d ? '#e2e8f0' : '#1e293b', margin: '0 auto 1.5px' }} />
                        <div style={{ height: 2.5, width: '36%', borderRadius: 1, background: d ? '#6b7280' : '#94a3b8', margin: '0 auto 3px' }} />
                        <div style={{ height: 0.5, background: d ? '#374151' : '#cbd5e1', marginBottom: 4 }} />
                        {miniSection('ÖZET', [90, 72], d ? '#94a3b8' : '#475569', true)}
                        {miniSection('DENEYİM', [80, 68, 60], d ? '#94a3b8' : '#475569', false)}
                        {miniSection('EĞİTİM', [65], d ? '#94a3b8' : '#475569', false)}
                        {miniChips(d ? '#94a3b8' : '#475569')}
                      </div>
                    )
                    if (id === 'professional') return (
                      <div style={{ width: '100%', height: '100%', borderRadius: '4px 4px 0 0', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: '32%', background: themeColor, padding: '6px 4px' }}>
                          <div style={{ height: 4, width: '85%', borderRadius: 2, background: 'rgba(255,255,255,0.85)', marginBottom: 1.5 }} />
                          <div style={{ height: 2, width: '65%', borderRadius: 1, background: 'rgba(255,255,255,0.5)', marginBottom: 3 }} />
                          {['BECERİLER','DİL','İLETİŞİM'].map((_s, i) => (
                            <div key={i} style={{ marginBottom: 3 }}>
                              <div style={{ height: 1.5, width: '70%', borderRadius: 1, background: 'rgba(255,255,255,0.7)', marginBottom: 1 }} />
                              {[85,65,75].map((w, j) => <div key={j} style={{ height: 1, width: `${w}%`, borderRadius: 1, background: 'rgba(255,255,255,0.35)', marginBottom: 1 }} />)}
                            </div>
                          ))}
                        </div>
                        <div style={{ flex: 1, background: d ? '#1e2433' : '#ffffff', padding: '6px 5px' }}>
                          {miniSection('ÖZET', [88, 70], d ? '#94a3b8' : '#475569')}
                          {miniSection('DENEYİM', [78, 65, 58], d ? '#94a3b8' : '#475569')}
                          {miniSection('EĞİTİM', [62], d ? '#94a3b8' : '#475569')}
                        </div>
                      </div>
                    )
                    if (id === 'elegant') {
                      const gold = d ? '#c8a060' : '#92704d'
                      return (
                        <div style={{ width: '100%', height: '100%', background: d ? '#1e2433' : '#fffdf7', borderRadius: '4px 4px 0 0', overflow: 'hidden', padding: '6px 7px' }}>
                          <div style={{ height: 4.5, width: '48%', borderRadius: 1, background: gold, margin: '0 auto 1px', fontStyle: 'italic' }} />
                          <div style={{ height: 2, width: '32%', borderRadius: 1, background: d ? '#6b5c4a' : '#c8a882', margin: '0 auto 3px' }} />
                          <div style={{ height: 0.5, background: gold, marginBottom: 4 }} />
                          {miniSection('ÖZET', [88, 72], gold, false)}
                          {miniSection('DENEYİM', [76, 63, 57], gold, false)}
                          {miniSection('EĞİTİM', [60], gold, false)}
                          {miniChips(gold)}
                        </div>
                      )
                    }
                    // bold
                    return (
                      <div style={{ width: '100%', height: '100%', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                        <div style={{ background: themeColor, padding: '6px 7px 5px' }}>
                          <div style={{ height: 5, width: '58%', borderRadius: 2, background: 'rgba(255,255,255,0.92)', marginBottom: 1.5 }} />
                          <div style={{ height: 2.5, width: '40%', borderRadius: 1, background: 'rgba(255,255,255,0.55)', marginBottom: 1 }} />
                          <div style={{ height: 1, background: 'rgba(255,255,255,0.3)', marginBottom: 0 }} />
                        </div>
                        <div style={{ background: d ? '#1e2433' : '#ffffff', padding: '4px 7px' }}>
                          {miniSection('ÖZET', [86, 70], themeColor)}
                          {miniSection('DENEYİM', [76, 62, 55], themeColor)}
                          {miniSection('EĞİTİM', [60], themeColor)}
                          {miniChips(themeColor)}
                        </div>
                      </div>
                    )
                  })()

                  return (
                    <button key={id} onClick={() => setActiveTemplate(id)} style={{
                      padding: 0, borderRadius: 10,
                      border: `2px solid ${active ? '#6366f1' : (d ? '#2d3748' : '#e2e8f0')}`,
                      background: 'transparent', cursor: 'pointer',
                      transition: 'all 0.15s', textAlign: 'left' as const,
                      boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                      position: 'relative' as const, overflow: 'hidden',
                    }}>
                      {/* Thumbnail */}
                      <div style={{ height: 130, overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
                        {mockup}
                      </div>
                      {/* Tik işareti */}
                      {active && (
                        <div style={{ position: 'absolute' as const, top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>
                        </div>
                      )}
                      {/* Etiket */}
                      <div style={{ padding: '6px 8px 7px', borderTop: `1px solid ${d ? '#2d3748' : '#f1f5f9'}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: active ? '#6366f1' : text, marginBottom: 1 }}>{label}</div>
                        <div style={{ fontSize: 9.5, color: muted, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Renk */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Renk</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setThemeColor(c)}
                    style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `2px solid ${themeColor === c ? '#fff' : 'transparent'}`, outline: themeColor === c ? `2px solid ${c}` : 'none', cursor: 'pointer', transition: 'all 0.15s' }} />
                ))}
              </div>
              <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)}
                style={{ width: '100%', height: 30, borderRadius: 8, border: `1px solid ${border}`, cursor: 'pointer', background: 'transparent' }} />
            </div>

            {/* Ses Tonu */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Ses Tonu</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {([['first', '1. Şahıs'], ['third', '3. Şahıs']] as const).map(([v, lbl]) => (
                  <button key={v} onClick={() => setNarrativeVoice(v)}
                    style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: `2px solid ${narrativeVoice === v ? '#6366f1' : border}`, background: narrativeVoice === v ? (d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)') : 'transparent', color: narrativeVoice === v ? '#6366f1' : text, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Metin Hizalama */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 }}>Metin Hizalama</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {([
                  ['text-left',    '⬅', 'Sol'],
                  ['text-center',  '↔', 'Orta'],
                  ['text-right',   '➡', 'Sağ'],
                  ['text-justify', '☰', 'Yası'],
                ] as const).map(([v, icon, lbl]) => (
                  <button key={v} onClick={() => setTextAlign(v)} title={lbl}
                    style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: `2px solid ${textAlign === v ? '#6366f1' : border}`, background: textAlign === v ? (d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)') : 'transparent', color: textAlign === v ? '#6366f1' : text, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* AI ile Madde Ekle */}
            {optimizedData && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>AI ile Madde Ekle</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Section selector */}
                  <select
                    value={addItemSection}
                    onChange={e => setAddItemSection(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${inputBdr}`, background: inputBg, color: text, fontSize: 12, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="experience">İş Deneyimi</option>
                    <option value="education">Eğitim</option>
                    <option value="skills">Beceri</option>
                    <option value="additional">Ek Bilgi</option>
                    <option value="summary">Özet Güncelle</option>
                    <option value="customLink">Özel Link</option>
                    <option value="customSection">Yeni Özel Alan</option>
                  </select>
                  {/* Custom section title input */}
                  {addItemSection === 'customSection' && (
                    <input
                      type="text"
                      value={customSectionTitle}
                      onChange={e => setCustomSectionTitle(e.target.value)}
                      placeholder="Bölüm başlığı (ör: Projelerim, Sertifikalar)"
                      style={{ width: '100%', boxSizing: 'border-box' as const, padding: '8px 10px', borderRadius: 8, border: `1px solid ${inputBdr}`, background: inputBg, color: text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                    />
                  )}
                  {/* Özel Link inputs */}
                  {addItemSection === 'customLink' ? (
                    <>
                      <input
                        type="text"
                        value={customLinkLabel}
                        onChange={e => setCustomLinkLabel(e.target.value)}
                        placeholder="Etiket (ör: GitHub, Portfolio)"
                        style={{ width: '100%', boxSizing: 'border-box' as const, padding: '8px 10px', borderRadius: 8, border: `1px solid ${inputBdr}`, background: inputBg, color: text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <input
                        type="url"
                        value={customLinkUrl}
                        onChange={e => setCustomLinkUrl(e.target.value)}
                        placeholder="URL (ör: https://github.com/kullanici)"
                        style={{ width: '100%', boxSizing: 'border-box' as const, padding: '8px 10px', borderRadius: 8, border: `1px solid ${inputBdr}`, background: inputBg, color: text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                      />
                    </>
                  ) : (
                    /* AI Input */
                    <textarea
                      value={addItemInput}
                      onChange={e => setAddItemInput(e.target.value)}
                      placeholder={
                        addItemSection === 'experience' ? 'Ör: 2022–2024 arası X şirketinde React geliştirici olarak çalıştım…'
                        : addItemSection === 'education' ? 'Ör: Boğaziçi Üniversitesi Bilgisayar Mühendisliği, 2020…'
                        : addItemSection === 'skills' ? 'Ör: Docker, Kubernetes, CI/CD'
                        : addItemSection === 'summary' ? 'Özete eklemek istediğiniz bilgiyi yazın…'
                        : addItemSection === 'customSection' ? 'Ham açıklamanızı yazın; AI profesyonel maddelere dönüştürsün…'
                        : 'Ör: B sınıfı sürücü belgesi, İngilizce C1'
                      }
                      rows={3}
                      style={{ width: '100%', boxSizing: 'border-box' as const, padding: '8px 10px', borderRadius: 8, border: `1px solid ${inputBdr}`, background: inputBg, color: text, fontSize: 12, lineHeight: 1.55, fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const }}
                    />
                  )}
                  {/* Add button */}
                  {addItemSection === 'customLink' ? (
                    <button
                      onClick={handleAddCustomLink}
                      disabled={!customLinkLabel.trim() || !customLinkUrl.trim()}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: 'none',
                        cursor: !customLinkLabel.trim() || !customLinkUrl.trim() ? 'not-allowed' : 'pointer',
                        background: !customLinkLabel.trim() || !customLinkUrl.trim()
                          ? (d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        color: !customLinkLabel.trim() || !customLinkUrl.trim() ? muted : '#fff',
                        fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.15s',
                      }}
                    >
                      🔗 Link Ekle
                    </button>
                  ) : (
                    <button
                      onClick={handleAddItem}
                      disabled={isAddingItem || !addItemInput.trim() || (addItemSection === 'customSection' && !customSectionTitle.trim())}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: 'none',
                        cursor: isAddingItem || !addItemInput.trim() || (addItemSection === 'customSection' && !customSectionTitle.trim()) ? 'not-allowed' : 'pointer',
                        background: isAddingItem || !addItemInput.trim() || (addItemSection === 'customSection' && !customSectionTitle.trim())
                          ? (d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        color: isAddingItem || !addItemInput.trim() || (addItemSection === 'customSection' && !customSectionTitle.trim()) ? muted : '#fff',
                        fontSize: 12, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        opacity: isAddingItem ? 0.7 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isAddingItem ? (
                        <>
                          <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Ekleniyor…
                        </>
                      ) : (
                        '✨ AI ile Ekle'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Center — CV Preview ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', background: d ? '#0d1117' : '#eef0f4' }}>
          <div style={{ width: '100%' }}>
          {/* Mevcut template: orijinal dosyayı görsel olarak göster */}
          {activeTemplate === 'mevcut' && originalPageImages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              {originalPageImages.map((src, i) => (
                <img key={i} src={src} alt={`Sayfa ${i + 1}`}
                  style={{ width: '100%', maxWidth: 794, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', borderRadius: 2, display: 'block' }} />
              ))}
            </div>
          )}
          {activeTemplate === 'mevcut' && !originalPageImages.length && originalDocHtml && (
            <div style={{ maxWidth: 794, margin: '0 auto', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', borderRadius: 2, padding: '48px 56px', minHeight: 1123, fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#111', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: originalDocHtml }} />
          )}
          {!(activeTemplate === 'mevcut' && (originalPageImages.length > 0 || originalDocHtml)) && <CvPreview
            ref={cvPreviewRef}
            data={optimizedData}
            template={activeTemplate}
            themeColor={themeColor}
            narrativeVoice={narrativeVoice}
            textAlign={textAlign}
            profileImage={profileImage}
            photoShape={photoShape}
            photoSize={photoSize}
            photoObjectX={photoObjectX}
            photoObjectY={photoObjectY}
            photoScale={photoScale}
            photoPosX={photoPosX}
            photoPosY={photoPosY}
            onPhotoChange={(sz, x, y, sc) => setPhotoTransform(sz, x, y, sc)}
            onPhotoPosChange={(x, y) => setPhotoPosition(x, y)}
            showIcons={showIcons}
            cvLanguage={cvLanguage}
            sectionsOrder={sectionsOrder}
            customHeadings={customHeadings}
            onUpdate={updateOptimizedData}
            onAddBullet={handleAddBullet}
            onDeleteBullet={(expId, bIdx) => {
              deleteWithUndo('Madde silindi', prev => ({
                ...prev,
                experience: prev.experience.map(exp => exp.id !== expId ? exp : {
                  ...exp,
                  bullets_v1: exp.bullets_v1.filter((_, i) => i !== bIdx),
                  bullets_v3: exp.bullets_v3.filter((_, i) => i !== bIdx),
                }),
              }))
            }}
            onDeleteExperience={(id) => {
              const exp = optimizedData.experience.find(e => e.id === id)
              deleteWithUndo(`"${exp?.role || 'Deneyim'}" silindi`, prev => ({
                ...prev, experience: prev.experience.filter(e => e.id !== id),
              }))
            }}
            onDeleteEducation={(id) => {
              const edu = optimizedData.education.find(e => e.id === id)
              deleteWithUndo(`"${edu?.degree || 'Eğitim'}" silindi`, prev => ({
                ...prev, education: prev.education.filter(e => e.id !== id),
              }))
            }}
            onDeleteSkill={(idx) => {
              const skill = optimizedData.skills[idx]
              deleteWithUndo(`"${skill}" silindi`, prev => ({
                ...prev, skills: prev.skills.filter((_, i) => i !== idx),
              }))
            }}
            onDeleteAdditional={(idx) => {
              const item = optimizedData.additional[idx]
              deleteWithUndo(`"${item}" silindi`, prev => ({
                ...prev, additional: prev.additional.filter((_, i) => i !== idx),
              }))
            }}
            onDeleteSection={(sectionId) => {
              const headingMap: Record<string, string> = { summary: 'Kişisel Özet', experience: 'İş Deneyimi', education: 'Eğitim', skills: 'Teknik Yetenekler', additional: 'Ek Bilgiler' }
              deleteWithUndo(`"${headingMap[sectionId] || sectionId}" bölümü silindi`, prev => {
                if (sectionId === 'summary') return { ...prev, summary_v1: '', summary_v3: '' }
                if (sectionId === 'skills') return { ...prev, skills: [] }
                if (sectionId === 'additional') return { ...prev, additional: [] }
                if (sectionId === 'experience') return { ...prev, experience: [] }
                if (sectionId === 'education') return { ...prev, education: [] }
                const rest = { ...prev } as Record<string, unknown>
                delete rest[sectionId]
                return rest as typeof prev
              })
            }}
            onHeadingChange={(key, value) => setCustomHeadings({ ...customHeadings, [key]: value })}
            onSectionsReorder={(newOrder) => setSectionsOrder(newOrder)}
            onReorderExperience={(from, to) => {
              updateOptimizedData(prev => {
                const arr = [...prev.experience]
                const [item] = arr.splice(from, 1)
                arr.splice(to, 0, item)
                return { ...prev, experience: arr }
              })
            }}
            onReorderEducation={(from, to) => {
              updateOptimizedData(prev => {
                const arr = [...prev.education]
                const [item] = arr.splice(from, 1)
                arr.splice(to, 0, item)
                return { ...prev, education: arr }
              })
            }}
            onDeleteDynamicItem={(sectionId, idx) => {
              deleteWithUndo('Öğe silindi', prev => {
                const arr = [...((prev as Record<string, unknown>)[sectionId] as unknown[])]
                arr.splice(idx, 1)
                return { ...prev, [sectionId]: arr } as OptimizedCvData
              })
            }}
          />}
          </div>
        </div>

        {/* ── Right sidebar — Şablon, Renk, Ses Tonu, Fotoğraf ── */}
        <div className="cv-right-sidebar" style={{ width: 320, flexShrink: 0, background: surface, borderLeft: `1px solid ${border}`, overflowY: 'auto', padding: '16px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Aksiyon butonları */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 14, borderBottom: `1px solid ${border}` }}>
              <button onClick={handleDownload} disabled={downloading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', cursor: downloading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}>
                <Download size={14} /> {downloading ? 'Hazırlanıyor…' : 'PDF İndir'}
              </button>
              <button onClick={() => { if (confirm('CV oturumunu sıfırlamak istediğinizden emin misiniz?')) { resetSession(); setPasteText('') } }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: 'transparent', color: muted, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <RotateCcw size={13} /> Yeni CV
              </button>

              {/* Dil Seçimi */}
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 6, background: d ? 'rgba(255,255,255,0.03)' : '#f8f9fa', padding: 4, borderRadius: 10, border: `1px solid ${border}` }}>
                  {([['tr', 'Türkçe'], ['en', 'English']] as const).map(([v, lbl]) => (
                    <button key={v} onClick={() => handleTranslateCV(v as 'tr' | 'en')} disabled={isTranslating || cvLanguage === v}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', background: cvLanguage === v ? '#6366f1' : 'transparent', color: cvLanguage === v ? '#fff' : text, cursor: (isTranslating || cvLanguage === v) ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                {isTranslating && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, fontSize: 11, fontWeight: 600, color: '#6366f1' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
                    {cvLanguage === 'en' ? 'İngilizceye çevriliyor...' : 'Türkçeye çevriliyor...'}
                  </div>
                )}
              </div>
            </div>

            {/* Başlık */}
            <div style={{ paddingBottom: 12, borderBottom: `1px solid ${border}` }}>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: text, marginBottom: 2 }}>CV Düzenleyici</h1>
              <p style={{ fontSize: 11, color: muted }}>Alanları tıklayarak düzenleyebilirsiniz.</p>
            </div>

            {/* Item Management */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>İçerik Yönetimi</p>

              {/* Experience */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: text }}>Deneyim ({optimizedData.experience?.length ?? 0})</span>
                  <button onClick={addExperience} style={{ fontSize: 11, color: '#6366f1', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>+ Ekle</button>
                </div>
                {optimizedData.experience?.map(exp => (
                  <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: d ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', marginBottom: 3 }}>
                    <span style={{ flex: 1, fontSize: 10, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.role || 'Pozisyon'} · {exp.company || 'Şirket'}</span>
                    <button onClick={() => deleteExperience(exp.id)} title="Sil" style={{ fontSize: 14, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0, opacity: 0.6 }}>×</button>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: text }}>Eğitim ({optimizedData.education?.length ?? 0})</span>
                  <button onClick={addEducation} style={{ fontSize: 11, color: '#6366f1', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>+ Ekle</button>
                </div>
                {optimizedData.education?.map(edu => (
                  <div key={edu.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: d ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', marginBottom: 3 }}>
                    <span style={{ flex: 1, fontSize: 10, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{edu.degree || 'Bölüm'}</span>
                    <button onClick={() => deleteEducation(edu.id)} title="Sil" style={{ fontSize: 14, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0, opacity: 0.6 }}>×</button>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: text }}>Beceriler ({optimizedData.skills?.length ?? 0})</span>
                  <button onClick={addSkill} style={{ fontSize: 11, color: '#6366f1', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>+ Ekle</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {optimizedData.skills?.map((skill, si) => (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 6px', borderRadius: 20, background: d ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <span style={{ fontSize: 10, color: '#6366f1' }}>{skill}</span>
                      <button onClick={() => deleteSkill(si)} style={{ fontSize: 12, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.6 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: text }}>Ek Bilgiler ({optimizedData.additional?.length ?? 0})</span>
                  <button onClick={addAdditional} style={{ fontSize: 11, color: '#6366f1', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>+ Ekle</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {optimizedData.additional?.map((item, ai) => (
                    <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 6px', borderRadius: 20, background: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${border}` }}>
                      <span style={{ fontSize: 10, color: muted }}>{item}</span>
                      <button onClick={() => deleteAdditional(ai)} style={{ fontSize: 12, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.6 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Özel Linkler */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: text }}>Özel Linkler ({optimizedData.customLinks?.filter(cl => !cl.url?.toLowerCase().includes('linkedin.com')).length ?? 0})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {(optimizedData.customLinks ?? []).filter(cl => !cl.url?.toLowerCase().includes('linkedin.com')).map((cl, ci) => {
                    const realIdx = (optimizedData.customLinks ?? []).findIndex(x => x === cl)
                    return (
                      <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: d ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                        <span style={{ flex: 1, fontSize: 10, color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cl.label} · {cl.url}</span>
                        <button onClick={() => deleteCustomLink(realIdx)} title="Sil" style={{ fontSize: 14, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0, opacity: 0.6 }}>×</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ATS Panel — sifirdan modunda hesaplanmış skor, diğer modlarda AI analizi */}
            {mod === 'sifirdan' ? (() => {
              const { score, checks } = computeSifirdanAts(optimizedData)
              const sc = score >= 91 ? '#10b981' : score >= 71 ? '#3b82f6' : score >= 41 ? '#f59e0b' : '#ef4444'
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase' as const, letterSpacing: 1, margin: 0 }}>ATS Uyumluluğu</p>
                    <span style={{ fontSize: 22, fontWeight: 900, color: sc }}>{score}</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 8, borderRadius: 4, background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ height: '100%', width: `${score}%`, background: sc, borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                  {/* Checks */}
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                    {checks.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 10.5, color: c.passed ? (d ? '#86efac' : '#16a34a') : (d ? '#fca5a5' : '#dc2626') }}>
                        <span style={{ flexShrink: 0, lineHeight: 1.4 }}>{c.passed ? '✓' : '✗'}</span>
                        <span style={{ lineHeight: 1.4 }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })() : analysis && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>ATS Raporu</p>
                {/* Scores */}
                <div style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: d ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor(analysis.scores.overall) }}>{analysis.scores.overall}</div>
                  <div style={{ fontSize: 10, color: muted, marginBottom: 8 }}>Genel Uyum Skoru</div>
                  {Object.entries({ skills: 'Beceri', experience: 'Deneyim', education: 'Eğitim' } as const).map(([k, lbl]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: muted, width: 52, textAlign: 'left', flexShrink: 0 }}>{lbl}</span>
                      <div style={{ flex: 1, height: 4, borderRadius: 4, background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${analysis.scores[k as keyof typeof analysis.scores]}%`, background: scoreColor(analysis.scores[k as keyof typeof analysis.scores]), borderRadius: 4, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor(analysis.scores[k as keyof typeof analysis.scores]), width: 24, textAlign: 'right', flexShrink: 0 }}>{analysis.scores[k as keyof typeof analysis.scores]}</span>
                    </div>
                  ))}
                </div>
                {/* Hard Skills */}
                {analysis.matches.hard_skills?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', marginBottom: 5 }}>🔧 Teknik Beceri Eşleşmeleri</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                      {analysis.matches.hard_skills.map((s, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: d ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>✓ {s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Soft Skills */}
                {analysis.matches.soft_skills?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', marginBottom: 5 }}>💬 Yumuşak Beceri Eşleşmeleri</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                      {analysis.matches.soft_skills.map((s, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: d ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>✓ {s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Stratejik Olarak Beklenen Kelimeler */}
                {analysis.additions?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', marginBottom: 5 }}>💡 Stratejik Olarak Beklenen Kelimeler</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                      {analysis.additions.map((a, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: d ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>+ {a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Gaps — Checkbox'lu seçim + Toplu Yedirme butonu */}
                {analysis.gaps?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginBottom: 5 }}>⚠ Eksik Alanlar</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {analysis.gaps.map((g, i) => (
                        <label key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 6, fontSize: 10,
                          padding: '4px 8px', borderRadius: 8, cursor: 'pointer',
                          background: selectedGaps.includes(g)
                            ? (d ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)')
                            : (d ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                          border: `1px solid ${selectedGaps.includes(g) ? 'rgba(245,158,11,0.4)' : 'transparent'}`,
                          transition: 'all 0.15s',
                        }}>
                          <input
                            type="checkbox"
                            checked={selectedGaps.includes(g)}
                            onChange={() => toggleGapSelection(g)}
                            style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
                          />
                          <span style={{ color: d ? '#fbbf24' : '#d97706', flex: 1 }}>{g}</span>
                        </label>
                      ))}
                    </div>
                    {selectedGaps.length > 0 && (
                      <button
                        onClick={handleIntegrateBatchGaps}
                        disabled={isIntegratingGaps}
                        style={{
                          width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 8,
                          border: 'none', cursor: isIntegratingGaps ? 'wait' : 'pointer',
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: '#fff', fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          opacity: isIntegratingGaps ? 0.7 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        {isIntegratingGaps ? (
                          <>
                            <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            Yediriliyor…
                          </>
                        ) : (
                          `🪄 CV'ye Yedir (${selectedGaps.length})`
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Warnings Panel */}
            {mod !== 'sifirdan' && optimizedData.warnings && optimizedData.warnings.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Öneriler</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {optimizedData.warnings.map((w, i) => {
                    const isHigh = w.severity === 'high'
                    const isMed  = w.severity === 'medium'
                    const accent = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#6366f1'
                    const bg     = isHigh
                      ? (d ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)')
                      : isMed
                      ? (d ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)')
                      : (d ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)')
                    return (
                      <div key={i} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${accent}30`, background: bg, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1 }}>
                          {isHigh ? '🔴' : isMed ? '🟡' : '🔵'}
                        </span>
                        <p style={{ fontSize: 10.5, color: text, lineHeight: 1.45, margin: 0, flex: 1 }}>{w.message}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Undo Toast ── */}
      {undoSnapshot && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 18px', borderRadius: 12,
          background: d ? '#1e293b' : '#1e293b',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'fadeUp 0.2s ease',
          minWidth: 260,
        }}>
          <span style={{ fontSize: 16 }}>🗑</span>
          <span style={{ flex: 1, fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>
            {undoSnapshot.label}
          </span>
          <button
            onClick={handleUndo}
            style={{
              padding: '5px 12px', borderRadius: 7, border: 'none',
              background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
          >
            Geri Al
          </button>
          <button
            onClick={() => setUndoSnapshot(null)}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
          >
            ×
          </button>
        </div>
      )}
    </motion.div>
  )
}
