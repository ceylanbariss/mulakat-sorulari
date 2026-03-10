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

// ─── Typed shortcuts ──────────────────────────────────────────────────────────

export { orderBy, serverTimestamp, where }
