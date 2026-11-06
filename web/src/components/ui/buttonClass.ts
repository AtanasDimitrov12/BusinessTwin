export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light'
export type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border font-semibold select-none transition-[color,background-color,border-color,translate,scale] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100'
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white border-accent hover:bg-accent-dark hover:border-accent-dark',
  secondary: 'bg-surface text-accent border-accent hover:bg-accent-50',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-line-soft hover:text-ink',
  danger: 'bg-surface text-bad border-line hover:border-bad',
  light: 'bg-white text-accent border-white hover:bg-accent-50',
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  `${base} ${sizes[size]} ${variants[variant]} ${extra}`

