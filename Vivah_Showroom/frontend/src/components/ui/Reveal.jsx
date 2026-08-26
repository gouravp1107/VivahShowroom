// ============================================================================
// components/ui/Reveal.jsx — a small scroll-triggered entrance animation
// wrapper. Wrap anything in <Reveal delay={...}>...</Reveal> and it starts
// invisible/shifted down, then fades and slides into place the moment it
// scrolls into view — used by pages/Spotlight.jsx to give its bento grid a
// staggered, "cards falling into place as you scroll" feel rather than
// everything just appearing at once on page load.
//
// Built on the browser's IntersectionObserver API (no animation library
// needed): it watches the wrapped element and flips `visible` to true the
// first time any part of it enters the viewport, then stops observing
// (the animation only plays once per element, not every time you scroll
// past it up and down).
// ============================================================================
import { useEffect, useRef, useState } from 'react'

export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el) // animate in once, then leave it alone
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
