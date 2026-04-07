// ─── CV Module Types (Hazircv / Resumatch v2 schema) ─────────────────────────

export interface CvWarning {
  type: string
  severity: 'high' | 'medium' | 'low'
  message: string
  action: 'remove' | 'improve' | 'add'
}

export interface CustomLink {
  label: string
  url: string
}

export interface OptimizedCvData {
  name: string
  title: string
  location: string
  phone: string
  email: string
  linkedin: string
  summary_v1: string    // 1. tekil şahıs (Ben)
  summary_v3: string    // 3. tekil şahıs (O)
  experience: {
    id: string
    role: string
    company: string
    date: string
    bullets_v1: string[]
    bullets_v3: string[]
    bullets: string[]
  }[]
  education: {
    id: string
    degree: string
    school: string
    date: string
    details: string
    details_v1?: string   // 1. tekil şahıs (Ben)
    details_v3?: string   // 3. tekil şahıs (O)
  }[]
  skills: string[]
  additional: string[]
  customLinks?: CustomLink[]
  warnings?: CvWarning[]
  analysis: AtsAnalysis
  [key: string]: unknown  // custom_ bölümler için
}

export interface AtsAnalysis {
  scores: {
    overall: number
    skills: number
    experience: number
    education: number
  }
  matches: {
    hard_skills: string[]
    soft_skills: string[]
  }
  gaps: string[]
  additions: string[]
  gap_mapping?: Record<string, string>
}

export type TemplateId = 'modern' | 'classic' | 'professional' | 'elegant' | 'bold' | 'mevcut'
export type NarrativeVoice = 'first' | 'third'
export type PhotoShapeClass = 'rounded-none' | 'rounded-lg' | 'rounded-full'

export interface CvOptimizeRequest {
  cvText: string
  jobDescription?: string
  language: 'tr' | 'en'
}

// ─── Legacy types kept for Firebase/Firestore compatibility ──────────────────

export type CvTemplateId = TemplateId
export type PhotoShape = 'square' | 'rounded' | 'circle'

export interface CvSessionData {
  userId: string
  optimizedData: OptimizedCvData
  jobDescription?: string
  orijinalDosyaAdi?: string
  dil: 'tr' | 'en'
}
