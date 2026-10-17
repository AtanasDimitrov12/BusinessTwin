import { Home, Info, Lightbulb, LogOut, Menu, Settings, SquareStack, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSignOut } from '../features/auth/auth'
import { useBusiness } from '../features/business/business'
import { useScenarios } from '../features/scenarios/scenarios'
import { Logo } from './ui/Logo'

const nav = [
  { to: '/app', label: 'My salon', icon: Home, end: true },
  { to: '/app/decide', label: 'Test a decision', icon: Lightbulb, end: false },
  { to: '/app/plans', label: 'Plans & compare', icon: SquareStack, end: false },
  { to: '/app/assumptions', label: 'Assumptions', icon: Info, end: false },
]

export function AppShell() {
  const [open, setOpen] = useState(false)
  const business = useBusiness()

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Logo to="/app" />
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-muted hover:bg-line-soft" aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line p-5">
          <div className="min-w-0">
            <Logo to="/app" />
            <div className="mt-2 truncate pl-0.5 text-xs text-muted">{business.data?.name}</div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
        <SidebarFooter />
      </aside>

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">
          <Outlet />
        </main>
        <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted sm:px-6 lg:px-8">
          Business Twin shows estimates based on your own figures and assumptions. It is not a forecast and not financial advice.
        </footer>
      </div>
    </div>
  )
}

function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const plans = useScenarios()
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-navy-50 font-semibold text-navy' : 'text-muted hover:bg-canvas hover:text-ink'
            }`
          }
        >
          <item.icon size={17} aria-hidden />
          {item.label}
          {item.to === '/app/plans' && !!plans.data?.length && (
            <span className="ml-auto rounded-full bg-amber-50 px-2 text-xs font-semibold text-amber-dark">{plans.data.length}</span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarFooter() {
  const navigate = useNavigate()
  const signOut = useSignOut()
  return (
    <div className="space-y-1 border-t border-line p-3">
      <NavLink to="/app/setup" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-ink">
        <Settings size={16} aria-hidden /> Salon figures
      </NavLink>
      <button
        type="button"
        onClick={() => signOut.mutate(undefined, { onSuccess: () => navigate('/') })}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted hover:bg-canvas hover:text-ink"
      >
        <LogOut size={16} aria-hidden /> Sign out
      </button>
    </div>
  )
}
