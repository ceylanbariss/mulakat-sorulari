import { create } from 'zustand'
import type { CvData, AtsAnalysis, CvTemplateId, PhotoShape } from '../types/cv'

export const EMPTY_CV: CvData = {
  kisiselBilgiler: { ad: '', unvan: '', email: '', telefon: '', konum: '', linkedin: '', github: '', website: '', ozet: '' },
  deneyim: [],
  egitim: [],
  beceriler: { teknik: [], diger: [] },
  diller: [],
  sertifikalar: [],
}

interface CvState {
  // CV content
  cvText: string
  cvFileName: string
  jobDescription: string
  isProcessing: boolean
  processingError: string
  cvData: CvData | null
  atsAnalysis: AtsAnalysis | null
  savedSessionId: string | null
  isSaving: boolean

  // Design settings
  template: CvTemplateId
  accentColor: string
  voice: 'first' | 'third'
  textAlign: 'left' | 'center' | 'right' | 'justify'
  photoDataUrl: string | null
  photoShape: PhotoShape

  // Actions
  setCvText: (text: string, fileName: string) => void
  setJobDescription: (text: string) => void
  setCvData: (data: CvData) => void
  updateCvData: (updater: (prev: CvData) => CvData) => void
  setAtsAnalysis: (analysis: AtsAnalysis | null) => void
  setProcessing: (v: boolean, error?: string) => void
  setSaved: (id: string | null) => void
  setSaving: (v: boolean) => void
  setTemplate: (t: CvTemplateId) => void
  setAccentColor: (c: string) => void
  setVoice: (v: 'first' | 'third') => void
  setTextAlign: (a: 'left' | 'center' | 'right' | 'justify') => void
  setPhoto: (dataUrl: string | null, shape: PhotoShape) => void
  resetSession: () => void
}

const initialState = {
  cvText: '',
  cvFileName: '',
  jobDescription: '',
  isProcessing: false,
  processingError: '',
  cvData: null,
  atsAnalysis: null,
  savedSessionId: null,
  isSaving: false,
  template: 'modern' as CvTemplateId,
  accentColor: '#6366f1',
  voice: 'first' as const,
  textAlign: 'left' as const,
  photoDataUrl: null,
  photoShape: 'circle' as PhotoShape,
}

export const useCvStore = create<CvState>((set) => ({
  ...initialState,

  setCvText: (text, fileName) => set({ cvText: text, cvFileName: fileName }),
  setJobDescription: (text) => set({ jobDescription: text }),
  setCvData: (data) => set({ cvData: data }),
  updateCvData: (updater) => set((state) => ({ cvData: state.cvData ? updater(state.cvData) : state.cvData })),
  setAtsAnalysis: (analysis) => set({ atsAnalysis: analysis }),
  setProcessing: (v, error = '') => set({ isProcessing: v, processingError: error }),
  setSaved: (id) => set({ savedSessionId: id }),
  setSaving: (v) => set({ isSaving: v }),
  setTemplate: (t) => set({ template: t }),
  setAccentColor: (c) => set({ accentColor: c }),
  setVoice: (v) => set({ voice: v }),
  setTextAlign: (a) => set({ textAlign: a }),
  setPhoto: (dataUrl, shape) => set({ photoDataUrl: dataUrl, photoShape: shape }),
  resetSession: () => set({ ...initialState }),
}))
