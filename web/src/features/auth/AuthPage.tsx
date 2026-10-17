import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRegister, useSignIn } from './auth'

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(10, 'Use at least 10 characters.'),
})
type FormValues = z.infer<typeof schema>

export function AuthPage() {
  const [mode, setMode] = useState<'signIn' | 'register'>('signIn')
  const signIn = useSignIn()
  const register = useRegister()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const { errors, isSubmitting } = form.formState
  const error = signIn.error ?? register.error

  const onSubmit = form.handleSubmit(async (values) => {
    if (mode === 'register') await register.mutateAsync(values)
    await signIn.mutateAsync(values)
  })

  return (
    <section className="card narrow">
      <h1>{mode === 'signIn' ? 'Sign in' : 'Create an account'}</h1>
      <p className="muted">Test a decision for your salon before you make it.</p>
      <form onSubmit={(e) => onSubmit(e).catch(() => {})} noValidate>
        <label>
          Email
          <input type="email" autoComplete="email" {...form.register('email')} />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            {...form.register('password')}
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>
        {error && <p className="form-error">{error.message}</p>}
        <button type="submit" disabled={isSubmitting}>
          {mode === 'signIn' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <button type="button" className="link" onClick={() => setMode(mode === 'signIn' ? 'register' : 'signIn')}>
        {mode === 'signIn' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
      </button>
    </section>
  )
}
