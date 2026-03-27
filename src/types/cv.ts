// ─── Core CV Data ──────────────────────────────────────────────────────────────

export interface KisiselBilgiler {
  ad: string
  unvan: string
  email: string
  telefon: string
  konum: string
  linkedin?: string
  github?: string
  website?: string
  ozet: string
}

export interface Deneyim {
  id: string
  sirket: string
  pozisyon: string
  baslangic: string
  bitis: string
  halen: boolean
  aciklama: string[]
}

export interface Egitim {
  id: string
  okul: string
  derece: string
  alan: string
  baslangic: string
  bitis: string
  gpa?: string
}

export interface Beceriler {
  teknik: string[]
  diger: string[]
}

export interface Dil {
  id: string
  dil: string
  seviye: string
}

export interface Sertifika {
  id: string
  ad: string
  kurum: string
  tarih: string
  url?: string
}

export interface CvData {
  kisiselBilgiler: KisiselBilgiler
  deneyim: Deneyim[]
  egitim: Egitim[]
  beceriler: Beceriler
  diller?: Dil[]
  sertifikalar?: Sertifika[]
}

// ─── ATS Analysis ──────────────────────────────────────────────────────────────

export interface AtsAnalysis {
  genelSkor: number
  deneyimSkor: number
  egitimSkor: number
  beceriSkor: number
  eslesen: {
    teknikBeceriler: string[]
    yazilimlar: string[]
    anahterKelimeler: string[]
  }
  eksik: string[]
  oneriler: string[]
}

// ─── API ───────────────────────────────────────────────────────────────────────

export interface CvOptimizeRequest {
  cvText: string
  jobDescription?: string
  language: 'tr' | 'en'
}

export interface CvOptimizeResponse {
  cvData: CvData
  atsAnalysis?: AtsAnalysis | null
}

// ─── Firebase ──────────────────────────────────────────────────────────────────

export interface CvSessionData {
  userId: string
  cvData: CvData
  atsAnalysis?: AtsAnalysis
  jobDescription?: string
  orijinalDosyaAdi?: string
  ad?: string
  dil: 'tr' | 'en'
}
