import { Component, type ReactNode, Suspense, lazy } from 'react'
import { cn } from '../../lib/utils'

const Spline = lazy(() => import('@splinetool/react-spline'))

// Spline hataları tüm sayfayı çökertmesin diye ErrorBoundary
class SplineErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const errorFallback = (
    <div className="w-full h-full flex items-center justify-center">
      <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)' }}>3D sahne yüklenemedi</span>
    </div>
  )

  return (
    <SplineErrorBoundary fallback={errorFallback}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(99,102,241,0.2)',
              borderTopColor: '#6366f1',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        }
      >
        <Spline scene={scene} className={cn('w-full h-full', className)} />
      </Suspense>
    </SplineErrorBoundary>
  )
}
