import { scaleLinear } from 'd3-scale'
import { curveMonotoneX, line } from 'd3-shape'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'

/**
 * The "plume": one decision run three times, drawn like a weather ensemble chart. Used on the landing page and in the
 * app (decision builder, plan outcome), so both show results the same way. d3 supplies the scales and the
 * smooth curves, Motion morphs the lines when the data changes (the demo sliders) and slides the reveal clip when the
 * story moves to another month. Values are pasted engine output; this component only turns them into geometry.
 */
export type CaseKey = 'pessimistic' | 'expected' | 'optimistic'
export type Series = Record<CaseKey, number[]> & { withoutHire?: number[] }
export type Note = { month: number; value: number; text: string; tone: CaseKey | 'neutral'; place?: 'above' | 'below' }

const color: Record<CaseKey | 'withoutHire' | 'neutral', string> = {
  pessimistic: 'var(--color-coral-strong)',
  expected: 'var(--color-ink)',
  optimistic: 'var(--color-teal-strong)',
  withoutHire: 'var(--color-faint)',
  neutral: 'var(--color-ink)',
}
const order: (CaseKey | 'withoutHire')[] = ['withoutHire', 'pessimistic', 'optimistic', 'expected']
const ease = [0.23, 1, 0.32, 1] as const // --ease-out
const easeInOut = [0.77, 0, 0.175, 1] as const // --ease-in-out

/** A value range that fits the lines, padded by 12% and always including zero (chart geometry only). */
function fit(series: Series): [number, number] {
  const all = [0, ...series.pessimistic, ...series.expected, ...series.optimistic, ...(series.withoutHire ?? [])]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const pad = Math.max(1500, (max - min) * 0.12)
  return [min - pad, max + pad]
}

/** Width of an element, kept up to date (the chart draws at real pixel size, so text stays crisp). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, width }
}

export function PlumeChart({
  series,
  domain,
  height,
  months,
  notes = [],
  endLabels,
  zeroLabel,
  zeroLabelAt = 'start',
  formatEnd,
  endText,
  drawIn = false,
}: {
  series: Series
  /** Fixed value range; omit to fit the range to the data (with padding, always including zero). */
  domain?: [number, number]
  height: number
  /** Months revealed (0 to the last month in the series). */
  months?: number
  notes?: Note[]
  /** Label each line at month 12 with its value (the demo); needs a right gutter. */
  endLabels?: boolean
  zeroLabel: string
  /** Where the zero-line label sits: at the start (lines start on zero) or the end (cash, where they start above it). */
  zeroLabelAt?: 'start' | 'end'
  formatEnd?: (value: number) => string
  /** Ready-made end labels (decimal strings from the API, formatted), used instead of formatEnd. */
  endText?: Partial<Record<CaseKey, string>>
  /** Reveal from month 0 on first render: the page's one orchestrated moment. */
  drawIn?: boolean
}) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const clip = useId()
  const reduce = useReducedMotion()
  const [drawn, setDrawn] = useState(!drawIn)
  useEffect(() => {
    if (drawn || !width) return
    const frame = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(frame)
  }, [drawn, width])

  const axis = 22 // room for month numbers
  const gutter = endLabels ? (width < 480 ? 92 : 132) : 8
  const plotW = Math.max(0, width - gutter)
  const plotH = height - axis
  // Series run from month 0 (the moment of the decision) to the plan's last month: 6, 12, 24 or 36.
  const last = series.expected.length - 1
  const tickEvery = last <= 12 ? 1 : last <= 24 ? 2 : 3
  const x = scaleLinear().domain([0, last]).range([0, plotW])
  const y = scaleLinear().domain(domain ?? fit(series)).range([plotH, 6]).clamp(true)
  const toPath = line<number>()
    .x((_, i) => x(i))
    .y((v) => y(v))
    .curve(curveMonotoneX)

  const shown = drawn ? (months ?? last) : 0
  const keys = order.filter((k) => series[k as keyof Series])

  // End labels: sorted top to bottom and pushed apart so they never overlap.
  const ends = endLabels
    ? (['optimistic', 'expected', 'pessimistic'] as CaseKey[])
        .map((k) => ({ k, v: series[k][last], y: y(series[k][last]) }))
        .sort((a, b) => a.y - b.y)
        .reduce<{ k: CaseKey; v: number; y: number }[]>((acc, e) => {
          const prev = acc[acc.length - 1]
          acc.push(prev && e.y - prev.y < 18 ? { ...e, y: prev.y + 18 } : e)
          return acc
        }, [])
    : []

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible" role="img" aria-label="Chart of the three cases over twelve months">
          <defs>
            <clipPath id={clip}>
              <motion.rect
                x={-6}
                y={-20}
                height={plotH + 40}
                initial={false}
                animate={{ width: x(shown) + 12 }}
                transition={{ duration: reduce ? 0 : drawIn ? 1.4 : 0.8, ease: easeInOut }}
              />
            </clipPath>
          </defs>

          {Array.from({ length: last + 1 }, (_, m) => (
            <g key={m}>
              <line x1={x(m)} x2={x(m)} y1={0} y2={plotH} stroke="currentColor" className="text-black/[0.07]" />
              {(m === 0 || m % tickEvery === 0) && (
                <text x={x(m)} y={height - 6} textAnchor="middle" className="fill-muted text-[11px] font-medium tabular-nums">
                  {m === 0 ? 'Now' : m}
                </text>
              )}
            </g>
          ))}
          <motion.line
            initial={false}
            animate={{ y1: y(0), y2: y(0) }}
            transition={{ duration: reduce ? 0 : 0.45, ease }}
            x1={0}
            x2={plotW}
            stroke="currentColor"
            strokeDasharray="4 5"
            className="text-black/45"
          />
          <motion.text
            initial={false}
            animate={{ y: zeroLabelAt === 'start' ? y(0) - 8 : y(0) + 18 }}
            transition={{ duration: reduce ? 0 : 0.45, ease }}
            x={zeroLabelAt === 'start' ? 2 : plotW}
            textAnchor={zeroLabelAt === 'start' ? 'start' : 'end'}
            className="fill-muted text-[12px] font-medium"
          >
            {zeroLabel}
          </motion.text>

          <g clipPath={`url(#${clip})`}>
            {keys.map((k) => (
              <motion.path
                key={k}
                initial={false}
                animate={{ d: toPath(series[k as keyof Series]!) ?? '' }}
                transition={{ duration: reduce ? 0 : 0.45, ease }}
                fill="none"
                stroke={color[k]}
                strokeWidth={k === 'expected' ? 3.5 : k === 'withoutHire' ? 1.75 : 2.75}
                strokeDasharray={k === 'withoutHire' ? '2 6' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>

          {notes.map((n) => {
            const nx = x(n.month)
            const ny = y(n.value)
            const anchor = nx < plotW * 0.2 ? 'start' : nx > plotW * 0.8 ? 'end' : 'middle'
            return (
              <motion.g key={`${n.month}-${n.text}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.5, duration: 0.3 }}>
                <circle cx={nx} cy={ny} r={6} fill={color[n.tone]} stroke="white" strokeWidth={3} />
                <text
                  x={nx + (anchor === 'start' ? -4 : anchor === 'end' ? 4 : 0)}
                  y={n.place === 'below' ? ny + 26 : ny - 14}
                  textAnchor={anchor}
                  className="fill-ink text-[14px] font-semibold"
                  paintOrder="stroke"
                  stroke="white"
                  strokeWidth={4}
                  strokeLinejoin="round"
                >
                  {n.text}
                </text>
              </motion.g>
            )
          })}

          {ends.map((e) => (
            <g key={e.k}>
              <motion.circle initial={false} animate={{ cy: y(e.v) }} transition={{ duration: reduce ? 0 : 0.45, ease }} cx={x(last)} r={5} fill={color[e.k]} stroke="white" strokeWidth={2.5} />
              <motion.text
                initial={false}
                animate={{ y: e.y + 5 }}
                transition={{ duration: reduce ? 0 : 0.45, ease }}
                x={x(last) + 12}
                className="text-[15px] font-bold tabular-nums"
                style={{ fill: color[e.k] }}
              >
                {endText?.[e.k] ?? (formatEnd ? formatEnd(e.v) : e.v)}
              </motion.text>
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}
