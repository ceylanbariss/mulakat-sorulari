import { Document, Page, View, Text, Link, StyleSheet, Font } from '@react-pdf/renderer'
import type { CvData } from '../../types/cv'
import { CV_ACCENT_COLOR, CV_FONT_FAMILY } from '../../config/cvConfig'

// Font kayıt — modül yüklendiğinde bir kez çalışır
Font.register({
  family: CV_FONT_FAMILY,
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Roboto-Italic.ttf', fontWeight: 'normal', fontStyle: 'italic' },
  ],
})

// Türkçe kelime bölünmesini önle
Font.registerHyphenationCallback(word => [word])

const ACCENT = CV_ACCENT_COLOR
const DARK = '#0f172a'
const MID = '#334155'
const MUTED = '#64748b'
const LIGHT = '#94a3b8'
const PILL_BG = '#f1f5f9'

const s = StyleSheet.create({
  page: {
    fontFamily: CV_FONT_FAMILY,
    fontSize: 10,
    color: MID,
    backgroundColor: '#ffffff',
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: 52,
  },
  // Header
  header: { marginBottom: 18 },
  name: { fontSize: 22, fontWeight: 'bold', color: DARK, marginBottom: 3 },
  title: { fontSize: 11.5, color: ACCENT, fontWeight: 'bold', marginBottom: 7 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  contactItem: { fontSize: 9, color: MUTED },
  // Section
  sectionHeader: {
    fontSize: 9.5, fontWeight: 'bold', color: ACCENT,
    borderBottomWidth: 1.5, borderBottomColor: ACCENT,
    paddingBottom: 3, marginBottom: 9, marginTop: 16,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  // Summary
  summary: { fontSize: 9.5, color: MID, lineHeight: 1.55 },
  // Experience
  expBlock: { marginBottom: 10 },
  expRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  expLeft: { flex: 1 },
  expCompany: { fontSize: 10, fontWeight: 'bold', color: DARK },
  expRole: { fontSize: 9.5, color: MUTED, fontStyle: 'italic' },
  expDate: { fontSize: 9, color: LIGHT, textAlign: 'right' },
  bullet: { flexDirection: 'row', marginBottom: 2.5, paddingLeft: 6 },
  bulletDot: { fontSize: 9, color: ACCENT, marginRight: 5, marginTop: 1 },
  bulletText: { fontSize: 9.5, color: MID, flex: 1, lineHeight: 1.45 },
  // Education
  eduBlock: { marginBottom: 8 },
  // Skills
  skillSection: { marginBottom: 6 },
  skillLabel: { fontSize: 9, fontWeight: 'bold', color: MUTED, marginBottom: 5 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  pill: {
    backgroundColor: PILL_BG, borderRadius: 3,
    paddingHorizontal: 7, paddingVertical: 2.5,
    fontSize: 8.5, color: MID,
  },
  // Languages / Certs
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 2 },
  langItem: { fontSize: 9.5, color: MID },
  langBold: { fontWeight: 'bold' },
  certRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  certName: { fontSize: 9.5, fontWeight: 'bold', color: DARK },
  certMeta: { fontSize: 9, color: LIGHT },
})

interface Props { cvData: CvData }

export function CvTemplate({ cvData }: Props) {
  const { kisiselBilgiler: k, deneyim, egitim, beceriler, diller, sertifikalar } = cvData

  return (
    <Document title={k.ad || 'CV'} author={k.ad || 'CV'}>
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          {k.ad ? <Text style={s.name}>{k.ad}</Text> : null}
          {k.unvan ? <Text style={s.title}>{k.unvan}</Text> : null}
          <View style={s.contactRow}>
            {k.email ? <Text style={s.contactItem}>{k.email}</Text> : null}
            {k.telefon ? <Text style={s.contactItem}>· {k.telefon}</Text> : null}
            {k.konum ? <Text style={s.contactItem}>· {k.konum}</Text> : null}
            {k.linkedin ? <Link src={k.linkedin} style={[s.contactItem, { color: ACCENT }]}>· LinkedIn</Link> : null}
            {k.github ? <Link src={k.github} style={[s.contactItem, { color: ACCENT }]}>· GitHub</Link> : null}
            {k.website ? <Link src={k.website} style={[s.contactItem, { color: ACCENT }]}>· Website</Link> : null}
          </View>
        </View>

        {/* ÖZET */}
        {k.ozet ? (
          <View>
            <Text style={s.sectionHeader}>Profil</Text>
            <Text style={s.summary}>{k.ozet}</Text>
          </View>
        ) : null}

        {/* DENEYİM */}
        {deneyim.length > 0 && (
          <View>
            <Text style={s.sectionHeader}>Deneyim</Text>
            {deneyim.map(exp => (
              <View key={exp.id} style={s.expBlock}>
                <View style={s.expRow}>
                  <View style={s.expLeft}>
                    <Text style={s.expCompany}>{exp.sirket}</Text>
                    <Text style={s.expRole}>{exp.pozisyon}</Text>
                  </View>
                  <Text style={s.expDate}>
                    {exp.baslangic} – {exp.halen ? 'Günümüz' : exp.bitis}
                  </Text>
                </View>
                {exp.aciklama.filter(Boolean).map((b, i) => (
                  <View key={i} style={s.bullet}>
                    <Text style={s.bulletDot}>▸</Text>
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* EĞİTİM */}
        {egitim.length > 0 && (
          <View>
            <Text style={s.sectionHeader}>Eğitim</Text>
            {egitim.map(edu => (
              <View key={edu.id} style={s.eduBlock}>
                <View style={s.expRow}>
                  <View style={s.expLeft}>
                    <Text style={s.expCompany}>{edu.okul}</Text>
                    <Text style={s.expRole}>
                      {edu.derece}{edu.alan ? ` — ${edu.alan}` : ''}{edu.gpa ? ` · ${edu.gpa}` : ''}
                    </Text>
                  </View>
                  <Text style={s.expDate}>{edu.baslangic} – {edu.bitis}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* BECERİLER */}
        {(beceriler.teknik.length > 0 || beceriler.diger.length > 0) && (
          <View>
            <Text style={s.sectionHeader}>Beceriler</Text>
            {beceriler.teknik.length > 0 && (
              <View style={s.skillSection}>
                <Text style={s.skillLabel}>Teknik</Text>
                <View style={s.pillRow}>
                  {beceriler.teknik.map((skill, i) => (
                    <Text key={i} style={s.pill}>{skill}</Text>
                  ))}
                </View>
              </View>
            )}
            {beceriler.diger.length > 0 && (
              <View style={s.skillSection}>
                <Text style={s.skillLabel}>Diğer</Text>
                <View style={s.pillRow}>
                  {beceriler.diger.map((skill, i) => (
                    <Text key={i} style={s.pill}>{skill}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* DİLLER */}
        {diller && diller.length > 0 && (
          <View>
            <Text style={s.sectionHeader}>Diller</Text>
            <View style={s.langRow}>
              {diller.map(l => (
                <Text key={l.id} style={s.langItem}>
                  <Text style={s.langBold}>{l.dil}</Text>{' — '}{l.seviye}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* SERTİFİKALAR */}
        {sertifikalar && sertifikalar.length > 0 && (
          <View>
            <Text style={s.sectionHeader}>Sertifikalar</Text>
            {sertifikalar.map(cert => (
              <View key={cert.id} style={s.certRow}>
                <Text style={s.certName}>{cert.ad}</Text>
                <Text style={s.certMeta}>{cert.kurum}{cert.tarih ? ` · ${cert.tarih}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  )
}
