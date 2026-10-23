import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Calculator,
  CalendarClock,
  Check,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  Users,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { ButtonLink } from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonClass'
import { Logo } from '../components/ui/Logo'
import { Badge, Eyebrow } from '../components/ui/primitives'
import { SourceBadge } from '../components/ui/SourceBadge'
import { changeMeta } from '../features/scenarios/changeForm'

// Example figures on this page are real scenario-engine output for labelled sample salons, pasted in as text.
// Nothing here is calculated in the browser.

export function LandingPage() {
  return (
    <div className="bg-canvas text-ink">
      <SiteNav />
      <main>
        <Hero />
        <FactStrip />
        <Problem />
        <HowItWorks />
        <Decisions />
        <Features />
        <Story />
        <Trust />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
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
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0 })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed bottom-6 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white shadow-lift transition-all duration-200 hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:right-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp size={20} aria-hidden />
    </button>
  )
}

function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
}

function SectionTitle({ eyebrow, title, sub, center = false }: { eyebrow: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <div className={`mb-12 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <Eyebrow className="mb-3 text-amber">{eyebrow}</Eyebrow>
      <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-[2.6rem]">{title}</h2>
      {sub && <p className="mt-4 text-lg leading-relaxed text-muted">{sub}</p>}
    </div>
  )
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label="Page sections">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#decisions" className="hover:text-ink">Decisions</a>
          <a href="#why" className="hover:text-ink">Why it's different</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink to="/login" variant="ghost" size="sm">Sign in</ButtonLink>
          <ButtonLink to="/register" size="sm">Start free</ButtonLink>
        </div>
      </Container>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-amber-50 blur-3xl"
      />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-[-10%] h-[420px] w-[420px] rounded-full bg-navy-50 blur-3xl" />
      <Container className="relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-rise">
          <Badge tone="amber" className="mb-6">
            <Sparkles size={12} /> For salons and barbershops with 3–10 staff
          </Badge>
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Before you decide, see what <em className="font-normal text-amber">might</em> happen.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Thinking of hiring a stylist, raising prices or spending more on marketing? Business Twin shows how it could change your customers, staff
            time, costs and cash, month by month, in a pessimistic, expected and optimistic case.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/register" size="lg">
              Test your first decision <ArrowRight size={18} />
            </ButtonLink>
            <a href="#how" className={buttonClass('secondary', 'lg')}>
              See how it works
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {['Free to try', 'Data stored in the EU', 'No accounting knowledge needed'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check size={16} className="text-good" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroVisual />
      </Container>
    </section>
  )
}

/**
 * Product preview built from real UI pieces. The figures are real engine output for the sample salon
 * (420 visits at €42, hire 120 h at €3,200 + €400/month campaign, 12 months), not invented marketing numbers.
 */
function HeroVisual() {
  const months = [
    { m: 1, v: '−€2,002', h: 100 },
    { m: 2, v: '−€1,483', h: 74 },
    { m: 3, v: '−€965', h: 48 },
    { m: 4, v: '−€446', h: 22 },
    { m: 5, v: '−€446', h: 22 },
    { m: 6, v: '−€446', h: 22 },
  ]
  return (
    <div className="relative mb-10 mt-8 animate-rise [animation-delay:120ms] lg:mb-0" aria-label="Example result for a sample salon">
      <div className="rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-muted">Sample salon</div>
            <div className="font-display text-lg font-semibold">Hire a stylist + local campaign</div>
          </div>
          <Badge tone="navy">12 months</Badge>
        </div>
        <div className="rounded-2xl border border-bad-200 bg-bad-50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Expected case</div>
          <div className="mt-1 font-mono text-3xl text-bad">−€8,467</div>
          <div className="text-xs font-semibold text-bad">less over the year than not doing it</div>
          <div className="mt-3">
            <div className="relative h-2 rounded-full bg-white">
              <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-bad via-navy to-good opacity-75" />
              <div className="absolute -top-1 left-[64%] size-4 -translate-x-1/2 rounded-full border-2 border-white bg-navy shadow" />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted">
              <span>Pessimistic −€33,102</span>
              <span>Optimistic +€5,270</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold text-muted">Each month vs today (expected)</div>
          <div className="flex h-20 items-start gap-2 border-t border-line pt-px">
            {months.map((b) => (
              <div key={b.m} className="flex h-full flex-1 items-start" title={`Month ${b.m}: ${b.v}`}>
                <div className="w-full rounded-b-md bg-bad/75" style={{ height: `${b.h}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-2 font-mono text-[10px] text-faint">
            {months.map((b) => (
              <span key={b.m} className="flex-1 text-center">M{b.m}</span>
            ))}
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-dark">
          It only pays off if most of the new stylist’s customers are <strong>new</strong> to the salon. Worth knowing before you sign a contract.
        </p>
      </div>
      <div className="absolute -bottom-12 -left-3 rotate-[-2deg] rounded-2xl border border-line bg-surface px-4 py-2.5 shadow-lift sm:-left-8">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">To break even</div>
        <div className="text-base font-semibold text-navy">
          <span className="font-mono">100</span> new visits a month
        </div>
      </div>
      <div className="absolute -top-9 right-4 rotate-[2deg] rounded-2xl border border-good-200 bg-surface px-4 py-2.5 shadow-lift sm:-right-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Optimistic case</div>
        <div className="text-base font-semibold text-good-dark">Monthly result catches up in month 3</div>
      </div>
    </div>
  )
}

function FactStrip() {
  return (
    <section className="border-y border-line bg-surface">
      <Container className="grid gap-8 py-10 text-center sm:grid-cols-3">
        <Fact value="2,890" label="Dutch hair salons work with 3 to 10 FTE" />
        <Fact value="26–40%" label="employer costs on top of a gross salary in NL" />
        <Fact value="21 days" label="median cash buffer of personal-services firms (US data)" />
      </Container>
      <Container className="pb-6 text-center text-[11px] text-faint">
        Sources: Schippers &amp; Beulen (2025), Panteia; Multiplier (2026); Farrell &amp; Wheat (2016), JPMorgan Chase Institute.
      </Container>
    </section>
  )
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-4xl font-semibold text-navy">{value}</div>
      <div className="mx-auto mt-1 max-w-[16rem] text-sm text-muted">{label}</div>
    </div>
  )
}

function Problem() {
  const tools = [
    { icon: CalendarClock, title: 'Booking software', text: 'shows last month’s bookings and income.' },
    { icon: BookOpen, title: 'Your accountant', text: 'explains the results after the year is over.' },
    { icon: FileSpreadsheet, title: 'A spreadsheet', text: 'needs you to build every formula yourself.' },
    { icon: Calculator, title: 'Online calculators', text: 'answer one question, one at a time.' },
  ]
  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionTitle
          eyebrow="The problem"
          title="Your tools show the past. Your decisions are about the future."
          sub="For a salon of five, one hire changes the whole cost base. Yet no tool links customers, staff time and cash for the decision in front of you."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t) => (
            <div key={t.title} className="rounded-2xl border border-line bg-surface p-5">
              <t.icon size={20} className="text-muted" aria-hidden />
              <div className="mt-3 font-semibold">{t.title}</div>
              <p className="mt-1 text-sm text-muted">{t.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-lg">
          <strong className="font-semibold text-navy">Business Twin connects them</strong>: one model of your salon where demand, staff time, costs and
          cash move together when you change something.
        </p>
      </Container>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      title: 'Describe a normal month',
      text: 'Customers, prices, staff hours, costs and cash. Start from a sample salon and replace the numbers you know. About ten minutes.',
      visual: (
        <div className="space-y-2 text-xs">
          {[
            ['Customers per month', '420', 'entered'],
            ['Average price', '€42.00', 'entered'],
            ['Time per visit', '1.25 h', 'estimated'],
          ].map(([l, v, s]) => (
            <div key={l} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
              <span className="text-muted">{l}</span>
              <span className="flex items-center gap-2 font-mono">
                {v} <SourceBadge source={s as 'entered' | 'estimated'} />
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Add a decision',
      text: 'Hire, price or marketing, alone or combined. For anything uncertain you give three guesses: pessimistic, expected and optimistic.',
      visual: (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            ['Pessimistic', '20%', 'bg-bad'],
            ['Expected', '35%', 'bg-navy'],
            ['Optimistic', '50%', 'bg-good'],
          ].map(([l, v, c]) => (
            <div key={l} className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className={`h-1 ${c}`} />
              <div className="px-2 pt-1.5 text-[9px] font-bold uppercase tracking-wider text-muted">{l}</div>
              <div className="pb-2 font-mono text-base">{v}</div>
            </div>
          ))}
          <div className="col-span-3 text-left text-[11px] text-muted">…of the new stylist’s customers are new to the salon</div>
        </div>
      ),
    },
    {
      title: 'Compare three cases',
      text: 'See sales, costs, result and cash for every month ahead, when the decision catches up, whether cash runs short, and why.',
      visual: (
        <div className="flex h-24 items-end gap-3 px-2">
          {[
            ['Today', 'h-[55%]', 'bg-navy'],
            ['Pess.', 'h-[35%]', 'bg-bad'],
            ['Exp.', 'h-[68%]', 'bg-good'],
            ['Opt.', 'h-[90%]', 'bg-good'],
          ].map(([l, h, c]) => (
            <div key={l} className="flex h-full flex-1 flex-col justify-end text-center">
              <div className={`${h} ${c} rounded-t-md opacity-85`} />
              <div className="mt-1 text-[10px] text-muted">{l}</div>
            </div>
          ))}
        </div>
      ),
    },
  ]
  return (
    <section id="how" className="scroll-mt-20 bg-surface py-20 md:py-28">
      <Container>
        <SectionTitle eyebrow="How it works" title="Three steps from a hunch to a clear picture" center />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-col rounded-3xl border border-line bg-canvas p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-navy font-mono text-sm text-white">{i + 1}</span>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.text}</p>
              <div className="mt-6 rounded-2xl bg-line-soft/70 p-4">{s.visual}</div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

function Decisions() {
  const questions = {
    hire: {
      q: 'Will a new stylist pay off, and when?',
      asks: ['Working hours and full monthly cost', 'Customers per month and how many are new', 'How long until they are fully booked'],
    },
    price: {
      q: 'What happens if I charge €5 more?',
      asks: ['The new average price', 'How many visits you might lose (or gain)', 'When the new price starts'],
    },
    marketing: {
      q: 'Is the campaign worth it, even if it disappoints?',
      asks: ['Monthly campaign cost', 'New customers it might bring', 'Whether your team has time to serve them'],
    },
  } as const
  return (
    <section id="decisions" className="scroll-mt-20 py-20 md:py-28">
      <Container>
        <SectionTitle
          eyebrow="Decisions you can test"
          title="The three decisions that change a salon most"
          sub="Test one, or combine them, e.g. hire a stylist and run a campaign to fill the new chair."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {(Object.keys(questions) as (keyof typeof questions)[]).map((k) => {
            const m = changeMeta[k]
            return (
              <article key={k} className="group rounded-3xl border border-line bg-surface p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber transition-colors group-hover:bg-navy group-hover:text-white">
                  <m.icon size={22} aria-hidden />
                </span>
                <div className="mt-5 text-xs font-bold uppercase tracking-wider text-muted">{m.title}</div>
                <h3 className="mt-1 font-display text-xl font-semibold leading-snug">“{questions[k].q}”</h3>
                <ul className="mt-5 space-y-2 border-t border-line pt-5 text-sm text-muted">
                  {questions[k].asks.map((a) => (
                    <li key={a} className="flex gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-good" aria-hidden /> {a}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

function Features() {
  return (
    <section id="why" className="scroll-mt-20 bg-surface py-20 md:py-28">
      <Container>
        <SectionTitle
          eyebrow="Why it's different"
          title="Built around how a salon actually works"
          sub="Not a finance tool with a salon skin: staff time, new versus moved customers and cash are part of the model from the start."
        />
        <div className="grid auto-rows-[minmax(190px,auto)] gap-4 md:grid-cols-6">
          <Tile className="md:col-span-4 md:row-span-2 bg-navy text-white" title="Three cases, not one guess" text="Your estimates are uncertain, and that is fine. Every uncertain number gets a pessimistic, expected and optimistic value, and you see all three outcomes side by side." dark>
            <div className="mt-8 flex h-40 items-end gap-4">
              {[
                ['Without', '50%', 'bg-white/30'],
                ['Pessimistic', '28%', 'bg-[#e8826f]'],
                ['Expected', '66%', 'bg-white'],
                ['Optimistic', '92%', 'bg-[#8fd1aa]'],
              ].map(([l, h, c]) => (
                <div key={l} className="flex h-full flex-1 flex-col justify-end text-center">
                  <div className={`rounded-t-lg ${c}`} style={{ height: h }} />
                  <div className="mt-2 text-xs text-white/70">{l}</div>
                </div>
              ))}
            </div>
          </Tile>
          <Tile className="md:col-span-2" icon={AlertTriangle} title="A cash warning before it happens" text="Wages start in month one, customers come gradually. Every month where cash drops below zero is flagged." />
          <Tile className="md:col-span-2" icon={Users} title="New or moved customers?" text="A new stylist’s regulars may simply move from colleagues. Only new customers add sales, and you decide the share." />
          <Tile className="md:col-span-2" icon={Scale} title="Demand and staff time, separately" text="Marketing brings customers, not hands. You see unused capacity, or demand your team cannot serve." />
          <Tile className="md:col-span-2" icon={Tags} title="Every number labelled" text="Entered, estimated, sample or calculated: you always know where a figure comes from.">
            <div className="mt-4 flex flex-wrap gap-1.5">
              <SourceBadge source="entered" />
              <SourceBadge source="estimated" />
              <SourceBadge source="sample" />
              <SourceBadge source="calculated" />
            </div>
          </Tile>
          <Tile className="md:col-span-2" icon={Eye} title="See why, not just what" text="Each result is split into its causes: extra visits, price, wages, marketing, so you can question it." />
        </div>
      </Container>
    </section>
  )
}

function Tile({
  title,
  text,
  icon: Icon,
  className = '',
  dark = false,
  children,
}: {
  title: string
  text: string
  icon?: typeof Users
  className?: string
  dark?: boolean
  children?: ReactNode
}) {
  return (
    <div className={`rounded-3xl border p-6 ${dark ? 'border-navy' : 'border-line bg-canvas'} ${className}`}>
      {Icon && <Icon size={22} className="text-amber" aria-hidden />}
      <h3 className={`font-display font-semibold ${dark ? 'text-2xl md:text-3xl' : 'mt-3 text-lg'}`}>{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${dark ? 'max-w-lg text-white/75' : 'text-muted'}`}>{text}</p>
      {children}
    </div>
  )
}

function Story() {
  return (
    <section className="py-20 md:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Eyebrow className="mb-3 text-amber">The question that started it</Eyebrow>
          <blockquote className="font-display text-2xl leading-snug md:text-3xl">
            “Four stylists see about 100 customers each. I hire a fifth. Wages start in month one, but she sees maybe 50 customers at first, and
            some of those just move from colleagues. <span className="text-amber">Does it pay off, when, and does cash run short first?</span>”
          </blockquote>
          <p className="mt-6 text-muted">
            Business Twin answers exactly this kind of question, with your own numbers and your own uncertainty.
          </p>
          <ButtonLink to="/register" className="mt-8">
            Try it with your salon <ArrowRight size={16} />
          </ButtonLink>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-semibold">Running total vs not hiring</div>
            <Badge tone="neutral">Sample salon</Badge>
          </div>
          <p className="mb-4 text-xs text-muted">
            4 stylists, 400 visits at €30. The new stylist costs €2,400 a month and grows to 150 appointments in five months; 60% are new to the
            salon.
          </p>
          <ol className="space-y-2">
            {[
              ['Month 1', '−€1,914', 40],
              ['Month 2', '−€3,342', 71],
              ['Month 3', '−€4,284', 90],
              ['Month 4', '−€4,740', 100],
              ['Month 5', '−€4,710', 99],
              ['Month 6', '−€4,680', 99],
            ].map(([m, v, w]) => (
              <li key={m as string} className="grid grid-cols-[4.5rem_1fr_5rem] items-center gap-3 text-sm">
                <span className="text-muted">{m}</span>
                <span className="h-2.5 rounded-full bg-line-soft">
                  <span className="block h-full rounded-full bg-bad/70" style={{ width: `${w}%` }} />
                </span>
                <span className="text-right font-mono text-bad">{v}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-dark">
            The monthly result catches up in <strong>month 5</strong>, but the salon is still <strong>€4,680 behind</strong> after six months. Both
            facts matter for the decision.
          </p>
        </div>
      </Container>
    </section>
  )
}

function Trust() {
  const items = [
    { icon: Lock, title: 'Your data stays in the EU', text: 'Hosted in an EU region, with sign-in handled by proven, standard security components.' },
    { icon: ShieldCheck, title: 'Only what the model needs', text: 'Monthly totals, no customer names, no bank connection.' },
    { icon: Trash2, title: 'Delete it any time', text: 'Remove your salon and every plan with one action.' },
    { icon: Scale, title: 'Estimates, not advice', text: 'Business Twin supports your judgement. It never tells you what to do.' },
  ]
  return (
    <section className="bg-surface py-20 md:py-24">
      <Container>
        <SectionTitle eyebrow="Trust" title="Honest numbers, handled with care" center />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => (
            <div key={i.title} className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-navy-50 text-navy">
                <i.icon size={22} aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{i.title}</h3>
              <p className="mt-1 text-sm text-muted">{i.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

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
    <section id="faq" className="scroll-mt-20 py-20 md:py-28">
      <Container className="max-w-3xl">
        <SectionTitle eyebrow="FAQ" title="Questions owners ask" center />
        <div className="divide-y divide-line rounded-3xl border border-line bg-surface">
          {faqs.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-navy px-6 py-16 text-center text-white sm:px-12">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-amber/30 blur-3xl" />
        <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight md:text-4xl">
          Your next decision deserves more than a gut feeling.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/75">Set up your salon in about ten minutes and test your first decision today.</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/register" variant="light" size="lg">
            Start free <ArrowRight size={18} />
          </ButtonLink>
          <ButtonLink to="/login" size="lg" className="border-white/30 bg-transparent hover:bg-white/10">
            Sign in
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <Container className="grid gap-8 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">
            A decision simulator for small service businesses. Results are estimates based on your own figures, not a forecast and not financial
            advice.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold">Product</div>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><a href="#how" className="hover:text-ink">How it works</a></li>
            <li><a href="#decisions" className="hover:text-ink">Decisions</a></li>
            <li><a href="#faq" className="hover:text-ink">FAQ</a></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold">Account</div>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><a href="/register" className="hover:text-ink">Create account</a></li>
            <li><a href="/login" className="hover:text-ink">Sign in</a></li>
          </ul>
        </div>
      </Container>
      <Container className="border-t border-line py-6 text-xs text-muted">© 2026 Business Twin · Fontys ICT research project</Container>
    </footer>
  )
}
