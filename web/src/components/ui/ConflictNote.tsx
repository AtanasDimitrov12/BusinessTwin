import { isEditConflict } from '../../api/client'
import { Button } from './Button'
import { ErrorNote } from './primitives'

/**
 * Shows a failed save. When the API refused it because a newer version was saved on another device or tab,
 * the owner chooses: load what was saved there (dropping these edits) or save these edits over it.
 * Any other error is shown as a plain error note.
 */
export function ConflictNote({
  error,
  what,
  busy,
  onLoadLatest,
  onKeepMine,
}: {
  error: Error | null | undefined
  /** What was edited, e.g. "this plan" or "your figures". */
  what: string
  busy?: boolean
  onLoadLatest: () => void
  onKeepMine: () => void
}) {
  if (!isEditConflict(error)) return <ErrorNote error={error} />
  return (
    <div role="alert" className="mb-6 rounded-2xl bg-swatch-peach px-4 py-4 sm:px-5">
      <p className="font-semibold text-ink">Changed on another device</p>
      <p className="mt-1 text-sm text-muted">
        Someone saved {what} on another device or in another tab after you opened it. Nothing has been overwritten yet.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onLoadLatest} disabled={busy}>
          Load the latest version
        </Button>
        <Button size="sm" onClick={onKeepMine} disabled={busy}>
          Keep my version
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">Loading the latest drops your edits here. Keeping yours replaces what was saved there.</p>
    </div>
  )
}
