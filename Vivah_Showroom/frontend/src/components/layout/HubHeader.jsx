// ============================================================================
// components/layout/HubHeader.jsx — the reusable "sub-navigation" header
// used by every hub/drill-down page (pages/CategoryHub.jsx,
// pages/JewelleryHub.jsx, pages/JewelleryTypeHub.jsx). It's the piece that
// makes the site's nested navigation actually work:
//
//   [ ← Back ]   Tab 1   Tab 2   Tab 3   Tab 4
//
// `tabs`   — array of { label, to } — each renders as a pill button linking
//            to a route (e.g. /bride/bridal-lehenga). The currently active
//            one (matched by `activeTo`) is highlighted.
// `backTo` — where the back button navigates. Every hub page passes the
//            path ONE LEVEL UP its own hierarchy (e.g. /bride/:slug's back
//            button goes to /bride; /bride's own back button goes to /).
//            This is deliberately a fixed `to` path rather than
//            navigate(-1) (browser history back) — using browser history
//            would do the wrong thing if someone lands on a deep page
//            directly (e.g. from a shared link) with no "previous page" in
//            their history at all.
// `backLabel` — text next to the arrow, e.g. "Home" or "Bride".
//
// AUTO-HIDE ON SCROLL: since this is a SINGLE shared component behind
// every hub page reached from the homepage's Showroom Rail (Bride, Groom,
// both Jewellery hubs), this behavior applies to every one of those
// automatically — no per-page wiring needed. Scrolling DOWN past the very
// top of the page slides this bar up out of view (behind the main sticky
// Navbar above it); scrolling UP even slightly brings it straight back.
// Near the very top of the page it always stays visible regardless of
// direction, so it doesn't flicker away immediately on landing.
// ============================================================================
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function HubHeader({ tabs, activeTo, backTo, backLabel = 'Back' }) {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    function onScroll() {
      const y = window.scrollY
      const delta = y - lastY.current
      if (y < 140) {
        // Always visible near the top — right under the main Navbar, where
        // this bar first appears — regardless of scroll direction.
        setHidden(false)
      } else if (delta > 4) {
        setHidden(true) // scrolling down -> slide away
      } else if (delta < -4) {
        setHidden(false) // scrolling up, even a little -> reappear
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`sticky top-20 z-30 -mx-6 sm:-mx-10 px-6 sm:px-10 py-4 bg-ivory/95 dark:bg-noir/95 backdrop-blur-md border-b border-ink/10 dark:border-ivory/10 transition-transform duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={backTo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-label tracking-wider uppercase text-ink/70 dark:text-ivory/70 border border-ink/15 dark:border-ivory/15 hover:border-gold dark:hover:border-gold-dark hover:text-gold dark:hover:text-gold-dark transition-colors flex-shrink-0"
        >
          <ArrowLeft size={14} /> {backLabel}
        </Link>

        {/* A thin divider between the back button and the tabs, purely visual */}
        <span className="hidden sm:block w-px h-6 bg-ink/10 dark:bg-ivory/10" aria-hidden="true" />

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = tab.to === activeTo
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`px-4 py-2 rounded-full text-xs font-label tracking-wider uppercase border transition-colors ${
                  active
                    ? 'bg-wine text-ivory border-wine dark:bg-gold-dark dark:text-noir dark:border-gold-dark'
                    : 'border-ink/15 dark:border-ivory/15 text-ink/70 dark:text-ivory/70 hover:border-gold dark:hover:border-gold-dark'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
