import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'

// Tooltip timing (emil-design-eng): a short delay before the first one opens, so passing the pointer over a
// button does not flash a label; once one has been open, neighbours open instantly and without animation.
const OPEN_DELAY_MS = 400
const SKIP_DELAY_WINDOW_MS = 300
let lastClosedAt = 0

type Side = 'top' | 'bottom'
const GAP = 8 // px between trigger and tooltip
const EDGE = 8 // px kept free at the viewport edges

/**
 * Hover and keyboard-focus label for a control that shows only an icon ("Delete this plan" on a trash button).
 * The control keeps its own aria-label; the tooltip repeats it visually and is hidden from screen readers so the
 * name is not read twice. Not shown for touch, where a tap acts straight away.
 */
export function Tooltip({ label, side = 'top', children }: { label: string; side?: Side; children: ReactElement }) {
  const wrapper = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLSpanElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [state, setState] = useState<{ open: boolean; instant: boolean; x: number; y: number }>({ open: false, instant: false, x: 0, y: 0 })

  const trigger = () => (wrapper.current?.firstElementChild as HTMLElement | null) ?? wrapper.current

  const show = (immediate = false) => {
    window.clearTimeout(timer.current)
    const instant = immediate || Date.now() - lastClosedAt < SKIP_DELAY_WINDOW_MS
    const open = () => {
      const r = trigger()?.getBoundingClientRect()
      if (!r) return
      setState({ open: true, instant, x: r.left + r.width / 2, y: side === 'top' ? r.top - GAP : r.bottom + GAP })
    }
    if (instant) open()
    else timer.current = window.setTimeout(open, OPEN_DELAY_MS)
  }

  const hide = () => {
    window.clearTimeout(timer.current)
    setState((s) => {
      if (s.open) lastClosedAt = Date.now()
      return { ...s, open: false }
    })
  }

  // Keep the tooltip inside the viewport: shift it sideways once its width is known.
  useLayoutEffect(() => {
    const el = tip.current
    if (!state.open || !el) return
    const half = el.offsetWidth / 2
    const x = Math.min(Math.max(state.x, half + EDGE), window.innerWidth - half - EDGE)
    el.style.left = `${x}px`
  }, [state.open, state.x])

  // Escape dismisses it (WCAG 1.4.13); scrolling moves the trigger away, so close rather than float.
  useEffect(() => {
    if (!state.open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide()
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', hide, { capture: true, passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', hide, { capture: true })
    }
  }, [state.open])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <span
      ref={wrapper}
      className="inline-flex"
      onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(e) => (e.target as HTMLElement).matches(':focus-visible') && show(true)}
      onBlur={hide}
    >
      {children}
      {state.open &&
        createPortal(
          <span
            ref={tip}
            role="tooltip"
            aria-hidden
            data-side={side}
            data-instant={state.instant || undefined}
            className="tooltip material-dark pointer-events-none fixed z-[60] whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-white shadow-lift"
            style={{ left: state.x, top: state.y }}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  )
}
