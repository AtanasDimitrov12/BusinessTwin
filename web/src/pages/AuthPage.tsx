import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Logo } from '../components/ui/Logo'
import { ErrorNote } from '../components/ui/primitives'
import { PlumeChart } from '../components/charts/PlumeChart'
import { useRegister, useSignIn } from '../features/auth/auth'
import { formatEuroDelta } from '../lib/format'
import { runningTotal } from './landing/story'

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(10, 'Use at least 10 characters.'),
})
type FormValues = z.infer<typeof schema>

export function AuthPage({ mode }: { mode: 'signIn' | 'register' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const signIn = useSignIn()
  const register = useRegister()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const { errors, isSubmitting } = form.formState
  const error = register.error ?? signIn.error
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const onSubmit = form.handleSubmit(async (values) => {
    if (mode === 'register') await register.mutateAsync(values)
    await signIn.mutateAsync(values)
    navigate(from, { replace: true })
  })

  return (
    <div className="flex min-h-dvh bg-surface">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:flex-[3] lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <Logo size={42} />
          <h1 className="mt-14 font-display font-extrabold font-stretch-[72%] leading-[0.95] tracking-[-0.015em] text-[3.25rem]">
            {mode === 'signIn' ? 'Welcome back' : 'Test your first decision'}
          </h1>
          <p className="mt-3 text-[17px] text-muted">
            {mode === 'signIn'
              ? 'Sign in to see your business and saved plans.'
              : 'Create a free account. Setting up your business takes about ten minutes, and you can start from a sample.'}
          </p>

          <form onSubmit={(e) => onSubmit(e).catch(() => {})} noValidate className="mt-8 space-y-4">
            <Field label="Email" type="email" autoComplete="email" {...form.register('email')} error={errors.email?.message} />
            <Field
              label="Password"
              type="password"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              hint={mode === 'register' ? 'At least 10 characters, with an uppercase letter, a number and a symbol.' : undefined}
              {...form.register('password')}
              error={errors.password?.message}
            />
            <ErrorNote error={error} />
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted">
            {mode === 'signIn' ? (
              <>
                New here?{' '}
                <Link to="/register" state={location.state} className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-teal">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" state={location.state} className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-teal">
                  Sign in
                </Link>
              </>
            )}
          </p>
          <p className="mt-10 border-t border-black/[0.06] pt-6 text-xs leading-relaxed text-muted">
            <strong>What this is:</strong> a tool for exploring possible outcomes, not a forecast or financial advice. Your data is stored in the EU
            and you can delete it at any time.
          </p>
        </div>
      </div>
      <ExamplePanel />
    </div>
  )
}

/** Right-hand panel: the landing page's example, so signing in feels like the same product. Real engine output. */
function ExamplePanel() {
  const euro = (n: number) => formatEuroDelta(String(n))
  return (
    <div className="hidden min-w-[380px] flex-col justify-center bg-swatch-mint px-10 py-12 lg:flex lg:flex-[2]">
      <p className="text-lg font-bold">Example: a salon of four hires a fifth employee</p>
      <p className="mt-1 text-sm text-ink/70">Money gained or lost compared with not hiring, in a bad, a normal and a good case.</p>
      <div className="mt-6 rounded-[24px] bg-surface p-5 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.3)]">
        <PlumeChart series={runningTotal} height={230} endLabels formatEnd={euro} zeroLabel="Not hiring" drawIn />
      </div>
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/70">
        Same decision, three outcomes. Set up your business and test your own in about ten minutes.
      </p>
    </div>
  )
}
