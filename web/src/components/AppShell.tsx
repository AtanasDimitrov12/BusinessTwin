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
    <div className="min-h-dvh bg-canvas lg:flex">
      {/* Mobile top bar */}
      <div className="material sticky top-0 z-30 flex items-center justify-between border-b border-black/[0.06] px-4 py-2.5 lg:hidden">
        <Logo to="/app" />
        <button type="button" onClick={() => setOpen(true)} className="rounded-full p-2 text-ink transition-[background-color,translate,scale] duration-150 ease-out hover:bg-black/[0.05] active:scale-[0.95]" aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>

      {/* Always mounted so it can fade; it only takes clicks while the menu is open. */}
      <div
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 ease-drawer lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 material flex w-64 flex-col border-r border-black/[0.06] transition-transform duration-300 ease-drawer lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 lg:transition-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <div className="min-w-0">
            <Logo to="/app" />
            <div className="mt-2.5 truncate pl-0.5 text-[13px] font-medium text-muted">{business.data?.name}</div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-muted transition-transform duration-150 ease-out active:scale-[0.95] lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
        <SidebarFooter />
      </aside>

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-10">
          <Outlet />
        </main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-faint sm:px-6 lg:px-10">
          Business Twin shows estimates based on your own figures and assumptions. It is not a forecast and not financial advice.
        </footer>
      </div>
    </div>
  )
}

function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const plans = useScenarios()
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-3 py-2" aria-label="Main">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] transition-colors ${
              isActive ? 'bg-black/[0.06] font-semibold text-ink' : 'text-ink/80 hover:bg-black/[0.035] hover:text-ink'
            }`
          }
        >
          <item.icon size={18} className="text-muted group-aria-[current=page]:text-accent" aria-hidden />
          {item.label}
          {item.to === '/app/plans' && !!plans.data?.length && (
            <span className="ml-auto rounded-full bg-black/[0.06] px-2 text-xs font-medium text-muted">{plans.data.length}</span>
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
    <div className="space-y-0.5 border-t border-black/[0.06] p-3">
      <NavLink to="/app/setup" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-muted transition-colors hover:bg-black/[0.035] hover:text-ink">
        <Settings size={16} aria-hidden /> Salon figures
      </NavLink>
      <button
        type="button"
        onClick={() => signOut.mutate(undefined, { onSuccess: () => navigate('/') })}
        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-muted transition-colors hover:bg-black/[0.035] hover:text-ink"
      >
        <LogOut size={16} aria-hidden /> Sign out
      </button>
    </div>
  )
}
