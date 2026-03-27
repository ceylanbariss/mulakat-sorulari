import { create } from 'zustand'
import type { CvData, AtsAnalysis } from '../types/cv'

export type CvStep = 1 | 2 | 3

export const EMPTY_CV: CvData = {
  kisiselBilgiler: { ad: '', unvan: '', email: '', telefon: '', konum: '', linkedin: '', github: '', website: '', ozet: '' },
  deneyim: [],
  egitim: [],
  beceriler: { teknik: [], diger: [] },
  diller: [],
  sertifikalar: [],
}

interface CvState {
  step: CvStep
  cvText: string
  cvFileName: string
  jobDescription: string
  isProcessing: boolean
  processingError: string
  cvData: CvData | null
  atsAnalysis: AtsAnalysis | null
  savedSessionId: string | null
  isSaving: boolean

  setCvText: (text: string, fileName: string) => void
  setJobDescription: (text: string) => void
  setCvData: (data: CvData) => void
  updateCvData: (updater: (prev: CvData) => CvData) => void
  setAtsAnalysis: (analysis: AtsAnalysis | null) => void
  setProcessing: (v: boolean, error?: string) => void
  setSaved: (id: string | null) => void
  setSaving: (v: boolean) => void
  goToStep: (step: CvStep) => void
  resetSession: () => void
}

const initialState = {
  step: 1 as CvStep,
  cvText: '',
  cvFileName: '',
  jobDescription: '',
  isProcessing: false,
  processingError: '',
  cvData: null,
  atsAnalysis: null,
  savedSessionId: null,
  isSaving: false,
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
  goToStep: (step) => set({ step }),
  resetSession: () => set(initialState),
}))
