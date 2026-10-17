import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthPage } from './features/auth/AuthPage'
import { useCurrentUser } from './features/auth/auth'
import { BaselineDashboard } from './features/baseline/BaselineDashboard'
import { BaselineForm } from './features/baseline/BaselineForm'
import { useBaseline } from './features/baseline/baseline'
import { BusinessForm } from './features/business/BusinessForm'
import { useBusiness } from './features/business/business'

export default function App() {
  const user = useCurrentUser()

  if (user.isPending) return <Layout signedIn={false}><p className="muted">Loading…</p></Layout>
  if (!user.data) return <Layout signedIn={false}><AuthPage /></Layout>

  return (
    <Layout signedIn>
      <OwnerArea />
    </Layout>
  )
}

/** Guides the owner through the process: business → baseline → dashboard (BPMN steps 3–6). */
function OwnerArea() {
  const business = useBusiness()
  const baseline = useBaseline()

  if (business.isPending || baseline.isPending) return <p className="muted">Loading…</p>
  if (business.error) return <p className="form-error">{business.error.message}</p>
  if (!business.data) return <BusinessForm />
  if (baseline.error) return <p className="form-error">{baseline.error.message}</p>

  return (
    <Routes>
      <Route
        path="/"
        element={baseline.data ? <BaselineDashboard baseline={baseline.data} /> : <BaselineForm existing={null} />}
      />
      <Route path="/baseline/edit" element={<BaselineForm existing={baseline.data ?? null} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
