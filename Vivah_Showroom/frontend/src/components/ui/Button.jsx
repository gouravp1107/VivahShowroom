// ============================================================================
// components/ui/Button.jsx — the ONE button component used everywhere on
// the site (product pages, forms, hero CTAs, etc.) so styling stays
// consistent. It's polymorphic: pass a `to` prop to render as a React
// Router <Link> (internal navigation), an `href` to render as a plain <a>
// (external links, tel:/mailto:), or neither to render a real <button>
// (form submits, onClick handlers).
//
// `variant` picks one of the three visual styles defined in VARIANTS below
// (primary = solid wine/gold, outline = bordered, ghost = text-only).
// Any extra props (disabled, aria-label, etc.) pass straight through via ...rest.
// ============================================================================
import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-wine text-ivory hover:bg-wine-deep dark:bg-gold-dark dark:text-noir dark:hover:bg-gold-bright',
  outline: 'border border-wine/40 text-wine hover:bg-wine hover:text-ivory dark:border-gold-dark/50 dark:text-gold-dark dark:hover:bg-gold-dark dark:hover:text-noir',
  ghost: 'text-ink dark:text-ivory hover:text-gold dark:hover:text-gold-dark',
}

export default function Button({ children, to, href, onClick, type = 'button', variant = 'primary', className = '', ...rest }) {
  const classes = `inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm tracking-wide font-medium transition-all duration-300 ${VARIANTS[variant]} ${className}`
  if (to) return <Link to={to} className={classes} {...rest}>{children}</Link>       // internal page navigation
  if (href) return <a href={href} className={classes} {...rest}>{children}</a>       // external link / tel: / mailto:
  return <button type={type} onClick={onClick} className={classes} {...rest}>{children}</button> // form/action button
}
