import { create } from 'zustand'

export type InterviewType = 'ik' | 'teknik' | 'her-ikisi'
export type InterviewLanguage = 'tr' | 'en'
export type MessageRole = 'interviewer' | 'user'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
}

interface MulakatState {
  step: 1 | 2 | 3
  cvText: string
  cvFileName: string
  jobDescription: string
  interviewType: InterviewType | null
  interviewLanguage: InterviewLanguage | null
  messages: ChatMessage[]
  currentAnswer: string
  isLoading: boolean
  isFinished: boolean
  questionCount: number

  setCvText: (text: string, fileName: string) => void
  setJobDescription: (text: string) => void
  setInterviewType: (type: InterviewType) => void
  setInterviewLanguage: (lang: InterviewLanguage) => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setCurrentAnswer: (text: string) => void
  setLoading: (v: boolean) => void
  setFinished: (v: boolean) => void
  incrementQuestion: () => void
  goToStep: (step: 1 | 2 | 3) => void
  resetSession: () => void
  resetChat: () => void
}

const initialState = {
  step: 1 as const,
  cvText: '',
  cvFileName: '',
  jobDescription: '',
  interviewType: null,
  interviewLanguage: null,
  messages: [],
  currentAnswer: '',
  isLoading: false,
  isFinished: false,
  questionCount: 0,
}

export const useMulakatStore = create<MulakatState>((set) => ({
  ...initialState,

  setCvText: (text, fileName) => set({ cvText: text, cvFileName: fileName }),
  setJobDescription: (text) => set({ jobDescription: text }),
  setInterviewType: (type) => set({ interviewType: type }),
  setInterviewLanguage: (lang) => set({ interviewLanguage: lang }),
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),
  setCurrentAnswer: (text) => set({ currentAnswer: text }),
  setLoading: (v) => set({ isLoading: v }),
  setFinished: (v) => set({ isFinished: v }),
  incrementQuestion: () => set((state) => ({ questionCount: state.questionCount + 1 })),
  goToStep: (step) => set({ step }),
  resetSession: () => set(initialState),
  resetChat: () => set({
    messages: [],
    currentAnswer: '',
    isLoading: false,
    isFinished: false,
    questionCount: 0,
  }),
}))
