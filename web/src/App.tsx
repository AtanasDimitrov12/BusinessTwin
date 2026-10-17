import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ErrorNote, Spinner } from './components/ui/primitives'
import { useCurrentUser } from './features/auth/auth'
import { useBaseline } from './features/baseline/baseline'
import { useBusiness } from './features/business/business'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'

// The owner area (charts, forms) loads on demand so the public landing page stays small.
const AppShell = lazy(() => import('./components/AppShell').then((m) => ({ default: m.AppShell })))
const AssumptionsPage = lazy(() => import('./features/assumptions/AssumptionsPage').then((m) => ({ default: m.AssumptionsPage })))
const BaselinePage = lazy(() => import('./features/baseline/BaselinePage').then((m) => ({ default: m.BaselinePage })))
const SetupWizard = lazy(() => import('./features/baseline/SetupWizard').then((m) => ({ default: m.SetupWizard })))
const OutcomePage = lazy(() => import('./features/scenarios/OutcomePage').then((m) => ({ default: m.OutcomePage })))
const PlansPage = lazy(() => import('./features/scenarios/PlansPage').then((m) => ({ default: m.PlansPage })))
const ScenarioBuilderPage = lazy(() => import('./features/scenarios/ScenarioBuilder').then((m) => ({ default: m.ScenarioBuilderPage })))

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<GuestOnly><AuthPage mode="signIn" /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />
        <Route path="/app" element={<RequireAuth />}>
          <Route path="setup" element={<SetupRoute />} />
          <Route element={<RequireBaseline />}>
            <Route element={<AppShell />}>
              <Route index element={<HomeRoute />} />
              <Route path="decide" element={<ScenarioBuilderPage />} />
              <Route path="decide/:id" element={<ScenarioBuilderPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="plans/:id" element={<OutcomePage />} />
              <Route path="assumptions" element={<AssumptionsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  )
}

function RequireAuth() {
  const user = useCurrentUser()
  const location = useLocation()
  if (user.isPending) return <FullPageSpinner />
  if (!user.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

function GuestOnly({ children }: { children: ReactNode }) {
  const user = useCurrentUser()
  if (user.isPending) return <FullPageSpinner />
  return user.data ? <Navigate to="/app" replace /> : children
}

/** The owner's area needs a business and baseline first (BPMN: enter baseline before testing decisions). */
function RequireBaseline() {
  const business = useBusiness()
  const baseline = useBaseline()
  if (business.isPending || baseline.isPending) return <FullPageSpinner />
  if (business.error || baseline.error) return <div className="p-8"><ErrorNote error={business.error ?? baseline.error} /></div>
  if (!business.data || !baseline.data) return <Navigate to="/app/setup" replace />
  return <Outlet />
}

function SetupRoute() {
  const business = useBusiness()
  const baseline = useBaseline()
  if (business.isPending || baseline.isPending) return <FullPageSpinner />
  return <SetupWizard business={business.data ?? null} baseline={baseline.data ?? null} />
}

function HomeRoute() {
  const business = useBusiness()
  const baseline = useBaseline()
  return <BaselinePage business={business.data!} baseline={baseline.data!} />
}
