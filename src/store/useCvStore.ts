import { create } from 'zustand'
import type { OptimizedCvData, TemplateId, NarrativeVoice, PhotoShapeClass } from '../types/cv'

interface CvState {
  // CV content
  originalCV: string
  cvFileName: string
  jobDescription: string
  optimizedData: OptimizedCvData | null
  cvLanguage: 'tr' | 'en'
  isLoading: boolean
  error: string | null

  // Design settings
  activeTemplate: TemplateId
  themeColor: string
  narrativeVoice: NarrativeVoice
  textAlign: string
  profileImage: string | null
  photoShape: PhotoShapeClass
  photoSize: number
  photoObjectX: number
  photoObjectY: number
  photoScale: number
  photoPosX: number | null
  photoPosY: number | null
  showIcons: boolean
  showHighlights: boolean
  sectionsOrder: string[]
  customHeadings: Record<string, string>
  termsAccepted: boolean

  // Actions
  setOriginalCV: (text: string, fileName?: string) => void
  setJobDescription: (text: string) => void
  setOptimizedData: (data: OptimizedCvData | null) => void
  updateOptimizedData: (updater: (prev: OptimizedCvData) => OptimizedCvData) => void
  setCvLanguage: (lang: 'tr' | 'en') => void
  setLoading: (v: boolean) => void
  setError: (err: string | null) => void
  setActiveTemplate: (t: TemplateId) => void
  setThemeColor: (c: string) => void
  setNarrativeVoice: (v: NarrativeVoice) => void
  setTextAlign: (a: string) => void
  setProfileImage: (img: string | null) => void
  setPhotoShape: (s: PhotoShapeClass) => void
  setPhotoTransform: (size: number, x: number, y: number, scale: number) => void
  setPhotoPosition: (x: number, y: number) => void
  setShowIcons: (v: boolean) => void
  setShowHighlights: (v: boolean) => void
  setSectionsOrder: (order: string[]) => void
  setCustomHeadings: (h: Record<string, string>) => void
  setTermsAccepted: (v: boolean) => void
  resetSession: () => void
}

const initialState = {
  originalCV: '',
  cvFileName: '',
  jobDescription: '',
  optimizedData: null as OptimizedCvData | null,
  cvLanguage: 'tr' as const,
  isLoading: false,
  error: null as string | null,
  activeTemplate: 'modern' as TemplateId,
  themeColor: '#000000',
  narrativeVoice: 'first' as NarrativeVoice,
  textAlign: 'text-left',
  profileImage: null as string | null,
  photoShape: 'rounded-lg' as PhotoShapeClass,
  photoSize: 88,
  photoObjectX: 50,
  photoObjectY: 50,
  photoScale: 1,
  photoPosX: null as null | number,
  photoPosY: null as null | number,
  showIcons: true,
  showHighlights: false,
  sectionsOrder: ['summary', 'experience', 'education', 'skills', 'additional'],
  customHeadings: {} as Record<string, string>,
  termsAccepted: false,
}

export const useCvStore = create<CvState>((set) => ({
  ...initialState,

  setOriginalCV: (text, fileName = '') => set({ originalCV: text, cvFileName: fileName }),
  setJobDescription: (text) => set({ jobDescription: text }),
  setOptimizedData: (data) => set({ optimizedData: data }),
  updateOptimizedData: (updater) => set((s) => ({
    optimizedData: s.optimizedData ? updater(s.optimizedData) : null,
  })),
  setCvLanguage: (lang) => set({ cvLanguage: lang }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (err) => set({ error: err }),
  setActiveTemplate: (t) => set({ activeTemplate: t }),
  setThemeColor: (c) => set({ themeColor: c }),
  setNarrativeVoice: (v) => set({ narrativeVoice: v }),
  setTextAlign: (a) => set({ textAlign: a }),
  setProfileImage: (img) => set({ profileImage: img }),
  setPhotoShape: (s) => set({ photoShape: s }),
  setPhotoTransform: (size, x, y, scale) => set({ photoSize: size, photoObjectX: x, photoObjectY: y, photoScale: scale }),
  setPhotoPosition: (x, y) => set({ photoPosX: x, photoPosY: y }),
  setShowIcons: (v) => set({ showIcons: v }),
  setShowHighlights: (v) => set({ showHighlights: v }),
  setSectionsOrder: (order) => set({ sectionsOrder: order }),
  setCustomHeadings: (h) => set({ customHeadings: h }),
  setTermsAccepted: (v) => set({ termsAccepted: v }),
  resetSession: () => set({ ...initialState }),
}))
