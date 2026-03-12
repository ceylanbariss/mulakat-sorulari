import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, Pencil, Trash2, X, BookOpen, Upload, FileText, CheckCircle2, AlertCircle, FolderTree } from 'lucide-react'
import { toast } from 'sonner'
import {
  questionsCol, categoriesCol, subcategoriesCol,
  getAll, addDocument, setDocument, updateDocument, deleteDocument, subscribeCollection,
  where,
} from '../../../lib/firestore'
import type { Question } from '../../../data/questions'

type QDoc = Question & { _id: string }
type CatDoc = { id: string; label: string; _id: string }

const DIFFICULTIES = ['kolay', 'orta', 'zor'] as const
const DIFF_COLOR: Record<string, string> = { kolay: '#10b981', orta: '#f59e0b', zor: '#ef4444' }

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
    .replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
    .replace(/[&\s]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

// ─── Shared design tokens ──────────────────────────────────────────────────────
const C = {
  bg: '#0a0f1e', card: '#111827', sidebar: '#0d1117',
  border: 'rgba(255,255,255,0.06)', borderHover: 'rgba(6,182,212,0.35)',
  cyan: '#06b6d4', purple: '#8b5cf6',
  t1: '#ffffff', t2: '#94a3b8', t3: '#64748b',
  gradient: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: C.t1, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, cursor: 'pointer',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', color: C.t3, fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
}



function Spinner() {
  return <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
}

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ color: C.t1, fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.t1)} onMouseLeave={e => (e.currentTarget.style.color = C.t3)}>
                <X size={18} />
              </button>
            </div>
            {/* Body */}
            <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
            {/* Footer */}
            {footer && <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DeleteConfirm({ open, message, onCancel, onConfirm }: { open: boolean; message: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
          >
            <h3 style={{ color: C.t1, fontWeight: 700, fontSize: 15, margin: '0 0 10px' }}>Silmek istediğinden emin misin?</h3>
            <p style={{ color: C.t2, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <CancelBtn onClick={onCancel} />
              <button onClick={onConfirm} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600 }}>Sil</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: C.gradient, color: '#fff', fontSize: 13, fontWeight: 600, opacity: disabled ? 0.6 : 1, transition: 'opacity 0.15s' }}>
      {children}
    </button>
  )
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid rgba(255,255,255,0.1)`, cursor: 'pointer', background: hov ? 'rgba(255,255,255,0.06)' : 'transparent', color: C.t2, fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      İptal
    </button>
  )
}

function emptyForm(): Omit<Question, 'id'> {
  return {
    category: '', subcategory: '', difficulty: 'orta', question: '', answer: '',
    hints: [],
    options: [
      { label: 'A', text: '', correct: false }, { label: 'B', text: '', correct: false },
      { label: 'C', text: '', correct: false }, { label: 'D', text: '', correct: false },
    ],
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function QuestionsModule() {
  const [questions, setQuestions] = useState<QDoc[]>([])
  const [categories, setCategories] = useState<CatDoc[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<QDoc | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [hintsText, setHintsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<QDoc | null>(null)

  // ── Soru Seçim State ──
  const [selectedQs, setSelectedQs] = useState<Set<string>>(new Set())

  function toggleRow(id: string) {
    const next = new Set(selectedQs)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedQs(next)
  }

  function toggleAll() {
    if (selectedQs.size === filtered.length) setSelectedQs(new Set())
    else setSelectedQs(new Set(filtered.map(q => q._id)))
  }

  // ── Tekli Soru Alan Değiştirme State ──
  const [inlineMoveTarget, setInlineMoveTarget] = useState<QDoc | null>(null)
  const [inlineMoveCat, setInlineMoveCat] = useState('')
  const [inlineMoveAlan, setInlineMoveAlan] = useState('')
  const [inlineMoveAltdal, setInlineMoveAltdal] = useState('')
  const [inlineMoveRol, setInlineMoveRol] = useState('')
  const [inlineMoveSubcats, setInlineMoveSubcats] = useState<Array<{ _id: string; name: string; slug: string; parentId?: string }>>([])
  const [inlineMoveLoading, setInlineMoveLoading] = useState(false)
  const [inlineMoveSaving, setInlineMoveSaving] = useState(false)

  useEffect(() => {
    if (inlineMoveTarget) {
      setInlineMoveCat(inlineMoveTarget.category)
      setInlineMoveAlan('')
      setInlineMoveAltdal('')
      setInlineMoveRol(inlineMoveTarget.subcategory || '')
    }
  }, [inlineMoveTarget])

  useEffect(() => {
    if (!inlineMoveCat) { setInlineMoveSubcats([]); return }
    setInlineMoveLoading(true)
    getAll<{ name: string; slug: string; orderIndex?: number; parentId?: string }>(subcategoriesCol(), where('categoryId', '==', inlineMoveCat))
      .then(docs => {
        const sorted = [...docs].sort((a, b) => ((a as any).orderIndex ?? 0) - ((b as any).orderIndex ?? 0))
        setInlineMoveSubcats(sorted as any)
        
        // Hiyerarşik pre-selection
        if (inlineMoveTarget && inlineMoveTarget.category === inlineMoveCat) {
          const currentSub = inlineMoveTarget.subcategory
          const node = sorted.find(s => s.slug === currentSub)
          if (node) {
            setInlineMoveRol(node.slug)
            if (node.parentId) {
               const parent = sorted.find(s => s._id === node.parentId)
               if (parent) {
                  if (parent.parentId) {
                     // 3. seviye
                     setInlineMoveAlan(parent.parentId)
                     setInlineMoveAltdal(parent._id)
                  } else {
                     // 2. seviye
                     setInlineMoveAlan(parent._id)
                     setInlineMoveAltdal(node._id)
                     setInlineMoveRol(node.slug) 
                  }
               }
            } else {
               setInlineMoveAlan(node._id)
            }
          }
        }
      })
      .finally(() => setInlineMoveLoading(false))
  }, [inlineMoveCat])
  
  async function handleInlineMoveSave() {
    if (!inlineMoveTarget || !inlineMoveCat) return
    const hasHierarchy = inlineMoveSubcats.some(s => s.parentId)
    let finalSlug = ''
    if (hasHierarchy) {
      if (!inlineMoveAlan) { toast.error('Lütfen bir alan seçin.'); return }
      finalSlug = inlineMoveRol;
      if (!finalSlug) { toast.error('Lütfen en alt dala kadar seçim yapın.'); return }
    } else {
      if (!inlineMoveRol) { toast.error('Lütfen bir alt dal seçin.'); return }
      finalSlug = inlineMoveRol;
    }

    setInlineMoveSaving(true)
    try {
      await updateDocument(questionsCol(), inlineMoveTarget._id, { category: inlineMoveCat, subcategory: finalSlug })
      toast.success('Soru başarıyla yeni alanına taşındı.')
      setInlineMoveTarget(null)
    } catch {
      toast.error('Güncellenirken hata oluştu.')
    } finally {
      setInlineMoveSaving(false)
    }
  }

  // ── Toplu Alt Dal Ata state ──
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false)
  const [bulkAssignCat, setBulkAssignCat] = useState('')
  const [bulkAssignSourceSub, setBulkAssignSourceSub] = useState('')
  const [bulkAssignTargetSub, setBulkAssignTargetSub] = useState('')
  const [bulkAssignTargetAlan, setBulkAssignTargetAlan] = useState('')
  const [bulkAssignTargetAltDal, setBulkAssignTargetAltDal] = useState('')
  const [bulkAssignSubcats, setBulkAssignSubcats] = useState<Array<{ _id: string; name: string; slug: string; parentId?: string }>>([])
  const [bulkAssignSubcatsLoading, setBulkAssignSubcatsLoading] = useState(false)
  const [bulkAssignSaving, setBulkAssignSaving] = useState(false)

  useEffect(() => {
    if (!bulkAssignCat) { setBulkAssignSubcats([]); setBulkAssignTargetSub(''); setBulkAssignTargetAlan(''); setBulkAssignTargetAltDal(''); return }
    setBulkAssignSubcatsLoading(true)
    setBulkAssignTargetSub('')
    setBulkAssignTargetAlan('')
    setBulkAssignTargetAltDal('')
    getAll<{ name: string; slug: string; orderIndex?: number; parentId?: string }>(subcategoriesCol(), where('categoryId', '==', bulkAssignCat))
      .then(docs => {
        const sorted = [...docs].sort((a, b) => ((a as any).orderIndex ?? 0) - ((b as any).orderIndex ?? 0))
        setBulkAssignSubcats(sorted as any)
      })
      .finally(() => setBulkAssignSubcatsLoading(false))
  }, [bulkAssignCat])

  const bulkAlanlar = bulkAssignSubcats.filter(s => !s.parentId || s.parentId === '')
  const bulkAltdallarOfAlan = bulkAssignTargetAlan ? bulkAssignSubcats.filter(s => s.parentId === bulkAssignTargetAlan) : []
  const bulkRollerOfAltDal = bulkAssignTargetAltDal ? bulkAssignSubcats.filter(s => s.parentId === bulkAssignTargetAltDal) : []

  async function handleBulkAssignSave() {
    if (!bulkAssignCat || !bulkAssignTargetSub) { toast.error('Kategori ve hedef alt dal zorunludur.'); return }
    const eligibleQs = questions.filter(q => {
      if (q.category !== bulkAssignCat) return false
      if (bulkAssignSourceSub === 'SELECTED') return selectedQs.has(q._id)
      if (bulkAssignSourceSub === '*') return true
      if (bulkAssignSourceSub === '' && (!q.subcategory || q.subcategory === '')) return true
      return q.subcategory === bulkAssignSourceSub
    })
    if (eligibleQs.length === 0) {
      toast.error('Bu kriterlere uyan soru bulunamadı.')
      return
    }
    setBulkAssignSaving(true)
    try {
      for (const q of eligibleQs) {
        await updateDocument(questionsCol(), q._id, { subcategory: bulkAssignTargetSub })
      }
      toast.success(`${eligibleQs.length} soruya başarıyla "${bulkAssignTargetSub}" atandı.`)
      setBulkAssignOpen(false)
      if (bulkAssignSourceSub === 'SELECTED') setSelectedQs(new Set())
    } catch {
      toast.error('Atama işlemi başarısız.')
    } finally {
      setBulkAssignSaving(false)
    }
  }



  // ── Alt kategori (subcategory) state ──
  const [subcats, setSubcats] = useState<Array<{ _id: string; name: string; slug: string; parentId?: string }>>([])
  const [subcatsLoading, setSubcatsLoading] = useState(false)
  const [selectedAlan, setSelectedAlan] = useState('')      // yazilim: alan _id
  const [selectedAltDal, setSelectedAltDal] = useState('')  // yazilim: alt dal _id

  useEffect(() => {
    if (!form.category) { setSubcats([]); setSelectedAlan(''); setSelectedAltDal(''); return }
    setSubcatsLoading(true)
    setSelectedAlan('')
    setSelectedAltDal('')
    getAll<{ name: string; slug: string; orderIndex?: number; parentId?: string }>(subcategoriesCol(), where('categoryId', '==', form.category))
      .then(docs => {
        const sorted = [...docs].sort((a, b) => ((a as any).orderIndex ?? 0) - ((b as any).orderIndex ?? 0))
        setSubcats(sorted as any)
      })
      .finally(() => setSubcatsLoading(false))
  }, [form.category])

  // yazilim: alanlar (top-level), alt dallar, roller
  const alanlar = subcats.filter(s => !s.parentId || s.parentId === '')
  const altdallarOfAlan = selectedAlan ? subcats.filter(s => s.parentId === selectedAlan) : []
  const rollerOfAltDal = selectedAltDal ? subcats.filter(s => s.parentId === selectedAltDal) : []

  // ── Toplu yükleme state ──
  const [importOpen, setImportOpen] = useState(false)
  const [importRaw, setImportRaw] = useState('')
  const [importParsed, setImportParsed] = useState<Question[] | null>(null)
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── AI Prompt state ──
  const [promptCat, setPromptCat] = useState('vibe-coding')
  const [promptCount, setPromptCount] = useState('100')
  const [promptCopied, setPromptCopied] = useState(false)

  // ── Kategori eşleştirme ──
  const [catMappings, setCatMappings] = useState<Record<string, string>>({})
  // value: mevcut category id  | '__new__' (yeni oluştur)

  // ── Subcategory eşleştirme ──
  const [subMappings, setSubMappings] = useState<Record<string, string>>({})
  const [subAvail, setSubAvail] = useState<Record<string, { _id: string; name: string; slug: string }[]>>({})

  useEffect(() => {
    const resolvedCats = [...new Set(Object.values(catMappings).filter(v => v && v !== '__new__'))]
    if (!resolvedCats.length) { setSubAvail({}); return }
    Promise.all(
      resolvedCats.map(catId =>
        getAll<{ name: string; slug: string; orderIndex?: number }>(subcategoriesCol(), where('categoryId', '==', catId))
          .then(docs => ({ catId, docs: docs.sort((a, b) => ((a as any).orderIndex ?? 0) - ((b as any).orderIndex ?? 0)) }))
      )
    ).then(results => {
      const map: Record<string, any[]> = {}
      results.forEach(({ catId, docs }) => { map[catId] = docs })
      setSubAvail(map)
    })
  }, [JSON.stringify(catMappings)])

  useEffect(() => {
    const unsubQ = subscribeCollection<Question>(questionsCol(), docs => setQuestions(docs as QDoc[]))
    const unsubC = subscribeCollection<any>(categoriesCol(), docs => setCategories(docs as CatDoc[]))
    return () => { unsubQ(); unsubC() }
  }, [])

  const filtered = questions.filter(q =>
    (!search || q.question.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || q.category === filterCat) &&
    (!filterDiff || q.difficulty === filterDiff)
  )

  function openAdd() { setEditing(null); setForm(emptyForm()); setHintsText(''); setSelectedAlan(''); setSelectedAltDal(''); setModalOpen(true) }
  function openEdit(q: QDoc) {
    setEditing(q)
    setForm({ category: q.category, subcategory: q.subcategory ?? '', difficulty: q.difficulty, question: q.question, answer: q.answer, hints: q.hints ?? [], options: q.options?.length ? q.options : [{ label: 'A', text: '', correct: false }, { label: 'B', text: '', correct: false }, { label: 'C', text: '', correct: false }, { label: 'D', text: '', correct: false }] })
    setHintsText((q.hints ?? []).join(', '))
    setSelectedAlan('')
    setSelectedAltDal('')
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.category || !form.question.trim() || !form.answer.trim()) { toast.error('Kategori, soru ve cevap zorunludur.'); return }
    setSaving(true)
    try {
      const data = { ...form, hints: hintsText.split(',').map(h => h.trim()).filter(Boolean) }
      if (editing) { await updateDocument(questionsCol(), editing._id, data); toast.success('Soru güncellendi.') }
      else { await addDocument(questionsCol(), data); toast.success('Soru eklendi.') }
      setModalOpen(false)
    } catch { toast.error('Kaydedilemedi.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try { await deleteDocument(questionsCol(), deleteTarget._id); toast.success('Soru silindi.') }
    catch { toast.error('Silinemedi.') }
    finally { setDeleteTarget(null) }
  }

  function setOption(idx: number, field: 'text' | 'correct', value: string | boolean) {
    setForm(f => ({
      ...f,
      options: f.options!.map((o, i) =>
        i === idx ? { ...o, [field]: value, correct: field === 'correct' ? true : o.correct }
          : field === 'correct' ? { ...o, correct: false } : o
      ),
    }))
  }

  // ── Toplu yükleme fonksiyonları ──
  function normCat(s: string) { return s.toLowerCase().replace(/[-_\s]/g, '') }

  function autoMatchCat(raw: string): string {
    const norm = normCat(raw)
    const found = categories.find(c => normCat(c.id) === norm || normCat(c.label) === norm)
    return found ? found.id : '__new__'
  }

  function parseImportText(text: string) {
    if (!text.trim()) { setImportParsed(null); setImportError(''); setCatMappings({}); setSubMappings({}); return }
    try {
      const data = JSON.parse(text)
      if (!Array.isArray(data)) { setImportError('JSON bir dizi (array) olmalı: [...]'); setImportParsed(null); return }
      const valid = data.filter((q: Question) => q.question && q.answer && q.category)
      const skipped = data.length - valid.length
      setImportError(skipped > 0 ? `${skipped} soruda zorunlu alan eksik (question/answer/category). Bunlar atlanacak.` : '')
      setImportParsed(valid as Question[])
      // Kategori eşleştirme
      const uniqueCats = [...new Set(valid.map((q: Question) => q.category).filter(Boolean))]
      const catMap: Record<string, string> = {}
      for (const raw of uniqueCats) catMap[raw] = autoMatchCat(raw)
      setCatMappings(catMap)
      // Subcategory eşleştirme — otomatik slug türet
      const uniqueSubs = [...new Set(valid.map((q: Question) => q.subcategory).filter(Boolean))] as string[]
      const subMap: Record<string, string> = {}
      for (const raw of uniqueSubs) subMap[raw] = toSlug(raw)
      setSubMappings(subMap)
    } catch {
      setImportError('Geçersiz JSON formatı. Dosyanın içeriği JSON array olmalı.')
      setImportParsed(null)
      setCatMappings({})
      setSubMappings({})
    }
  }

  function handleRawChange(text: string) { setImportRaw(text); parseImportText(text) }

  function handleFileLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { const t = ev.target?.result as string; setImportRaw(t); parseImportText(t) }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  async function handleBulkImport() {
    if (!importParsed || importParsed.length === 0) return
    setImporting(true); setImportProgress(0)

    // ── Adım 1: '__new__' olan kategorileri Firestore'a ekle ──
    const resolved = { ...catMappings }
    for (const [raw, mapped] of Object.entries(resolved)) {
      if (mapped === '__new__') {
        const newId = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'kategori'
        try {
          await setDocument(categoriesCol(), newId, { id: newId, label: raw, emoji: '📌', description: '', color: '#3B82F6', bgColor: '#EFF6FF', order: 0 })
          resolved[raw] = newId
        } catch { toast.error(`"${raw}" kategorisi oluşturulamadı.`) }
      }
    }

    // ── Adım 2: Soruları eşlenmiş kategori ve alt dal ile yükle ──
    let success = 0; let fail = 0
    for (let i = 0; i < importParsed.length; i++) {
      try {
        const { id: _id, ...data } = importParsed[i] as Question & { id?: string }
        const resolvedCat = resolved[data.category] ?? data.category
        const resolvedSub = data.subcategory
          ? (subMappings[data.subcategory] ?? toSlug(data.subcategory))
          : ''
        await addDocument(questionsCol(), { ...data, category: resolvedCat, subcategory: resolvedSub })
        success++
      } catch { fail++ }
      setImportProgress(i + 1)
    }
    setImporting(false)
    if (fail === 0) toast.success(`${success} soru başarıyla yüklendi!`)
    else toast.error(`${success} yüklendi, ${fail} başarısız.`)
    setImportOpen(false); setImportRaw(''); setImportParsed(null); setImportError(''); setCatMappings({}); setSubMappings({}); setSubAvail({})
  }

  // ── AI Prompt üretici ──
  function buildPrompt() {
    return `Aşağıdaki JSON formatında "${promptCat}" kategorisi için ${promptCount} adet Türkçe mülakat sorusu oluştur.
Sadece JSON array döndür — başka açıklama, kod bloğu işareti veya metin ekleme.

[
  {
    "category": "${promptCat}",
    "subcategory": "Alt Kategori Adı",
    "difficulty": "kolay",
    "question": "Soru metni burada",
    "answer": "Model cevap burada (2-4 cümle, açıklayıcı)",
    "hints": ["İpucu 1", "İpucu 2", "İpucu 3"],
    "options": [
      { "label": "A", "text": "Seçenek A metni", "correct": false },
      { "label": "B", "text": "Doğru seçenek metni", "correct": true },
      { "label": "C", "text": "Seçenek C metni", "correct": false },
      { "label": "D", "text": "Seçenek D metni", "correct": false }
    ]
  }
]

Kurallar:
- Her soruda tam olarak 4 şık (A, B, C, D) olsun
- Her soruda tam olarak 1 tane "correct: true" şık olsun
- "difficulty" değeri yalnızca "kolay", "orta" veya "zor" olabilir
- "hints" dizisinde 2-4 adet kısa ipucu olsun
- "subcategory" alanını konuya göre belirle (örn. "AI Araçları", "Prompt Mühendisliği")
- Yanıt olarak yalnızca JSON array yaz, başka hiçbir şey ekleme`
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(buildPrompt()).then(() => {
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    })
  }

  // ─── Focusable fields state ─────────────────────────────────────────────────
  const [fc, setFc] = useState<Record<string, boolean>>({})
  const fi = (name: string): React.CSSProperties => ({ ...INPUT_STYLE, borderColor: fc[name] ? C.cyan : 'rgba(255,255,255,0.08)' })
  const fb = (name: string) => ({ onFocus: () => setFc(s => ({ ...s, [name]: true })), onBlur: () => setFc(s => ({ ...s, [name]: false })) })

  return (
    <div style={{ padding: 32, background: C.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: C.t1, fontWeight: 700, fontSize: 24, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={22} style={{ color: C.cyan }} /> Sorular
          </h1>
          <p style={{ color: C.t3, fontSize: 13, margin: '4px 0 0' }}>{filtered.length} soru gösteriliyor</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setBulkAssignCat('');
              setBulkAssignSourceSub(selectedQs.size > 0 ? 'SELECTED' : '');
              setBulkAssignTargetSub('');
              setBulkAssignTargetAlan('');
              setBulkAssignTargetAltDal('');
              setBulkAssignOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', background: selectedQs.size > 0 ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selectedQs.size > 0 ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)'}`, color: selectedQs.size > 0 ? C.purple : C.t2, fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = selectedQs.size > 0 ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = selectedQs.size > 0 ? '#a78bfa' : C.t1 }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = selectedQs.size > 0 ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = selectedQs.size > 0 ? C.purple : C.t2 }}
          >
            <Pencil size={14} /> Toplu Alt Dal Ata {selectedQs.size > 0 && `(${selectedQs.size})`}
          </button>
          <button
            onClick={() => { setImportRaw(''); setImportParsed(null); setImportError(''); setImportProgress(0); setImportOpen(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: C.t2, fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = C.t1 }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = C.t2 }}
          >
            <Upload size={14} /> Toplu Yükle
          </button>
          <button
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.gradient, color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 14px rgba(6,182,212,0.25)' }}
          >
            <Plus size={15} /> Soru Ekle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.t3 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Sorularda ara..."
            style={{ ...INPUT_STYLE, paddingLeft: 36, borderColor: fc['search'] ? C.cyan : 'rgba(255,255,255,0.08)' }}
            {...fb('search')}
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...SELECT_STYLE, width: 160 }}>
          <option value="" style={{ background: C.card, color: C.t1 }}>Tüm Kategoriler</option>
          {categories.map(c => <option key={c._id} value={c.id} style={{ background: C.card, color: C.t1 }}>{c.label}</option>)}
        </select>
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} style={{ ...SELECT_STYLE, width: 140 }}>
          <option value="" style={{ background: C.card, color: C.t1 }}>Tüm Zorluklar</option>
          {DIFFICULTIES.map(d => <option key={d} value={d} style={{ background: C.card, color: C.t1 }}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: C.t3, fontSize: 14 }}>
            Soru bulunamadı. Önce Dashboard'dan Firestore'u doldur.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
             <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ width: 40, padding: '12px 16px', textAlign: 'center' }}>
                  <input type="checkbox" checked={filtered.length > 0 && selectedQs.size === filtered.length} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                </th>
                {['Soru', 'Kategori', 'Zorluk', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '12px 16px', color: C.t3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', width: i === 3 ? 80 : undefined }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => (
                <TableRow key={q._id} isLast={i === filtered.length - 1}>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedQs.has(q._id)} onChange={() => toggleRow(q._id)} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: 380 }}>
                    <p style={{ color: C.t1, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</p>
                    {q.subcategory && <p style={{ color: C.t3, fontSize: 11, margin: '2px 0 0' }}>{q.subcategory}</p>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: C.t2, textTransform: 'capitalize' }}>{q.category}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <DiffBadge diff={q.difficulty} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <IconBtn onClick={() => setInlineMoveTarget(q)} hoverColor="#a855f7"><FolderTree size={13} /></IconBtn>
                      <IconBtn onClick={() => openEdit(q)} hoverColor={C.cyan}><Pencil size={13} /></IconBtn>
                      <IconBtn onClick={() => setDeleteTarget(q)} hoverColor="#ef4444"><Trash2 size={13} /></IconBtn>
                    </div>
                  </td>
                </TableRow>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Soruyu Düzenle' : 'Yeni Soru'}
        footer={
          <>
            <CancelBtn onClick={() => setModalOpen(false)} />
            <PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? <Spinner /> : null}{editing ? 'Güncelle' : 'Kaydet'}</PrimaryBtn>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={LABEL_STYLE}>Kategori *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, subcategory: '' }))} style={{ ...SELECT_STYLE, borderColor: fc['cat'] ? C.cyan : 'rgba(255,255,255,0.08)' }} {...fb('cat')}>
              <option value="" style={{ background: C.sidebar, color: C.t1 }}>Seç...</option>
              {categories.map(c => <option key={c._id} value={c.id} style={{ background: C.sidebar, color: C.t1 }}>{c.label}</option>)}
            </select>
          </div>

          {/* Dinamik Hiyerarşi (Alan + Alt Dal + Rol) veya Düz (Alt Kategori) */}
          {subcats.some(s => s.parentId) ? (
            <>
              <div>
                <label style={LABEL_STYLE}>Alan{subcatsLoading ? ' …' : ''}</label>
                <select
                  value={selectedAlan}
                  onChange={e => {
                    setSelectedAlan(e.target.value)
                    setSelectedAltDal('')
                    setForm(f => ({ ...f, subcategory: '' }))
                  }}
                  style={{ ...SELECT_STYLE, borderColor: fc['alan'] ? C.cyan : 'rgba(255,255,255,0.08)' }}
                  {...fb('alan')}
                >
                  <option value="" style={{ background: C.sidebar, color: C.t1 }}>Alan seç…</option>
                  {alanlar.map(s => <option key={s._id} value={s._id} style={{ background: C.sidebar, color: C.t1 }}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Alt Dal</label>
                {altdallarOfAlan.length > 0 ? (
                  <select
                    value={selectedAltDal}
                    onChange={e => {
                      const altDalId = e.target.value
                      setSelectedAltDal(altDalId)
                      // Eğer bu alt dalın çocukları varsa subcategory'i temizle, yoksa bu alt dalın slug'ını set et
                      const hasChildren = subcats.some(s => s.parentId === altDalId)
                      if (!hasChildren && altDalId) {
                        const node = subcats.find(s => s._id === altDalId)
                        setForm(f => ({ ...f, subcategory: node?.slug ?? '' }))
                      } else {
                        setForm(f => ({ ...f, subcategory: '' }))
                      }
                    }}
                    style={{ ...SELECT_STYLE, borderColor: fc['altdal'] ? C.cyan : 'rgba(255,255,255,0.08)' }}
                    {...fb('altdal')}
                  >
                    <option value="" style={{ background: C.sidebar, color: C.t1 }}>Alt dal seç…</option>
                    {altdallarOfAlan.map(s => <option key={s._id} value={s._id} style={{ background: C.sidebar, color: C.t1 }}>{s.name}</option>)}
                  </select>
                ) : (
                  <input value='' disabled placeholder={selectedAlan ? 'Alt dal yok' : 'Önce alan seçin'} style={{ ...fi('altdal'), opacity: 0.5 }} />
                )}
              </div>
              {rollerOfAltDal.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>Rol</label>
                  <select
                    value={form.subcategory ?? ''}
                    onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))}
                    style={{ ...SELECT_STYLE, borderColor: fc['rol'] ? C.cyan : 'rgba(255,255,255,0.08)' }}
                    {...fb('rol')}
                  >
                    <option value="" style={{ background: C.sidebar, color: C.t1 }}>Rol seç…</option>
                    {rollerOfAltDal.map(s => <option key={s._id} value={s.slug} style={{ background: C.sidebar, color: C.t1 }}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </>
          ) : (
            /* Diğer kategoriler: tek dropdown */
            <div>
              <label style={LABEL_STYLE}>Alt Kategori{subcatsLoading ? ' …' : ''}</label>
              {subcats.length > 0 ? (
                <select
                  value={subcats.find(s => s.slug === form.subcategory) ? form.subcategory : ''}
                  onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))}
                  style={{ ...SELECT_STYLE, borderColor: fc['sub'] ? C.cyan : 'rgba(255,255,255,0.08)' }}
                  {...fb('sub')}
                >
                  <option value="" style={{ background: C.sidebar, color: C.t1 }}>Seç...</option>
                  {subcats.map(s => <option key={s._id} value={s.slug} style={{ background: C.sidebar, color: C.t1 }}>{s.name}</option>)}
                </select>
              ) : (
                <input value={form.subcategory ?? ''} onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))} placeholder={form.category ? 'Alt dal yok — serbest giriş' : 'Önce kategori seçin'} style={fi('sub')} {...fb('sub')} />
              )}
            </div>
          )}
        </div>

        <div>
          <label style={LABEL_STYLE}>Zorluk</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFICULTIES.map(d => (
              <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))} style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                border: form.difficulty === d ? `1px solid ${DIFF_COLOR[d]}60` : '1px solid rgba(255,255,255,0.08)',
                background: form.difficulty === d ? `${DIFF_COLOR[d]}18` : 'rgba(255,255,255,0.03)',
                color: form.difficulty === d ? DIFF_COLOR[d] : C.t3,
              }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={LABEL_STYLE}>Soru *</label>
          <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} rows={3} placeholder="Soru metnini buraya yaz..." style={{ ...fi('q'), resize: 'none' }} {...fb('q')} />
        </div>

        <div>
          <label style={LABEL_STYLE}>Cevap *</label>
          <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={4} placeholder="Model cevabı buraya yaz..." style={{ ...fi('ans'), resize: 'none' }} {...fb('ans')} />
        </div>

        <div>
          <label style={LABEL_STYLE}>İpuçları <span style={{ fontWeight: 400, textTransform: 'none' }}>(virgülle ayır)</span></label>
          <input value={hintsText} onChange={e => setHintsText(e.target.value)} placeholder="İpucu 1, İpucu 2, İpucu 3" style={fi('hints')} {...fb('hints')} />
        </div>

        <div>
          <label style={LABEL_STYLE}>Şıklar <span style={{ fontWeight: 400, textTransform: 'none' }}>(opsiyonel — doğru olanı seç)</span></label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(form.options ?? []).map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button type="button" onClick={() => setOption(i, 'correct', true)} style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${opt.correct ? '#10b981' : 'rgba(255,255,255,0.15)'}`, background: opt.correct ? '#10b981' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  {opt.correct && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                </button>
                <span style={{ color: C.t3, fontSize: 11, fontWeight: 700, width: 14 }}>{opt.label || String.fromCharCode(65 + i)}</span>
                <input
                  value={opt.text} onChange={e => setOption(i, 'text', e.target.value)} placeholder={`${String.fromCharCode(65 + i)} şıkkı...`}
                  style={{ ...INPUT_STYLE, flex: 1, padding: '8px 12px', borderColor: fc[`opt${i}`] ? C.cyan : 'rgba(255,255,255,0.08)' }}
                  onFocus={() => setFc(s => ({ ...s, [`opt${i}`]: true }))} onBlur={() => setFc(s => ({ ...s, [`opt${i}`]: false }))}
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="*" style={{ display: 'none' }} onChange={handleFileLoad} />

      {/* Toplu Yükleme Modal */}
      <Modal
        open={importOpen}
        onClose={() => !importing && setImportOpen(false)}
        title="Toplu Soru Yükleme"
        footer={
          importing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.gradient, borderRadius: 3, width: `${importParsed ? (importProgress / importParsed.length) * 100 : 0}%`, transition: 'width 0.2s' }} />
              </div>
              <span style={{ color: C.t2, fontSize: 13, whiteSpace: 'nowrap' }}>{importProgress}/{importParsed?.length} yüklendi</span>
            </div>
          ) : (
            <>
              <CancelBtn onClick={() => setImportOpen(false)} />
              <PrimaryBtn onClick={handleBulkImport} disabled={!importParsed || importParsed.length === 0}>
                <Upload size={14} /> {importParsed ? `${importParsed.length} Soruyu Yükle` : 'Yükle'}
              </PrimaryBtn>
            </>
          )
        }
      >
        {/* ── AI Prompt Şablonu ── */}
        <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '16px 18px' }}>
          <p style={{ color: C.purple, fontSize: 12, fontWeight: 700, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✦ AI ile Soru Oluştur
          </p>
          <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: 12, margin: '0 0 12px', lineHeight: 1.6 }}>
            Kategori ve soru sayısını gir → promptu kopyala → ChatGPT / Claude'a yapıştır → çıktıyı <code style={{ color: C.purple, fontSize: 11 }}>.txt</code> veya <code style={{ color: C.purple, fontSize: 11 }}>.json</code> olarak kaydet → aşağıdan yükle.
          </p>

          {/* Kategori + Sayı girdileri */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Kategori adı</label>
              <input
                value={promptCat}
                onChange={e => setPromptCat(e.target.value)}
                placeholder="vibe-coding"
                style={{ ...INPUT_STYLE, fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>Soru sayısı</label>
              <input
                value={promptCount}
                onChange={e => setPromptCount(e.target.value)}
                placeholder="100"
                style={{ ...INPUT_STYLE, fontSize: 12, width: 80 }}
              />
            </div>
          </div>

          {/* Prompt önizleme */}
          <textarea
            readOnly
            value={buildPrompt()}
            rows={6}
            style={{ ...INPUT_STYLE, resize: 'none', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6, color: 'rgba(148,163,184,0.7)', cursor: 'text' }}
          />

          {/* Kopyala butonu */}
          <button
            onClick={handleCopyPrompt}
            style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: `1px solid ${promptCopied ? 'rgba(52,211,153,0.4)' : 'rgba(139,92,246,0.4)'}`, background: promptCopied ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.12)', color: promptCopied ? '#34d399' : C.purple, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {promptCopied ? <><CheckCircle2 size={13} /> Kopyalandı!</> : <><FileText size={13} /> Promptu Kopyala</>}
          </button>
        </div>

        {/* Dosya seçici */}
        <div>
          <label style={LABEL_STYLE}>Dosya Yükle <span style={{ fontWeight: 400, textTransform: 'none' }}>(herhangi bir metin dosyası)</span></label>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', padding: '20px', borderRadius: 10, border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: C.t3, fontSize: 13, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.cyan; (e.currentTarget as HTMLButtonElement).style.color = C.cyan }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = C.t3 }}
          >
            <Upload size={20} />
            <span>Dosya seç (.json, .txt veya herhangi bir format)</span>
          </button>
        </div>

        {/* Ya da direkt yapıştır */}
        <div>
          <label style={LABEL_STYLE}>Ya da JSON'u direkt yapıştır</label>
          <textarea
            value={importRaw}
            onChange={e => handleRawChange(e.target.value)}
            placeholder='[{"category": "vibe-coding", "question": "...", "answer": "...", ...}]'
            rows={8}
            style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}
          />
        </div>

        {/* Hata / Önizleme */}
        {importError && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <AlertCircle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: '#fbbf24', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{importError}</p>
          </div>
        )}
        {importParsed && importParsed.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle2 size={14} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#34d399', fontSize: 12, fontWeight: 700, margin: 0 }}>{importParsed.length} soru hazır</p>
            </div>

            {/* ── Kategori Eşleştirme ── */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ color: C.t2, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
                Kategori Eşleştirme
              </p>
              {Object.entries(catMappings).map(([raw, mapped]) => {
                const isNew = mapped === '__new__'
                return (
                  <div key={raw} style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ padding: '7px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: C.t2, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {raw}
                    </div>
                    <span style={{ color: C.t3, fontSize: 12, textAlign: 'center' }}>→</span>
                    <select
                      value={mapped}
                      onChange={e => setCatMappings(m => ({ ...m, [raw]: e.target.value }))}
                      style={{ ...SELECT_STYLE, fontSize: 12, borderColor: isNew ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)', color: isNew ? '#fbbf24' : '#34d399' }}
                    >
                      {categories.map(c => (
                        <option key={c._id} value={c.id} style={{ background: C.card, color: C.t1 }}>{c.label} — {c.id}</option>
                      ))}
                      <option value="__new__" style={{ background: C.card, color: '#fbbf24' }}>+ Yeni kategori oluştur</option>
                    </select>
                  </div>
                )
              })}
              {Object.values(catMappings).some(v => v === '__new__') && (
                <p style={{ color: '#fbbf24', fontSize: 11, margin: '4px 0 0', lineHeight: 1.5 }}>
                  ⚠ "Yeni kategori oluştur" seçilen kategoriler yükleme sırasında otomatik oluşturulacak.
                </p>
              )}
            </div>

            {/* ── Alt Dal (Subcategory) Eşleştirme ── */}
            {Object.keys(subMappings).length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ color: C.t2, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
                  Alt Dal Eşleştirme
                </p>
                {Object.entries(subMappings).map(([raw, mapped]) => {
                  const allAvail = Object.values(subAvail).flat()
                  const matched = allAvail.find(s => s.slug === mapped)
                  return (
                    <div key={raw} style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ padding: '7px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: C.t2, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {raw}
                      </div>
                      <span style={{ color: C.t3, fontSize: 12, textAlign: 'center' }}>→</span>
                      <select
                        value={mapped}
                        onChange={e => setSubMappings(m => ({ ...m, [raw]: e.target.value }))}
                        style={{ ...SELECT_STYLE, fontSize: 12, borderColor: matched ? 'rgba(16,185,129,0.4)' : 'rgba(100,116,139,0.4)', color: matched ? '#34d399' : C.t2 }}
                      >
                        <option value={toSlug(raw)} style={{ background: C.card, color: C.t1 }}>Otomatik: {toSlug(raw)}</option>
                        {allAvail.map(s => (
                          <option key={s._id} value={s.slug} style={{ background: C.card, color: C.t1 }}>{s.name} — {s.slug}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
                <p style={{ color: C.t3, fontSize: 11, margin: '4px 0 0', lineHeight: 1.5 }}>
                  Kategori seçildikten sonra o kategorideki alt dallar listede görünür.
                </p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Toplu Alt Dal Ata Modal */}
      <Modal open={bulkAssignOpen} onClose={() => setBulkAssignOpen(false)} title="Toplu Alt Dal Ata"
        footer={
          <>
            <CancelBtn onClick={() => setBulkAssignOpen(false)} />
            <PrimaryBtn onClick={handleBulkAssignSave} disabled={bulkAssignSaving}>{bulkAssignSaving ? <Spinner /> : null} Uygula</PrimaryBtn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Adım 1: Kategori */}
          <div>
             <label style={LABEL_STYLE}>1. Hangi Kategorideki Sorular?</label>
             <select value={bulkAssignCat} onChange={e => { setBulkAssignCat(e.target.value); setBulkAssignSourceSub(''); }} style={SELECT_STYLE}>
               <option value="" style={{ background: C.sidebar, color: C.t1 }}>Kategori Seç...</option>
               {categories.map(c => <option key={c._id} value={c.id} style={{ background: C.sidebar, color: C.t1 }}>{c.label}</option>)}
             </select>
          </div>

          {bulkAssignCat && (
            <>
              {/* Adım 2: Hangi Sorular */}
              <div>
                 <label style={LABEL_STYLE}>2. Bu Kategorideki Hangi Sorular?</label>
                 <select value={bulkAssignSourceSub} onChange={e => setBulkAssignSourceSub(e.target.value)} style={SELECT_STYLE}>
                   <option value="SELECTED" style={{ background: C.sidebar, color: C.purple }}>Sadece İşaretli Sorular ({selectedQs.size})</option>
                   <option value="" style={{ background: C.sidebar, color: C.t1 }}>Sadece Alt Dalı "BOŞ" Olanlar (Varsayılan)</option>
                   <option value="*" style={{ background: C.sidebar, color: C.t1 }}>Kategorideki Tüm Sorular (Üzerine Yaz)</option>
                   {Array.from(new Set(questions.filter(q => q.category === bulkAssignCat).map(q => q.subcategory).filter(Boolean))).map(sub => (
                     <option key={sub} value={sub ?? ''} style={{ background: C.sidebar, color: C.t1 }}>Sadece "{sub}" olanlar</option>
                   ))}
                 </select>
              </div>

              {/* Adım 3: Hedef Alt Dal */}
              <div>
                 <label style={LABEL_STYLE}>3. Yeni Alt Dal Ne Olsun? {bulkAssignSubcatsLoading ? '...' : ''}</label>
                 {bulkAssignSubcats.some(s => s.parentId) ? (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                     <select value={bulkAssignTargetAlan} onChange={e => { setBulkAssignTargetAlan(e.target.value); setBulkAssignTargetAltDal(''); setBulkAssignTargetSub(''); }} style={SELECT_STYLE}>
                       <option value="" style={{ background: C.sidebar, color: C.t1 }}>Alan Seç...</option>
                       {bulkAlanlar.map(a => <option key={a._id} value={a._id} style={{ background: C.sidebar, color: C.t1 }}>{a.name}</option>)}
                     </select>
                     {bulkAltdallarOfAlan.length > 0 && (
                       <select value={bulkAssignTargetAltDal} onChange={e => {
                         const altDalId = e.target.value;
                         setBulkAssignTargetAltDal(altDalId);
                         const hasChildren = bulkAssignSubcats.some(s => s.parentId === altDalId);
                         if (!hasChildren && altDalId) {
                           const node = bulkAssignSubcats.find(s => s._id === altDalId);
                           setBulkAssignTargetSub(node?.slug ?? '');
                         } else {
                           setBulkAssignTargetSub('');
                         }
                       }} style={SELECT_STYLE}>
                         <option value="" style={{ background: C.sidebar, color: C.t1 }}>Alt Dal Seç...</option>
                         {bulkAltdallarOfAlan.map(a => <option key={a._id} value={a._id} style={{ background: C.sidebar, color: C.t1 }}>{a.name}</option>)}
                       </select>
                     )}
                     {bulkRollerOfAltDal.length > 0 && (
                       <select value={bulkAssignTargetSub} onChange={e => setBulkAssignTargetSub(e.target.value)} style={SELECT_STYLE}>
                         <option value="" style={{ background: C.sidebar, color: C.t1 }}>Alt Dal Spesifik (Rol) Seç...</option>
                         {bulkRollerOfAltDal.map(a => <option key={a.slug} value={a.slug} style={{ background: C.sidebar, color: C.t1 }}>{a.name}</option>)}
                       </select>
                     )}
                   </div>
                 ) : (
                   <select value={bulkAssignTargetSub} onChange={e => setBulkAssignTargetSub(e.target.value)} style={SELECT_STYLE}>
                     <option value="" style={{ background: C.sidebar, color: C.t1 }}>Alt Kategori Seç...</option>
                     {bulkAssignSubcats.map(s => <option key={s._id} value={s.slug} style={{ background: C.sidebar, color: C.t1 }}>{s.name}</option>)}
                   </select>
                 )}
              </div>
            </>
          )}

          {bulkAssignCat && bulkAssignTargetSub && (() => {
            const count = questions.filter(q => {
              if (q.category !== bulkAssignCat) return false
              if (bulkAssignSourceSub === 'SELECTED') return selectedQs.has(q._id)
              if (bulkAssignSourceSub === '*') return true
              if (bulkAssignSourceSub === '' && (!q.subcategory || q.subcategory === '')) return true
              return q.subcategory === bulkAssignSourceSub
            }).length;
            return (
              <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <p style={{ color: C.cyan, fontSize: 13, margin: 0 }}>
                  <AlertCircle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                  Toplam <strong>{count}</strong> soru güncellenecek.
                </p>
              </div>
            );
          })()}
        </div>
      </Modal>

      {/* Delete */}
      <DeleteConfirm
        open={!!deleteTarget}
        message={`"${deleteTarget?.question ?? ''}" sorusunu kalıcı olarak silmek istediğinden emin misin?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      {/* Inline Move Modal */}
      <Modal open={!!inlineMoveTarget} onClose={() => setInlineMoveTarget(null)} title="Soru Alanını Değiştir"
        footer={
          <>
            <CancelBtn onClick={() => setInlineMoveTarget(null)} />
            <PrimaryBtn onClick={handleInlineMoveSave} disabled={inlineMoveSaving}>{inlineMoveSaving ? <Spinner /> : null} Kaydet</PrimaryBtn>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
             <p style={{ margin: 0, fontSize: 13, color: C.t2, lineHeight: 1.5 }}>
               <strong>Soru:</strong> {inlineMoveTarget?.question}
             </p>
           </div>
           
           <div>
             <label style={LABEL_STYLE}>1. Kategori</label>
             <select value={inlineMoveCat} onChange={e => { setInlineMoveCat(e.target.value); setInlineMoveAlan(''); setInlineMoveAltdal(''); setInlineMoveRol(''); }} style={SELECT_STYLE}>
               <option value="" style={{ background: C.sidebar, color: C.t1 }}>Kategori Seç...</option>
               {categories.map(c => <option key={c._id} value={c.id} style={{ background: C.sidebar, color: C.t1 }}>{c.label}</option>)}
             </select>
           </div>

           {inlineMoveCat && (() => {
               const alanlar = inlineMoveSubcats.filter(s => !s.parentId || s.parentId === '')
               const altdallarOfAlan = inlineMoveAlan ? inlineMoveSubcats.filter(s => s.parentId === inlineMoveAlan) : []
               const rollerOfAltDal = inlineMoveAltdal ? inlineMoveSubcats.filter(s => s.parentId === inlineMoveAltdal) : []
               const hasHierarchy = inlineMoveSubcats.some(s => s.parentId)

               if (inlineMoveLoading) return <div style={{ color: C.t3, fontSize: 12 }}>Yükleniyor...</div>
               if (inlineMoveSubcats.length === 0) return <div style={{ color: C.t3, fontSize: 12 }}>Bu kategoride hiç alt dal yok.</div>

               if (hasHierarchy) {
                 return (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                     <div>
                       <label style={LABEL_STYLE}>2. Alan / Ana Dal</label>
                       <select value={inlineMoveAlan} onChange={e => { setInlineMoveAlan(e.target.value); setInlineMoveAltdal(''); setInlineMoveRol(''); }} style={SELECT_STYLE}>
                         <option value="" style={{ background: C.sidebar, color: C.t1 }}>Alan Seç...</option>
                         {alanlar.map(a => <option key={a._id} value={a._id} style={{ background: C.sidebar, color: C.t1 }}>{a.name}</option>)}
                       </select>
                     </div>
                     {altdallarOfAlan.length > 0 && (
                       <div>
                         <label style={LABEL_STYLE}>3. Alt Dal</label>
                         <select value={inlineMoveAltdal} onChange={e => {
                           const val = e.target.value
                           setInlineMoveAltdal(val)
                           setInlineMoveRol('')
                           const hasCh = inlineMoveSubcats.some(s => s.parentId === val)
                           if (!hasCh && val) {
                             const node = inlineMoveSubcats.find(s => s._id === val)
                             setInlineMoveRol(node?.slug ?? '')
                           }
                         }} style={SELECT_STYLE}>
                           <option value="" style={{ background: C.sidebar, color: C.t1 }}>Alt Dal Seç...</option>
                           {altdallarOfAlan.map(a => <option key={a._id} value={a._id} style={{ background: C.sidebar, color: C.t1 }}>{a.name}</option>)}
                         </select>
                       </div>
                     )}
                     {rollerOfAltDal.length > 0 && (
                       <div>
                         <label style={LABEL_STYLE}>4. Rol / Özel Alan</label>
                         <select value={inlineMoveRol} onChange={e => setInlineMoveRol(e.target.value)} style={SELECT_STYLE}>
                           <option value="" style={{ background: C.sidebar, color: C.t1 }}>Rol Seç...</option>
                           {rollerOfAltDal.map(a => <option key={a.slug} value={a.slug} style={{ background: C.sidebar, color: C.t1 }}>{a.name}</option>)}
                         </select>
                       </div>
                     )}
                     
                     {inlineMoveCat && inlineMoveRol && (() => {
                       const targetSubInfo = inlineMoveSubcats.find(s => s.slug === inlineMoveRol)
                       if(!targetSubInfo) return null
                       return (
                         <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                           <p style={{ color: C.cyan, fontSize: 13, margin: 0 }}>
                             <AlertCircle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                             Soru şu alt dala yerleştirilecek: <strong>{targetSubInfo.name}</strong>
                           </p>
                         </div>
                       )
                     })()}
                   </div>
                 )
               } else {
                 return (
                   <div>
                     <label style={LABEL_STYLE}>2. Alt Kategori</label>
                     <select value={inlineMoveRol} onChange={e => setInlineMoveRol(e.target.value)} style={SELECT_STYLE}>
                       <option value="" style={{ background: C.sidebar, color: C.t1 }}>Seç...</option>
                       {inlineMoveSubcats.map(s => <option key={s._id} value={s.slug} style={{ background: C.sidebar, color: C.t1 }}>{s.name}</option>)}
                     </select>
                   </div>
                 )
               }
           })()}
        </div>
      </Modal>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TableRow({ isLast, children }: { isLast: boolean; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <tr
      style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)', background: hov ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.12s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {children}
    </tr>
  )
}

function DiffBadge({ diff }: { diff: string }) {
  const color = DIFF_COLOR[diff] ?? '#94a3b8'
  return (
    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color, background: `${color}18` }}>
      {diff}
    </span>
  )
}

function IconBtn({ onClick, hoverColor, children }: { onClick: () => void; hoverColor: string; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} style={{ padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: hov ? `${hoverColor}18` : 'transparent', color: hov ? hoverColor : '#64748b', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  )
}
