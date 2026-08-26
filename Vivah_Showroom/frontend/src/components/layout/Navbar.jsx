// ============================================================================
// components/layout/Navbar.jsx — the sticky top navigation bar, rendered
// once in App.jsx and shown on every single page.
//
// Four interactive pieces, each backed by its own bit of state:
//   1. Desktop "mega-menu" — hovering Bride/Groom/Jewellery (`megaGroup`
//      state) opens a dropdown listing that section's entry points:
//        Bride     -> the 4 bride categories, linking straight into
//                      /bride/:slug (skips the hub landing page)
//        Groom     -> the 5 groom categories, linking into /groom/:slug
//        Jewellery -> just 2 links (Bridal Jewellery / Groom Jewellery),
//                      pointing at /jewellery/bride and /jewellery/groom —
//                      the finer jewellery TYPE tabs (Necklace, Earrings,
//                      etc) only show up once you're on one of those pages
//                      (see pages/JewelleryTypeHub.jsx's own header)
//      Couple, Garba and Other have no dropdown — each is a single page,
//      so their nav links go straight there.
//   2. Mobile menu — the hamburger icon (`open` state) opens a full-screen
//      overlay with the same top-level entry points as desktop.
//   3. Icons on the right read shared state from ShowroomContext.jsx —
//      wishlist count, bag count, and whether someone's logged in — plus
//      ThemeContext.jsx for the sun/moon dark-mode toggle.
//   4. TWO SEPARATE, CLEARLY LABELED login buttons — "User Login" and
//      "Owner Login" — side by side, not one icon plus one pill. Owner
//      Login additionally polls GET /api/auth/admin-lock-status (public,
//      no auth needed — see backend controllers/authController.js's
//      adminLockStatus()) so the button itself shows a lock icon and
//      greys out whenever a DIFFERENT admin is already checked into the
//      single active admin session — this is a visual hint only, though:
//      it's still clickable (goes to /admin, which explains the lock and
//      lets a different admin account sign in), and the single-session
//      rule is actually enforced server-side regardless of what this
//      button shows — see middleware/auth.js's adminSessionGuard.
// ============================================================================
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Heart, ShoppingBag, Sun, Moon, User, Search, ShieldCheck, Lock, ArrowLeft } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useShowroom } from '../../context/ShowroomContext'
import { getCategoriesByHub } from '../../data/categories'
import { adminLockStatus } from '../../api/adminApi'

// Top-level menu items shown on both desktop and mobile. "Home" sits first
// (in front of Spotlight) and does exactly what clicking the VIVAH
// TROUSSEAU wordmark already does — navigates to "/" — as its own explicit
// nav item rather than only being reachable via the logo.
const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Spotlight', to: '/spotlight' },
  { label: 'Bride', to: '/bride' },
  { label: 'Groom', to: '/groom' },
  { label: 'Jewellery', to: '/jewellery' },
  { label: 'Couple', to: '/category/couple-collection' },
  { label: 'Garba', to: '/category/garba' },
  { label: 'Other', to: '/category/other' },
]

// Builds the dropdown items for one nav link's mega-menu — returns an
// empty array for links with no dropdown (e.g. Couple), which the render
// code below treats as "don't show a dropdown at all."
function getDropdownItems(label) {
  if (label === 'Bride') return getCategoriesByHub('bride').map((c) => ({ name: c.name, to: `/bride/${c.slug}` }))
  if (label === 'Groom') return getCategoriesByHub('groom').map((c) => ({ name: c.name, to: `/groom/${c.slug}` }))
  if (label === 'Jewellery') return [
    { name: 'Bridal Jewellery', to: '/jewellery/bride' },
    { name: 'Groom Jewellery', to: '/jewellery/groom' },
  ]
  return []
}

export default function Navbar() {
  const [open, setOpen] = useState(false)       // mobile full-screen menu open/closed
  const [megaLabel, setMegaLabel] = useState(null) // which desktop dropdown is currently open (or null)
  const [ownerLocked, setOwnerLocked] = useState(false) // is someone ELSE currently checked into the admin session?
  const { theme, toggleTheme } = useTheme()
  const { wishlist, bag, user } = useShowroom()
  const navigate = useNavigate()

  // Polls the public lock-status endpoint every 30s so the Owner Login
  // button's locked/unlocked look stays roughly current without needing a
  // page refresh (e.g. the current owner logs out in another tab).
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const { locked } = await adminLockStatus()
        if (!cancelled) setOwnerLocked(locked)
      } catch {
        // Lock-status endpoint unreachable (e.g. no backend configured in
        // demo mode) — just leave the button in its normal, unlocked look.
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ivory/85 dark:bg-noir/85 border-b border-ink/10 dark:border-ivory/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back — goes one step back in browser history (navigate(-1)),
              distinct from "Home" (always "/") above in NAV_LINKS. Sits at
              the very front of the header, left of the wordmark. */}
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back"
                  className="w-9 h-9 rounded-full grid place-items-center text-ink dark:text-ivory hover:bg-ink/5 dark:hover:bg-ivory/10 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <Link to="/" className="flex items-center gap-2 font-display text-2xl italic text-wine dark:text-gold-dark">
            <span className="font-label not-italic text-lg tracking-widest">VIVAH</span>
            <span className="hidden sm:inline text-xs font-body not-italic tracking-[0.3em] uppercase text-ink/50 dark:text-ivory/50">Trousseau</span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-8 font-label text-[13px] tracking-wider uppercase"
             onMouseLeave={() => setMegaLabel(null)}>
          {NAV_LINKS.map((link) => {
            const dropdownItems = getDropdownItems(link.label)
            return (
              <div key={link.label} className="relative" onMouseEnter={() => setMegaLabel(link.label)}>
                <NavLink to={link.to} className="py-8 inline-block hover:text-gold dark:hover:text-gold-dark transition-colors">
                  {link.label}
                </NavLink>
                {megaLabel === link.label && dropdownItems.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72">
                    <div className="bg-ivory dark:bg-charcoal border border-ink/10 dark:border-ivory/10 rounded-2xl shadow-2xl p-4 normal-case font-body">
                      {dropdownItems.map((item) => (
                        <Link key={item.to} to={item.to}
                              className="block px-3 py-2 rounded-lg text-sm text-ink dark:text-ivory hover:bg-wine/5 dark:hover:bg-gold-dark/10">
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="flex items-center gap-4 text-ink dark:text-ivory">
          <button aria-label="Search" className="hidden sm:inline-flex hover:text-gold dark:hover:text-gold-dark">
            <Search size={19} />
          </button>
          <button aria-label="Toggle dark mode" onClick={toggleTheme} className="hover:text-gold dark:hover:text-gold-dark">
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <Link to="/wishlist" aria-label="Wishlist" className="relative hover:text-gold dark:hover:text-gold-dark">
            <Heart size={19} />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] bg-wine text-ivory dark:bg-gold-dark dark:text-noir w-4 h-4 rounded-full grid place-items-center">{wishlist.length}</span>
            )}
          </Link>
          <Link to="/bag" aria-label="Rental bag" className="relative hover:text-gold dark:hover:text-gold-dark">
            <ShoppingBag size={19} />
            {bag.length > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] bg-wine text-ivory dark:bg-gold-dark dark:text-noir w-4 h-4 rounded-full grid place-items-center">{bag.length}</span>
            )}
          </Link>

          {/* USER LOGIN — its own clearly labeled pill (not just the
              account icon), matching Owner Login's pill styling below.
              Switches label/destination to "My Account" once someone's
              actually signed in. */}
          <Link to={user ? '/profile' : '/login'} aria-label={user ? 'My Account' : 'User Login'}
                className="hidden sm:inline-flex items-center gap-1.5 pl-3 pr-3.5 py-1.5 rounded-full border border-ink/15 dark:border-ivory/15 text-[11px] font-label tracking-wider uppercase text-ink/60 dark:text-ivory/60 hover:text-wine hover:border-wine/40 dark:hover:text-gold-dark dark:hover:border-gold-dark/40 transition-colors">
            <User size={13} />
            {user ? 'My Account' : 'User Login'}
          </Link>

          {/* OWNER LOGIN — always clickable (the single-session rule is
              enforced server-side regardless — see file header comment),
              but visually greys out with a lock icon whenever someone
              ELSE currently holds the session, so it's obvious at a
              glance without having to click through. */}
          <Link to="/admin" aria-label={ownerLocked ? 'Owner Login (in use by another admin)' : 'Owner Login'}
                title={ownerLocked ? 'Another admin is currently signed in' : 'Owner Login'}
                className={`hidden sm:inline-flex items-center gap-1.5 pl-3 pr-3.5 py-1.5 rounded-full border text-[11px] font-label tracking-wider uppercase transition-colors ${
                  ownerLocked
                    ? 'border-ink/10 dark:border-ivory/10 text-ink/30 dark:text-ivory/30 cursor-not-allowed'
                    : 'border-ink/15 dark:border-ivory/15 text-ink/60 dark:text-ivory/60 hover:text-wine hover:border-wine/40 dark:hover:text-gold-dark dark:hover:border-gold-dark/40'
                }`}>
            {ownerLocked ? <Lock size={13} /> : <ShieldCheck size={13} />}
            Owner Login
          </Link>

          <button className="lg:hidden" aria-label="Menu" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* MOBILE-ONLY always-visible nav strip — Home/Bride/Groom/Jewellery/
          Couple/Garba/Other used to only be reachable by opening the
          hamburger menu below the "lg" breakpoint (the row above is
          "hidden lg:flex"); that made them effectively invisible on phone
          screens unless you knew to tap the menu icon. This is the exact
          same NAV_LINKS list, always visible in a horizontally-scrollable
          strip right under the header, no tap required. Hidden on desktop
          (lg:hidden) since the row above already covers it there. */}
      <nav className="lg:hidden flex items-center gap-5 overflow-x-auto rail-scroll px-5 pb-3 -mt-1 font-label text-xs tracking-wider uppercase text-ink/70 dark:text-ivory/70">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.label} to={link.to}
                    className={({ isActive }) => `flex-shrink-0 py-1 ${isActive ? 'text-wine dark:text-gold-dark' : ''}`}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {open && (
        <div className="fixed inset-0 z-[60] bg-ivory dark:bg-noir p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <span className="font-label text-lg tracking-widest text-wine dark:text-gold-dark">VIVAH</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu"><X size={24} /></button>
          </div>
          <div className="flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.to} onClick={() => setOpen(false)}
                    className="font-display text-2xl italic text-ink dark:text-ivory">
                {link.label}
              </Link>
            ))}
            <div className="kundan-divider text-gold my-2"><span className="gem" /></div>
            <Link to={user ? '/profile' : '/login'} onClick={() => setOpen(false)} className="text-sm font-label tracking-wider uppercase text-ink dark:text-ivory flex items-center gap-1.5">
              <User size={14} /> {user ? 'My Account' : 'User Login'}
            </Link>
            <Link to="/admin" onClick={() => setOpen(false)}
                  className={`text-sm font-label tracking-wider uppercase flex items-center gap-1.5 ${ownerLocked ? 'text-ink/30 dark:text-ivory/30' : 'text-wine dark:text-gold-dark'}`}>
              {ownerLocked ? <Lock size={14} /> : <ShieldCheck size={14} />}
              Owner Login{ownerLocked ? ' (in use)' : ''}
            </Link>
            <Link to="/book-appointment" onClick={() => setOpen(false)} className="text-sm font-label tracking-wider uppercase text-wine dark:text-gold-dark">Book Appointment</Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="text-sm font-label tracking-wider uppercase text-wine dark:text-gold-dark">Contact</Link>
          </div>
        </div>
      )}
    </header>
  )
}
