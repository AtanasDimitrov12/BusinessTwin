import { useEffect, useState } from 'react'

/**
 * Marks an element once it scrolls into view, for the reveal animations in index.css.
 * Spread the result on the element together with `data-reveal`, `data-reveal-children` or `data-reveal-bars`.
 * Plays once: the observer disconnects after the first time the element is seen.
 */
export function useReveal() {
  const [element, setElement] = useState<Element | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return { ref: setElement, 'data-inview': inView || undefined }
}
