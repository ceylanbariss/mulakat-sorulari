import { Helmet } from 'react-helmet-async'
import { HeroSection } from '../components/home/HeroSection'
import { CategoryGrid } from '../components/home/CategoryGrid'
import { HowItWorks } from '../components/home/HowItWorks'
import { OneCikanHaberler } from '../components/home/OneCikanHaberler'
import { CtaBanner } from '../components/home/CtaBanner'

export function Home() {
  return (
    <div>
      <Helmet>
        <title>Mülakat Soruları | Yazılım Mülakatına Hazırlan</title>
        <meta name="description" content="Flash Card, Quiz ve Yazılı Cevap modlarıyla yazılım mülakat sorularını çalış. JavaScript, React, CSS, Genel Yazılım kategorilerinde 3000+ uzman soru." />
        <meta property="og:title" content="Mülakat Soruları | Yazılım Mülakatına Hazırlan" />
        <meta property="og:description" content="Flash Card, Quiz ve Yazılı Cevap modlarıyla yazılım mülakat sorularını çalış. 3000+ uzman soru, 5 kategori." />
        <meta property="og:url" content="https://mulakatsorulari.com.tr/" />
        <link rel="canonical" href="https://mulakatsorulari.com.tr/" />
      </Helmet>
      <HeroSection />
      <CategoryGrid />
      <HowItWorks />
      <OneCikanHaberler />
      <CtaBanner />
    </div>
  )
}
