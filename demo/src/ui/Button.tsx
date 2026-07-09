import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'ghost' }

export function Button({ variant = 'ghost', className = '', ...rest }: Props) {
  const base = 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const styles =
    variant === 'solid'
      ? 'bg-accent text-white hover:brightness-110'
      : 'border border-line text-ink hover:bg-surface'
  return <button className={`${base} ${styles} ${className}`} {...rest} />
}
