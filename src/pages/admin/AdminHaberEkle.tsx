import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Newspaper, FileText, AlignLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/useAuthStore'
import { saveHaber, getById, haberlerCol } from '../../lib/firestore'
import { HaberEditor } from '../../components/haberler/HaberEditor'
import { MedyaYukleyici } from '../../components/haberler/MedyaYukleyici'
import type { HaberData, HaberMedya } from '../../lib/firestore'
import { serverTimestamp, Timestamp } from 'firebase/firestore'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0f1e', card: '#111827',
  border: 'rgba(255,255,255,0.06)', borderFocus: 'rgba(99,102,241,0.4)',
  cyan: '#6366f1', t1: '#ffffff', t2: '#94a3b8', t3: '#64748b',
  gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
  color: C.t1, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s', fontFamily: 'inherit',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', color: C.t3, fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
}

const KATEGORI_OPTIONS = [
  { value: 'mulakat-ipucu', label: 'Mülakat İpucu' },
  { value: 'sektor-haberi', label: 'Sektör Haberi' },
  { value: 'platform-guncelleme', label: 'Platform Güncellemesi' },
  { value: 'basari-hikayesi', label: 'Başarı Hikayesi' },
]

function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function calcOkumaSuresi(icerik: string): number {
  const plain = icerik.replace(/<[^>]+>/g, ' ')
  const wordCount = plain.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

type DurumType = 'taslak' | 'yayinda' | 'zamanlanmis'

interface FormData {
  tip: 'makale' | 'post'
  baslik: string
  slug: string
  ozet: string
  icerik: string
  kategori: string
  durum: DurumType
  yayinTarihi: string // datetime-local input value
  oneCikar: boolean
  medya: HaberMedya[]
}

function emptyForm(): FormData {
  return {
    tip: 'makale', baslik: '', slug: '', ozet: '', icerik: '',
    kategori: 'mulakat-ipucu', durum: 'taslak', yayinTarihi: '',
    oneCikar: false, medya: [],
  }
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', transition: 'background 0.2s', background: value ? C.cyan : 'rgba(255,255,255,0.1)' }}
      >
        <div style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </div>
      <span style={{ color: value ? C.cyan : C.t2, fontSize: 13, fontWeight: 600 }}>{label}</span>
    </label>
  )
}

export function AdminHaberEkle() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const { user } = useAuthStore()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [slugManual, setSlugManual] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(isEdit)

  // Edit modunda mevcut haberi yükle
  useEffect(() => {
    if (!id) return
    getById<HaberData>(haberlerCol(), id).then(haber => {
      if (!haber) { toast.error('Haber bulunamadı.'); navigate('/admin/haberler'); return }
      const ts = haber.yayinTarihi as { toDate?: () => Date } | null
      const dtVal = ts?.toDate ? ts.toDate().toISOString().slice(0, 16) : ''
      setForm({
        tip: haber.tip ?? 'makale',
        baslik: haber.baslik ?? '',
        slug: haber.slug ?? '',
        ozet: haber.ozet ?? '',
        icerik: haber.icerik ?? '',
        kategori: haber.kategori ?? 'mulakat-ipucu',
        durum: haber.durum ?? 'taslak',
        yayinTarihi: dtVal,
        oneCikar: haber.oneCikar ?? false,
        medya: haber.medya ?? [],
      })
      setSlugManual(true)
    }).finally(() => setLoadingEdit(false))
  }, [id])

  // Başlıktan otomatik slug türet
  useEffect(() => {
    if (!slugManual && form.baslik) {
      setForm(f => ({ ...f, slug: normalizeSlug(f.baslik) }))
    }
  }, [form.baslik, slugManual])

  const okumaSuresi = calcOkumaSuresi(form.icerik)

  async function handleSave() {
    if (!form.baslik.trim()) { toast.error('Başlık zorunludur.'); return }
    if (!form.slug.trim()) { toast.error('Slug zorunludur.'); return }
    if (!user) { toast.error('Giriş yapman gerekiyor.'); return }

    setSaving(true)
    try {
      let yayinTarihi: unknown = serverTimestamp()
      if (form.durum === 'zamanlanmis' && form.yayinTarihi) {
        yayinTarihi = Timestamp.fromDate(new Date(form.yayinTarihi))
      } else if (form.durum === 'yayinda') {
        yayinTarihi = serverTimestamp()
      } else {
        yayinTarihi = null
      }

      const data: Partial<HaberData> = {
        tip: form.tip,
        baslik: form.baslik.trim(),
        slug: form.slug.trim(),
        ozet: form.ozet.trim().slice(0, 200),
        icerik: form.icerik,
        kategori: form.kategori as HaberData['kategori'],
        durum: form.durum,
        yayinTarihi,
        oneCikar: form.oneCikar,
        okumaSuresi,
        medya: form.medya,
        yazar: user.displayName ?? user.email ?? 'Admin',
        yazarId: user.uid,
        goruntulenme: 0,
      }

      if (!isEdit) {
        data.olusturmaTarihi = serverTimestamp()
        data.guncellenmeTarihi = serverTimestamp()
      } else {
        data.guncellenmeTarihi = serverTimestamp()
      }

      await saveHaber(data, id)
      toast.success(isEdit ? 'Haber güncellendi.' : 'Haber kaydedildi.')
      navigate('/admin/haberler')
    } catch (err) {
      console.error(err)
      toast.error('Kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingEdit) {
    return (
      <div style={{ padding: 32, background: C.bg, minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3 }}>
        Yükleniyor...
      </div>
    )
  }

  const fi = (focused: boolean): React.CSSProperties => ({ ...INPUT_STYLE, borderColor: focused ? C.borderFocus : C.border })

  return (
    <div style={{ padding: 32, background: C.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button
          onClick={() => navigate('/admin/haberler')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, cursor: 'pointer', background: 'transparent', color: C.t2, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft size={14} /> Geri
        </button>
        <div>
          <h1 style={{ color: C.t1, fontWeight: 700, fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Newspaper size={20} style={{ color: C.cyan }} />
            {isEdit ? 'Haberi Düzenle' : 'Yeni Haber'}
          </h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Sol: İçerik */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tip toggle */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <label style={LABEL_STYLE}>İçerik Tipi</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ key: 'makale', label: 'Makale', icon: FileText }, { key: 'post', label: 'Kısa Post', icon: AlignLeft }].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tip: key as 'makale' | 'post' }))}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 8, border: `1px solid ${form.tip === key ? C.borderFocus : C.border}`,
                    cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                    background: form.tip === key ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: form.tip === key ? '#818cf8' : C.t2,
                  }}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Başlık + Slug + Özet */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FieldWithFocus label="Başlık *">
              {(focused, bind) => (
                <input
                  value={form.baslik}
                  onChange={e => setForm(f => ({ ...f, baslik: e.target.value }))}
                  placeholder="Haberin başlığını yaz..."
                  style={fi(focused)}
                  {...bind}
                />
              )}
            </FieldWithFocus>

            <FieldWithFocus label="Slug (SEO URL)">
              {(focused, bind) => (
                <input
                  value={form.slug}
                  onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: normalizeSlug(e.target.value) })) }}
                  placeholder="haber-url-slugi"
                  style={fi(focused)}
                  {...bind}
                />
              )}
            </FieldWithFocus>

            <div>
              <div style={{ ...LABEL_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Özet</span>
                <span style={{ color: form.ozet.length > 180 ? '#f59e0b' : C.t3, fontSize: 11, fontWeight: 600 }}>
                  {form.ozet.length}/200
                </span>
              </div>
              <textarea
                value={form.ozet}
                onChange={e => setForm(f => ({ ...f, ozet: e.target.value.slice(0, 200) }))}
                placeholder="Haberin kısa özeti..."
                rows={3}
                style={{ ...INPUT_STYLE, resize: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.borderFocus)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>
          </div>

          {/* İçerik editörü */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <label style={LABEL_STYLE}>{form.tip === 'makale' ? 'İçerik (Zengin Metin)' : 'Gönderi İçeriği'}</label>
            <HaberEditor
              value={form.icerik}
              onChange={icerik => setForm(f => ({ ...f, icerik }))}
              mode={form.tip}
            />
          </div>

          {/* Medya */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <label style={LABEL_STYLE}>Medya</label>
            <MedyaYukleyici
              medya={form.medya}
              onChange={medya => setForm(f => ({ ...f, medya }))}
              haberId={id ?? 'yeni'}
            />
          </div>
        </div>

        {/* Sağ: Ayarlar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>
          {/* Kategori */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <label style={LABEL_STYLE}>Kategori</label>
            <select
              value={form.kategori}
              onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}
              style={{ ...INPUT_STYLE, cursor: 'pointer' }}
            >
              {KATEGORI_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: '#111827' }}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Durum */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
            <label style={LABEL_STYLE}>Durum</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { key: 'taslak', label: 'Taslak', desc: 'Sadece admin görebilir' },
                { key: 'yayinda', label: 'Hemen Yayınla', desc: 'Şu an canlıya alınır' },
                { key: 'zamanlanmis', label: 'Zamanla', desc: 'İleri tarihe yayınla' },
              ].map(({ key, label, desc }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, background: form.durum === key ? 'rgba(99,102,241,0.1)' : 'transparent', border: `1px solid ${form.durum === key ? C.borderFocus : C.border}`, transition: 'all 0.15s' }}>
                  <input type="radio" value={key} checked={form.durum === key} onChange={() => setForm(f => ({ ...f, durum: key as DurumType }))} style={{ marginTop: 2, accentColor: C.cyan }} />
                  <div>
                    <span style={{ color: C.t1, fontSize: 13, fontWeight: 600, display: 'block' }}>{label}</span>
                    <span style={{ color: C.t3, fontSize: 11 }}>{desc}</span>
                  </div>
                </label>
              ))}
            </div>

            {form.durum === 'zamanlanmis' && (
              <div style={{ marginTop: 12 }}>
                <label style={LABEL_STYLE}>Yayın Tarihi & Saati</label>
                <input
                  type="datetime-local"
                  value={form.yayinTarihi}
                  onChange={e => setForm(f => ({ ...f, yayinTarihi: e.target.value }))}
                  style={{ ...INPUT_STYLE, colorScheme: 'dark' }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.borderFocus)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>
            )}
          </div>

          {/* Öne çıkar + meta */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              value={form.oneCikar}
              onChange={oneCikar => setForm(f => ({ ...f, oneCikar }))}
              label="Ana sayfada öne çıkar"
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: C.t3, fontSize: 12, fontWeight: 600 }}>Yazar</span>
              <span style={{ color: C.t2, fontSize: 12 }}>{user?.displayName ?? user?.email ?? '-'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: C.t3, fontSize: 12, fontWeight: 600 }}>Okuma süresi</span>
              <span style={{ color: C.t2, fontSize: 12 }}>{okumaSuresi} dk</span>
            </div>
          </div>

          {/* Kaydet */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 20px', borderRadius: 10, border: 'none',
              cursor: saving ? 'wait' : 'pointer',
              background: C.gradient, color: '#fff', fontSize: 14, fontWeight: 700,
              opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            <Save size={16} /> {saving ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Utility: field with focus state ─────────────────────────────────────────

function FieldWithFocus({ label, children }: {
  label: string
  children: (focused: boolean, bind: { onFocus: () => void; onBlur: () => void }) => React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      {children(focused, { onFocus: () => setFocused(true), onBlur: () => setFocused(false) })}
    </div>
  )
}
