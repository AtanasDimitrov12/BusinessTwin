import { Popover } from '@base-ui/react/popover'
import { Monitor, MonitorSmartphone, Smartphone } from 'lucide-react'
import type { Schemas } from '../api/client'
import { useSessions, useSignOutOtherSessions, useSignOutSession } from '../features/auth/auth'
import { ErrorNote } from './ui/primitives'

type Session = Schemas['SessionDto']

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const day = new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short' })

/** "Active now" within five minutes, then "Active 40 minutes ago", "Active 2 hours ago", "Active 3 days ago". */
function lastSeen(iso: string, now = Date.now()) {
  const minutes = Math.round((now - Date.parse(iso)) / 60_000)
  if (minutes < 5) return 'Active now'
  if (minutes < 60) return `Active ${relative.format(-minutes, 'minute')}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Active ${relative.format(-hours, 'hour')}`
  return `Active ${relative.format(-Math.round(hours / 24), 'day')}`
}

const isPhone = (device: string) => /iPhone|iPad|Android/.test(device)

/**
 * Sidebar entry showing how many browsers are signed in to this account, with a popover to see them and sign
 * other ones out. Sessions are kept on the server (user_sessions), so signing a device out takes effect on its
 * next request.
 */
export function DevicesMenu() {
  const sessions = useSessions()
  const signOutOne = useSignOutSession()
  const signOutOthers = useSignOutOtherSessions()
  const list = sessions.data ?? []
  const others = list.filter((s) => !s.isCurrent)

  return (
    <Popover.Root onOpenChange={(open) => open && sessions.refetch()}>
      <Popover.Trigger className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-muted transition-colors hover:bg-black/[0.035] hover:text-ink data-[popup-open]:bg-black/[0.035] data-[popup-open]:text-ink">
        <MonitorSmartphone size={16} aria-hidden /> Signed-in devices
        {list.length > 0 && (
          <span
            className={`ml-auto rounded-full px-2 text-xs font-medium ${others.length > 0 ? 'bg-swatch-peach text-ink' : 'bg-black/[0.06] text-muted'}`}
            aria-label={`${list.length} signed in`}
          >
            {list.length}
          </span>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="right" align="end" sideOffset={10} collisionPadding={12} className="z-50">
          <Popover.Popup className="popover w-[min(22rem,calc(100vw-24px))] rounded-2xl bg-surface p-3 shadow-lift outline-none">
            <div className="px-1 pb-2">
              <Popover.Title className="text-[15px] font-semibold">
                {list.length === 1 ? 'Signed in on this device only' : `Signed in on ${list.length} devices`}
              </Popover.Title>
              <Popover.Description className="mt-0.5 text-xs text-muted">
                Don’t recognise one? Sign it out. It will need your password to get back in.
              </Popover.Description>
            </div>

            <ul className="divide-y divide-black/[0.06]">
              {list.map((s) => (
                <SessionRow key={s.id} session={s} busy={signOutOne.isPending && signOutOne.variables === s.id} onSignOut={() => signOutOne.mutate(s.id)} />
              ))}
            </ul>

            <ErrorNote error={sessions.error ?? signOutOne.error ?? signOutOthers.error} />

            {others.length > 1 && (
              <button
                type="button"
                onClick={() => signOutOthers.mutate()}
                disabled={signOutOthers.isPending}
                className="mt-2 w-full rounded-[10px] px-3 py-2 text-left text-sm font-medium text-bad transition-colors hover:bg-bad-50 disabled:opacity-40"
              >
                Sign out all other devices
              </button>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function SessionRow({ session, busy, onSignOut }: { session: Session; busy: boolean; onSignOut: () => void }) {
  const Icon = isPhone(session.device) ? Smartphone : Monitor
  return (
    <li className="flex items-center gap-3 px-1 py-2.5">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${session.isCurrent ? 'bg-swatch-mint text-teal-strong' : 'bg-black/[0.05] text-muted'}`}>
        <Icon size={16} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{session.device}</p>
        <p className="text-xs text-muted">
          {session.isCurrent ? 'This device' : lastSeen(session.lastSeenAt)} · since {day.format(new Date(session.signedInAt))}
        </p>
      </div>
      {!session.isCurrent && (
        <button
          type="button"
          onClick={onSignOut}
          disabled={busy}
          className="shrink-0 rounded-full bg-black/[0.055] px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-bad-50 hover:text-bad disabled:opacity-40"
        >
          Sign out
        </button>
      )}
    </li>
  )
}
