// AI Mülakat Simülasyonu yapılandırması
// Soru sayısını ve diğer sabitleri buradan yönet

export const MAX_QUESTIONS = 8

export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  ik: 'İK Mülakatı',
  teknik: 'Teknik Mülakat',
  'her-ikisi': 'Karma Mülakat',
}

export const INTERVIEW_TYPE_DESCRIPTIONS: Record<string, string> = {
  ik: 'İletişim, kültür uyumu ve davranışsal yetkinlikler',
  teknik: 'Problem çözme, teknik bilgi ve proje deneyimi',
  'her-ikisi': 'İK ve teknik sorular karma olarak (~' + MAX_QUESTIONS + ' soru)',
}

export const MAX_CV_TEXT_LENGTH = 6000
export const MAX_JOB_DESC_LENGTH = 1500
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const MIN_JOB_DESC_LENGTH = 50
export const MIN_CV_TEXT_LENGTH = 100
