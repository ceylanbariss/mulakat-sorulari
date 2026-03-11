export interface Category {
  id: string
  label: string
  emoji: string
  description: string
  color: string
  bgColor: string
  count: number
}

export const CATEGORIES: Category[] = [
  {
    id: 'yazilim',
    label: 'IT / Bilişim',
    emoji: '🖥️',
    description: 'Yazılım geliştirme, veri, DevOps, siber güvenlik ve daha fazlası.',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    count: 20,
  },
  {
    id: 'kamu',
    label: 'Kamu',
    emoji: '🏛️',
    description: 'Genel yetenek, vatandaşlık bilgisi, hukuk temelleri ve kurum kültürü.',
    color: '#10B981',
    bgColor: '#ECFDF5',
    count: 20,
  },
  {
    id: 'banka',
    label: 'Banka',
    emoji: '🏦',
    description: 'Finans temelleri, muhasebe, risk yönetimi ve bankacılık ürünleri.',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    count: 20,
  },
  {
    id: 'ik',
    label: 'İK',
    emoji: '👥',
    description: 'Yetkinlik bazlı, davranışsal sorular, kariyer motivasyonu ve liderlik.',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    count: 20,
  },
]
