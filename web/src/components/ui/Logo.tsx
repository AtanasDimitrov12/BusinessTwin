import { Link } from 'react-router-dom'

// Brand assets live in public/brand/, trimmed from "public/Business Twin mirrored geometric logo.png".
const FULL = { src: '/brand/logo.png', width: 850, height: 160 } // wordmark, 5.31 : 1
const MARK = { src: '/brand/logo-mark.png', width: 160, height: 160 }

/** The Business Twin logo. `compact` shows only the mark. Height is set by `size` (px). */
export function Logo({ to = '/', compact = false, size = 34 }: { to?: string; compact?: boolean; size?: number }) {
  const asset = compact ? MARK : FULL
  return (
    <Link to={to} className="inline-flex shrink-0 items-center" aria-label="Business Twin home">
      <img
        src={asset.src}
        alt="Business Twin"
        width={Math.round((asset.width / asset.height) * size)}
        height={size}
        style={{ height: size, width: 'auto' }}
        decoding="async"
      />
    </Link>
  )
}
