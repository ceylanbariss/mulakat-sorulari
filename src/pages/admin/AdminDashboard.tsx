import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Tag, Megaphone, Users, Database, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  questionsCol, categoriesCol, announcementsCol, userProfilesCol,
  getAll, setDocument,
} from '../../lib/firestore'
import { getAllQuestions } from '../../data/questions'
import { CATEGORIES } from '../../data/categories'

interface Stats { questions: number; categories: number; announcements: number; users: number }

const CARD_VAR = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.45 } },
}

const STAT_CARDS = [
  { label: 'Toplam Soru',  key: 'questions'     as const, icon: BookOpen,  color: '#06b6d4', path: '/admin/sorular' },
  { label: 'Kategori',     key: 'categories'    as const, icon: Tag,        color: '#8b5cf6', path: '/admin/kategoriler' },
  { label: 'Duyuru',       key: 'announcements' as const, icon: Megaphone,  color: '#f59e0b', path: '/admin/duyurular' },
  { label: 'Kullanıcı',    key: 'users'         as const, icon: Users,      color: '#10b981', path: '/admin/kullanicilar' },
]

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ questions: 0, categories: 0, announcements: 0, users: 0 })
  const [seeding, setSeeding] = useState(false)
  const [seedDone, setSeedDone] = useState(false)

  useEffect(() => {
    Promise.all([
      getAll(questionsCol()), getAll(categoriesCol()),
      getAll(announcementsCol()), getAll(userProfilesCol()),
    ]).then(([questions, categories, announcements, users]) => {
      setStats({ questions: questions.length, categories: categories.length, announcements: announcements.length, users: users.length })
    })
  }, [seedDone])

  const handleSeed = async () => {
    if (!confirm('Mevcut TypeScript verilerini Firestore\'a yüklemek istiyor musun?')) return
    setSeeding(true)
    try {
      for (const cat of CATEGORIES) {
        await setDocument(categoriesCol(), cat.id, {
          id: cat.id, label: cat.label, emoji: cat.emoji, description: cat.description,
          color: cat.color, bgColor: cat.bgColor, order: CATEGORIES.indexOf(cat),
        })
      }
      const existing = await getAll(questionsCol())
      const existingIds = new Set(existing.map((q: { _id: string }) => q._id))
      for (const q of getAllQuestions()) {
        if (!existingIds.has(q.id)) {
          await setDocument(questionsCol(), q.id, {
            id: q.id, category: q.category, subcategory: q.subcategory ?? '',
            difficulty: q.difficulty, question: q.question, answer: q.answer,
            hints: q.hints ?? [], options: q.options ?? [],
          })
        }
      }
      setSeedDone(true)
      toast.success(`${CATEGORIES.length} kategori ve ${getAllQuestions().length} soru yüklendi!`)
    } catch (err) { console.error(err); toast.error('Seed işlemi başarısız.') }
    finally { setSeeding(false) }
  }

  return (
    <div style={{ padding: 32, maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 24, margin: 0 }}>Genel Bakış</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 6, margin: '6px 0 0' }}>Sitenin genel durumunu buradan takip edebilirsin.</p>
      </div>

      {/* Stat cards */}
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}
      >
        {STAT_CARDS.map(({ label, key, icon: Icon, color, path }) => (
          <motion.div key={label} variants={CARD_VAR}>
            <StatCard label={label} value={stats[key]} Icon={Icon} color={color} path={path} />
          </motion.div>
        ))}
      </motion.div>

      {/* Seed */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{ background: '#111827', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Database size={18} style={{ color: '#64748b' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, margin: '0 0 6px' }}>Veritabanını Başlat</h3>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 }}>
              Mevcut TypeScript dosyalarındaki soruları ve kategorileri Firestore'a taşır. Tek seferlik çalıştır.
            </p>
            {seedDone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                <CheckCircle2 size={14} /> Başarıyla yüklendi!
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleSeed} disabled={seeding}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: seeding ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 600, opacity: seeding ? 0.6 : 1, transition: 'opacity 0.15s' }}
              >
                {seeding
                  ? <><Spinner /> Yükleniyor...</>
                  : <><Database size={13} /> Firestore'a Yükle</>
                }
              </button>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: 12 }}>
                <AlertTriangle size={12} /> Bir kez çalıştır
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function StatCard({ label, value, Icon, color, path }: { label: string; value: number; Icon: React.ElementType; color: string; path: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={path}
      style={{
        display: 'flex', flexDirection: 'column', gap: 16, padding: 20,
        background: '#111827',
        border: hovered ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, textDecoration: 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 24px ${color}14` : 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, ${color}00)`, borderRadius: 1 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <ArrowUpRight size={14} style={{ color: hovered ? color : '#334155', transition: 'color 0.15s', marginTop: 2 }} />
      </div>
      <div>
        <p style={{ color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1, margin: 0 }}>{value}</p>
        <p style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</p>
      </div>
    </Link>
  )
}

function Spinner() {
  return (
    <span style={{
      width: 13, height: 13, border: '2px solid rgba(255,255,255,0.25)',
      borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
