export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light' | 'glass'
export type Size = 'sm' | 'md' | 'lg'

// Pill buttons, Apple-style: solid blue for the one main action, tinted fills for the rest.
// Feedback lives on the press (scale 0.97, 150ms strong ease-out); colour changes use plain ease.
const base =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent font-medium tracking-[-0.01em] select-none transition-[color,background-color,border-color,box-shadow,translate,scale] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'
const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-[13px]',
  md: 'px-5 py-2.5 text-[15px]',
  lg: 'px-7 py-3.5 text-[17px]',
}
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark',
  secondary: 'bg-accent/10 text-accent hover:bg-accent/15',
  ghost: 'bg-transparent text-ink hover:bg-black/[0.05]',
  danger: 'bg-bad/10 text-bad hover:bg-bad/15',
  light: 'bg-white text-ink hover:bg-white/90',
  glass: 'bg-white/10 text-white hover:bg-white/15', // on dark surfaces
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  `${base} ${sizes[size]} ${variants[variant]} ${extra}`
