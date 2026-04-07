import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart2, Clock, CheckCircle, Flame, ArrowRight, TrendingUp, TrendingDown, Trophy, Target, BookOpen, Zap, AlertCircle } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { useTrainingStats } from '../hooks/useTrainingStats'
import { PersonalCoach } from '../components/stats/PersonalCoach'

const CATEGORY_LABELS: Record<string, string> = {
  yazilim: 'Yazılım', kamu: 'Kamu', banka: 'Banka', ik: 'İnsan Kaynakları',
}
const CATEGORY_COLORS: Record<string, string> = {
  yazilim: '#3b82f6', kamu: '#10b981', banka: '#f59e0b', ik: '#8b5cf6',
}
const CATEGORY_EMOJIS: Record<string, string> = {
  yazilim: '💻', kamu: '🏛️', banka: '🏦', ik: '👥',
}
const MODE_LABELS: Record<string, string> = {
  flashcard: 'Flash Card', quiz: 'Quiz Modu', written: 'Yazılı Cevap',
}
const MODE_COLORS: Record<string, string> = {
  flashcard: '#f97316', quiz: '#6366f1', written: '#10b981',
}

function scoreColor(score: number) {
  if (score >= 70) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function formatDate(ts: any): string {
  if (!ts?.toMillis) return '—'
  const d = new Date(ts.toMillis())
  const diff = Date.now() - d.getTime()
  if (diff < 60 * 60 * 1000) return 'Az önce'
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} saat önce`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} gün önce`
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const cardVar = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

export function Statistics() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)
  const stats = useTrainingStats()

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
  const cardShadow = '0 4px 24px rgba(0,0,0,0.07)'

  // ── Auth yükleniyor ──
  if (authLoading) {
    return (
      <div className="relative overflow-hidden" style={{ minHeight: '100vh', paddingTop: '120px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </div>
    )
  }

  // GEÇİCİ: Giriş yapılmamış guard devre dışı — geri almak için bu yorumu kaldır
  // if (!user) { return (...) }

  // ── İstatistikler yükleniyor ──
  if (stats.loading) {
    return (
      <div className="relative overflow-hidden" style={{ minHeight: '100vh', paddingTop: '120px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '14px', color: d ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.7)' }}>Veriler yükleniyor…</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Henüz antrenman yok ──
  if (stats.totalSessions === 0) {
    return (
      <div className="relative overflow-hidden" style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, borderRadius: '24px', textAlign: 'center', padding: '64px 40px' }}
          >
            <div style={{ fontSize: '64px', marginBottom: '24px', lineHeight: 1 }}>🏁</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: d ? 'white' : '#0f172a', marginBottom: '12px' }}>
              Henüz antrenman yapılmamış
            </h2>
            <p style={{ fontSize: '14px', color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.7)', lineHeight: 1.75, marginBottom: '32px' }}>
              Bir antrenmanı tamamladıktan sonra burada detaylı analizin görünecek.
            </p>
            <Link to="/sorular" className="btn-gradient-bg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, boxShadow: '0 8px 24px rgba(99,102,241,0.35)', textDecoration: 'none' }}>
              İlk Antrenmanı Başlat <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Tam analitik ──
  const { totalSessions, totalQuestions, avgScore, weeklyQuestions, categoryStats, modeStats, recentSessions, strongCategories, weakCategories } = stats

  // Analysis text
  const overallAssessment = avgScore >= 75
    ? { emoji: '🏆', text: 'Mükemmel performans sergiliyorsun! Devam et.', color: '#10b981' }
    : avgScore >= 55
      ? { emoji: '💪', text: 'İyi bir yoldasın. Zayıf kategorilere odaklanırsan çok daha iyi olacak.', color: '#f59e0b' }
      : { emoji: '📚', text: 'Düzenli antrenmanlarla hızlı gelişim sağlayabilirsin.', color: '#6366f1' }

  // Suggestions
  const suggestions: string[] = []
  const usedModes = Object.keys(modeStats)
  if (!usedModes.includes('flashcard')) suggestions.push('Flash Card modunu dene — hızlı tekrar ve hafıza güçlendirmede çok etkili.')
  if (!usedModes.includes('quiz')) suggestions.push('Quiz moduyla bilgini test et — çoktan seçmeli sorular sınav refleksini geliştirir.')
  if (!usedModes.includes('written')) suggestions.push('Yazılı Cevap modunu dene — derinlemesine kavramak için ideal.')
  if (weakCategories.length > 0) suggestions.push(`"${CATEGORY_LABELS[weakCategories[0].category] ?? weakCategories[0].category}" kategorisine daha fazla zaman ayır.`)
  if (weeklyQuestions < 10 && totalSessions > 2) suggestions.push('Haftada en az 10 soru çözmek düzenli gelişim için ideal.')

  return (
    <div className="relative overflow-hidden" style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Başlık ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: d ? 'white' : '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '4px' }}>
            İlerleme Paneli
          </h1>
          <p style={{ fontSize: '15px', color: d ? 'rgba(148,163,184,0.65)' : 'rgba(71,85,105,0.7)' }}>
            {user?.displayName ? `Merhaba, ${user.displayName.split(' ')[0]}` : 'Merhaba'} — işte antrenman özetin
          </p>
        </motion.div>

        {/* ── Özet Kartlar ── */}
        <motion.div
          variants={container} initial="hidden" animate="show"
          style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}
          className="grid-cols-2 grid sm:grid-cols-4"
        >
          {[
            { label: 'Toplam Antrenman', value: totalSessions, icon: BarChart2, color: '#3b82f6', iconBg: 'rgba(59,130,246,0.15)' },
            { label: 'Çözülen Soru', value: totalQuestions, icon: CheckCircle, color: '#10b981', iconBg: 'rgba(16,185,129,0.15)' },
            { label: 'Ortalama Başarı', value: `%${avgScore}`, icon: Trophy, color: '#8b5cf6', iconBg: 'rgba(139,92,246,0.15)' },
            { label: 'Bu Hafta', value: weeklyQuestions + ' soru', icon: Flame, color: '#f59e0b', iconBg: 'rgba(245,158,11,0.15)' },
          ].map(({ label, value, icon: Icon, color, iconBg }) => (
            <motion.div key={label} variants={cardVar} style={{ borderRadius: '16px', padding: '24px', background: cardBg, border: cardBorder, boxShadow: cardShadow }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Icon size={20} style={{ color }} />
              </div>
              <p style={{ fontSize: '28px', fontWeight: 800, color: d ? 'white' : '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
              <p style={{ fontSize: '12px', color: d ? 'rgba(148,163,184,0.55)' : 'rgba(71,85,105,0.65)', marginTop: '6px', fontWeight: 500 }}>{label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '24px' }}>

          {/* ── Sol sütun ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Kategori Performansı */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, borderRadius: '20px', padding: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: d ? 'white' : '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} style={{ color: '#6366f1' }} /> Kategori Performansı
              </h2>
              {categoryStats.length === 0 ? (
                <p style={{ fontSize: '13px', color: d ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.6)' }}>Henüz kategori verisi yok.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {categoryStats.map((cat, i) => {
                    const color = CATEGORY_COLORS[cat.category] ?? '#6366f1'
                    const label = CATEGORY_LABELS[cat.category] ?? cat.category
                    const emoji = CATEGORY_EMOJIS[cat.category] ?? '📋'
                    return (
                      <motion.div key={cat.category} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.07 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{emoji}</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.9)' : '#0f172a' }}>{label}</span>
                            <span style={{ fontSize: '11px', color: d ? 'rgba(100,116,139,0.7)' : 'rgba(100,116,139,0.8)', fontWeight: 500 }}>{cat.totalSessions} antrenman</span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: scoreColor(cat.score) }}>%{cat.score}</span>
                        </div>
                        <div style={{ height: '8px', background: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.score}%` }}
                            transition={{ delay: 0.3 + i * 0.07, duration: 0.7, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: '4px', background: `linear-gradient(90deg, ${color}80, ${color})` }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '5px', fontSize: '11px', color: d ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.75)' }}>
                          <span style={{ color: '#10b981' }}>✓ {cat.correctCount} doğru</span>
                          <span style={{ color: '#ef4444' }}>✗ {cat.totalQuestions - cat.correctCount} eksik</span>
                          <span>{cat.totalQuestions} toplam soru</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Analiz */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, borderRadius: '20px', padding: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: d ? 'white' : '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} style={{ color: '#f59e0b' }} /> Performans Analizi
              </h2>

              {/* Genel değerlendirme */}
              <div style={{ borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${overallAssessment.color}25`, display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{overallAssessment.emoji}</span>
                <p style={{ fontSize: '14px', color: d ? 'rgba(226,232,240,0.85)' : '#1e293b', lineHeight: 1.65, fontWeight: 500 }}>{overallAssessment.text}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {/* Güçlü Yönler */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <TrendingUp size={12} /> Güçlü Yönlerin
                  </p>
                  {strongCategories.length === 0 ? (
                    <p style={{ fontSize: '12px', color: d ? 'rgba(100,116,139,0.6)' : 'rgba(100,116,139,0.7)', lineHeight: 1.6 }}>
                      Henüz güçlü alan belirlenmedi. Daha fazla antrenman yap!
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {strongCategories.map(cat => (
                        <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px' }}>
                          <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span>
                          <span style={{ color: d ? 'rgba(226,232,240,0.8)' : '#0f172a', fontWeight: 600 }}>{CATEGORY_LABELS[cat.category] ?? cat.category}</span>
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>%{cat.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Geliştirme Alanları */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ef4444', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <TrendingDown size={12} /> Geliştirme Alanları
                  </p>
                  {weakCategories.length === 0 ? (
                    <p style={{ fontSize: '12px', color: d ? 'rgba(100,116,139,0.6)' : 'rgba(100,116,139,0.7)', lineHeight: 1.6 }}>
                      Tüm kategorilerde iyi gidiyorsun 🎉
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {weakCategories.map(cat => (
                        <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px' }}>
                          <span style={{ color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>↑</span>
                          <span style={{ color: d ? 'rgba(226,232,240,0.8)' : '#0f172a', fontWeight: 600 }}>{CATEGORY_LABELS[cat.category] ?? cat.category}</span>
                          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>%{cat.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Öneriler */}
              {suggestions.length > 0 && (
                <div style={{ borderTop: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: d ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.7)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertCircle size={12} /> Öneriler
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {suggestions.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: d ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.85)', lineHeight: 1.55 }}>
                        <span style={{ color: '#6366f1', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>→</span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Sağ sütun ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Mod Kullanımı */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, borderRadius: '20px', padding: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: d ? 'white' : '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} style={{ color: '#3b82f6' }} /> Mod Kullanımı
              </h2>
              {Object.keys(modeStats).length === 0 ? (
                <p style={{ fontSize: '13px', color: d ? 'rgba(100,116,139,0.6)' : 'rgba(100,116,139,0.7)' }}>Veri yok.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(modeStats).sort((a, b) => b[1] - a[1]).map(([mode, count]) => {
                    const pct = Math.round((count / totalSessions) * 100)
                    const color = MODE_COLORS[mode] ?? '#6366f1'
                    return (
                      <div key={mode}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.85)' : '#0f172a' }}>{MODE_LABELS[mode] ?? mode}</span>
                          <span style={{ fontSize: '12px', color: color, fontWeight: 700 }}>{count}x · %{pct}</span>
                        </div>
                        <div style={{ height: '6px', background: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            style={{ height: '100%', borderRadius: '3px', background: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Son Antrmanlar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, borderRadius: '20px', padding: '28px', flex: 1 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: d ? 'white' : '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: '#10b981' }} /> Son Antrmanlar
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {recentSessions.map((s, i) => {
                  const catColor = CATEGORY_COLORS[s.category] ?? '#6366f1'
                  const catLabel = CATEGORY_LABELS[s.category] ?? s.category
                  const modeLabel = MODE_LABELS[s.mode] ?? s.mode
                  const sc = scoreColor(s.score)
                  return (
                    <motion.div
                      key={s._id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.85)' : '#0f172a', lineHeight: 1.3 }}>{catLabel}</p>
                        <p style={{ fontSize: '11px', color: d ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.75)' }}>{modeLabel} · {s.totalQuestions} soru</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: sc, lineHeight: 1 }}>%{s.score}</p>
                        <p style={{ fontSize: '10px', color: d ? 'rgba(100,116,139,0.55)' : 'rgba(100,116,139,0.65)', marginTop: '2px' }}>{formatDate((s as any).createdAt)}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

          </div>
        </div>

        <PersonalCoach stats={stats} d={d} />

      </div>
    </div>
  )
}
