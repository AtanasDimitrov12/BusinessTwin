import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Logo } from '../components/ui/Logo'
import { ErrorNote } from '../components/ui/primitives'
import { useRegister, useSignIn } from '../features/auth/auth'

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
    <div className="flex min-h-screen bg-canvas">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:flex-[3] lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <Logo size={42} />
          <h1 className="mt-12 font-display text-4xl font-semibold leading-tight">
            {mode === 'signIn' ? 'Welcome back' : 'Test your first decision'}
          </h1>
          <p className="mt-3 text-muted">
            {mode === 'signIn'
              ? 'Sign in to see your salon and saved plans.'
              : 'Create a free account. Setting up your salon takes about ten minutes, and you can start from a sample.'}
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
              {mode === 'signIn' ? 'Sign in' : 'Create account'} <ArrowRight size={18} />
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted">
            {mode === 'signIn' ? (
              <>
                New here?{' '}
                <Link to="/register" state={location.state} className="font-semibold text-navy hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" state={location.state} className="font-semibold text-navy hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
          <p className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
            <strong>What this is:</strong> a tool for exploring possible outcomes, not a forecast or financial advice. Your data is stored in the EU
            and you can delete it at any time.
          </p>
        </div>
      </div>
      <ExamplePanel />
    </div>
  )
}

const exampleNodes = [
  { label: 'Customer demand', value: '420', sub: 'visits wanted / month', kind: 'input' },
  { label: 'Team capacity', value: '448', sub: 'visits possible / month', kind: 'input' },
  { label: 'Customers served', value: '420', sub: 'the smaller of the two', kind: 'derived' },
  { label: 'Sales', value: '€17,640', sub: '420 × €42', kind: 'derived' },
  { label: 'Cost of services', value: '€2,520', sub: '420 × €6', kind: 'derived' },
  { label: 'Contribution', value: '€15,120', sub: 'sales − cost of services', kind: 'derived' },
  { label: 'Fixed costs', value: '€12,500', sub: 'wages, rent, other', kind: 'input' },
  { label: 'Monthly result', value: '€2,620', sub: 'contribution − fixed costs', kind: 'result' },
] as const

/** Right-hand panel from the prototype: how the numbers connect, for a sample salon. */
function ExamplePanel() {
  return (
    <div className="hidden min-w-[360px] flex-col justify-center bg-navy px-10 py-12 lg:flex lg:flex-[2]">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Sample salon · a normal month</div>
      <div className="mb-6 mt-1 text-sm text-white/75">How the numbers connect</div>
      <div className="space-y-1.5">
        {exampleNodes.map((n) => (
          <div
            key={n.label}
            className={`flex items-center justify-between gap-4 rounded-xl px-4 py-2.5 ${
              n.kind === 'result' ? 'mt-2 bg-white shadow-lg' : n.kind === 'derived' ? 'border border-white/15 bg-white/10' : 'border border-white/10 bg-white/5'
            }`}
          >
            <div className="min-w-0">
              <div className={`truncate text-[10px] font-bold uppercase tracking-[0.12em] ${n.kind === 'result' ? 'text-muted' : 'text-white/60'}`}>{n.label}</div>
              <div className={`truncate text-[11px] ${n.kind === 'result' ? 'text-muted' : 'text-white/45'}`}>{n.sub}</div>
            </div>
            <div className={`shrink-0 font-mono ${n.kind === 'result' ? 'text-xl text-navy' : 'text-base text-white'}`}>{n.value}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-relaxed text-white/55">
        Change one input and you see exactly which numbers move, and why.
      </p>
    </div>
  )
}
