export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light'
export type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border font-semibold transition-colors select-none disabled:cursor-not-allowed disabled:opacity-45'
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}
const variants: Record<Variant, string> = {
  primary: 'bg-navy text-white border-navy hover:bg-navy-dark hover:border-navy-dark',
  secondary: 'bg-surface text-navy border-navy hover:bg-navy-50',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-line-soft hover:text-ink',
  danger: 'bg-surface text-bad border-line hover:border-bad',
  light: 'bg-white text-navy border-white hover:bg-navy-50',
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  `${base} ${sizes[size]} ${variants[variant]} ${extra}`

