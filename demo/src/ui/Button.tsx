import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'ghost' }

export function buttonClasses(variant: 'solid' | 'ghost' = 'ghost', extra = '') {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35'
  const styles =
    variant === 'solid'
      ? 'bg-accent text-white shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_8px_24px_-8px_rgba(124,92,255,0.6)] hover:bg-accent-soft'
      : 'border border-line bg-surface/60 text-ink backdrop-blur-sm hover:border-accent/50 hover:bg-elevated'
  return `${base} ${styles} ${extra}`
}

export function Button({ variant = 'ghost', className = '', ...rest }: Props) {
  return <button className={buttonClasses(variant, className)} {...rest} />
}
