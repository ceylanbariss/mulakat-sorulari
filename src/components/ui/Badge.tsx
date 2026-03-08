import { cn } from '../../lib/utils'

type BadgeVariant = 'yazilim' | 'kamu' | 'banka' | 'ik' | 'kolay' | 'orta' | 'zor' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  yazilim: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  kamu: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  banka: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ik: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  kolay: 'bg-emerald-500 text-white font-semibold',
  orta: 'bg-amber-500 text-white font-semibold',
  zor: 'bg-red-500 text-white font-semibold',
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
