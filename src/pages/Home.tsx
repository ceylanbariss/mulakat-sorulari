import { HeroSection } from '../components/home/HeroSection'
import { CategoryGrid } from '../components/home/CategoryGrid'
import { HowItWorks } from '../components/home/HowItWorks'
import { CtaBanner } from '../components/home/CtaBanner'

export function Home() {
  return (
    <div>
      <HeroSection />
      <CategoryGrid />
      <HowItWorks />
      <CtaBanner />
    </div>
  )
}
