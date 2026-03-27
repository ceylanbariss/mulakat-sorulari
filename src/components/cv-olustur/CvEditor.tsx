import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useCvStore } from '../../store/useCvStore'
import type { Deneyim, Egitim, Dil, Sertifika } from '../../types/cv'

interface Props { d: boolean }

// Ortak stiller
function useStyles(d: boolean) {
  return {
    borderColor: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    borderFocus: 'rgba(99,102,241,0.45)',
    textColor: d ? '#f1f5f9' : '#0f172a',
    mutedColor: d ? '#64748b' : '#94a3b8',
    labelColor: d ? '#94a3b8' : '#475569',
    cardBg: d ? 'rgba(17,24,39,0.6)' : '#f8fafc',
    inputBg: d ? 'rgba(255,255,255,0.04)' : '#fff',
  }
}

function SectionCard({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)', overflow: 'hidden', marginBottom: 12 }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(99,102,241,0.07)', border: 'none', cursor: 'pointer' }}>
        <span style={{ color: '#818cf8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
        {open ? <ChevronUp size={15} style={{ color: '#818cf8' }} /> : <ChevronDown size={15} style={{ color: '#818cf8' }} />}
      </button>
      {open && <div style={{ padding: '16px' }}>{children}</div>}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, multiline, rows, d }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; rows?: number; d: boolean
}) {
  const st = useStyles(d)
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', color: st.labelColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</label>
      {multiline ? (
        <textarea
          value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows ?? 3}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 7, boxSizing: 'border-box', background: st.inputBg, border: `1px solid ${focused ? st.borderFocus : st.borderColor}`, color: st.textColor, fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, transition: 'border-color 0.15s' }}
        />
      ) : (
        <input
          type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 7, boxSizing: 'border-box', background: st.inputBg, border: `1px solid ${focused ? st.borderFocus : st.borderColor}`, color: st.textColor, fontSize: 12, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
        />
      )}
    </div>
  )
}

function TagInput({ label, value, onChange, placeholder, d }: {
  label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; d: boolean
}) {
  const st = useStyles(d)
  const [input, setInput] = useState('')
  function add() {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) { onChange([...value, trimmed]); setInput('') }
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', color: st.labelColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {value.map((tag, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', fontSize: 12, color: '#818cf8' }}>
            {tag}
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', padding: 0, display: 'flex' }}><Trash2 size={10} /></button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          style={{ flex: 1, padding: '7px 10px', borderRadius: 7, background: st.inputBg, border: `1px solid ${st.borderColor}`, color: st.textColor, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={add} style={{ padding: '7px 12px', borderRadius: 7, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Ekle</button>
      </div>
    </div>
  )
}

export function CvEditor({ d }: Props) {
  const { cvData, updateCvData } = useCvStore()
  const st = useStyles(d)

  const [openSections, setOpenSections] = useState({
    kisisel: true, deneyim: true, egitim: true, beceriler: true, diller: false, sertifikalar: false,
  })

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!cvData) return null

  function updateK(field: string, val: string) {
    updateCvData(cv => ({ ...cv, kisiselBilgiler: { ...cv.kisiselBilgiler, [field]: val } }))
  }

  function updateDeneyim(id: string, field: keyof Deneyim, val: unknown) {
    updateCvData(cv => ({ ...cv, deneyim: cv.deneyim.map(e => e.id === id ? { ...e, [field]: val } : e) }))
  }

  function addDeneyim() {
    const newItem: Deneyim = { id: `exp-${Date.now()}`, sirket: '', pozisyon: '', baslangic: '', bitis: '', halen: false, aciklama: [''] }
    updateCvData(cv => ({ ...cv, deneyim: [...cv.deneyim, newItem] }))
  }

  function removeDeneyim(id: string) {
    updateCvData(cv => ({ ...cv, deneyim: cv.deneyim.filter(e => e.id !== id) }))
  }

  function updateEgitim(id: string, field: keyof Egitim, val: string) {
    updateCvData(cv => ({ ...cv, egitim: cv.egitim.map(e => e.id === id ? { ...e, [field]: val } : e) }))
  }

  function addEgitim() {
    const newItem: Egitim = { id: `edu-${Date.now()}`, okul: '', derece: '', alan: '', baslangic: '', bitis: '', gpa: '' }
    updateCvData(cv => ({ ...cv, egitim: [...cv.egitim, newItem] }))
  }

  function removeEgitim(id: string) {
    updateCvData(cv => ({ ...cv, egitim: cv.egitim.filter(e => e.id !== id) }))
  }

  function addDil() {
    const newItem: Dil = { id: `lang-${Date.now()}`, dil: '', seviye: 'Orta' }
    updateCvData(cv => ({ ...cv, diller: [...(cv.diller ?? []), newItem] }))
  }

  function removeDil(id: string) {
    updateCvData(cv => ({ ...cv, diller: (cv.diller ?? []).filter(l => l.id !== id) }))
  }

  function addSertifika() {
    const newItem: Sertifika = { id: `cert-${Date.now()}`, ad: '', kurum: '', tarih: '', url: '' }
    updateCvData(cv => ({ ...cv, sertifikalar: [...(cv.sertifikalar ?? []), newItem] }))
  }

  function removeSertifika(id: string) {
    updateCvData(cv => ({ ...cv, sertifikalar: (cv.sertifikalar ?? []).filter(c => c.id !== id) }))
  }

  const k = cvData.kisiselBilgiler

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Kişisel Bilgiler */}
      <SectionCard title="Kişisel Bilgiler" open={openSections.kisisel} onToggle={() => toggleSection('kisisel')}>
        <Field label="Ad Soyad" value={k.ad} onChange={v => updateK('ad', v)} d={d} />
        <Field label="Unvan / Pozisyon" value={k.unvan} onChange={v => updateK('unvan', v)} placeholder="ör: Senior Frontend Developer" d={d} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="E-posta" value={k.email} onChange={v => updateK('email', v)} d={d} />
          <Field label="Telefon" value={k.telefon} onChange={v => updateK('telefon', v)} d={d} />
        </div>
        <Field label="Konum" value={k.konum} onChange={v => updateK('konum', v)} placeholder="İstanbul, Türkiye" d={d} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="LinkedIn URL" value={k.linkedin ?? ''} onChange={v => updateK('linkedin', v)} d={d} />
          <Field label="GitHub URL" value={k.github ?? ''} onChange={v => updateK('github', v)} d={d} />
        </div>
        <Field label="Özet / Profil" value={k.ozet} onChange={v => updateK('ozet', v)} multiline rows={4} placeholder="Profesyonel özet..." d={d} />
      </SectionCard>

      {/* Deneyim */}
      <SectionCard title={`Deneyim (${cvData.deneyim.length})`} open={openSections.deneyim} onToggle={() => toggleSection('deneyim')}>
        {cvData.deneyim.map((exp, idx) => (
          <div key={exp.id} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${st.borderColor}`, marginBottom: 12, background: st.cardBg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: '#818cf8', fontSize: 11, fontWeight: 700 }}>#{idx + 1} Deneyim</span>
              <button onClick={() => removeDeneyim(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: st.mutedColor, display: 'flex', padding: 4 }}>
                <Trash2 size={13} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Şirket" value={exp.sirket} onChange={v => updateDeneyim(exp.id, 'sirket', v)} d={d} />
              <Field label="Pozisyon" value={exp.pozisyon} onChange={v => updateDeneyim(exp.id, 'pozisyon', v)} d={d} />
              <Field label="Başlangıç" value={exp.baslangic} onChange={v => updateDeneyim(exp.id, 'baslangic', v)} placeholder="Ocak 2022" d={d} />
              <Field label="Bitiş" value={exp.halen ? 'Günümüz' : exp.bitis} onChange={v => updateDeneyim(exp.id, 'bitis', v)} placeholder="Aralık 2023" d={d} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
              <input type="checkbox" checked={exp.halen} onChange={e => updateDeneyim(exp.id, 'halen', e.target.checked)} style={{ accentColor: '#6366f1' }} />
              <span style={{ color: st.labelColor, fontSize: 12 }}>Hâlâ burada çalışıyorum</span>
            </label>
            <label style={{ display: 'block', color: st.labelColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Açıklamalar (her satır bir madde)
            </label>
            {exp.aciklama.map((bullet, bi) => (
              <div key={bi} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input
                  value={bullet} onChange={e => { const arr = [...exp.aciklama]; arr[bi] = e.target.value; updateDeneyim(exp.id, 'aciklama', arr) }}
                  placeholder={`Madde ${bi + 1}...`}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 7, background: st.inputBg, border: `1px solid ${st.borderColor}`, color: st.textColor, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={() => updateDeneyim(exp.id, 'aciklama', exp.aciklama.filter((_, j) => j !== bi))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: st.mutedColor, display: 'flex', padding: 6 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button onClick={() => updateDeneyim(exp.id, 'aciklama', [...exp.aciklama, ''])} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
              <Plus size={12} /> Madde Ekle
            </button>
          </div>
        ))}
        <button onClick={addDeneyim} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Deneyim Ekle
        </button>
      </SectionCard>

      {/* Eğitim */}
      <SectionCard title={`Eğitim (${cvData.egitim.length})`} open={openSections.egitim} onToggle={() => toggleSection('egitim')}>
        {cvData.egitim.map((edu, idx) => (
          <div key={edu.id} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${st.borderColor}`, marginBottom: 12, background: st.cardBg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#818cf8', fontSize: 11, fontWeight: 700 }}>#{idx + 1} Eğitim</span>
              <button onClick={() => removeEgitim(edu.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: st.mutedColor, display: 'flex', padding: 4 }}><Trash2 size={13} /></button>
            </div>
            <Field label="Okul / Üniversite" value={edu.okul} onChange={v => updateEgitim(edu.id, 'okul', v)} d={d} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Derece" value={edu.derece} onChange={v => updateEgitim(edu.id, 'derece', v)} placeholder="Lisans" d={d} />
              <Field label="Bölüm" value={edu.alan} onChange={v => updateEgitim(edu.id, 'alan', v)} placeholder="Bilgisayar Mühendisliği" d={d} />
              <Field label="Başlangıç" value={edu.baslangic} onChange={v => updateEgitim(edu.id, 'baslangic', v)} placeholder="2018" d={d} />
              <Field label="Bitiş" value={edu.bitis} onChange={v => updateEgitim(edu.id, 'bitis', v)} placeholder="2022" d={d} />
            </div>
          </div>
        ))}
        <button onClick={addEgitim} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Eğitim Ekle
        </button>
      </SectionCard>

      {/* Beceriler */}
      <SectionCard title="Beceriler" open={openSections.beceriler} onToggle={() => toggleSection('beceriler')}>
        <TagInput label="Teknik Beceriler" value={cvData.beceriler.teknik} onChange={v => updateCvData(cv => ({ ...cv, beceriler: { ...cv.beceriler, teknik: v } }))} placeholder="React, TypeScript..." d={d} />
        <TagInput label="Diğer Beceriler" value={cvData.beceriler.diger} onChange={v => updateCvData(cv => ({ ...cv, beceriler: { ...cv.beceriler, diger: v } }))} placeholder="Takım çalışması..." d={d} />
      </SectionCard>

      {/* Diller */}
      <SectionCard title={`Diller (${(cvData.diller ?? []).length})`} open={openSections.diller} onToggle={() => toggleSection('diller')}>
        {(cvData.diller ?? []).map((dil, idx) => (
          <div key={dil.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}><Field label={`Dil ${idx + 1}`} value={dil.dil} onChange={v => updateCvData(cv => ({ ...cv, diller: (cv.diller ?? []).map(l => l.id === dil.id ? { ...l, dil: v } : l) }))} placeholder="Türkçe" d={d} /></div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Seviye</label>
              <select value={dil.seviye} onChange={e => updateCvData(cv => ({ ...cv, diller: (cv.diller ?? []).map(l => l.id === dil.id ? { ...l, seviye: e.target.value } : l) }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, background: d ? 'rgba(255,255,255,0.04)' : '#fff', border: `1px solid ${st.borderColor}`, color: d ? '#f1f5f9' : '#0f172a', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                {['Anadil', 'İleri (C1-C2)', 'Orta (B1-B2)', 'Başlangıç (A1-A2)'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={() => removeDil(dil.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: st.mutedColor, padding: '0 4px 13px' }}><Trash2 size={13} /></button>
          </div>
        ))}
        <button onClick={addDil} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Dil Ekle
        </button>
      </SectionCard>

      {/* Sertifikalar */}
      <SectionCard title={`Sertifikalar (${(cvData.sertifikalar ?? []).length})`} open={openSections.sertifikalar} onToggle={() => toggleSection('sertifikalar')}>
        {(cvData.sertifikalar ?? []).map((cert, idx) => (
          <div key={cert.id} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${st.borderColor}`, marginBottom: 10, background: st.cardBg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#818cf8', fontSize: 11, fontWeight: 700 }}>#{idx + 1}</span>
              <button onClick={() => removeSertifika(cert.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: st.mutedColor, display: 'flex', padding: 4 }}><Trash2 size={13} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Sertifika Adı" value={cert.ad} onChange={v => updateCvData(cv => ({ ...cv, sertifikalar: (cv.sertifikalar ?? []).map(c => c.id === cert.id ? { ...c, ad: v } : c) }))} d={d} />
              <Field label="Kurum" value={cert.kurum} onChange={v => updateCvData(cv => ({ ...cv, sertifikalar: (cv.sertifikalar ?? []).map(c => c.id === cert.id ? { ...c, kurum: v } : c) }))} d={d} />
              <Field label="Tarih" value={cert.tarih} onChange={v => updateCvData(cv => ({ ...cv, sertifikalar: (cv.sertifikalar ?? []).map(c => c.id === cert.id ? { ...c, tarih: v } : c) }))} placeholder="2023" d={d} />
            </div>
          </div>
        ))}
        <button onClick={addSertifika} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Sertifika Ekle
        </button>
      </SectionCard>
    </div>
  )
}
