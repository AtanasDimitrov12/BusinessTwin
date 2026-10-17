import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch, type Path } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import type { BaselineDto, BusinessDto, SourceLabel } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Logo } from '../../components/ui/Logo'
import { Card, ErrorNote, Eyebrow, InfoBox } from '../../components/ui/primitives'
import { SourceBadge } from '../../components/ui/SourceBadge'
import { useSaveBusiness } from '../business/business'
import { useSaveBaseline } from './baseline'
import { baselineFields, formatField, type BaselineField, type WizardStep } from './fields'

// Decimal values stay strings end to end. A comma is accepted as decimal separator and normalised to a dot.
const decimal = z.string().trim().regex(/^\d+([.,]\d{1,4})?$/, 'Enter a number, e.g. 40.50.')
const signedDecimal = z.string().trim().regex(/^-?\d+([.,]\d{1,4})?$/, 'Enter a number, e.g. 2000 or -500.')
const source = z.enum(['entered', 'estimated', 'sample'])

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the name of your salon.').max(100),
  staffCount: z.string().regex(/^\d{1,2}$/, 'Use a whole number.').refine((v) => v !== '0' && v !== '00', 'At least 1.'),
  values: z.object(
    Object.fromEntries(baselineFields.map((f) => [f.name, f.allowNegative ? signedDecimal : decimal])) as Record<BaselineField, typeof decimal>,
  ),
  sources: z.object(Object.fromEntries(baselineFields.map((f) => [f.name, source])) as Record<BaselineField, typeof source>),
})
type FormValues = z.infer<typeof schema>

const steps: { key: 'salon' | WizardStep | 'review'; title: string; intro: string }[] = [
  { key: 'salon', title: 'Your salon', intro: 'Start with the basics. You can change everything later.' },
  { key: 'customers', title: 'Customers and prices', intro: 'Think of a normal month, not your best or worst one.' },
  { key: 'time', title: 'Team time', intro: 'Staff time limits how many customers you can serve, so it is modelled separately from demand.' },
  { key: 'costs', title: 'Costs and cash', intro: 'Fixed costs stay the same however busy you are. Cash shows whether a decision could leave you short.' },
  { key: 'review', title: 'Check your figures', intro: 'This is your baseline: the starting point every decision is compared with.' },
]

function initialValues(business: BusinessDto | null, baseline: BaselineDto | null): FormValues {
  const values = {} as Record<BaselineField, string>
  const sources = {} as Record<BaselineField, SourceLabel>
  for (const f of baselineFields) {
    values[f.name] = baseline ? baseline[f.name] : f.sample
    sources[f.name] = baseline ? (baseline.sources[f.name] ?? 'entered') : 'sample'
  }
  return { name: business?.name ?? '', staffCount: business ? String(business.staffCount) : '4', values, sources }
}

/** Guided setup of business and baseline (BPMN: gather figures → enter baseline). */
export function SetupWizard({ business, baseline }: { business: BusinessDto | null; baseline: BaselineDto | null }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const saveBusiness = useSaveBusiness()
  const saveBaseline = useSaveBaseline()
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initialValues(business, baseline), mode: 'onTouched' })
  const { errors, isSubmitting } = form.formState
  const sources = useWatch({ control: form.control, name: 'sources' })
  const values = useWatch({ control: form.control, name: 'values' })
  const current = steps[step]
  const sampleCount = baselineFields.filter((f) => sources[f.name] === 'sample').length

  const fieldsOf = (key: string): Path<FormValues>[] =>
    key === 'salon' ? ['name', 'staffCount'] : baselineFields.filter((f) => f.step === key).map((f) => `values.${f.name}` as Path<FormValues>)

  const next = async () => {
    if (await form.trigger(fieldsOf(current.key))) setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const onSubmit = form.handleSubmit(async (v) => {
    await saveBusiness.mutateAsync({ name: v.name, staffCount: Number(v.staffCount) })
    const normalised = Object.fromEntries(baselineFields.map((f) => [f.name, v.values[f.name].replace(',', '.')])) as Record<BaselineField, string>
    await saveBaseline.mutateAsync({ ...normalised, sources: v.sources })
    navigate('/app')
  })

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <Logo to={baseline ? '/app' : '/'} />
          <ol className="ml-auto flex items-center gap-2 sm:gap-3" aria-label="Setup steps">
            {steps.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  aria-current={i === step ? 'step' : undefined}
                  className={`flex items-center gap-1.5 text-xs font-medium ${i === step ? 'text-navy' : i < step ? 'text-muted hover:text-navy' : 'text-faint'}`}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border text-[11px] font-bold ${
                      i === step ? 'border-navy bg-navy text-white' : i < step ? 'border-good-200 bg-good-50 text-good' : 'border-line bg-surface'
                    }`}
                  >
                    {i < step ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="hidden md:inline">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
        <Eyebrow className="mb-2 text-amber">
          Step {step + 1} of {steps.length}
        </Eyebrow>
        <h1 className="font-display text-3xl font-semibold leading-tight">{current.title}</h1>
        <p className="mb-8 mt-2 text-muted">{current.intro}</p>

        <form onSubmit={(e) => onSubmit(e).catch(() => {})} noValidate className="space-y-5">
          {current.key === 'salon' && (
            <>
              <Field label="Salon name" autoComplete="organization" {...form.register('name')} error={errors.name?.message} />
              <Field
                label="People who serve customers"
                hint="Including yourself if you work in the salon."
                inputMode="numeric"
                {...form.register('staffCount')}
                error={errors.staffCount?.message}
              />
              {!baseline && (
                <InfoBox tone="navy">
                  The next steps start with a <strong>sample salon</strong>. Replace each value with your own; until then it stays marked as a sample.
                </InfoBox>
              )}
            </>
          )}

          {baselineFields
            .filter((f) => f.step === current.key)
            .map((f) => (
              <Field
                key={f.name}
                label={f.label}
                hint={f.hint}
                prefix={f.prefix}
                suffix={f.suffix}
                inputMode="decimal"
                error={errors.values?.[f.name]?.message}
                aside={
                  sources[f.name] === 'sample' ? (
                    <SourceBadge source="sample" />
                  ) : (
                    <select
                      aria-label={`How sure are you about ${f.label}?`}
                      className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-muted"
                      {...form.register(`sources.${f.name}`)}
                    >
                      <option value="entered">I know this</option>
                      <option value="estimated">My estimate</option>
                    </select>
                  )
                }
                {...form.register(`values.${f.name}`, {
                  onChange: () => {
                    if (form.getValues(`sources.${f.name}`) === 'sample') form.setValue(`sources.${f.name}`, 'entered')
                  },
                })}
              />
            ))}

          {current.key === 'review' && (
            <>
              <Card className="divide-y divide-line-soft">
                <ReviewRow label="Salon" value={form.getValues('name')} />
                <ReviewRow label="People serving customers" value={form.getValues('staffCount')} />
                {baselineFields.map((f) => (
                  <ReviewRow
                    key={f.name}
                    label={f.label}
                    value={signedDecimal.safeParse(values[f.name]).success ? formatField(f, values[f.name].trim().replace(',', '.')) : values[f.name]}
                    badge={<SourceBadge source={sources[f.name]} />}
                  />
                ))}
              </Card>
              {sampleCount > 0 && (
                <InfoBox tone="amber">
                  {sampleCount} value{sampleCount > 1 ? 's are' : ' is'} still from the sample salon. You can continue and replace them later.
                </InfoBox>
              )}
            </>
          )}

          <ErrorNote error={saveBusiness.error ?? saveBaseline.error} />

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={() => (step > 0 ? setStep(step - 1) : navigate(baseline ? '/app' : '/'))}>
              <ArrowLeft size={16} /> {step > 0 ? 'Back' : baseline ? 'Cancel' : 'Home'}
            </Button>
            {current.key === 'review' ? (
              <Button type="submit" disabled={isSubmitting}>
                Save and see my salon <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={() => next().catch(() => {})}>
                Continue <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}

function ReviewRow({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-2 font-mono text-ink">
        {value}
        {badge}
      </span>
    </div>
  )
}
