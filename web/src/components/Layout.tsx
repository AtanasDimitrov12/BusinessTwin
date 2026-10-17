import type { ReactNode } from 'react'
import { useSignOut } from '../features/auth/auth'

export function Layout({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  const signOut = useSignOut()
  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Business Twin</span>
        {signedIn && (
          <button type="button" className="link" onClick={() => signOut.mutate()}>
            Sign out
          </button>
        )}
      </header>
      <main>{children}</main>
      <footer className="disclaimer">
        Business Twin shows estimates based on your own figures and assumptions. It is not a forecast and not
        financial advice.
      </footer>
    </div>
  )
}
