import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc as _deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Collection references ────────────────────────────────────────────────────

export const questionsCol = () => collection(db, 'questions')
export const categoriesCol = () => collection(db, 'categories')
export const subcategoriesCol = () => collection(db, 'subcategories')
export const announcementsCol = () => collection(db, 'announcements')
export const userProfilesCol = () => collection(db, 'userProfiles')
export const trainingSessionsCol = () => collection(db, 'trainingSessions')

// ─── Generic helpers ──────────────────────────────────────────────────────────

export async function getAll<T>(
  col: ReturnType<typeof collection>,
  ...constraints: QueryConstraint[]
): Promise<(T & { _id: string })[]> {
  const q = constraints.length ? query(col, ...constraints) : query(col)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ _id: d.id, ...(d.data() as T) }))
}

export async function getById<T>(
  col: ReturnType<typeof collection>,
  id: string
): Promise<(T & { _id: string }) | null> {
  const snap = await getDoc(doc(col, id))
  if (!snap.exists()) return null
  return { _id: snap.id, ...(snap.data() as T) }
}

export async function addDocument<T extends DocumentData>(
  col: ReturnType<typeof collection>,
  data: T
): Promise<string> {
  const ref = await addDoc(col, { ...data, createdAt: serverTimestamp() })
  return ref.id
}

export async function setDocument<T extends DocumentData>(
  col: ReturnType<typeof collection>,
  id: string,
  data: T,
  merge = true
): Promise<void> {
  await setDoc(doc(col, id), data, { merge })
}

export async function updateDocument<T extends DocumentData>(
  col: ReturnType<typeof collection>,
  id: string,
  data: Partial<T>
): Promise<void> {
  await updateDoc(doc(col, id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteDocument(
  col: ReturnType<typeof collection>,
  id: string
): Promise<void> {
  await _deleteDoc(doc(col, id))
}

export function subscribeCollection<T>(
  col: ReturnType<typeof collection>,
  callback: (items: (T & { _id: string })[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const q = constraints.length ? query(col, ...constraints) : query(col)
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ _id: d.id, ...(d.data() as T) })))
  })
}

// ─── Mülakat Simülasyonu ──────────────────────────────────────────────────────

export interface MulakatSessionData {
  userId: string
  interviewType: string
  jobDescription: string
  cvFileName: string
  questionCount: number
  summary: string
  messages: Array<{ role: string; content: string }>
  terminated?: boolean
  analysis?: Record<string, unknown>
  name?: string
}

export const mulakatGecmisiCol = () => collection(db, 'mulakatGecmisi')

export async function saveMulakatSession(data: MulakatSessionData): Promise<string> {
  return addDocument(mulakatGecmisiCol(), data as unknown as DocumentData)
}

export async function getMulakatGecmisi(
  userId: string
): Promise<(MulakatSessionData & { _id: string; createdAt?: unknown })[]> {
  // orderBy kaldırıldı — composite index gerektirmesin, client'ta sıralıyoruz
  const items = await getAll<MulakatSessionData>(
    mulakatGecmisiCol(),
    where('userId', '==', userId),
  )
  return (items as (MulakatSessionData & { _id: string; createdAt?: unknown })[]).sort((a, b) => {
    const ta = (a.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
    const tb = (b.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
    return tb - ta
  })
}

export async function updateMulakatSessionName(id: string, name: string): Promise<void> {
  await updateDoc(doc(mulakatGecmisiCol(), id), { name })
}

// ─── Haberler ─────────────────────────────────────────────────────────────────

export interface HaberMedya {
  tip: 'gorsel' | 'gif' | 'video-link' | 'video-dosya'
  url: string
  thumbnail?: string
}

export interface HaberData {
  slug: string
  tip: 'makale' | 'post'
  kategori: 'mulakat-ipucu' | 'sektor-haberi' | 'platform-guncelleme' | 'basari-hikayesi'
  baslik: string
  ozet: string
  icerik: string
  medya: HaberMedya[]
  yazar: string
  yazarId: string
  durum: 'taslak' | 'yayinda' | 'zamanlanmis'
  yayinTarihi: unknown
  olusturmaTarihi: unknown
  guncellenmeTarihi: unknown
  oneCikar: boolean
  okumaSuresi: number
  goruntulenme: number
}

export type HaberDoc = HaberData & { _id: string }

export const haberlerCol = () => collection(db, 'haberler')

export async function getHaberler(
  kategori?: string,
  limitN = 10,
  offset = 0,
  siralama: 'yeni' | 'populer' = 'yeni'
): Promise<HaberDoc[]> {
  const constraints: QueryConstraint[] = [where('durum', '==', 'yayinda')]
  if (kategori) constraints.push(where('kategori', '==', kategori))
  const items = await getAll<HaberData>(haberlerCol(), ...constraints)
  const sorted = items.sort((a, b) => {
    if (siralama === 'populer') return (b.goruntulenme ?? 0) - (a.goruntulenme ?? 0)
    const ta = (a.olusturmaTarihi as { toMillis?: () => number })?.toMillis?.() ?? 0
    const tb = (b.olusturmaTarihi as { toMillis?: () => number })?.toMillis?.() ?? 0
    return tb - ta
  })
  return sorted.slice(offset, offset + limitN) as HaberDoc[]
}

export async function getHaberBySlug(slug: string): Promise<HaberDoc | null> {
  const items = await getAll<HaberData>(haberlerCol(), where('slug', '==', slug))
  if (!items.length) return null
  return items[0] as HaberDoc
}

export async function saveHaber(data: Partial<HaberData>, id?: string): Promise<string> {
  if (id) {
    await updateDocument<HaberData>(haberlerCol(), id, data as Partial<HaberData> & DocumentData)
    return id
  }
  return addDocument<HaberData & DocumentData>(haberlerCol(), data as HaberData & DocumentData)
}

export async function deleteHaber(id: string): Promise<void> {
  await deleteDocument(haberlerCol(), id)
}

export interface YorumData {
  userId: string
  kullaniciAdi: string
  metin: string
  olusturmaTarihi: unknown
}

export type YorumDoc = YorumData & { _id: string }

export async function addYorum(
  haberId: string,
  yorum: Omit<YorumData, 'olusturmaTarihi'>
): Promise<string> {
  const yorumlarCol = collection(db, 'haberler', haberId, 'yorumlar')
  const ref = await addDoc(yorumlarCol, { ...yorum, olusturmaTarihi: serverTimestamp() })
  return ref.id
}

export async function getYorumlar(haberId: string): Promise<YorumDoc[]> {
  const yorumlarCol = collection(db, 'haberler', haberId, 'yorumlar')
  const items = await getAll<YorumData>(yorumlarCol)
  return (items as YorumDoc[]).sort((a, b) => {
    const ta = (a.olusturmaTarihi as { toMillis?: () => number })?.toMillis?.() ?? 0
    const tb = (b.olusturmaTarihi as { toMillis?: () => number })?.toMillis?.() ?? 0
    return ta - tb
  })
}

export async function deleteYorum(haberId: string, yorumId: string): Promise<void> {
  const yorumlarCol = collection(db, 'haberler', haberId, 'yorumlar')
  await deleteDocument(yorumlarCol, yorumId)
}

export async function incrementGoruntulenme(id: string): Promise<void> {
  await updateDoc(doc(haberlerCol(), id), { goruntulenme: increment(1) })
}

// ─── CV Geçmişi ───────────────────────────────────────────────────────────────

import type { CvSessionData } from '../types/cv'

export const cvGecmisiCol = () => collection(db, 'cvGecmisi')

export async function saveCvSession(data: CvSessionData): Promise<string> {
  return addDocument(cvGecmisiCol(), data as unknown as DocumentData)
}

export async function getCvGecmisi(
  userId: string
): Promise<(CvSessionData & { _id: string; createdAt?: unknown })[]> {
  const items = await getAll<CvSessionData>(cvGecmisiCol(), where('userId', '==', userId))
  return (items as (CvSessionData & { _id: string; createdAt?: unknown })[]).sort((a, b) => {
    const ta = (a.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
    const tb = (b.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
    return tb - ta
  })
}

// ─── Typed shortcuts ──────────────────────────────────────────────────────────

export { orderBy, serverTimestamp, where }
