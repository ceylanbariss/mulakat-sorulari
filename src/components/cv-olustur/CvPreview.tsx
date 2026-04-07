/**
 * CvPreview.tsx — Orijinal hazircv.com.tr (Resumatch v2) template'lerinin birebir kopyası.
 *
 * ÖNEMLİ: Bu dosya Tailwind class'ları kullanır (orijinal gibi).
 * Tailwind v4'te animate-in / slide-in-from-* gibi class'lar yoktur;
 * CSS animasyonlar inline @keyframes ile sağlanır.
 *
 * Mevcut CvPreview.tsx'in ÜSTÜNE yaz (replace).
 * Props interface'i ve CvPreviewHandle aynı kalıyor — CvOlusturPage'de değişiklik gerekmez.
 */

import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react'
import type { OptimizedCvData, TemplateId, NarrativeVoice, PhotoShapeClass } from '../../types/cv'
import {
  DndContext, closestCenter, MouseSensor, TouchSensor,
  useSensor, useSensors, MeasuringStrategy,
} from '@dnd-kit/core'
import type { DragEndEvent, Modifier } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/* ── Drag handle SVG ─────────────────────────────────────────────────────── */
const GripSvg = ({ color = '#94a3b8' }: { color?: string }) => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill={color}>
    <rect x="0" y="1"   width="10" height="1.5" rx="0.75" />
    <rect x="0" y="5.5" width="10" height="1.5" rx="0.75" />
    <rect x="0" y="10"  width="10" height="1.5" rx="0.75" />
  </svg>
)
const TrashSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
  </svg>
)

/* ── Sortable section wrapper (outside forwardRef — stable reference) ─────── */
function SortableSectionWrapper({ id, children, themeColor }: { id: string; children: React.ReactNode; themeColor: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1, position: 'relative' }}
      className="cv-dnd-section"
    >
      <div
        data-no-pdf="true"
        className="cv-section-grip"
        style={{ position: 'absolute', left: -20, top: 2, cursor: 'grab', opacity: 0, touchAction: 'none', userSelect: 'none', zIndex: 20, padding: '2px 3px' }}
        {...attributes} {...listeners}
      >
        <GripSvg color={themeColor} />
      </div>
      {children}
    </div>
  )
}

/* ── Sortable experience/education entry wrapper ──────────────────────────── */
function SortableEntryWrapper({ id, children, themeColor }: { id: string; children: React.ReactNode; themeColor: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1, position: 'relative' }}
      className="cv-dnd-entry"
    >
      <div
        data-no-pdf="true"
        className="cv-entry-grip"
        style={{ position: 'absolute', left: -20, top: 2, cursor: 'grab', opacity: 0, touchAction: 'none', userSelect: 'none', zIndex: 20, padding: '2px 3px' }}
        {...attributes} {...listeners}
      >
        <GripSvg color={themeColor} />
      </div>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC HANDLE (PDF export)
   ═══════════════════════════════════════════════════════════════════════════ */
export interface CvPreviewHandle {
  downloadPdf: () => Promise<void>
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════════════════ */
interface Props {
  data: OptimizedCvData
  template: TemplateId
  themeColor: string
  narrativeVoice: NarrativeVoice
  textAlign: string          // 'text-left' | 'text-center' | 'text-right' | 'text-justify'
  profileImage: string | null
  photoShape: PhotoShapeClass
  photoSize?: number
  photoObjectX?: number
  photoObjectY?: number
  photoScale?: number
  photoPosX?: number | null
  photoPosY?: number | null
  onPhotoChange?: (size: number, x: number, y: number, scale: number) => void
  onPhotoPosChange?: (x: number, y: number) => void
  showIcons: boolean
  cvLanguage: 'tr' | 'en'
  sectionsOrder?: string[]
  customHeadings?: Record<string, string>
  onUpdate: (updater: (prev: OptimizedCvData) => OptimizedCvData) => void
  onAddBullet?: (expId: string) => void
  onDeleteBullet?: (expId: string, bulletIdx: number) => void
  onDeleteExperience?: (id: string) => void
  onDeleteEducation?: (id: string) => void
  onDeleteSkill?: (idx: number) => void
  onDeleteAdditional?: (idx: number) => void
  onSectionsReorder?: (newOrder: string[]) => void
  onReorderExperience?: (fromIdx: number, toIdx: number) => void
  onReorderEducation?: (fromIdx: number, toIdx: number) => void
  onDeleteDynamicItem?: (sectionId: string, idx: number) => void
  onDeleteSection?: (sectionId: string) => void
  onHeadingChange?: (key: string, value: string) => void
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */
const A4_W = 794
const A4_MIN_H = 1123

// Editable class — orijinal hazircv'den birebir
const EC = 'hover:bg-slate-100 transition-colors cursor-text outline-none focus:bg-slate-50 focus:ring-1 focus:ring-black rounded px-1'

const TRANSLATIONS = {
  tr: {
    summary: 'Kişisel Özet', experience: 'İş Deneyimi', education: 'Eğitim',
    skills: 'Teknik Yetenekler', additional: 'Ek Bilgiler',
    location: 'Lokasyon', phone: 'Telefon', email: 'E-posta',
    profil: 'linkedin.com/in/profil-linki',
  },
  en: {
    summary: 'Professional Summary', experience: 'Work Experience', education: 'Education',
    skills: 'Technical Skills', additional: 'Additional Information',
    location: 'Location', phone: 'Phone', email: 'Email',
    profil: 'linkedin.com/in/profile-link',
  },
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE STYLE HELPERS (Orijinal App.jsx'ten birebir)
   ═══════════════════════════════════════════════════════════════════════════ */

function getHeaderStyle(t: TemplateId): string {
  switch (t) {
    case 'classic':      return 'flex-col items-center text-center'
    case 'professional': return 'flex-row items-center justify-between border-b-2 pb-4'
    case 'elegant':      return 'flex-col items-center text-center border-b pb-6 mb-6'
    case 'bold':         return 'flex-col items-center text-center pb-4 mb-4'
    default:             return 'flex-row justify-between items-start' // modern
  }
}

function getSectionTitleStyle(t: TemplateId): string {
  switch (t) {
    case 'classic':      return 'text-center border-b pb-2 mb-3 font-serif tracking-widest text-[15px]'
    case 'professional': return 'w-32 flex-shrink-0 font-bold text-[15px] uppercase pt-1'
    case 'elegant':      return 'text-center uppercase tracking-widest text-[15px] font-semibold mb-4 mt-2'
    case 'bold':         return 'uppercase font-bold text-[16px] border-b-2 pb-2 mb-4 text-left'
    default:             return 'font-bold text-[15px] tracking-widest border-b mb-1 pb-2' // modern
  }
}

function getSectionContainerStyle(t: TemplateId, isLast: boolean): string {
  const spacing = 'mb-2 pb-1'
  const noSpacing = isLast ? 'mb-0 border-0 pb-0' : spacing
  if (t === 'professional') return `flex gap-6 border-b border-slate-100 ${noSpacing}`
  return isLast ? 'mb-0' : 'mb-2'
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export const CvPreview = forwardRef<CvPreviewHandle, Props>(function CvPreview(props, ref) {
  const {
    data, template, themeColor, narrativeVoice, textAlign,
    profileImage, photoShape,
    photoSize: photoSizeProp = 88,
    photoObjectX: photoObjectXProp = 50,
    photoObjectY: photoObjectYProp = 50,
    photoScale: photoScaleProp = 1,
    photoPosX: photoPosXProp = null,
    photoPosY: photoPosYProp = null,
    onPhotoChange,
    onPhotoPosChange,
    showIcons, cvLanguage,
    sectionsOrder = ['summary', 'experience', 'education', 'skills', 'additional'],
    customHeadings = {},
    onUpdate, onAddBullet, onDeleteBullet,
    onDeleteExperience, onDeleteEducation, onDeleteSkill, onDeleteAdditional,
    onSectionsReorder, onReorderExperience, onReorderEducation, onDeleteDynamicItem,
    onDeleteSection, onHeadingChange,
  } = props

  const wrapRef = useRef<HTMLDivElement>(null)
  const cvRef   = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [cvH, setCvH]     = useState(A4_MIN_H)

  // ── Photo drag/resize state ───────────────────────────────────────────────
  const scaleRef = useRef(1)
  scaleRef.current = scale
  const photoOuterRef = useRef<HTMLDivElement>(null)
  const panOverlayRef = useRef<HTMLDivElement>(null)
  // Wheel handler ref — her render'da güncel closure'ı tutar, non-passive listener'a geçilir
  const wheelHandlerRef = useRef<(e: WheelEvent) => void>(() => {})

  const dragStateRef = useRef<{
    type: string
    startX: number; startY: number
    startObjX: number; startObjY: number
    startSize: number
    startPosX: number; startPosY: number
    startScale: number
  } | null>(null)
  const [isPhotoDragging, setIsPhotoDragging] = useState(false)
  const [isPhotoHovered, setIsPhotoHovered] = useState(false)

  const t = TRANSLATIONS[cvLanguage]
  const isFirst = narrativeVoice === 'first'
  const textAlignStyle = textAlign.replace('text-', '') as React.CSSProperties['textAlign']

  // ── DnD: scale modifier + sensors ───────────────────────────────────────
  const scaleModifier: Modifier = ({ transform }) => ({
    ...transform,
    x: transform.x / scale,
    y: transform.y / scale,
  })
  const cvDndSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
  )

  // ── Inject drag-handle hover CSS once ───────────────────────────────────
  useEffect(() => {
    if (document.querySelector('[data-cv-dnd-styles]')) return
    const style = document.createElement('style')
    style.setAttribute('data-cv-dnd-styles', 'true')
    style.textContent = `
      .cv-dnd-section:hover > .cv-section-grip { opacity: 1 !important; }
      .cv-dnd-entry:hover > .cv-entry-grip { opacity: 1 !important; }
    `
    document.head.appendChild(style)
  }, [])

  // ── Responsive scale ────────────────────────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const calc = () => {
      const w = el.offsetWidth
      setScale(Math.max(0.25, Math.min(1, (w - 20) / A4_W)))
    }
    calc()
    const obs = new ResizeObserver(calc)
    obs.observe(el)
    window.addEventListener('resize', calc)
    return () => { obs.disconnect(); window.removeEventListener('resize', calc) }
  }, [data, template])

  // ── CV height tracking ──────────────────────────────────────────────────
  useEffect(() => {
    const el = cvRef.current
    if (!el) return
    const obs = new ResizeObserver(() => setCvH(Math.max(A4_MIN_H, el.scrollHeight)))
    obs.observe(el)
    return () => obs.disconnect()
  }, [data, template, sectionsOrder])

  // ── Pan overlay: non-passive wheel listener (preventDefault çalışsın) ───
  useEffect(() => {
    const el = panOverlayRef.current
    if (!el) return
    const handler = (e: WheelEvent) => wheelHandlerRef.current(e)
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [profileImage]) // profileImage değişince pan overlay yeniden mount edilir

  // ── PDF Export (orijinal handleDownloadPdf mantığı) ─────────────────────
  useImperativeHandle(ref, () => ({
    async downloadPdf() {
      const el = cvRef.current
      if (!el) return
      ;(document.activeElement as HTMLElement | null)?.blur()

      // data-no-pdf elementlerini gizle
      const noPdf = Array.from(el.querySelectorAll<HTMLElement>('[data-no-pdf]'))
      noPdf.forEach(e => { e.style.display = 'none' })

      // Clone oluştur (orijinal mantık)
      const clone = el.cloneNode(true) as HTMLElement
      clone.style.width = `${A4_W}px`
      clone.style.minHeight = `${A4_MIN_H}px`
      clone.style.height = 'max-content'
      clone.style.position = 'absolute'
      clone.style.top = '0'
      clone.style.left = '0'
      clone.style.zIndex = '-1000'
      clone.style.transform = 'none'
      clone.style.background = '#ffffff'
      document.body.appendChild(clone)

      // Page break logic
      const pageHeightPx = Math.ceil(A4_W * 1.414)
      const cloneRect = clone.getBoundingClientRect()
      const sections = Array.from(clone.querySelectorAll<HTMLElement>('[data-cv-section]'))
      sections.forEach(section => {
        const rect = section.getBoundingClientRect()
        const relTop = rect.top - cloneRect.top
        const relBottom = relTop + section.offsetHeight
        const startPage = Math.floor(relTop / pageHeightPx)
        const endPage = Math.floor(relBottom / pageHeightPx)
        if (startPage !== endPage && section.offsetHeight < pageHeightPx * 0.5) {
          const pushMargin = (endPage * pageHeightPx) - relTop + 40
          section.style.marginTop = `${pushMargin}px`
        }
      })

      // Tıklanabilir link pozisyonları
      const cloneLinks = Array.from(clone.querySelectorAll<HTMLElement>('.pdf-link'))
      const linkLocs = cloneLinks.map(link => {
        const r = link.getBoundingClientRect()
        return { x: r.left - cloneRect.left, y: r.top - cloneRect.top, w: r.width, h: r.height, url: link.getAttribute('data-url') }
      })

      try {
        const [{ toPng }, { jsPDF }] = await Promise.all([
          import('html-to-image'),
          import('jspdf'),
        ])

        const cloneH = clone.scrollHeight
        const imgData = await toPng(clone, {
          width: A4_W,
          height: cloneH,
          pixelRatio: 3,
          backgroundColor: '#ffffff',
          style: { transform: 'none' },
        })

        document.body.removeChild(clone)

        const pdf = new jsPDF('p', 'mm', 'a4')
        const pw = pdf.internal.pageSize.getWidth()
        const ph = pdf.internal.pageSize.getHeight()
        // pixelRatio:3 → actual pixel dimensions are A4_W*3 × cloneH*3
        const imgPixelW = A4_W * 3
        const imgPixelH = cloneH * 3
        const imgH = (imgPixelH * pw) / imgPixelW
        const pdfScale = pw / A4_W

        let heightLeft = imgH
        let position = 0
        let pageIndex = 0

        while (heightLeft > 10) {
          if (pageIndex > 0) pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, pw, imgH, undefined, 'FAST')

          // Link'leri ekle
          linkLocs.forEach(link => {
            if (!link.url) return
            const linkPdfY = link.y * pdfScale
            const pageTop = pageIndex * ph
            const pageBottom = (pageIndex + 1) * ph
            if (linkPdfY >= pageTop && linkPdfY < pageBottom) {
              pdf.link(link.x * pdfScale, linkPdfY - pageTop, link.w * pdfScale, link.h * pdfScale, { url: encodeURI(link.url) })
            }
          })

          heightLeft -= ph
          position -= ph
          pageIndex++
        }

        pdf.save(`${(data.name || 'cv').replace(/\s+/g, '_')}_CV_${cvLanguage.toUpperCase()}.pdf`)
      } catch (err) {
        if (document.body.contains(clone)) document.body.removeChild(clone)
        throw err
      } finally {
        noPdf.forEach(e => { e.style.display = '' })
      }
    },
  }))

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getSummary = () => isFirst ? (data.summary_v1 || '') : (data.summary_v3 || '')
  const getBullets = (exp: OptimizedCvData['experience'][0]) => {
    if (isFirst && exp.bullets_v1?.length) return exp.bullets_v1
    if (!isFirst && exp.bullets_v3?.length) return exp.bullets_v3
    return exp.bullets || []
  }
  const bulletsKey = isFirst ? 'bullets_v1' : 'bullets_v3'

  // ── Voice-aware helpers ───────────────────────────────────────────────────
  const getEduDetails = (edu: OptimizedCvData['education'][0]) =>
    isFirst ? (edu.details_v1 || edu.details || '') : (edu.details_v3 || edu.details || '')
  const updateEduDetails = (idx: number, value: string) =>
    updateArrayField('education', idx, isFirst ? 'details_v1' : 'details_v3', value)

  // Dinamik bölümlerde: önce voice-specific key'e bak (_v1/_v3), yoksa base key
  const getDynamicItems = (sectionId: string): unknown[] => {
    const d = data as Record<string, unknown>
    const voiceKey = sectionId + (isFirst ? '_v1' : '_v3')
    const voiced = d[voiceKey]
    if (Array.isArray(voiced) && voiced.length > 0) return voiced
    return (d[sectionId] as unknown[]) || []
  }
  const getStructuredDetails = (a: { details?: string[]; details_v1?: string[]; details_v3?: string[] }): string[] => {
    if (isFirst && a.details_v1?.length) return a.details_v1
    if (!isFirst && a.details_v3?.length) return a.details_v3
    return a.details || []
  }
  // Inline edit: voice-specific key varsa onu güncelle, yoksa base key
  const updateDynamicSimpleItem = (sectionId: string, idx: number, value: string) => {
    onUpdate(p => {
      const d = p as Record<string, unknown>
      const voiceKey = sectionId + (isFirst ? '_v1' : '_v3')
      const targetKey = Array.isArray(d[voiceKey]) ? voiceKey : sectionId
      const arr = [...(d[targetKey] as unknown[])]
      arr[idx] = value
      return { ...p, [targetKey]: arr }
    })
  }

  const updateField = (field: string, value: string) => {
    if (field === 'summary') {
      const key = isFirst ? 'summary_v1' : 'summary_v3'
      onUpdate(p => ({ ...p, [key]: value }))
    } else {
      onUpdate(p => ({ ...p, [field]: value }))
    }
  }

  const updateArrayField = (section: string, index: number, field: string, value: string) => {
    onUpdate(p => {
      const arr = [...(p as any)[section]]
      arr[index] = { ...arr[index], [field]: value }
      return { ...p, [section]: arr }
    })
  }

  const updateBulletPoint = (expIndex: number, bulletIndex: number, value: string) => {
    onUpdate(p => {
      const newExp = [...p.experience]
      const bk = bulletsKey as 'bullets_v1' | 'bullets_v3'
      const bullets = [...(newExp[expIndex][bk] || newExp[expIndex].bullets || [])]
      bullets[bulletIndex] = value
      newExp[expIndex] = { ...newExp[expIndex], [bk]: bullets }
      return { ...p, experience: newExp }
    })
  }

  const updateSimpleList = (section: string, index: number, value: string) => {
    onUpdate(p => {
      const arr = [...(p as any)[section]]
      arr[index] = value
      return { ...p, [section]: arr }
    })
  }

  const removeSectionItem = (section: string, index: number) => {
    onUpdate(p => {
      const arr = [...((p as any)[section] || [])]
      arr.splice(index, 1)
      return { ...p, [section]: arr }
    })
  }

  const removeBulletPoint = (expIndex: number, bulletIndex: number) => {
    onDeleteBullet?.(data.experience[expIndex]?.id, bulletIndex)
  }

  const lbl = (key: string) => customHeadings[key] || (t as any)[key] || key

  const toUpper = (text: string) => text ? text.toLocaleUpperCase(cvLanguage === 'tr' ? 'tr-TR' : 'en-US') : ''

  // ── FONT ────────────────────────────────────────────────────────────────
  const isSerif = template === 'classic' || template === 'bold' || template === 'modern' || template === 'professional'
  const fontFamily = isSerif
    ? 'Georgia, "Times New Roman", serif'
    : 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'

  const photoRadius = photoShape === 'rounded-full' ? '50%' : photoShape === 'rounded-none' ? '0' : '8px'

  // ── Interactive photo (absolute pos, edge-resize, scroll-zoom, pan, move) ─
  const renderPhotoInteractive = () => {
    if (!profileImage) return null

    const sz    = photoSizeProp
    const objX  = photoObjectXProp
    const objY  = photoObjectYProp
    const zoom  = photoScaleProp
    const posX  = photoPosXProp  ?? (A4_W - sz - 32)
    const posY  = photoPosYProp  ?? 24
    const goldBg = template === 'professional'

    // Handle size constants
    const M  = 10   // margin around frame for handles
    const EH = 8    // edge handle thickness
    const CH = 10   // corner handle size

    const clampSz = (n: number) => Math.max(50, Math.min(200, n))

    const startDrag = (type: string) => (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Capture on outer wrapper so onPointerMove fires there
      photoOuterRef.current?.setPointerCapture(e.pointerId)
      dragStateRef.current = {
        type,
        startX: e.clientX, startY: e.clientY,
        startObjX: objX, startObjY: objY,
        startSize: sz,
        startPosX: posX, startPosY: posY,
        startScale: zoom,
      }
      setIsPhotoDragging(true)
    }

    const onMove = (e: React.PointerEvent) => {
      const ds = dragStateRef.current
      if (!ds) return
      const sc = scaleRef.current
      const dx = (e.clientX - ds.startX) / sc
      const dy = (e.clientY - ds.startY) / sc

      if (ds.type === 'pan') {
        // Drag right → image shifts right → show LEFT side → objX decreases
        const newX = Math.max(0, Math.min(100, ds.startObjX - (dx / ds.startSize) * 100))
        const newY = Math.max(0, Math.min(100, ds.startObjY - (dy / ds.startSize) * 100))
        onPhotoChange?.(ds.startSize, newX, newY, ds.startScale)
      } else if (ds.type === 'pos') {
        // Move frame
        onPhotoPosChange?.(ds.startPosX + dx, ds.startPosY + dy)
      } else {
        // Resize — keep opposite corner/edge fixed
        let newSz = ds.startSize
        let newPX = ds.startPosX
        let newPY = ds.startPosY

        if      (ds.type === 'rs') { newSz = clampSz(ds.startSize + dy) }
        else if (ds.type === 'rn') { newSz = clampSz(ds.startSize - dy); newPY = ds.startPosY + ds.startSize - newSz }
        else if (ds.type === 're') { newSz = clampSz(ds.startSize + dx) }
        else if (ds.type === 'rw') { newSz = clampSz(ds.startSize - dx); newPX = ds.startPosX + ds.startSize - newSz }
        else if (ds.type === 'rnw') { newSz = clampSz(ds.startSize + (-dx - dy) / 2); const d = newSz - ds.startSize; newPX = ds.startPosX - d; newPY = ds.startPosY - d }
        else if (ds.type === 'rne') { newSz = clampSz(ds.startSize + (dx - dy) / 2);  const d = newSz - ds.startSize; newPY = ds.startPosY - d }
        else if (ds.type === 'rsw') { newSz = clampSz(ds.startSize + (-dx + dy) / 2); const d = newSz - ds.startSize; newPX = ds.startPosX - d }

        onPhotoChange?.(newSz, objX, objY, zoom)
        if (newPX !== ds.startPosX || newPY !== ds.startPosY) onPhotoPosChange?.(newPX, newPY)
      }
    }

    const onEnd = () => { dragStateRef.current = null; setIsPhotoDragging(false) }

    // Her render'da güncel closure'ı wheelHandlerRef'e yaz
    wheelHandlerRef.current = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const newZoom = Math.max(1, Math.min(4, zoom + (e.deltaY < 0 ? 0.1 : -0.1)))
      onPhotoChange?.(sz, objX, objY, newZoom)
    }

    // Shared style for resize handles (shown on hover/drag)
    const vis: React.CSSProperties = { opacity: isPhotoHovered || isPhotoDragging ? 1 : 0, transition: 'opacity 0.12s' }

    // Edge handle base
    const eh = (extra: React.CSSProperties): React.CSSProperties => ({
      position: 'absolute', zIndex: 3,
      background: 'rgba(99,102,241,0.5)',
      borderRadius: 3,
      ...vis, ...extra,
    })
    // Corner handle base
    const ch = (extra: React.CSSProperties): React.CSSProperties => ({
      position: 'absolute', width: CH, height: CH, zIndex: 4,
      background: '#6366f1', borderRadius: 2,
      ...vis, ...extra,
    })

    return (
      /* Outer wrapper: slightly larger than frame to accommodate handles */
      <div
        ref={photoOuterRef}
        style={{
          position: 'absolute',
          left: posX - M, top: posY - M,
          width: sz + 2 * M, height: sz + 2 * M,
          zIndex: 10,
          pointerEvents: onPhotoChange ? 'auto' : 'none',
        }}
        onMouseEnter={() => setIsPhotoHovered(true)}
        onMouseLeave={() => { if (!isPhotoDragging) setIsPhotoHovered(false) }}
        onPointerMove={onMove}
        onPointerUp={onEnd}
        onPointerCancel={onEnd}
      >
        {/* ── Photo frame (this part renders in PDF) ── */}
        <div style={{
          position: 'absolute', left: M, top: M, width: sz, height: sz,
          borderRadius: photoRadius, overflow: 'hidden',
          ...(goldBg ? { backgroundColor: '#F0C040' } : { border: '2px solid #e2e8f0' }),
        }}>
          <img
            src={profileImage} alt="Profil" draggable={false}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover' as const,
              objectPosition: `${objX}% ${objY}%`,
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
              display: 'block', userSelect: 'none' as const, pointerEvents: 'none',
            }}
          />
          {/* Pan overlay — captures drag & scroll inside the frame */}
          <div
            data-no-pdf
            ref={panOverlayRef}
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              cursor: dragStateRef.current?.type === 'pan' ? 'grabbing' : 'grab',
            }}
            onPointerDown={startDrag('pan')}
          />
          {/* Zoom hint */}
          {isPhotoHovered && !isPhotoDragging && (
            <div data-no-pdf style={{
              position: 'absolute', inset: 0, zIndex: 2,
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 2,
              background: 'rgba(0,0,0,0.14)', pointerEvents: 'none',
            }}>
              <span style={{ fontSize: 8, color: 'white', fontWeight: 700, letterSpacing: 0.4, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Kaydır: Kırp</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.3, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>Scroll: Zoom</span>
            </div>
          )}
        </div>

        {/* ── Handles (data-no-pdf, only visible on hover/drag) ── */}

        {/* Selection border */}
        <div data-no-pdf style={{
          ...vis,
          position: 'absolute', left: M - 1, top: M - 1, width: sz + 2, height: sz + 2,
          border: '1.5px dashed rgba(99,102,241,0.75)', borderRadius: photoRadius,
          pointerEvents: 'none', zIndex: 2,
        }} />

        {/* Edge handles */}
        <div data-no-pdf style={eh({ top: M - EH / 2, left: M + CH, right: M + CH, height: EH, cursor: 'ns-resize' })} onPointerDown={startDrag('rn')} />
        <div data-no-pdf style={eh({ bottom: M - EH / 2, left: M + CH, right: M + CH, height: EH, cursor: 'ns-resize' })} onPointerDown={startDrag('rs')} />
        <div data-no-pdf style={eh({ left: M - EH / 2, top: M + CH, bottom: M + CH, width: EH, cursor: 'ew-resize' })} onPointerDown={startDrag('rw')} />
        <div data-no-pdf style={eh({ right: M - EH / 2, top: M + CH, bottom: M + CH, width: EH, cursor: 'ew-resize' })} onPointerDown={startDrag('re')} />

        {/* Corner handles: NW / NE / SW = resize */}
        <div data-no-pdf style={ch({ top: M - CH / 2, left: M - CH / 2, cursor: 'nw-resize' })} onPointerDown={startDrag('rnw')} />
        <div data-no-pdf style={ch({ top: M - CH / 2, right: M - CH / 2, cursor: 'ne-resize' })} onPointerDown={startDrag('rne')} />
        <div data-no-pdf style={ch({ bottom: M - CH / 2, left: M - CH / 2, cursor: 'sw-resize' })} onPointerDown={startDrag('rsw')} />

        {/* Bottom-right corner = MOVE frame */}
        <div data-no-pdf style={{
          ...ch({ bottom: M - CH / 2 - 1, right: M - CH / 2 - 1, cursor: 'move', width: 14, height: 14, background: '#4f46e5' }),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onPointerDown={startDrag('pos')}>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8M5 1L3.5 2.5M5 1L6.5 2.5M5 9L3.5 7.5M5 9L6.5 7.5M1 5L2.5 3.5M1 5L2.5 6.5M9 5L7.5 3.5M9 5L7.5 6.5" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    )
  }

  // ── Padding ─────────────────────────────────────────────────────────────
  const padTop = template === 'professional' ? '40px' : '32px'
  const padSide = template === 'professional' ? '40px' : '32px'

  /* ═════════════════════════════════════════════════════════════════════════
     SECTION RENDERERS — Orijinal hazircv JSX'inden birebir
     ═════════════════════════════════════════════════════════════════════════ */

  // ── Section Title ───────────────────────────────────────────────────────
  const SectionTitle = ({ label, sectionId }: { label: string; sectionId?: string }) => {
    const stCls = getSectionTitleStyle(template)
    const extraStyle = (template === 'classic' || template === 'bold') ? { marginBottom: 12 } : {}
    return (
      <div className="group/section relative">
        <h3
          className={`${stCls} ${EC}`}
          style={{ color: themeColor, borderColor: themeColor, ...extraStyle }}
          contentEditable
          suppressContentEditableWarning
          onBlur={e => sectionId && onHeadingChange?.(sectionId, (e.currentTarget as HTMLElement).innerText)}
        >
          {toUpper(label)}
        </h3>
        {sectionId && onDeleteSection && (
          <button
            data-no-pdf="true"
            onClick={() => onDeleteSection(sectionId)}
            className="absolute right-0 top-1 opacity-0 group-hover/section:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
            title="Bu bölümü sil"
          >
            <TrashSvg />
          </button>
        )}
      </div>
    )
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  const renderSummary = () => {
    const summary = getSummary()
    if (!summary) return null
    return (
      <>
        <SectionTitle label={lbl('summary')} sectionId="summary" />
        <p
          className={`text-[12px] leading-tight text-slate-700 ${EC} ${textAlign}`}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateField('summary', (e.target as HTMLElement).innerText)}
        >
          {summary}
        </p>
      </>
    )
  }

  // ── Experience ──────────────────────────────────────────────────────────
  const renderExperience = () => {
    if (!data.experience?.length) return null
    const expIds = data.experience.map((e, i) => e.id || `exp-${i}`)
    return (
      <>
        <SectionTitle label={lbl('experience')} sectionId="experience" />
        <DndContext
          sensors={cvDndSensors}
          collisionDetection={closestCenter}
          modifiers={[scaleModifier]}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragEnd={(e: DragEndEvent) => {
            const { active, over } = e
            if (over && active.id !== over.id) {
              const o = expIds.indexOf(String(active.id))
              const n = expIds.indexOf(String(over.id))
              if (o !== -1 && n !== -1) onReorderExperience?.(o, n)
            }
          }}
        >
          <SortableContext items={expIds} strategy={verticalListSortingStrategy}>
            {data.experience.map((exp, idx) => {
              const bullets = getBullets(exp)
              return (
                <SortableEntryWrapper key={exp.id || idx} id={expIds[idx]} themeColor={themeColor}>
                  <div className="last:mb-0 group/item relative" style={{ marginBottom: template === 'classic' ? 4 : template === 'bold' ? 4 : 6 }}>
                    {/* Role + Company + Date */}
                    <div className="flex justify-between items-baseline" style={{ marginBottom: (template === 'classic' || template === 'bold') ? 4 : 2 }}>
                      <h4 className="font-bold text-[14px] text-slate-900 leading-snug">
                        <span className={EC} contentEditable suppressContentEditableWarning
                          onBlur={(e) => updateArrayField('experience', idx, 'role', (e.target as HTMLElement).innerText)}>
                          {exp.role}
                        </span>
                        {template !== 'professional' && (
                          <span className={`font-medium text-slate-600 ${EC}`} contentEditable suppressContentEditableWarning
                            onBlur={(e) => updateArrayField('experience', idx, 'company', (e.target as HTMLElement).innerText)}>
                            , {exp.company}
                          </span>
                        )}
                      </h4>
                      <span className={`${EC} text-[12px] font-bold italic whitespace-nowrap ${!exp.date ? 'text-slate-300' : 'text-slate-500'}`}
                        contentEditable suppressContentEditableWarning
                        onBlur={(e) => updateArrayField('experience', idx, 'date', (e.target as HTMLElement).innerText)}>
                        {exp.date || 'Tarih Ekle'}
                      </span>
                    </div>
                    {/* Professional template: company ayrı satır */}
                    {template === 'professional' && (
                      <p className={`text-[13px] font-semibold text-slate-600 mb-1 ${EC}`} contentEditable suppressContentEditableWarning
                        onBlur={(e) => updateArrayField('experience', idx, 'company', (e.target as HTMLElement).innerText)}>
                        {exp.company}
                      </p>
                    )}
                    {/* Bullet points */}
                    <ul className={`list-disc ml-4 space-y-0.5 ${textAlign}`} style={{ marginTop: (template === 'classic' || template === 'bold') ? 4 : 0 }}>
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="text-[12px] text-slate-700 relative group/subitem pr-6">
                          <span className={`outline-none ${EC}`} contentEditable suppressContentEditableWarning
                            onBlur={(e) => {
                              const newText = (e.target as HTMLElement).innerText.trim()
                              if (newText === '') removeBulletPoint(idx, bIdx)
                              else updateBulletPoint(idx, bIdx, newText)
                            }}>
                            {b}
                          </span>
                          {onDeleteBullet && (
                            <button data-no-pdf="true" onClick={() => removeBulletPoint(idx, bIdx)}
                              className="absolute right-0 top-0 opacity-0 group-hover/subitem:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10">
                              <TrashSvg />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    {onAddBullet && (
                      <button data-no-pdf="true" onClick={() => onAddBullet(exp.id)}
                        className="text-[10px] mt-1 opacity-0 group-hover/item:opacity-60 hover:!opacity-100 transition-opacity"
                        style={{ color: themeColor }}>
                        + madde ekle
                      </button>
                    )}
                    {onDeleteExperience && (
                      <button data-no-pdf="true" onClick={() => onDeleteExperience(exp.id)}
                        className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
                        title="Bu deneyimi sil">
                        <TrashSvg />
                      </button>
                    )}
                  </div>
                </SortableEntryWrapper>
              )
            })}
          </SortableContext>
        </DndContext>
      </>
    )
  }

  // ── Education ───────────────────────────────────────────────────────────
  const renderEducation = () => {
    if (!data.education?.length) return null
    const eduIds = data.education.map((e, i) => e.id || `edu-${i}`)
    return (
      <>
        <SectionTitle label={lbl('education')} sectionId="education" />
        <DndContext
          sensors={cvDndSensors}
          collisionDetection={closestCenter}
          modifiers={[scaleModifier]}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragEnd={(e: DragEndEvent) => {
            const { active, over } = e
            if (over && active.id !== over.id) {
              const o = eduIds.indexOf(String(active.id))
              const n = eduIds.indexOf(String(over.id))
              if (o !== -1 && n !== -1) onReorderEducation?.(o, n)
            }
          }}
        >
          <SortableContext items={eduIds} strategy={verticalListSortingStrategy}>
            {data.education.map((edu, idx) => (
              <SortableEntryWrapper key={edu.id || idx} id={eduIds[idx]} themeColor={themeColor}>
                <div className="last:mb-0 group/item relative" style={{ marginBottom: (template === 'classic' || template === 'bold') ? 10 : 4 }}>
                  <div className="flex justify-between items-baseline">
                    <div className={`flex-1 leading-tight text-[14px] ${EC}`}>
                      <span className="font-bold text-slate-900" contentEditable suppressContentEditableWarning
                        onBlur={(e) => updateArrayField('education', idx, 'degree', (e.target as HTMLElement).innerText)}>
                        {edu.degree}
                      </span>
                      <span className="mx-1.5 text-slate-300">|</span>
                      <span className="font-medium text-slate-600" contentEditable suppressContentEditableWarning
                        onBlur={(e) => updateArrayField('education', idx, 'school', (e.target as HTMLElement).innerText)}>
                        {edu.school}
                      </span>
                    </div>
                    <span className={`${EC} text-[12px] font-bold italic whitespace-nowrap ${!edu.date ? 'text-slate-300' : 'text-slate-500'}`}
                      contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateArrayField('education', idx, 'date', (e.target as HTMLElement).innerText)}>
                      {edu.date || 'Tarih Ekle'}
                    </span>
                  </div>
                  {getEduDetails(edu) && (
                    <p className={`text-[11px] text-slate-500 leading-snug ${EC} ${textAlign} mt-0.5`}
                      contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateEduDetails(idx, (e.target as HTMLElement).innerText)}>
                      {getEduDetails(edu)}
                    </p>
                  )}
                  {onDeleteEducation && (
                    <button data-no-pdf="true" onClick={() => onDeleteEducation(edu.id)}
                      className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
                      title="Bu eğitimi sil">
                      <TrashSvg />
                    </button>
                  )}
                </div>
              </SortableEntryWrapper>
            ))}
          </SortableContext>
        </DndContext>
      </>
    )
  }

  // ── Skills ──────────────────────────────────────────────────────────────
  const renderSkills = () => {
    if (!data.skills?.length) return null
    return (
      <>
        <SectionTitle label={lbl('skills')} sectionId="skills" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
          {data.skills.map((s, i) => (
            <div key={i} className="text-[12px] text-slate-700 flex items-start gap-2 relative group/item leading-snug pr-2">
              <span className="w-1 h-1 rounded-full shrink-0 mt-[6px]" style={{ backgroundColor: themeColor }} />
              <span
                className={`break-words flex-1 outline-none ${EC}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const v = (e.target as HTMLElement).innerText.trim()
                  if (v === '') removeSectionItem('skills', i)
                  else updateSimpleList('skills', i, v)
                }}
              >
                {s}
              </span>
              <button
                data-no-pdf="true"
                onClick={() => onDeleteSkill ? onDeleteSkill(i) : removeSectionItem('skills', i)}
                className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
              </button>
            </div>
          ))}
        </div>
      </>
    )
  }

  // ── Additional ──────────────────────────────────────────────────────────
  const renderAdditional = () => {
    if (!data.additional?.length) return null
    return (
      <>
        <SectionTitle label={lbl('additional')} sectionId="additional" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
          {data.additional.map((a, i) => (
            <div key={i} className="text-[12px] text-slate-700 relative group/item flex items-start gap-1.5 leading-snug pr-2">
              <span className="font-bold mt-[-1px] text-slate-400">•</span>
              <span
                className={`break-words flex-1 outline-none ${EC}`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const v = (e.target as HTMLElement).innerText.trim()
                  if (v === '') removeSectionItem('additional', i)
                  else updateSimpleList('additional', i, v)
                }}
              >
                {a}
              </span>
              <button
                data-no-pdf="true"
                onClick={() => onDeleteAdditional ? onDeleteAdditional(i) : removeSectionItem('additional', i)}
                className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
              </button>
            </div>
          ))}
        </div>
      </>
    )
  }

  // ── Generic item to string — obje gelse bile güvenli string'e çevirir ───
  const itemToStr = (a: unknown): string => {
    if (typeof a === 'string') return a
    if (a && typeof a === 'object') {
      const o = a as Record<string, unknown>
      return String(o.title || o.name || o.label || o.text || JSON.stringify(a))
    }
    return String(a ?? '')
  }

  // ── Snake_case key → okunabilir Türkçe başlık ───────────────────────────
  const KNOWN_SECTION_LABELS: Record<string, string> = {
    aktif_projeler: 'Aktif Projeler', projeler: 'Projeler', sertifikalar: 'Sertifikalar',
    aktiviteler: 'Aktiviteler', ilgi_alanlari: 'İlgi Alanları',
    diller: 'Diller', referanslar: 'Referanslar',
    gonullu_calismalar: 'Gönüllü Çalışmalar', kurslar: 'Kurslar',
    oduller: 'Ödüller', yayinlar: 'Yayınlar',
    projects: 'Projects', certifications: 'Certifications',
    languages: 'Languages', interests: 'Interests',
    volunteering: 'Volunteering', awards: 'Awards',
  }
  const sectionLabel = (sectionId: string) =>
    customHeadings[sectionId]
    || KNOWN_SECTION_LABELS[sectionId]
    || sectionId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // ── Generic item renderer: "BAŞLIK — açıklama" formatını bold title + description olarak ayırır ──
  const renderDynamicItemContent = (raw: unknown) => {
    const text = itemToStr(raw)
    const sep = text.indexOf(' — ')
    if (sep !== -1) {
      return (
        <>
          <span style={{ fontWeight: 700 }}>{text.slice(0, sep)}</span>
          <span>{' — ' + text.slice(sep + 3)}</span>
        </>
      )
    }
    return <span>{text}</span>
  }

  // Uzun items (ort. > 45 karakter) veya "—" içerenler → tek sütun, kısa olanlar → grid
  const isRichContent = (items: unknown[]) => {
    const strings = items.filter((a): a is string => typeof a === 'string')
    if (strings.length === 0) return false
    return strings.some(s => s.includes(' — ')) || strings.reduce((s, a) => s + a.length, 0) / strings.length > 45
  }

  const isStructuredItem = (a: unknown): a is { title?: string; subtitle?: string; date?: string; details?: string[]; details_v1?: string[]; details_v3?: string[] } =>
    a !== null && typeof a === 'object' && !Array.isArray(a)

  const updateDynamicItem = (sectionId: string, idx: number, field: string, value: string) => {
    onUpdate(p => {
      const arr = [...((p as Record<string, unknown>)[sectionId] as unknown[])]
      arr[idx] = { ...(arr[idx] as object), [field]: value }
      return { ...p, [sectionId]: arr }
    })
  }

  const updateDynamicItemDetail = (sectionId: string, idx: number, detailIdx: number, value: string) => {
    onUpdate(p => {
      const arr = [...((p as Record<string, unknown>)[sectionId] as unknown[])]
      const item = { ...(arr[idx] as Record<string, unknown>) }
      const dk = isFirst ? 'details_v1' : 'details_v3'
      const details = [...(((item[dk] as string[]) || (item.details as string[])) || [])]
      details[detailIdx] = value
      arr[idx] = { ...item, [dk]: details }
      return { ...p, [sectionId]: arr }
    })
  }

  // ── Generic fallback renderer — string[] olan bilinmeyen bölümler ────────
  const renderGenericSection = (sectionId: string) => {
    const items = getDynamicItems(sectionId)
    if (!Array.isArray(items) || items.length === 0) return null
    const heading = sectionLabel(sectionId)
    const hasStructured = items.some(isStructuredItem)
    return (
      <>
        <SectionTitle label={heading} sectionId={sectionId} />
        {hasStructured ? (
          <div>
            {items.map((a, i) => {
              if (isStructuredItem(a)) {
                return (
                  <div key={i} className="group/dynitem relative" style={{ marginBottom: 6 }}>
                    <div className="flex justify-between items-baseline" style={{ marginBottom: 2 }}>
                      <h4 className="font-bold text-[14px] text-slate-900 leading-snug">
                        <span className={EC} contentEditable suppressContentEditableWarning
                          onBlur={e => updateDynamicItem(sectionId, i, 'title', (e.target as HTMLElement).innerText)}>
                          {a.title || ''}
                        </span>
                        {a.subtitle && (
                          <span className={`font-medium text-slate-600 ${EC}`} contentEditable suppressContentEditableWarning
                            onBlur={e => updateDynamicItem(sectionId, i, 'subtitle', (e.target as HTMLElement).innerText)}>
                            {', '}{a.subtitle}
                          </span>
                        )}
                      </h4>
                      {a.date && (
                        <span className={`${EC} text-[12px] font-bold italic whitespace-nowrap text-slate-500`} contentEditable suppressContentEditableWarning
                          onBlur={e => updateDynamicItem(sectionId, i, 'date', (e.target as HTMLElement).innerText)}>
                          {a.date}
                        </span>
                      )}
                    </div>
                    {getStructuredDetails(a).length > 0 && (
                      <ul className={`list-disc ml-4 space-y-0.5 ${textAlign}`} style={{ marginTop: 4 }}>
                        {getStructuredDetails(a).map((d, di) => (
                          <li key={di} className="text-[12px] text-slate-700">
                            <span className={`outline-none ${EC}`} contentEditable suppressContentEditableWarning
                              onBlur={e => updateDynamicItemDetail(sectionId, i, di, (e.target as HTMLElement).innerText.trim())}>
                              {d}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {onDeleteDynamicItem && (
                      <button data-no-pdf="true" onClick={() => onDeleteDynamicItem(sectionId, i)}
                        className="absolute right-0 top-0 opacity-0 group-hover/dynitem:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10">
                        <TrashSvg />
                      </button>
                    )}
                  </div>
                )
              }
              return (
                <div key={i} className="group/dynitem relative text-[12px] text-slate-700 flex items-start gap-2 leading-snug mb-1.5 pr-5">
                  <span className="w-1 h-1 rounded-full shrink-0 mt-[6px]" style={{ backgroundColor: themeColor }} />
                  <span className={`break-words flex-1 outline-none ${EC}`} contentEditable suppressContentEditableWarning
                    onBlur={e => updateDynamicSimpleItem(sectionId, i, (e.target as HTMLElement).innerText.trim())}>
                    {renderDynamicItemContent(a)}
                  </span>
                  {onDeleteDynamicItem && (
                    <button data-no-pdf="true" onClick={() => onDeleteDynamicItem(sectionId, i)}
                      className="absolute right-0 top-0 opacity-0 group-hover/dynitem:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10">
                      <TrashSvg />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className={isRichContent(items) ? 'flex flex-col gap-y-2' : 'grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5'}>
            {items.map((a, i) => (
              <div key={i} className="group/dynitem relative text-[12px] text-slate-700 flex items-start gap-2 leading-snug pr-5">
                <span className="w-1 h-1 rounded-full shrink-0 mt-[6px]" style={{ backgroundColor: themeColor }} />
                <span className={`break-words flex-1 outline-none ${EC}`} contentEditable suppressContentEditableWarning
                  onBlur={e => updateSimpleList(sectionId, i, (e.target as HTMLElement).innerText.trim())}>
                  {renderDynamicItemContent(a)}
                </span>
                {onDeleteDynamicItem && (
                  <button data-no-pdf="true" onClick={() => onDeleteDynamicItem(sectionId, i)}
                    className="absolute right-0 top-0 opacity-0 group-hover/dynitem:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10">
                    <TrashSvg />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  const renderModernGenericSection = (sectionId: string) => {
    const items = getDynamicItems(sectionId)
    if (!Array.isArray(items) || items.length === 0) return null
    const heading = sectionLabel(sectionId)
    const hasStructured = items.some(isStructuredItem)
    return (
      <>
        {renderModernSectionTitle(heading, sectionId)}
        <div style={{ paddingLeft: 4 }}>
          {hasStructured ? items.map((a, i) => {
            if (isStructuredItem(a)) {
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <div>
                      <div contentEditable suppressContentEditableWarning
                        onBlur={e => updateDynamicItem(sectionId, i, 'title', (e.currentTarget as HTMLElement).innerText)}
                        style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', outline: 'none' }}>
                        {a.title || ''}
                      </div>
                      {a.subtitle && (
                        <div contentEditable suppressContentEditableWarning
                          onBlur={e => updateDynamicItem(sectionId, i, 'subtitle', (e.currentTarget as HTMLElement).innerText)}
                          style={{ fontSize: 11, fontWeight: 500, color: '#475569', outline: 'none', marginTop: 1 }}>
                          {a.subtitle}
                        </div>
                      )}
                    </div>
                    {a.date && (
                      <span contentEditable suppressContentEditableWarning
                        onBlur={e => updateDynamicItem(sectionId, i, 'date', (e.currentTarget as HTMLElement).innerText)}
                        style={{ fontSize: 10.5, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', marginLeft: 12, outline: 'none' }}>
                        {a.date}
                      </span>
                    )}
                  </div>
                  {getStructuredDetails(a).length > 0 && (
                    <div style={{ paddingLeft: 12 }}>
                      {getStructuredDetails(a).map((d, di) => (
                        <div key={di} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
                          <span style={{ color: themeColor, fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
                          <span contentEditable suppressContentEditableWarning
                            onBlur={e => updateDynamicItemDetail(sectionId, i, di, (e.currentTarget as HTMLElement).innerText.trim())}
                            style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none', flex: 1 }}>
                            {d}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                <span style={{ color: themeColor, fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
                <span contentEditable suppressContentEditableWarning
                  onBlur={e => updateDynamicSimpleItem(sectionId, i, (e.currentTarget as HTMLElement).innerText.trim())}
                  style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none' }}>
                  {renderDynamicItemContent(a)}
                </span>
              </div>
            )
          }) : items.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
              <span style={{ color: themeColor, fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
              <span contentEditable suppressContentEditableWarning
                onBlur={e => updateDynamicSimpleItem(sectionId, i, (e.currentTarget as HTMLElement).innerText.trim())}
                style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none' }}>
                {renderDynamicItemContent(a)}
              </span>
            </div>
          ))}
        </div>
      </>
    )
  }

  const renderProfessionalGenericSection = (sectionId: string) => {
    const items = getDynamicItems(sectionId)
    if (!Array.isArray(items) || items.length === 0) return null
    const heading = sectionLabel(sectionId)
    const hasStructured = items.some(isStructuredItem)
    return (
      <div style={{ display: 'flex', paddingTop: 16 }}>
        {renderProfessionalSectionLabel(heading, sectionId)}
        <div style={{ flex: 1 }}>
          {hasStructured ? items.map((a, i) => {
            if (isStructuredItem(a)) {
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 1 }}>
                    <div>
                      <div contentEditable suppressContentEditableWarning
                        onBlur={e => updateDynamicItem(sectionId, i, 'title', (e.currentTarget as HTMLElement).innerText)}
                        style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', outline: 'none' }}>
                        {a.title || ''}
                      </div>
                      {a.subtitle && (
                        <div contentEditable suppressContentEditableWarning
                          onBlur={e => updateDynamicItem(sectionId, i, 'subtitle', (e.currentTarget as HTMLElement).innerText)}
                          style={{ fontSize: 11, color: '#475569', marginTop: 1, outline: 'none' }}>
                          {a.subtitle}
                        </div>
                      )}
                    </div>
                    {a.date && (
                      <span contentEditable suppressContentEditableWarning
                        onBlur={e => updateDynamicItem(sectionId, i, 'date', (e.currentTarget as HTMLElement).innerText)}
                        style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', marginLeft: 12, outline: 'none' }}>
                        {a.date}
                      </span>
                    )}
                  </div>
                  {getStructuredDetails(a).length > 0 && (
                    <div style={{ paddingLeft: 10, marginTop: 3 }}>
                      {getStructuredDetails(a).map((d, di) => (
                        <div key={di} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 2 }}>
                          <span style={{ color: '#64748b', fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
                          <span contentEditable suppressContentEditableWarning
                            onBlur={e => updateDynamicItemDetail(sectionId, i, di, (e.currentTarget as HTMLElement).innerText.trim())}
                            style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none', flex: 1 }}>
                            {d}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8', fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
                <span contentEditable suppressContentEditableWarning
                  onBlur={e => updateDynamicSimpleItem(sectionId, i, (e.currentTarget as HTMLElement).innerText.trim())}
                  style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none' }}>
                  {renderDynamicItemContent(a)}
                </span>
              </div>
            )
          }) : items.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 4 }}>
              <span style={{ color: '#94a3b8', fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
              <span contentEditable suppressContentEditableWarning
                onBlur={e => updateDynamicSimpleItem(sectionId, i, (e.currentTarget as HTMLElement).innerText.trim())}
                style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none' }}>
                {renderDynamicItemContent(a)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Section map & ordered render ────────────────────────────────────────
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    summary: renderSummary,
    experience: renderExperience,
    education: renderEducation,
    skills: renderSkills,
    additional: renderAdditional,
  }


  /* ═════════════════════════════════════════════════════════════════════════
     MODERN TEMPLATE — Tamamen yeni tasarım (inline styles, renkli header bandı)
     ═════════════════════════════════════════════════════════════════════════ */

  const renderModernSectionTitle = (label: string, sectionId?: string) => (
    <div
      className="group/section relative"
      style={{
        borderTop: `1px solid ${themeColor}`,
        borderBottom: `1px solid ${themeColor}`,
        padding: '5px 0',
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={e => sectionId && onHeadingChange?.(sectionId, (e.currentTarget as HTMLElement).innerText)}
        style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: themeColor, outline: 'none', cursor: 'text' }}
      >
        {toUpper(label)}
      </span>
      {sectionId && onDeleteSection && (
        <button
          data-no-pdf="true"
          onClick={() => onDeleteSection(sectionId)}
          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/section:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
          title="Bu bölümü sil"
        >
          <TrashSvg />
        </button>
      )}
    </div>
  )

  const renderModernHeader = () => {
    // Düz metin öğeler (link olmayan)
    const textItems: string[] = []
    if (data.location) textItems.push(data.location)
    if (data.phone) textItems.push(data.phone)
    if (data.email) textItems.push(data.email)
    const linkedinUrl = data.linkedin
      ? (data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`)
      : null
    const extraLinks = (data.customLinks ?? []).filter(cl => !cl.url?.toLowerCase().includes('linkedin.com'))

    return (
      <div style={{
        backgroundColor: '#ffffff',
        padding: '28px 32px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        {/* Sol: İsim + Ünvan + İletişim */}
        <div style={{ flex: 1 }}>
          <div
            contentEditable suppressContentEditableWarning
            onBlur={e => updateField('name', (e.currentTarget as HTMLElement).innerText)}
            style={{ fontSize: 28, fontWeight: 800, color: themeColor, letterSpacing: 1.5, textTransform: 'uppercase' as const, lineHeight: 1.1, marginBottom: 6, outline: 'none' }}
          >
            {data.name || 'İSİM SOYİSİM'}
          </div>
          <div
            contentEditable suppressContentEditableWarning
            onBlur={e => updateField('title', (e.currentTarget as HTMLElement).innerText)}
            style={{ fontSize: 13, fontWeight: 500, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 10, outline: 'none' }}
          >
            {data.title}
          </div>
          {/* İletişim — ikonlar yok, | ile ayrılmış tek satır */}
          <div style={{ fontSize: 10.5, color: '#64748b', display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: '0px' }}>
            {textItems.map((item, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <span style={{ margin: '0 7px', color: '#cbd5e1' }}>|</span>}
                <span>{item}</span>
              </span>
            ))}
            {linkedinUrl && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {textItems.length > 0 && <span style={{ margin: '0 7px', color: '#cbd5e1' }}>|</span>}
                <span
                  className="pdf-link"
                  data-url={linkedinUrl}
                  contentEditable suppressContentEditableWarning
                  onBlur={e => updateField('linkedin', (e.currentTarget as HTMLElement).innerText)}
                  style={{ outline: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  {data.linkedin!.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              </span>
            )}
            {extraLinks.map((cl, i) => {
              const url = cl.url ? (cl.url.startsWith('http') ? cl.url : `https://${cl.url}`) : '#'
              return (
                <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ margin: '0 7px', color: '#cbd5e1' }}>|</span>
                  <a href={url} target="_blank" rel="noreferrer" className="pdf-link" data-url={url} style={{ outline: 'none', cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>
                    {cl.label}
                  </a>
                </span>
              )
            })}
          </div>
        </div>
        {/* Fotoğraf modern template için cvRef'in içinde absolute olarak render edilir */}
      </div>
    )
  }

  const renderModernSummary = () => {
    const summary = getSummary()
    if (!summary) return null
    return (
      <>
        {renderModernSectionTitle(lbl('summary'), 'summary')}
        <p
          contentEditable suppressContentEditableWarning
          onBlur={e => updateField('summary', (e.currentTarget as HTMLElement).innerText)}
          style={{ fontSize: 11, lineHeight: 1.55, color: '#374151', outline: 'none', margin: 0, textAlign: textAlignStyle }}
        >
          {summary}
        </p>
      </>
    )
  }

  const renderModernExperience = () => {
    if (!data.experience?.length) return null
    return (
      <>
        {renderModernSectionTitle(lbl('experience'), 'experience')}
        {data.experience.map((exp, idx) => {
          const bullets = getBullets(exp)
          return (
            <div key={exp.id || idx} style={{ marginBottom: 10 }} className="group/item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <div>
                  <div
                    contentEditable suppressContentEditableWarning
                    onBlur={e => updateArrayField('experience', idx, 'role', (e.currentTarget as HTMLElement).innerText)}
                    style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', outline: 'none' }}
                  >
                    {exp.role}
                  </div>
                  <div
                    contentEditable suppressContentEditableWarning
                    onBlur={e => updateArrayField('experience', idx, 'company', (e.currentTarget as HTMLElement).innerText)}
                    style={{ fontSize: 11, fontWeight: 500, color: '#475569', outline: 'none', marginTop: 1 }}
                  >
                    {exp.company}
                  </div>
                </div>
                {exp.date && (
                  <span
                    contentEditable suppressContentEditableWarning
                    onBlur={e => updateArrayField('experience', idx, 'date', (e.currentTarget as HTMLElement).innerText)}
                    style={{ fontSize: 10.5, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', marginLeft: 12, outline: 'none' }}
                  >
                    {exp.date}
                  </span>
                )}
              </div>
              <div style={{ paddingLeft: 12 }}>
                {bullets.map((b, bi) => (
                  <div key={bi} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 2 }} className="group/subitem relative pr-6">
                    <span style={{ color: themeColor, fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
                    <span
                      contentEditable suppressContentEditableWarning
                      onBlur={e => {
                        const v = (e.currentTarget as HTMLElement).innerText.trim()
                        if (!v) removeBulletPoint(idx, bi)
                        else updateBulletPoint(idx, bi, v)
                      }}
                      style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none', flex: 1, textAlign: textAlignStyle }}
                    >
                      {b}
                    </span>
                    {onDeleteBullet && (
                      <button
                        data-no-pdf="true"
                        onClick={() => removeBulletPoint(idx, bi)}
                        className="absolute right-0 top-0 opacity-0 group-hover/subitem:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {onAddBullet && (
                <button
                  data-no-pdf="true"
                  onClick={() => onAddBullet(exp.id)}
                  className="text-[10px] mt-1 opacity-0 group-hover/item:opacity-60 hover:!opacity-100 transition-opacity"
                  style={{ color: themeColor }}
                >
                  + madde ekle
                </button>
              )}
            </div>
          )
        })}
      </>
    )
  }

  const renderModernEducation = () => {
    if (!data.education?.length) return null
    return (
      <>
        {renderModernSectionTitle(lbl('education'), 'education')}
        {data.education.map((edu, idx) => (
          <div key={edu.id || idx} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div
                  contentEditable suppressContentEditableWarning
                  onBlur={e => updateArrayField('education', idx, 'degree', (e.currentTarget as HTMLElement).innerText)}
                  style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', outline: 'none' }}
                >
                  {edu.degree}
                </div>
                <div
                  contentEditable suppressContentEditableWarning
                  onBlur={e => updateArrayField('education', idx, 'school', (e.currentTarget as HTMLElement).innerText)}
                  style={{ fontSize: 11, color: '#475569', marginTop: 1, outline: 'none' }}
                >
                  {edu.school}
                </div>
              </div>
              {edu.date && (
                <span
                  contentEditable suppressContentEditableWarning
                  onBlur={e => updateArrayField('education', idx, 'date', (e.currentTarget as HTMLElement).innerText)}
                  style={{ fontSize: 10.5, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', marginLeft: 12, outline: 'none' }}
                >
                  {edu.date}
                </span>
              )}
            </div>
            {getEduDetails(edu) && (
              <div
                contentEditable suppressContentEditableWarning
                onBlur={e => updateEduDetails(idx, (e.currentTarget as HTMLElement).innerText)}
                style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, outline: 'none', textAlign: textAlignStyle }}
              >
                {getEduDetails(edu)}
              </div>
            )}
          </div>
        ))}
      </>
    )
  }

  const renderModernSkills = () => {
    if (!data.skills?.length) return null
    return (
      <>
        {renderModernSectionTitle(lbl('skills'), 'skills')}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '5px 8px',
          padding: '4px 0',
        }}>
          {data.skills.map((s, i) => (
            <div key={i} className="group/item relative" style={{ display: 'flex', alignItems: 'center' }}>
              <span
                contentEditable suppressContentEditableWarning
                onBlur={e => {
                  const v = (e.currentTarget as HTMLElement).innerText.trim()
                  if (!v) removeSectionItem('skills', i)
                  else updateSimpleList('skills', i, v)
                }}
                style={{ fontSize: 10.5, color: '#374151', outline: 'none' }}
              >
                {s}
              </span>
              <button
                data-no-pdf="true"
                onClick={() => onDeleteSkill ? onDeleteSkill(i) : removeSectionItem('skills', i)}
                className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
              </button>
            </div>
          ))}
        </div>
      </>
    )
  }

  const renderModernAdditional = () => {
    if (!data.additional?.length) return null
    return (
      <>
        {renderModernSectionTitle(lbl('additional'), 'additional')}
        <div style={{ paddingLeft: 4 }}>
          {data.additional.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }} className="group/item relative pr-6">
              <span style={{ color: themeColor, fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
              <span
                contentEditable suppressContentEditableWarning
                onBlur={e => {
                  const v = (e.currentTarget as HTMLElement).innerText.trim()
                  if (!v) removeSectionItem('additional', i)
                  else updateSimpleList('additional', i, v)
                }}
                style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none', textAlign: textAlignStyle }}
              >
                {a}
              </span>
              <button
                data-no-pdf="true"
                onClick={() => onDeleteAdditional ? onDeleteAdditional(i) : removeSectionItem('additional', i)}
                className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
              </button>
            </div>
          ))}
        </div>
      </>
    )
  }

  const modernSectionRenderers: Record<string, () => React.ReactNode> = {
    summary: renderModernSummary,
    experience: renderModernExperience,
    education: renderModernEducation,
    skills: renderModernSkills,
    additional: renderModernAdditional,
  }

  /* ═════════════════════════════════════════════════════════════════════════
     PROFESSIONAL TEMPLATE — Gutter düzeni + gold fotoğraf arka planı
     ═════════════════════════════════════════════════════════════════════════ */

  const PROF_LABEL_W = 96

  const renderProfessionalSectionLabel = (label: string, sectionId?: string) => (
    <div className="group/section relative" style={{ width: PROF_LABEL_W, flexShrink: 0, paddingRight: 14, paddingTop: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: '#1e293b', lineHeight: 1.35, display: 'block', wordBreak: 'break-word' as const }}>
        {toUpper(label)}
      </span>
      {sectionId && onDeleteSection && (
        <button
          data-no-pdf="true"
          onClick={() => onDeleteSection(sectionId)}
          className="absolute right-2 top-0 opacity-0 group-hover/section:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"
          title="Bu bölümü sil"
        >
          <TrashSvg />
        </button>
      )}
    </div>
  )

  const renderProfessionalHeader = () => (
    <div style={{ padding: '28px 32px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${themeColor}` }}>
      <div style={{ flex: 1 }}>
        {/* İsim */}
        <div
          contentEditable suppressContentEditableWarning
          onBlur={e => updateField('name', (e.currentTarget as HTMLElement).innerText)}
          style={{ fontSize: 30, fontWeight: 800, color: themeColor, letterSpacing: 0.5, lineHeight: 1.1, marginBottom: 5, outline: 'none' }}
        >
          {data.name || 'İSİM SOYİSİM'}
        </div>
        {/* Ünvan */}
        <div
          contentEditable suppressContentEditableWarning
          onBlur={e => updateField('title', (e.currentTarget as HTMLElement).innerText)}
          style={{ fontSize: 13, fontWeight: 500, color: '#475569', letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 12, outline: 'none' }}
        >
          {data.title}
        </div>
        {/* İletişim — ikonlu, tek satır */}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '3px 14px', fontSize: 10, color: '#475569' }}>
          {data.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg style={{ width: 9, height: 9, opacity: 0.7, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
              {data.location}
            </span>
          )}
          {data.phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg style={{ width: 9, height: 9, opacity: 0.7, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.67 21 3 13.33 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.26.2 2.47.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" /></svg>
              {data.phone}
            </span>
          )}
          {data.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg style={{ width: 9, height: 9, opacity: 0.7, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
              {data.email}
            </span>
          )}
          {data.linkedin && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg style={{ width: 9, height: 9, opacity: 0.8, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>
              <span
                className="pdf-link"
                data-url={data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`}
                contentEditable suppressContentEditableWarning
                onBlur={e => updateField('linkedin', (e.currentTarget as HTMLElement).innerText)}
                style={{ outline: 'none', cursor: 'pointer' }}
              >
                {data.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
              </span>
            </span>
          )}
          {(data.customLinks ?? []).filter(cl => !cl.url?.toLowerCase().includes('linkedin.com')).map((cl, i) => {
            const url = cl.url.startsWith('http') ? cl.url : `https://${cl.url}`
            return (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg style={{ width: 9, height: 9, opacity: 0.7, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d="M10 6v2H5v11h11v-5h2v6a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h6zm11-3v8l-3.528-3.536-5.99 5.997-1.042-1.042 5.99-5.997L13 3h8z" /></svg>
                <a href={url} target="_blank" rel="noreferrer" className="pdf-link" data-url={url} style={{ outline: 'none', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                  {cl.label}
                </a>
              </span>
            )
          })}
        </div>
      </div>
      {/* Fotoğraf professional template için cvRef'in içinde absolute olarak render edilir */}
    </div>
  )

  const renderProfessionalSummary = () => {
    const summary = getSummary()
    if (!summary) return null
    return (
      <div style={{ display: 'flex', paddingTop: 16 }}>
        {renderProfessionalSectionLabel(lbl('summary'), 'summary')}
        <div style={{ flex: 1 }}>
          <p
            contentEditable suppressContentEditableWarning
            onBlur={e => updateField('summary', (e.currentTarget as HTMLElement).innerText)}
            style={{ fontSize: 11, lineHeight: 1.6, color: '#374151', outline: 'none', margin: 0, textAlign: textAlignStyle }}
          >
            {summary}
          </p>
        </div>
      </div>
    )
  }

  const renderProfessionalExperience = () => {
    if (!data.experience?.length) return null
    return (
      <div style={{ display: 'flex', paddingTop: 16 }}>
        {renderProfessionalSectionLabel(lbl('experience'), 'experience')}
        <div style={{ flex: 1 }}>
          {data.experience.map((exp, idx) => {
            const bullets = getBullets(exp)
            return (
              <div key={exp.id || idx} style={{ marginBottom: 10 }} className="group/item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 1 }}>
                  <div>
                    <div
                      contentEditable suppressContentEditableWarning
                      onBlur={e => updateArrayField('experience', idx, 'role', (e.currentTarget as HTMLElement).innerText)}
                      style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', outline: 'none' }}
                    >
                      {exp.role}
                    </div>
                    <div
                      contentEditable suppressContentEditableWarning
                      onBlur={e => updateArrayField('experience', idx, 'company', (e.currentTarget as HTMLElement).innerText)}
                      style={{ fontSize: 11, color: '#475569', marginTop: 1, outline: 'none' }}
                    >
                      {exp.company}
                    </div>
                  </div>
                  {exp.date && (
                    <span
                      contentEditable suppressContentEditableWarning
                      onBlur={e => updateArrayField('experience', idx, 'date', (e.currentTarget as HTMLElement).innerText)}
                      style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', marginLeft: 12, outline: 'none' }}
                    >
                      {exp.date}
                    </span>
                  )}
                </div>
                <div style={{ paddingLeft: 10, marginTop: 3 }}>
                  {bullets.map((b, bi) => (
                    <div key={bi} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 2 }} className="group/subitem relative pr-6">
                      <span style={{ color: '#64748b', fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
                      <span
                        contentEditable suppressContentEditableWarning
                        onBlur={e => {
                          const v = (e.currentTarget as HTMLElement).innerText.trim()
                          if (!v) removeBulletPoint(idx, bi)
                          else updateBulletPoint(idx, bi, v)
                        }}
                        style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none', flex: 1 }}
                      >
                        {b}
                      </span>
                      {onDeleteBullet && (
                        <button data-no-pdf="true" onClick={() => removeBulletPoint(idx, bi)} className="absolute right-0 top-0 opacity-0 group-hover/subitem:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {onAddBullet && (
                  <button data-no-pdf="true" onClick={() => onAddBullet(exp.id)} className="text-[10px] mt-1 opacity-0 group-hover/item:opacity-60 hover:!opacity-100 transition-opacity" style={{ color: '#64748b' }}>
                    + madde ekle
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderProfessionalEducation = () => {
    if (!data.education?.length) return null
    return (
      <div style={{ display: 'flex', paddingTop: 16 }}>
        {renderProfessionalSectionLabel(lbl('education'), 'education')}
        <div style={{ flex: 1 }}>
          {data.education.map((edu, idx) => (
            <div key={edu.id || idx} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div
                    contentEditable suppressContentEditableWarning
                    onBlur={e => updateArrayField('education', idx, 'degree', (e.currentTarget as HTMLElement).innerText)}
                    style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', outline: 'none' }}
                  >
                    {edu.degree}
                  </div>
                  <div
                    contentEditable suppressContentEditableWarning
                    onBlur={e => updateArrayField('education', idx, 'school', (e.currentTarget as HTMLElement).innerText)}
                    style={{ fontSize: 11, color: '#475569', marginTop: 1, outline: 'none' }}
                  >
                    {edu.school}
                  </div>
                </div>
                {edu.date && (
                  <span
                    contentEditable suppressContentEditableWarning
                    onBlur={e => updateArrayField('education', idx, 'date', (e.currentTarget as HTMLElement).innerText)}
                    style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', marginLeft: 12, outline: 'none' }}
                  >
                    {edu.date}
                  </span>
                )}
              </div>
              {getEduDetails(edu) && (
                <div
                  contentEditable suppressContentEditableWarning
                  onBlur={e => updateEduDetails(idx, (e.currentTarget as HTMLElement).innerText)}
                  style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, outline: 'none' }}
                >
                  {getEduDetails(edu)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderProfessionalSkills = () => {
    if (!data.skills?.length) return null
    return (
      <div style={{ display: 'flex', paddingTop: 16 }}>
        {renderProfessionalSectionLabel(lbl('skills'), 'skills')}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 8px' }}>
          {data.skills.map((s, i) => (
            <div key={i} className="group/item relative" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#94a3b8', flexShrink: 0 }} />
              <span
                contentEditable suppressContentEditableWarning
                onBlur={e => {
                  const v = (e.currentTarget as HTMLElement).innerText.trim()
                  if (!v) removeSectionItem('skills', i)
                  else updateSimpleList('skills', i, v)
                }}
                style={{ fontSize: 10.5, color: '#374151', outline: 'none' }}
              >
                {s}
              </span>
              <button data-no-pdf="true" onClick={() => onDeleteSkill ? onDeleteSkill(i) : removeSectionItem('skills', i)} className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderProfessionalAdditional = () => {
    if (!data.additional?.length) return null
    return (
      <div style={{ display: 'flex', paddingTop: 16 }}>
        {renderProfessionalSectionLabel(lbl('additional'), 'additional')}
        <div style={{ flex: 1 }}>
          {data.additional.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 3 }} className="group/item relative pr-6">
              <span style={{ color: '#94a3b8', fontSize: 10, marginTop: 2, flexShrink: 0 }}>•</span>
              <span
                contentEditable suppressContentEditableWarning
                onBlur={e => {
                  const v = (e.currentTarget as HTMLElement).innerText.trim()
                  if (!v) removeSectionItem('additional', i)
                  else updateSimpleList('additional', i, v)
                }}
                style={{ fontSize: 10.5, lineHeight: 1.5, color: '#374151', outline: 'none' }}
              >
                {a}
              </span>
              <button data-no-pdf="true" onClick={() => onDeleteAdditional ? onDeleteAdditional(i) : removeSectionItem('additional', i)} className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const professionalSectionRenderers: Record<string, () => React.ReactNode> = {
    summary: renderProfessionalSummary,
    experience: renderProfessionalExperience,
    education: renderProfessionalEducation,
    skills: renderProfessionalSkills,
    additional: renderProfessionalAdditional,
  }

  /* ═════════════════════════════════════════════════════════════════════════
     HEADER — Her template için farklı (Orijinalden birebir)
     ═════════════════════════════════════════════════════════════════════════ */

  const renderHeader = () => {
    const isCentered = template === 'classic' || template === 'elegant' || template === 'bold'

    return (
      <div className={`flex ${getHeaderStyle(template)} mb-3`} style={{ borderColor: themeColor }}>
        <div className={isCentered ? 'text-center w-full' : 'flex-1 pr-6'}>
          {/* İsim */}
          <h1
            className={`text-4xl font-bold uppercase tracking-tight mb-2 ${EC}`}
            style={{ color: themeColor }}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateField('name', (e.target as HTMLElement).innerText)}
          >
            {data.name || 'İsim Giriniz'}
          </h1>

          {/* Ünvan */}
          <h2
            className={`text-xl font-bold text-slate-800 mb-2 ${EC} ${(template === 'classic' || template === 'bold') ? 'text-slate-600 font-medium' : ''}`}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateField('title', (e.target as HTMLElement).innerText)}
          >
            {data.title}
          </h2>

          {/* İletişim bilgileri */}
          <div className={`flex flex-wrap ${isCentered ? 'justify-center gap-2 text-[11px]' : 'items-center gap-x-2 gap-y-0.5 text-[10px]'} text-slate-500 font-medium`} style={{ marginTop: (template === 'classic' || template === 'bold') ? 10 : 4, marginBottom: (template === 'classic' || template === 'bold') ? 10 : 0 }}>
            {/* Location */}
            {data.location && (
              <>
                <div className="flex items-center gap-1">
                  {showIcons && (
                    <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                  )}
                  <span className={EC} contentEditable suppressContentEditableWarning onBlur={(e) => updateField('location', (e.target as HTMLElement).innerText)}>
                    {data.location}
                  </span>
                </div>
                <span className="text-slate-300">•</span>
              </>
            )}
            {/* Phone */}
            {data.phone && (
              <>
                <div className="flex items-center gap-1">
                  {showIcons && (
                    <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.67 21 3 13.33 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.26.2 2.47.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" /></svg>
                  )}
                  <span className={EC} contentEditable suppressContentEditableWarning onBlur={(e) => updateField('phone', (e.target as HTMLElement).innerText)}>
                    {data.phone}
                  </span>
                </div>
                <span className="text-slate-300">•</span>
              </>
            )}
            {/* Email */}
            {data.email && (
              <div className="flex items-center gap-1">
                {showIcons && (
                  <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                )}
                <a href={`mailto:${data.email}`} className={`pdf-link ${EC}`} data-url={`mailto:${data.email}`}
                  contentEditable suppressContentEditableWarning onBlur={(e) => updateField('email', (e.target as HTMLElement).innerText)}>
                  {data.email}
                </a>
              </div>
            )}
            {/* LinkedIn */}
            {data.linkedin && (
              <>
                {(data.location || data.phone || data.email) && <span className="text-slate-300">•</span>}
                <div className="flex items-center gap-1">
                  {showIcons && (
                    <svg className="w-2.5 h-2.5 opacity-80" style={{ color: themeColor }} viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>
                  )}
                  <span
                    className={`${EC} font-semibold pdf-link`}
                    style={{ color: themeColor }}
                    data-url={data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateField('linkedin', (e.target as HTMLElement).innerText)}
                  >
                    {decodeURIComponent(data.linkedin).replace(/^https?:\/\/(www\.)?/, '')}
                  </span>
                </div>
              </>
            )}
            {(data.customLinks ?? []).filter(cl => !cl.url?.toLowerCase().includes('linkedin.com')).map((cl, i) => {
              const url = cl.url ? (cl.url.startsWith('http') ? cl.url : `https://${cl.url}`) : '#'
              return (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-slate-300">•</span>
                  <a href={url} target="_blank" rel="noreferrer" className={`font-semibold pdf-link`} data-url={url} style={{ color: themeColor, textDecoration: 'none', cursor: 'pointer', outline: 'none' }}>
                    {cl.label}
                  </a>
                </div>
              )
            })}
          </div>
        </div>

        {/* Fotoğraf default render'da showPhoto zaten false, cvRef'te absolute */}
      </div>
    )
  }

  /* ═════════════════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════════════════ */

  // ── Professional template: gutter düzeni, gold fotoğraf ─────────────────
  if (template === 'professional') {
    return (
      <div ref={wrapRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          className="relative bg-white shadow-2xl"
          style={{ width: `${A4_W * scale}px`, height: `${cvH * scale}px`, flexShrink: 0 }}
        >
          <div
            ref={cvRef}
            className="absolute top-0 left-0 overflow-visible select-none origin-top-left"
            style={{
              width: `${A4_W}px`,
              minWidth: `${A4_W}px`,
              minHeight: `${A4_MIN_H}px`,
              height: 'max-content',
              transform: `scale(${scale})`,
              fontFamily: 'Georgia, "Times New Roman", serif',
              background: '#ffffff',
              color: '#0f172a',
            }}
          >
            {renderProfessionalHeader()}
            <div style={{ padding: '4px 32px 32px' }}>
              <DndContext sensors={cvDndSensors} collisionDetection={closestCenter} modifiers={[scaleModifier]} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                onDragEnd={(e: DragEndEvent) => { const { active, over } = e; if (over && active.id !== over.id) { const o = sectionsOrder.indexOf(String(active.id)); const n = sectionsOrder.indexOf(String(over.id)); if (o !== -1 && n !== -1) onSectionsReorder?.(arrayMove(sectionsOrder, o, n)) } }}>
                <SortableContext items={sectionsOrder} strategy={verticalListSortingStrategy}>
                  {sectionsOrder.map((sectionId) => {
                    const renderer = professionalSectionRenderers[sectionId]
                    const content = renderer ? renderer() : renderProfessionalGenericSection(sectionId)
                    if (!content) return null
                    return (
                      <SortableSectionWrapper key={sectionId} id={sectionId} themeColor={themeColor}>
                        <div data-cv-section={sectionId} style={{ pageBreakInside: 'avoid' }}>
                          {content}
                        </div>
                      </SortableSectionWrapper>
                    )
                  })}
                </SortableContext>
              </DndContext>
            </div>
            {renderPhotoInteractive()}
          </div>
        </div>
      </div>
    )
  }

  // ── Modern template: tam farklı yapı (header padding'siz, body ayrı) ──────
  if (template === 'modern') {
    return (
      <div ref={wrapRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          className="relative bg-white shadow-2xl"
          style={{ width: `${A4_W * scale}px`, height: `${cvH * scale}px`, flexShrink: 0 }}
        >
          <div
            ref={cvRef}
            className="absolute top-0 left-0 overflow-visible select-none origin-top-left"
            style={{
              width: `${A4_W}px`,
              minWidth: `${A4_W}px`,
              minHeight: `${A4_MIN_H}px`,
              height: 'max-content',
              transform: `scale(${scale})`,
              fontFamily: 'Georgia, "Times New Roman", serif',
              background: '#ffffff',
              color: '#0f172a',
            }}
          >
            {/* Header — kendi padding'i var, tam genişlik */}
            {renderModernHeader()}

            {/* Body — sections */}
            <div style={{ padding: '10px 32px 32px' }}>
              <DndContext sensors={cvDndSensors} collisionDetection={closestCenter} modifiers={[scaleModifier]} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                onDragEnd={(e: DragEndEvent) => { const { active, over } = e; if (over && active.id !== over.id) { const o = sectionsOrder.indexOf(String(active.id)); const n = sectionsOrder.indexOf(String(over.id)); if (o !== -1 && n !== -1) onSectionsReorder?.(arrayMove(sectionsOrder, o, n)) } }}>
                <SortableContext items={sectionsOrder} strategy={verticalListSortingStrategy}>
                  {sectionsOrder.map((sectionId, index) => {
                    const isLast = index === sectionsOrder.length - 1
                    const renderer = modernSectionRenderers[sectionId]
                    const content = renderer ? renderer() : renderModernGenericSection(sectionId)
                    if (!content) return null
                    return (
                      <SortableSectionWrapper key={sectionId} id={sectionId} themeColor={themeColor}>
                        <div data-cv-section={sectionId} style={{ marginBottom: isLast ? 0 : 14, pageBreakInside: 'avoid' }}>
                          {content}
                        </div>
                      </SortableSectionWrapper>
                    )
                  })}
                </SortableContext>
              </DndContext>
            </div>
            {renderPhotoInteractive()}
          </div>
        </div>
      </div>
    )
  }

  // ── Mevcut CV template — düz, okunabilir, stil-nötr ─────────────────────────
  if (template === 'mevcut') {
    const bullets = (exp: typeof data.experience[0]) => narrativeVoice === 'first' ? exp.bullets_v1 : exp.bullets_v3
    const summary = narrativeVoice === 'first' ? data.summary_v1 : data.summary_v3
    return (
      <div ref={wrapRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="relative bg-white shadow-2xl" style={{ width: `${A4_W * scale}px`, height: `${cvH * scale}px`, flexShrink: 0 }}>
          <div
            ref={cvRef}
            className="absolute top-0 left-0 overflow-visible select-none origin-top-left"
            style={{ width: `${A4_W}px`, minWidth: `${A4_W}px`, minHeight: `${A4_MIN_H}px`, height: 'max-content', transform: `scale(${scale})`, fontFamily: 'Arial, Helvetica, sans-serif', background: '#ffffff', color: '#111827', padding: '48px 56px 48px' }}
          >
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div className={EC} contentEditable suppressContentEditableWarning style={{ fontSize: 22, fontWeight: 700, marginBottom: 3 }} onBlur={e => onUpdate(p => ({ ...p, name: (e.target as HTMLElement).innerText }))}>{data.name}</div>
              <div className={EC} contentEditable suppressContentEditableWarning style={{ fontSize: 14, color: '#374151', marginBottom: 6 }} onBlur={e => onUpdate(p => ({ ...p, title: (e.target as HTMLElement).innerText }))}>{data.title}</div>
              <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '0 16px', lineHeight: 1.6 }}>
                {data.email && <span className={EC} contentEditable suppressContentEditableWarning onBlur={e => onUpdate(p => ({ ...p, email: (e.target as HTMLElement).innerText }))}>{data.email}</span>}
                {data.phone && <span className={EC} contentEditable suppressContentEditableWarning onBlur={e => onUpdate(p => ({ ...p, phone: (e.target as HTMLElement).innerText }))}>{data.phone}</span>}
                {data.location && <span className={EC} contentEditable suppressContentEditableWarning onBlur={e => onUpdate(p => ({ ...p, location: (e.target as HTMLElement).innerText }))}>{data.location}</span>}
                {data.linkedin && <span className={EC} contentEditable suppressContentEditableWarning onBlur={e => onUpdate(p => ({ ...p, linkedin: (e.target as HTMLElement).innerText }))}>{data.linkedin}</span>}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', marginBottom: 18 }} />
            {/* Summary */}
            {summary && (
              <div style={{ marginBottom: 18 }} data-cv-section="summary">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#374151', marginBottom: 6 }}>Kişisel Özet</div>
                <div className={`text-[13px] text-slate-700 leading-relaxed ${EC}`} contentEditable suppressContentEditableWarning onBlur={e => { const v = (e.target as HTMLElement).innerText; onUpdate(p => ({ ...p, summary_v1: v, summary_v3: v })) }}>{summary}</div>
              </div>
            )}
            {/* Experience */}
            {data.experience?.length > 0 && (
              <div style={{ marginBottom: 18 }} data-cv-section="experience">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#374151', marginBottom: 8 }}>İş Deneyimi</div>
                {data.experience.map((exp, idx) => (
                  <div key={exp.id} className="group/item relative" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>
                        <span className={EC} contentEditable suppressContentEditableWarning onBlur={e => updateArrayField('experience', idx, 'role', (e.target as HTMLElement).innerText)}>{exp.role}</span>
                        {exp.company && <><span style={{ color: '#9ca3af' }}> · </span><span className={EC} contentEditable suppressContentEditableWarning style={{ fontWeight: 400, color: '#374151' }} onBlur={e => updateArrayField('experience', idx, 'company', (e.target as HTMLElement).innerText)}>{exp.company}</span></>}
                      </div>
                      <span className={EC} contentEditable suppressContentEditableWarning style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8 }} onBlur={e => updateArrayField('experience', idx, 'date', (e.target as HTMLElement).innerText)}>{exp.date || 'Tarih Ekle'}</span>
                    </div>
                    <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                      {bullets(exp).map((b, bIdx) => (
                        <li key={bIdx} className="relative group/subitem pr-6" style={{ fontSize: 12, color: '#374151', marginBottom: 2, lineHeight: 1.5 }}>
                          <span className={`outline-none ${EC}`} contentEditable suppressContentEditableWarning onBlur={e => { const t = (e.target as HTMLElement).innerText.trim(); t === '' ? removeBulletPoint(idx, bIdx) : updateBulletPoint(idx, bIdx, t) }}>{b}</span>
                          {onDeleteBullet && <button data-no-pdf="true" onClick={() => removeBulletPoint(idx, bIdx)} className="absolute right-0 top-0 opacity-0 group-hover/subitem:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg></button>}
                        </li>
                      ))}
                    </ul>
                    {onAddBullet && <button data-no-pdf="true" onClick={() => onAddBullet(exp.id)} className="text-[10px] mt-1 opacity-0 group-hover/item:opacity-60 hover:!opacity-100 transition-opacity" style={{ color: '#6b7280' }}>+ madde ekle</button>}
                    {onDeleteExperience && <button data-no-pdf="true" onClick={() => onDeleteExperience(exp.id)} className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10" title="Sil"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg></button>}
                  </div>
                ))}
              </div>
            )}
            {/* Education */}
            {data.education?.length > 0 && (
              <div style={{ marginBottom: 18 }} data-cv-section="education">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#374151', marginBottom: 8 }}>Eğitim</div>
                {data.education.map((edu, idx) => (
                  <div key={edu.id} className="group/item relative" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: 13 }}>
                        <span className="font-bold" contentEditable suppressContentEditableWarning style={{ outline: 'none' }} onBlur={e => updateArrayField('education', idx, 'degree', (e.target as HTMLElement).innerText)}>{edu.degree}</span>
                        {edu.school && <><span style={{ color: '#9ca3af' }}> · </span><span className={EC} contentEditable suppressContentEditableWarning style={{ color: '#374151' }} onBlur={e => updateArrayField('education', idx, 'school', (e.target as HTMLElement).innerText)}>{edu.school}</span></>}
                      </div>
                      <span className={EC} contentEditable suppressContentEditableWarning style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8 }} onBlur={e => updateArrayField('education', idx, 'date', (e.target as HTMLElement).innerText)}>{edu.date || 'Tarih Ekle'}</span>
                    </div>
                    {getEduDetails(edu) && <div className={`text-[11px] text-slate-500 mt-0.5 ${EC}`} contentEditable suppressContentEditableWarning onBlur={e => updateEduDetails(idx, (e.target as HTMLElement).innerText)}>{getEduDetails(edu)}</div>}
                    {onDeleteEducation && <button data-no-pdf="true" onClick={() => onDeleteEducation(edu.id)} className="absolute right-0 top-0 opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10" title="Sil"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg></button>}
                  </div>
                ))}
              </div>
            )}
            {/* Skills */}
            {data.skills?.length > 0 && (
              <div style={{ marginBottom: 18 }} data-cv-section="skills">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#374151', marginBottom: 8 }}>Beceriler</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
                  {data.skills.map((s, i) => (
                    <div key={i} className="relative group/item flex items-center gap-1" style={{ fontSize: 12, color: '#374151' }}>
                      <span style={{ color: '#9ca3af' }}>•</span>
                      <span className={`outline-none ${EC}`} contentEditable suppressContentEditableWarning onBlur={e => { const v = (e.target as HTMLElement).innerText.trim(); v === '' ? (onDeleteSkill ? onDeleteSkill(i) : removeSectionItem('skills', i)) : updateSimpleList('skills', i, v) }}>{s}</span>
                      <button data-no-pdf="true" onClick={() => onDeleteSkill ? onDeleteSkill(i) : removeSectionItem('skills', i)} className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Additional */}
            {data.additional?.length > 0 && (
              <div data-cv-section="additional">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#374151', marginBottom: 8 }}>Ek Bilgiler</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                  {data.additional.map((a, i) => (
                    <div key={i} className="relative group/item flex items-center gap-1" style={{ fontSize: 12, color: '#374151' }}>
                      <span style={{ color: '#9ca3af' }}>•</span>
                      <span className={`outline-none ${EC}`} contentEditable suppressContentEditableWarning onBlur={e => { const v = (e.target as HTMLElement).innerText.trim(); v === '' ? (onDeleteAdditional ? onDeleteAdditional(i) : removeSectionItem('additional', i)) : updateSimpleList('additional', i, v) }}>{a}</span>
                      <button data-no-pdf="true" onClick={() => onDeleteAdditional ? onDeleteAdditional(i) : removeSectionItem('additional', i)} className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity z-10"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Diğer template'ler (classic, professional, elegant, bold) ─────────────
  return (
    <div ref={wrapRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      {/* Outer container — scaled height */}
      <div
        className="relative bg-white shadow-2xl"
        style={{
          width: `${A4_W * scale}px`,
          height: `${cvH * scale}px`,
          flexShrink: 0,
        }}
      >
        {/* A4 Kağıt — scale ile küçültülür */}
        <div
          ref={cvRef}
          className={`absolute top-0 left-0 overflow-visible select-none origin-top-left ${isSerif ? 'font-serif' : 'font-sans'}`}
          style={{
            width: `${A4_W}px`,
            minWidth: `${A4_W}px`,
            minHeight: `${A4_MIN_H}px`,
            height: 'max-content',
            paddingTop: padTop,
            paddingRight: padSide,
            paddingLeft: padSide,
            paddingBottom: '32px',
            transform: `scale(${scale})`,
            fontFamily,
            background: '#ffffff',
            color: '#0f172a',
          }}
        >
          {/* CV İçeriği — grid layout (classic hariç) */}
          <div className={template !== 'classic' ? 'grid grid-cols-2 gap-x-6 gap-y-0' : ''}>
            {/* Header — col-span-2 */}
            <div className={template !== 'classic' ? 'col-span-2' : ''}>
              {renderHeader()}
            </div>

            {/* Sections — hepsi col-span-2 */}
            <DndContext sensors={cvDndSensors} collisionDetection={closestCenter} modifiers={[scaleModifier]} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
              onDragEnd={(e: DragEndEvent) => { const { active, over } = e; if (over && active.id !== over.id) { const o = sectionsOrder.indexOf(String(active.id)); const n = sectionsOrder.indexOf(String(over.id)); if (o !== -1 && n !== -1) onSectionsReorder?.(arrayMove(sectionsOrder, o, n)) } }}>
              <SortableContext items={sectionsOrder} strategy={verticalListSortingStrategy}>
                {sectionsOrder.map((sectionId, index) => {
                  const isLast = index === sectionsOrder.length - 1
                  const renderer = sectionRenderers[sectionId]
                  const content = renderer ? renderer() : renderGenericSection(sectionId)
                  if (!content) return null
                  return (
                    <SortableSectionWrapper key={sectionId} id={sectionId} themeColor={themeColor}>
                      <div
                        data-cv-section={sectionId}
                        className={`col-span-2 ${getSectionContainerStyle(template, isLast)}`}
                        style={{ pageBreakInside: 'avoid', marginBottom: (template === 'classic' || template === 'bold') && !isLast ? 16 : undefined }}
                      >
                        <div>{content}</div>
                      </div>
                    </SortableSectionWrapper>
                  )
                })}
              </SortableContext>
            </DndContext>
          </div>
          {renderPhotoInteractive()}
        </div>
      </div>
    </div>
  )
})
