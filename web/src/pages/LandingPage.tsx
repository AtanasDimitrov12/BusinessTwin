import { Slider } from '@base-ui/react/slider'
import { ArrowUp, ChevronDown, Minus, Plus } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'
import { Tooltip } from '../components/ui/Tooltip'
import { formatEuroDelta, formatEuroWhole } from '../lib/format'
import { demoGrid, shareSteps } from './landing/demoGrid'
import { PlumeChart, type Note, type Series } from './landing/PlumeChart'
import { breakEvenNewVisits, cash, runningTotal } from './landing/story'

// One story, told with colour: a fictional salon deciding whether to hire a fifth stylist. Every figure is real
// scenario-engine output (landing/story.ts, landing/demoGrid.ts); the browser formats and draws, it never calculates.

const delta = (n: number) => formatEuroDelta(String(n))
const money = (n: number) => formatEuroWhole(String(n)).replace('-', '−')

/** Display type: Archivo condensed and heavy, the page's loud voice. */
const display = 'font-display font-extrabold font-stretch-[72%] leading-[0.92] tracking-[-0.015em]'

export function LandingPage() {
  return (
    <div className="overflow-x-clip bg-surface text-ink">
      <SiteNav />
      <main>
        <Hero />
        <Story />
        <YourSalon />
        <Honest />
        <Faq />
        <Close />
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  )
}

function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

function SiteNav() {
  return (
    <header className="material sticky top-0 z-40 border-b border-line">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Logo size={28} />
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Page sections">
          {[
            ['#story', 'The story'],
            ['#your-salon', 'How it works'],
            ['#faq', 'Questions'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="underline-offset-4 hover:underline">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ButtonLink to="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <Link
            to="/register"
            className="inline-flex select-none items-center rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white transition-[scale] duration-150 ease-out active:scale-[0.97]"
          >
            Start free
          </Link>
        </div>
      </Container>
    </header>
  )
}

// ── Hero: what it is in one line, then a decision to play with ───────────

function Hero() {
  return (
    <section className="border-b border-line">
      {/* Text and a working example side by side, sized so both fit in a laptop's first screen. */}
      <Container className="grid items-center gap-10 py-10 md:py-14 lg:min-h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:py-10">
        <div>
          <h1 className={`${display} text-[clamp(2.9rem,4.9vw,4.4rem)]`}>Test salon decisions before you make them.</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Hiring a stylist, raising your prices or starting a campaign? Business Twin plays it out over the next twelve months, in a bad, a normal
            and a good case.
          </p>
          {/* The page's one loud button: highest contrast in the hero, a teal ring on hover, a press that gives. */}
          <Link
            to="/register"
            className="mt-8 inline-flex select-none items-center rounded-full bg-ink px-8 py-4 text-[17px] font-semibold text-white transition-[box-shadow,scale] duration-200 ease-out hover:shadow-[0_0_0_4px_var(--color-surface),0_0_0_7px_var(--color-teal)] active:scale-[0.97]"
          >
            Start with your salon
          </Link>
          <p className="mt-4 text-sm text-muted">Free to try. Set-up takes about ten minutes.</p>
        </div>

        <Demo />
      </Container>
    </section>
  )
}

/** The hero demo: one control picks one of the pre-computed engine runs for the example hire. */
const DEMO_COST = 2400

function Demo() {
  const [share, setShare] = useState(60)
  const run = demoGrid[`${share}-${DEMO_COST}`]
  const series: Series = { pessimistic: run.pessimistic.total, expected: run.expected.total, optimistic: run.optimistic.total }
  const normal = run.expected.paidBack ? `Paid back in month ${run.expected.paidBack}` : 'Not paid back within a year'
  const bad =
    run.pessimistic.lowestCash < 0
      ? `Cash drops to ${money(run.pessimistic.lowestCash)} in month ${run.pessimistic.lowestCashMonth}`
      : `Cash stays above ${money(run.pessimistic.lowestCash)}`

  return (
    <figure id="try" className="scroll-mt-20 rounded-[28px] border border-line bg-surface p-5 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.3)] sm:p-7">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-bold">Example: a salon of four hires a fifth stylist</span>
        <span className="text-sm text-muted">Gained or lost vs not hiring</span>
      </figcaption>
      <div className="mt-4">
        <PlumeChart series={series} height={230} endLabels formatEnd={delta} zeroLabel="Not hiring" drawIn />
      </div>

      <div className="mt-6 grid gap-6 border-t border-line pt-5 sm:grid-cols-2 sm:gap-8">
        <DemoSlider label="New customers" value={share} steps={shareSteps} onChange={setShare} show={(v) => `${v}%`} hint="Of her customers, how many are new to the salon. The rest move from colleagues." />
        {/* Two fixed rows, so the card keeps its height whatever the outcome says. */}
        <dl className="grid content-start gap-3" aria-live="polite">
          <Verdict label="Normal case" text={normal} tone="ink" />
          <Verdict label="Bad case" text={bad} tone={run.pessimistic.lowestCash < 0 ? 'bad' : 'ink'} />
        </dl>
      </div>
    </figure>
  )
}

function Verdict({ label, text, tone }: { label: string; text: string; tone: 'ink' | 'bad' }) {
  return (
    <div className="grid content-start">
      <dt className="text-sm text-muted">{label}</dt>
      {/* Room for two lines, so a longer outcome never changes the card's height. */}
      <dd className="relative min-h-[2.9rem]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            className={`block text-[17px] font-bold leading-snug ${tone === 'bad' ? 'text-coral-strong' : 'text-ink'}`}
            initial={{ opacity: 0, filter: 'blur(4px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(4px)', y: -4 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </dd>
    </div>
  )
}

function DemoSlider({
  label,
  value,
  steps,
  onChange,
  show,
  hint,
}: {
  label: string
  value: number
  steps: number[]
  onChange: (v: number) => void
  show: (v: number) => string
  hint: string
}) {
  const index = steps.indexOf(value)
  const step = (d: number) => onChange(steps[Math.min(steps.length - 1, Math.max(0, index + d))])
  const nudge =
    'flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface transition-[background-color,scale] duration-150 hover:bg-canvas active:scale-[0.92]'
  return (
    <Slider.Root value={index} min={0} max={steps.length - 1} step={1} onValueChange={(i) => onChange(steps[i as number])}>
      <div className="flex items-baseline justify-between gap-3">
        <Slider.Label className="font-bold">{label}</Slider.Label>
        <span className={`${display} text-[2.5rem] tabular-nums`}>{show(value)}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" onClick={() => step(-1)} aria-label="Fewer new customers" className={nudge}>
          <Minus size={14} aria-hidden />
        </button>
        <Slider.Control className="flex h-8 flex-1 touch-none items-center">
          <Slider.Track className="h-1.5 w-full rounded-full bg-black/10">
            <Slider.Indicator className="rounded-full bg-ink" />
            <Slider.Thumb
              getAriaValueText={(_formatted, i) => show(steps[i])}
              className="size-6 rounded-full border-[3px] border-ink bg-white shadow-[0_2px_6px_rgb(0_0_0/0.25)] outline-none transition-[scale] duration-150 focus-visible:ring-4 focus-visible:ring-black/20 data-[dragging]:scale-110"
            />
          </Slider.Track>
        </Slider.Control>
        <button type="button" onClick={() => step(1)} aria-label="More new customers" className={nudge}>
          <Plus size={14} aria-hidden />
        </button>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{hint}</p>
    </Slider.Root>
  )
}

// ── Story: the same hire, month by month; the stage changes colour per chapter ──

type Swatch = 'mint' | 'sky' | 'lilac' | 'peach'
const swatchBg: Record<Swatch, string> = {
  mint: 'var(--color-swatch-mint)',
  sky: 'var(--color-swatch-sky)',
  lilac: 'var(--color-swatch-lilac)',
  peach: 'var(--color-swatch-peach)',
}
type Beat = { month: number; mode: 'total' | 'cash'; swatch: Swatch; title: string; body: ReactNode; notes: Note[] }

const beats: Beat[] = [
  {
    month: 1,
    mode: 'total',
    swatch: 'mint',
    title: 'Month 1. The wages start before the customers do.',
    body: (
      <>
        She costs €2,400 a month from her first day, while her chair is still mostly empty. Every case starts in the red: between{' '}
        {delta(runningTotal.optimistic[1])} and {delta(runningTotal.pessimistic[1])} in the first month.
      </>
    ),
    notes: [{ month: 1, value: runningTotal.pessimistic[1], text: `${delta(runningTotal.optimistic[1])} to ${delta(runningTotal.pessimistic[1])}`, tone: 'neutral', place: 'below' }],
  },
  {
    month: 5,
    mode: 'total',
    swatch: 'sky',
    title: 'A client base takes five months.',
    body: (
      <>
        She sees more customers every month until she is fully booked. In the normal case the hire is {delta(runningTotal.expected[4])} behind in
        month 4. That is the lowest point, before it starts to earn.
      </>
    ),
    notes: [{ month: 4, value: runningTotal.expected[4], text: `Lowest point ${delta(runningTotal.expected[4])}`, tone: 'expected', place: 'below' }],
  },
  {
    month: 8,
    mode: 'total',
    swatch: 'lilac',
    title: 'Only new customers add money.',
    body: (
      <>
        Some of her customers simply move from colleagues: more work for her, no extra sales. Are 40%, 60% or 80% of them new? Nobody knows, so the
        owner gives all three. That one guess is why the lines split. To cover her cost she needs about {breakEvenNewVisits} new visits a month.
      </>
    ),
    notes: [
      { month: 8, value: runningTotal.optimistic[8], text: '80% new', tone: 'optimistic' },
      { month: 8, value: runningTotal.expected[8], text: '60% new', tone: 'expected' },
      { month: 8, value: runningTotal.pessimistic[8], text: '40% new', tone: 'pessimistic', place: 'below' },
    ],
  },
  {
    month: 6,
    mode: 'cash',
    swatch: 'peach',
    title: 'Profit is not cash.',
    body: (
      <>
        The bank account tells its own story. In the bad case it drops to {money(cash.pessimistic[4])} in month 4: wages due, money not in yet.
        Business Twin marks every month like that, so the tight month is never a surprise.
      </>
    ),
    notes: [{ month: 4, value: cash.pessimistic[4], text: `${money(cash.pessimistic[4])} in month 4`, tone: 'pessimistic', place: 'below' }],
  },
  {
    month: 12,
    mode: 'total',
    swatch: 'mint',
    title: 'Month 12. One hire, three different years.',
    body: (
      <>
        Good case: ahead from month 5, {delta(runningTotal.optimistic[12])} after a year. Normal case: paid back in month 11. Bad case: never paid
        back, {delta(runningTotal.pessimistic[12])}. Same decision. Now the owner chooses knowing all three.
      </>
    ),
    notes: [
      { month: 5, value: runningTotal.optimistic[5], text: 'Paid back, month 5', tone: 'optimistic' },
      { month: 11, value: runningTotal.expected[11], text: 'Paid back, month 11', tone: 'expected' },
      { month: 12, value: runningTotal.pessimistic[12], text: delta(runningTotal.pessimistic[12]), tone: 'pessimistic' },
    ],
  },
]

const storyTotal: Series = runningTotal
const storyCash: Series = { pessimistic: cash.pessimistic, expected: cash.expected, optimistic: cash.optimistic, withoutHire: cash.withoutHire }

/** Which story step sits just below the middle of the viewport (where text is read under a sticky chart on phones). */
function useActiveStep(count: number) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLElement | null)[]>([])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step))
      },
      { rootMargin: '-55% 0px -35% 0px' },
    )
    refs.current.slice(0, count).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [count])
  return { active, register: (i: number) => (el: HTMLElement | null) => void (refs.current[i] = el) }
}

function Story() {
  const { active, register } = useActiveStep(beats.length)
  const beat = beats[active]
  const isCash = beat.mode === 'cash'
  return (
    <section
      id="story"
      aria-labelledby="story-title"
      className="scroll-mt-14 transition-[background-color] duration-700"
      style={{ backgroundColor: swatchBg[beat.swatch] }}
    >
      <Container className="pt-20 md:pt-28">
        <h2 id="story-title" className={`${display} max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)]`}>
          Four stylists. One more chair. Twelve months.
        </h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">
          Here is what Business Twin showed the owner, one month at a time. Scroll, and watch the year unfold.
        </p>
      </Container>

      <Container className="grid gap-x-14 pb-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="sticky top-14 z-10 -mx-4 px-4 pt-4 sm:-mx-6 sm:px-6 lg:order-last lg:top-24 lg:mx-0 lg:h-fit lg:px-0 lg:pt-12">
          <div className="rounded-[24px] bg-white p-4 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.35)] sm:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className={`${display} text-[clamp(2rem,4.5vw,3.25rem)] tabular-nums`} aria-live="polite">
                Month {beat.month}
              </span>
              <span className="text-right text-sm text-muted">{isCash ? 'Cash in the bank' : 'Gained or lost vs not hiring'}</span>
            </div>
            <div className="mt-3">
              <PlumeChart
                key={beat.mode}
                series={isCash ? storyCash : storyTotal}
                domain={isCash ? [-3500, 13000] : [-14000, 17500]}
                height={240}
                months={beat.month}
                notes={beat.notes}
                zeroLabel={isCash ? '€0 in the bank' : 'Not hiring'}
                zeroLabelAt={isCash ? 'end' : 'start'}
              />
            </div>
            <Legend withoutHire={isCash} />
          </div>
        </div>

        <ol className="lg:pt-12">
          {beats.map((b, i) => (
            <li
              key={b.title}
              ref={register(i)}
              data-step={i}
              className={`flex min-h-[85vh] flex-col justify-end pb-[8vh] pt-10 transition-opacity duration-300 lg:justify-center lg:pb-10 ${
                i === active ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <h3 className="text-[1.65rem] font-bold leading-tight md:text-[1.9rem]">{b.title}</h3>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/75">{b.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

function Legend({ withoutHire }: { withoutHire: boolean }) {
  const items = [
    { label: 'Good case', swatch: 'bg-teal-strong h-[3px]' },
    { label: 'Normal case', swatch: 'bg-ink h-[4px]' },
    { label: 'Bad case', swatch: 'bg-coral-strong h-[3px]' },
  ]
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className={`w-5 rounded-full ${i.swatch}`} aria-hidden /> {i.label}
        </li>
      ))}
      {withoutHire && (
        <li className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dotted border-faint" aria-hidden /> Without the hire
        </li>
      )}
    </ul>
  )
}

// ── Your salon: from her story to yours ──────────────────────────────────

// Hand-drawn marker strokes behind the example values, painted in one after another the first time the sentence is seen.
const BRUSH = 'M2,8 C10,5 30,4 50,5 C70,6 88,3 98,6 C99.5,10 99,15 97.5,19 C80,21 60,19 40,20.5 C25,21.5 10,21 2.5,19 C0.5,15 1,11 2,8 Z'
const brushColors = ['#b4e9d3', '#ffc7ae', '#d6c9f7', '#bcd7f7', '#ffe08a']
const paint = {
  hidden: { clipPath: 'inset(0 100% 0 0)' },
  shown: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.55, ease: [0.77, 0, 0.175, 1] as const } },
}

/** The example sentence: its blanks are painted in, left to right, like a highlighter on paper. */
function BrushSentence({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.p
      initial={reduce ? false : 'hidden'}
      whileInView="shown"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: 0.22, delayChildren: 0.15 }}
      className="text-[clamp(1.4rem,2.6vw,2rem)] font-medium leading-[1.7]"
    >
      {children}
    </motion.p>
  )
}

/** A sample value inside the example sentence: what the owner would type. */
function Blank({ children, n }: { children: ReactNode; n: number }) {
  return (
    <span className="relative inline-block whitespace-nowrap px-1.5 font-bold">
      <motion.svg
        aria-hidden
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        variants={paint}
        className="absolute -left-1 top-[0.18em] h-[calc(100%-0.2em)] w-[calc(100%+0.5rem)]"
        style={{ rotate: n % 2 ? '1.2deg' : '-1.2deg' }}
      >
        <path d={BRUSH} fill={brushColors[n % brushColors.length]} />
      </motion.svg>
      <span className="relative">{children}</span>
    </span>
  )
}

const decisions: { name: string; swatch: Swatch; question: string; asks: string }[] = [
  { name: 'Hire', swatch: 'mint', question: 'Will a new stylist pay off, and when?', asks: 'Hours, full monthly cost, customers a month, how many are new, and the time to get fully booked.' },
  { name: 'Price', swatch: 'peach', question: 'What happens if I charge €5 more?', asks: 'The new average price, and how many visits you might lose or gain.' },
  { name: 'Marketing', swatch: 'lilac', question: 'Is a campaign worth it, even if it disappoints?', asks: 'The monthly cost, the new customers it might bring, and whether the team has time for them.' },
]

function YourSalon() {
  return (
    <section id="your-salon" className="scroll-mt-14 py-24 md:py-32" aria-labelledby="your-salon-title">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          <div>
            <h2 id="your-salon-title" className={`${display} text-[clamp(2.5rem,6vw,4.5rem)]`}>
              Now run your own salon.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              Describe one normal month. It takes about ten minutes, and you can start from a sample salon and replace what you know.
            </p>
          </div>
          <div className="lg:pt-3">
            <BrushSentence>
              We see <Blank n={0}>420</Blank> visits a month at <Blank n={1}>€42</Blank> each. The team has <Blank n={2}>560</Blank> hours with
              customers, wages are <Blank n={3}>€9,000</Blank> and there is <Blank n={4}>€6,000</Blank> in the bank.
            </BrushSentence>
            <p className="mt-3 text-sm text-muted">Example values. You type your own.</p>
          </div>
        </div>

        <h3 className="mt-24 text-2xl font-bold md:text-[1.75rem]">Then test a decision, or combine them.</h3>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {decisions.map((d) => (
            <li key={d.name} className="flex flex-col rounded-[24px] p-6 sm:p-7" style={{ backgroundColor: swatchBg[d.swatch] }}>
              <span className={`${display} text-[clamp(2.75rem,4.6vw,3.75rem)]`}>{d.name}</span>
              <span className="mt-5 text-xl font-semibold leading-snug">“{d.question}”</span>
              <span className="mt-auto pt-8 text-[15px] leading-relaxed text-ink/70">
                <span className="mb-1 block text-sm font-semibold text-ink">You enter</span>
                {d.asks}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

// ── Honest: what it is, what it is not, and why salons ───────────────────

function Honest() {
  const panels: { title: string; swatch: Swatch; items: string[] }[] = [
    {
      title: 'It is',
      swatch: 'sky',
      items: ['Your own figures, run through one model of your salon.', 'Three cases for everything you are unsure about.', 'Profit and cash, month by month, kept apart.'],
    },
    {
      title: 'It is not',
      swatch: 'peach',
      items: ['A forecast. It shows what could happen, not what will.', 'Financial advice. The decision stays yours.', 'Accounting software. No bookkeeping, no bank connection.'],
    },
  ]
  return (
    <section className="pb-24 md:pb-32" aria-labelledby="honest-title">
      <Container>
        <h2 id="honest-title" className={`${display} max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)]`}>
          Honest about what it is.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {panels.map((p) => (
            <div key={p.title} className="rounded-[24px] p-6 sm:p-8" style={{ backgroundColor: swatchBg[p.swatch] }}>
              <h3 className="text-2xl font-bold">{p.title}</h3>
              <ul className="mt-4 divide-y divide-black/10">
                {p.items.map((t) => (
                  <li key={t} className="py-4 text-lg leading-snug">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <p className="text-lg leading-relaxed">
            Your data is stored in the EU. Business Twin only asks for monthly totals, never customer names, and one action deletes your salon and
            every plan.
          </p>
          <p className="text-[15px] leading-relaxed text-muted">
            Why salons first: <strong className="font-semibold text-ink">2,890</strong> Dutch hair salons work with 3 to 10 FTE (Schippers &amp;
            Beulen, 2025, Panteia). An employee costs <strong className="font-semibold text-ink">26–40%</strong> on top of the gross salary
            (Multiplier, 2026). Personal-services firms hold a median cash buffer of just <strong className="font-semibold text-ink">21 days</strong>{' '}
            (Farrell &amp; Wheat, 2016, JPMorgan Chase Institute, US data).
          </p>
        </div>
      </Container>
    </section>
  )
}

// ── Questions ────────────────────────────────────────────────────────────

function Faq() {
  const faqs = [
    {
      q: 'Is this financial advice?',
      a: 'No. Business Twin calculates what could happen based on the numbers and estimates you enter. It does not predict the future or recommend a decision. Discuss big decisions with your accountant or adviser; a saved plan is a good basis for that conversation.',
    },
    {
      q: 'Do I need to know accounting?',
      a: 'No. You enter numbers you already know, such as customers per month, average price, staff hours and costs. Every calculated figure shows how it was worked out.',
    },
    {
      q: 'What information do I need?',
      a: 'A normal month: number of visits, average price, cost per visit, staff hours, time per visit, wages, other fixed costs and cash in the bank. Your booking system and bank app usually have these. You can start from a sample salon.',
    },
    {
      q: 'How accurate are the results?',
      a: 'As accurate as your estimates. That is why you give three values for anything uncertain and see three outcomes. The calculations themselves are exact and checked against hand-worked examples.',
    },
    {
      q: 'Can I test more than one decision?',
      a: 'Yes. Combine changes in one plan (for example a hire plus a campaign), save several plans and compare them side by side.',
    },
    {
      q: 'Who is behind Business Twin?',
      a: 'Business Twin is a research project at Fontys University of Applied Sciences (2026), developed with and for small salon owners in the Netherlands.',
    },
  ]
  return (
    <section id="faq" className="scroll-mt-14 border-t border-line py-24 md:py-32" aria-labelledby="faq-title">
      <Container>
        {/* Full width, so the title reads on one line; the questions sit below it. */}
        <h2 id="faq-title" className={`${display} text-[clamp(2.5rem,6vw,4.5rem)] sm:whitespace-nowrap`}>
          Questions owners ask.
        </h2>
        <div className="mt-10 max-w-4xl border-t-2 border-ink">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={20} className="shrink-0 transition-transform duration-200 ease-out group-open:rotate-180" aria-hidden />
              </summary>
              <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ── Close ────────────────────────────────────────────────────────────────

function Close() {
  return (
    <section className="bg-ink py-24 text-white md:py-32">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
        <h2 className={`${display} text-[clamp(2.75rem,7vw,5.5rem)]`}>
          See all three before you decide.
        </h2>
        <div>
          <p className="max-w-sm text-lg leading-relaxed text-white/70">Free to try. Set-up takes about ten minutes, starting from a sample salon.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink to="/register" variant="light" size="lg">
              Start with your salon
            </ButtonLink>
            <ButtonLink to="/login" variant="glass" size="lg">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer>
      <Container className="flex flex-wrap items-start justify-between gap-8 py-12">
        <div className="max-w-sm">
          <Logo size={26} />
          <p className="mt-4 text-sm text-muted">
            A decision simulator for small service businesses. Results are estimates based on your own figures, not a forecast and not financial
            advice.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-12 text-sm">
          <ul className="space-y-2">
            <li>
              <a href="#story" className="hover:underline">
                The story
              </a>
            </li>
            <li>
              <a href="#your-salon" className="hover:underline">
                How it works
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:underline">
                Questions
              </a>
            </li>
          </ul>
          <ul className="space-y-2">
            <li>
              <a href="/register" className="hover:underline">
                Create account
              </a>
            </li>
            <li>
              <a href="/login" className="hover:underline">
                Sign in
              </a>
            </li>
          </ul>
        </nav>
      </Container>
      <Container className="pb-8 text-xs text-muted">© 2026 Business Twin, a Fontys ICT research project</Container>
    </footer>
  )
}

/** Appears once the visitor has scrolled past the hero. Smooth scrolling comes from index.css (off for reduced motion). */
function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Tooltip label="Back to top">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0 })}
        aria-label="Back to top"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className={`fixed bottom-6 right-4 z-40 flex size-11 items-center justify-center rounded-full bg-ink text-white transition-[opacity,translate,scale] duration-200 ease-out active:scale-[0.95] sm:right-6 ${
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp size={20} aria-hidden />
      </button>
    </Tooltip>
  )
}
