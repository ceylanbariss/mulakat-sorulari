import { cn } from '../../lib/utils'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div
      className={cn(className)}
      style={{ maxWidth: '1152px', width: '100%', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px' }}
    >
      {children}
    </div>
  )
}
