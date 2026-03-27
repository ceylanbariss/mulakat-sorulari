import { Document, Page, View, Text, Link, Font, Image } from '@react-pdf/renderer'
import type { CvData } from '../../types/cv'
import type { CvTemplateId, PhotoShape } from '../../types/cv'

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Roboto-Italic.ttf', fontWeight: 'normal', fontStyle: 'italic' },
  ],
})
Font.registerHyphenationCallback(word => [word])

export interface CvTemplateProps {
  cvData: CvData
  template: CvTemplateId
  accentColor: string
  textAlign: 'left' | 'center' | 'right' | 'justify'
  photoDataUrl: string | null
  photoShape: PhotoShape
}

// ─── Template configuration ──────────────────────────────────────────────────

interface TConfig {
  fontFamily: 'Roboto' | 'Times-Roman' | 'Helvetica'
  headerLayout: 'row' | 'column'
  showPhoto: boolean
  nameAlign: 'left' | 'center'
  nameColor: (accent: string) => string
  nameSize: number
  titleColor: string
  titleAlign: 'left' | 'center'
  sectionLayout: 'normal' | 'sidebar'
  sectionTitleAlign: 'left' | 'center'
  sectionTitleColor: (accent: string) => string
  sectionTitleBorderColor: (accent: string) => string
  sectionTitleBorderWidth: number
  headerBorderWidth: number
  headerBorderColor: (accent: string) => string
  headerPaddingBottom: number
  headerMarginBottom: number
  sectionTitleTracking: number
  sectionTitleSize: number
  padding: number
  contactAlign: 'left' | 'center'
}

const CONFIGS: Record<CvTemplateId, TConfig> = {
  modern: {
    fontFamily: 'Roboto',
    headerLayout: 'row',
    showPhoto: true,
    nameAlign: 'left',
    nameColor: (a) => a,
    nameSize: 22,
    titleColor: '#334155',
    titleAlign: 'left',
    sectionLayout: 'normal',
    sectionTitleAlign: 'left',
    sectionTitleColor: (a) => a,
    sectionTitleBorderColor: (a) => a,
    sectionTitleBorderWidth: 1.5,
    headerBorderWidth: 0,
    headerBorderColor: () => 'transparent',
    headerPaddingBottom: 0,
    headerMarginBottom: 18,
    sectionTitleTracking: 1.2,
    sectionTitleSize: 9.5,
    padding: 44,
    contactAlign: 'left',
  },
  klasik: {
    fontFamily: 'Times-Roman',
    headerLayout: 'column',
    showPhoto: false,
    nameAlign: 'center',
    nameColor: () => '#000000',
    nameSize: 24,
    titleColor: '#475569',
    titleAlign: 'center',
    sectionLayout: 'normal',
    sectionTitleAlign: 'center',
    sectionTitleColor: () => '#333333',
    sectionTitleBorderColor: () => '#cbd5e1',
    sectionTitleBorderWidth: 0.75,
    headerBorderWidth: 0.75,
    headerBorderColor: () => '#cbd5e1',
    headerPaddingBottom: 12,
    headerMarginBottom: 14,
    sectionTitleTracking: 2,
    sectionTitleSize: 9.5,
    padding: 44,
    contactAlign: 'center',
  },
  profesyonel: {
    fontFamily: 'Roboto',
    headerLayout: 'row',
    showPhoto: true,
    nameAlign: 'left',
    nameColor: () => '#1e293b',
    nameSize: 21,
    titleColor: '#475569',
    titleAlign: 'left',
    sectionLayout: 'sidebar',
    sectionTitleAlign: 'left',
    sectionTitleColor: () => '#374151',
    sectionTitleBorderColor: () => '#f1f5f9',
    sectionTitleBorderWidth: 1,
    headerBorderWidth: 2,
    headerBorderColor: () => '#1e293b',
    headerPaddingBottom: 12,
    headerMarginBottom: 16,
    sectionTitleTracking: 1,
    sectionTitleSize: 9,
    padding: 44,
    contactAlign: 'left',
  },
  zarif: {
    fontFamily: 'Roboto',
    headerLayout: 'column',
    showPhoto: false,
    nameAlign: 'center',
    nameColor: () => '#000000',
    nameSize: 23,
    titleColor: '#475569',
    titleAlign: 'center',
    sectionLayout: 'normal',
    sectionTitleAlign: 'center',
    sectionTitleColor: () => '#4b5563',
    sectionTitleBorderColor: () => '#e2e8f0',
    sectionTitleBorderWidth: 0.5,
    headerBorderWidth: 0.75,
    headerBorderColor: () => '#e2e8f0',
    headerPaddingBottom: 16,
    headerMarginBottom: 20,
    sectionTitleTracking: 3,
    sectionTitleSize: 9,
    padding: 48,
    contactAlign: 'center',
  },
  guclu: {
    fontFamily: 'Times-Roman',
    headerLayout: 'column',
    showPhoto: false,
    nameAlign: 'center',
    nameColor: () => '#000000',
    nameSize: 24,
    titleColor: '#475569',
    titleAlign: 'center',
    sectionLayout: 'normal',
    sectionTitleAlign: 'left',
    sectionTitleColor: () => '#1f2937',
    sectionTitleBorderColor: () => '#1f2937',
    sectionTitleBorderWidth: 2,
    headerBorderWidth: 2,
    headerBorderColor: () => '#000000',
    headerPaddingBottom: 12,
    headerMarginBottom: 14,
    sectionTitleTracking: 1,
    sectionTitleSize: 10,
    padding: 44,
    contactAlign: 'center',
  },
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function ExpBlock({ exp, cfg, accent, bodyAlign }: {
  exp: CvData['deneyim'][0]
  cfg: TConfig
  accent: string
  bodyAlign: CvTemplateProps['textAlign']
}) {
  const DARK = '#0f172a'
  const MID = '#334155'
  const MUTED = '#64748b'
  const LIGHT = '#94a3b8'
  return (
    <View style={{ marginBottom: cfg.sectionLayout === 'sidebar' ? 8 : 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: DARK, fontFamily: cfg.fontFamily }}>{exp.sirket}</Text>
          <Text style={{ fontSize: 9.5, color: MUTED, fontStyle: 'italic', fontFamily: cfg.fontFamily }}>{exp.pozisyon}</Text>
        </View>
        <Text style={{ fontSize: 9, color: LIGHT, textAlign: 'right', fontFamily: cfg.fontFamily }}>
          {exp.baslangic} – {exp.halen ? 'Günümüz' : exp.bitis}
        </Text>
      </View>
      {exp.aciklama.filter(Boolean).map((b, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 2.5, paddingLeft: 6 }}>
          <Text style={{ fontSize: 9, color: accent, marginRight: 5, marginTop: 1, fontFamily: cfg.fontFamily }}>▸</Text>
          <Text style={{ fontSize: 9.5, color: MID, flex: 1, lineHeight: 1.45, textAlign: bodyAlign, fontFamily: cfg.fontFamily }}>{b}</Text>
        </View>
      ))}
    </View>
  )
}

function EduBlock({ edu, cfg }: { edu: CvData['egitim'][0]; cfg: TConfig }) {
  const DARK = '#0f172a'
  const MUTED = '#64748b'
  const LIGHT = '#94a3b8'
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: DARK, fontFamily: cfg.fontFamily }}>{edu.okul}</Text>
          <Text style={{ fontSize: 9.5, color: MUTED, fontStyle: 'italic', fontFamily: cfg.fontFamily }}>
            {edu.derece}{edu.alan ? ` — ${edu.alan}` : ''}{edu.gpa ? ` · ${edu.gpa}` : ''}
          </Text>
        </View>
        <Text style={{ fontSize: 9, color: LIGHT, textAlign: 'right', fontFamily: cfg.fontFamily }}>{edu.baslangic} – {edu.bitis}</Text>
      </View>
    </View>
  )
}

// ─── Section wrapper (normal vs sidebar) ────────────────────────────────────

function SectionTitle({ title, cfg, accent }: { title: string; cfg: TConfig; accent: string }) {
  return (
    <Text style={{
      fontSize: cfg.sectionTitleSize,
      fontWeight: 'bold',
      color: cfg.sectionTitleColor(accent),
      fontFamily: cfg.fontFamily,
      textTransform: 'uppercase',
      letterSpacing: cfg.sectionTitleTracking,
      textAlign: cfg.sectionTitleAlign,
      borderBottomWidth: cfg.sectionTitleBorderWidth,
      borderBottomColor: cfg.sectionTitleBorderColor(accent),
      paddingBottom: cfg.sectionLayout === 'sidebar' ? 0 : 3,
      marginBottom: cfg.sectionLayout === 'sidebar' ? 0 : 8,
    }}>
      {title}
    </Text>
  )
}

function Section({ title, cfg, accent, children }: {
  title: string; cfg: TConfig; accent: string; children: React.ReactNode
}) {
  if (cfg.sectionLayout === 'sidebar') {
    return (
      <View style={{
        flexDirection: 'row', gap: 18, marginTop: 12,
        paddingBottom: 10, borderBottomWidth: cfg.sectionTitleBorderWidth,
        borderBottomColor: cfg.sectionTitleBorderColor(accent),
      }}>
        <View style={{ width: 82, flexShrink: 0, paddingTop: 2 }}>
          <SectionTitle title={title} cfg={cfg} accent={accent} />
        </View>
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </View>
    )
  }
  return (
    <View style={{ marginTop: 14 }}>
      <SectionTitle title={title} cfg={cfg} accent={accent} />
      {children}
    </View>
  )
}

// ─── Main template ───────────────────────────────────────────────────────────

export function CvTemplate({ cvData, template, accentColor, textAlign, photoDataUrl, photoShape }: CvTemplateProps) {
  const cfg = CONFIGS[template]
  const { kisiselBilgiler: k, deneyim, egitim, beceriler, diller, sertifikalar } = cvData
  const accent = accentColor
  const MID = '#334155'
  const MUTED = '#64748b'

  const photoRadius = photoShape === 'circle' ? 35 : photoShape === 'rounded' ? 8 : 0

  const contactItems = [
    k.email, k.telefon ? `· ${k.telefon}` : null,
    k.konum ? `· ${k.konum}` : null,
  ].filter(Boolean) as string[]

  return (
    <Document title={k.ad || 'CV'} author={k.ad || 'CV'}>
      <Page size="A4" style={{
        fontFamily: cfg.fontFamily,
        fontSize: 10,
        color: MID,
        backgroundColor: '#ffffff',
        paddingTop: cfg.padding,
        paddingBottom: cfg.padding,
        paddingHorizontal: cfg.padding + 8,
      }}>

        {/* ── HEADER ── */}
        {cfg.headerLayout === 'row' ? (
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
            borderBottomWidth: cfg.headerBorderWidth, borderBottomColor: cfg.headerBorderColor(accent),
            paddingBottom: cfg.headerPaddingBottom, marginBottom: cfg.headerMarginBottom,
          }}>
            <View style={{ flex: 1, paddingRight: photoDataUrl && cfg.showPhoto ? 16 : 0 }}>
              {k.ad ? <Text style={{ fontSize: cfg.nameSize, fontWeight: 'bold', color: cfg.nameColor(accent), textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3, fontFamily: cfg.fontFamily }}>{k.ad}</Text> : null}
              {k.unvan ? <Text style={{ fontSize: 11.5, color: cfg.titleColor, fontWeight: 'bold', marginBottom: 6, fontFamily: cfg.fontFamily }}>{k.unvan}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {contactItems.map((item, i) => (
                  <Text key={i} style={{ fontSize: 9, color: MUTED, fontFamily: cfg.fontFamily }}>{item}</Text>
                ))}
                {k.linkedin ? <Link src={k.linkedin} style={{ fontSize: 9, color: accent, fontFamily: cfg.fontFamily }}>· LinkedIn</Link> : null}
                {k.github ? <Link src={k.github} style={{ fontSize: 9, color: accent, fontFamily: cfg.fontFamily }}>· GitHub</Link> : null}
                {k.website ? <Link src={k.website} style={{ fontSize: 9, color: accent, fontFamily: cfg.fontFamily }}>· Website</Link> : null}
              </View>
            </View>
            {photoDataUrl && cfg.showPhoto ? (
              <Image
                src={photoDataUrl}
                style={{ width: 70, height: 70, borderRadius: photoRadius, objectFit: 'cover', flexShrink: 0 }}
              />
            ) : null}
          </View>
        ) : (
          // column layout (Klasik, Zarif, Güçlü)
          <View style={{
            alignItems: 'center',
            borderBottomWidth: cfg.headerBorderWidth, borderBottomColor: cfg.headerBorderColor(accent),
            paddingBottom: cfg.headerPaddingBottom, marginBottom: cfg.headerMarginBottom,
          }}>
            {photoDataUrl && cfg.showPhoto ? (
              <Image src={photoDataUrl} style={{ width: 70, height: 70, borderRadius: photoRadius, objectFit: 'cover', marginBottom: 8 }} />
            ) : null}
            {k.ad ? <Text style={{ fontSize: cfg.nameSize, fontWeight: 'bold', color: cfg.nameColor(accent), textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', fontFamily: cfg.fontFamily, marginBottom: 3 }}>{k.ad}</Text> : null}
            {k.unvan ? <Text style={{ fontSize: 11.5, color: cfg.titleColor, textAlign: 'center', marginBottom: 6, fontFamily: cfg.fontFamily }}>{k.unvan}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
              {contactItems.map((item, i) => (
                <Text key={i} style={{ fontSize: 9.5, color: MUTED, fontFamily: cfg.fontFamily }}>{item}</Text>
              ))}
              {k.linkedin ? <Link src={k.linkedin} style={{ fontSize: 9.5, color: accent, fontFamily: cfg.fontFamily }}>· LinkedIn</Link> : null}
              {k.github ? <Link src={k.github} style={{ fontSize: 9.5, color: accent, fontFamily: cfg.fontFamily }}>· GitHub</Link> : null}
            </View>
          </View>
        )}

        {/* ── ÖZET ── */}
        {k.ozet ? (
          <Section title="Profil" cfg={cfg} accent={accent}>
            <Text style={{ fontSize: 9.5, color: MID, lineHeight: 1.55, textAlign: textAlign, fontFamily: cfg.fontFamily }}>{k.ozet}</Text>
          </Section>
        ) : null}

        {/* ── DENEYİM ── */}
        {deneyim.length > 0 && (
          <Section title="Deneyim" cfg={cfg} accent={accent}>
            {deneyim.map(exp => <ExpBlock key={exp.id} exp={exp} cfg={cfg} accent={accent} bodyAlign={textAlign} />)}
          </Section>
        )}

        {/* ── EĞİTİM ── */}
        {egitim.length > 0 && (
          <Section title="Eğitim" cfg={cfg} accent={accent}>
            {egitim.map(edu => <EduBlock key={edu.id} edu={edu} cfg={cfg} />)}
          </Section>
        )}

        {/* ── BECERİLER ── */}
        {(beceriler.teknik.length > 0 || beceriler.diger.length > 0) && (
          <Section title="Beceriler" cfg={cfg} accent={accent}>
            {beceriler.teknik.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: MUTED, marginBottom: 5, fontFamily: cfg.fontFamily }}>Teknik</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                  {beceriler.teknik.map((skill, i) => (
                    <Text key={i} style={{ backgroundColor: '#f1f5f9', borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2.5, fontSize: 8.5, color: MID, fontFamily: cfg.fontFamily }}>{skill}</Text>
                  ))}
                </View>
              </View>
            )}
            {beceriler.diger.length > 0 && (
              <View>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: MUTED, marginBottom: 5, fontFamily: cfg.fontFamily }}>Diğer</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                  {beceriler.diger.map((skill, i) => (
                    <Text key={i} style={{ backgroundColor: '#f1f5f9', borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2.5, fontSize: 8.5, color: MID, fontFamily: cfg.fontFamily }}>{skill}</Text>
                  ))}
                </View>
              </View>
            )}
          </Section>
        )}

        {/* ── DİLLER ── */}
        {diller && diller.length > 0 && (
          <Section title="Diller" cfg={cfg} accent={accent}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
              {diller.map(l => (
                <Text key={l.id} style={{ fontSize: 9.5, color: MID, fontFamily: cfg.fontFamily }}>
                  <Text style={{ fontWeight: 'bold', fontFamily: cfg.fontFamily }}>{l.dil}</Text>{' — '}{l.seviye}
                </Text>
              ))}
            </View>
          </Section>
        )}

        {/* ── SERTİFİKALAR ── */}
        {sertifikalar && sertifikalar.length > 0 && (
          <Section title="Sertifikalar" cfg={cfg} accent={accent}>
            {sertifikalar.map(cert => (
              <View key={cert.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: '#0f172a', fontFamily: cfg.fontFamily }}>{cert.ad}</Text>
                <Text style={{ fontSize: 9, color: '#94a3b8', fontFamily: cfg.fontFamily }}>{cert.kurum}{cert.tarih ? ` · ${cert.tarih}` : ''}</Text>
              </View>
            ))}
          </Section>
        )}

      </Page>
    </Document>
  )
}
