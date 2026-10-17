import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import type { BaselineDto, BaselineInput, SourceLabel } from '../../api/client'
import { SourceBadge } from '../../components/SourceBadge'
import { useSaveBaseline } from './baseline'
import { baselineFields, type BaselineField } from './fields'

// Decimal values stay strings end to end. A comma is accepted as decimal separator and normalised to a dot.
const decimal = z.string().trim().regex(/^\d+([.,]\d{1,4})?$/, 'Enter a number, e.g. 40.50.')
const signedDecimal = z.string().trim().regex(/^-?\d+([.,]\d{1,4})?$/, 'Enter a number, e.g. 2000 or -500.')
const source = z.enum(['entered', 'estimated', 'sample'])

const schema = z.object({
  values: z.object(
    Object.fromEntries(baselineFields.map((f) => [f.name, f.allowNegative ? signedDecimal : decimal])) as Record<
      BaselineField,
      typeof decimal
    >,
  ),
  sources: z.object(Object.fromEntries(baselineFields.map((f) => [f.name, source])) as Record<BaselineField, typeof source>),
})
type FormValues = z.infer<typeof schema>

function initialValues(existing: BaselineDto | null): FormValues {
  const values = {} as Record<BaselineField, string>
  const sources = {} as Record<BaselineField, SourceLabel>
  for (const f of baselineFields) {
    values[f.name] = existing ? existing[f.name] : f.sample
    sources[f.name] = existing ? (existing.sources[f.name] ?? 'entered') : 'sample'
  }
  return { values, sources }
}

/** Today's monthly picture. Starts from a sample salon; every sample stays marked until replaced. */
export function BaselineForm({ existing }: { existing: BaselineDto | null }) {
  const navigate = useNavigate()
  const save = useSaveBaseline()
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initialValues(existing) })
  const { errors, isSubmitting } = form.formState
  const sources = useWatch({ control: form.control, name: 'sources' })

  const onSubmit = form.handleSubmit(async ({ values, sources }) => {
    const normalised = Object.fromEntries(baselineFields.map((f) => [f.name, values[f.name].replace(',', '.')]))
    const body: BaselineInput = { ...(normalised as Record<BaselineField, string>), sources }
    await save.mutateAsync(body)
    navigate('/')
  })

  return (
    <section className="card">
      <h1>Your salon today</h1>
      <p className="muted">
        Enter a normal month. Values marked <SourceBadge source="sample" /> come from a sample salon: replace them with
        your own figures. Mark a value as estimated when you are not sure.
      </p>
      <form onSubmit={(e) => onSubmit(e).catch(() => {})} noValidate className="baseline-form">
        {baselineFields.map((f) => (
          <div key={f.name} className="field-row">
            <label htmlFor={f.name}>
              {f.label} <span className="unit">({f.unit})</span>
              <span className="hint">{f.hint}</span>
            </label>
            <input
              id={f.name}
              inputMode="decimal"
              {...form.register(`values.${f.name}`, {
                onChange: () => {
                  if (form.getValues(`sources.${f.name}`) === 'sample') form.setValue(`sources.${f.name}`, 'entered')
                },
              })}
            />
            {sources[f.name] === 'sample' ? (
              <SourceBadge source="sample" />
            ) : (
              <select aria-label={`Source of ${f.label}`} {...form.register(`sources.${f.name}`)}>
                <option value="entered">Entered</option>
                <option value="estimated">Estimated</option>
              </select>
            )}
            {errors.values?.[f.name] && <span className="field-error">{errors.values[f.name]?.message}</span>}
          </div>
        ))}
        {save.error && <p className="form-error">{save.error.message}</p>}
        <div className="actions">
          {existing && (
            <button type="button" className="secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting}>
            Save baseline
          </button>
        </div>
      </form>
    </section>
  )
}
