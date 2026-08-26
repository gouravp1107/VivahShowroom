// ============================================================================
// components/ui/Divider.jsx — the site's signature "kundan-thread divider":
// a thin gold rule with a small diamond-shaped gem mark in the middle,
// echoing the jewellery/embroidery motifs in the product photography. Used
// between homepage sections and in a couple of forms as a visual break.
// The actual line/gem CSS lives in index.css under the `.kundan-divider`
// and `.gem` classes — this component just renders the right markup.
// ============================================================================
export default function Divider({ className = '', color = 'text-gold dark:text-gold-dark' }) {
  return (
    <div className={`kundan-divider w-full max-w-xs mx-auto ${color} ${className}`}>
      <span className="gem" aria-hidden="true" />
    </div>
  )
}
