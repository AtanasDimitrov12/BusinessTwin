import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSaveBusiness } from './business'

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the name of your salon.').max(100),
  staffCount: z.coerce.number<string>().int('Use a whole number.').min(1).max(50),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

/** First step: the salon itself. One business per owner in the PoC. */
export function BusinessForm() {
  const save = useSaveBusiness()
  const form = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) })
  const { errors, isSubmitting } = form.formState

  return (
    <section className="card narrow">
      <h1>Your salon</h1>
      <p className="muted">Start with the basics. You can change them later.</p>
      <form onSubmit={form.handleSubmit((values) => save.mutateAsync(values).catch(() => {}))} noValidate>
        <label>
          Salon name
          <input {...form.register('name')} />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </label>
        <label>
          Number of staff
          <input type="number" inputMode="numeric" min={1} max={50} {...form.register('staffCount')} />
          {errors.staffCount && <span className="field-error">{errors.staffCount.message}</span>}
        </label>
        {save.error && <p className="form-error">{save.error.message}</p>}
        <button type="submit" disabled={isSubmitting}>
          Continue
        </button>
      </form>
    </section>
  )
}
