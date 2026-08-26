// ============================================================================
// components/ui/SectionHeading.jsx — the reusable "eyebrow + big italic
// title + optional subtitle" heading block used at the top of nearly every
// homepage section (Trending, FAQ, Testimonials, etc.) and category pages.
// `align="left"` is used on left-aligned page headers (e.g. Category.jsx);
// the default `align="center"` is used for centered homepage sections.
// ============================================================================
export default function SectionHeading({ eyebrow, title, subtitle, align = 'center' }) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left'
  return (
    <div className={`flex flex-col gap-3 max-w-2xl ${alignment}`}>
      {eyebrow && (
        <span className="font-label text-[11px] tracking-[0.3em] uppercase text-gold dark:text-gold-dark">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-4xl sm:text-5xl leading-tight text-ink dark:text-ivory italic">
        {title}
      </h2>
      {subtitle && <p className="text-sm sm:text-base text-ink/60 dark:text-ivory/60 max-w-lg">{subtitle}</p>}
    </div>
  )
}
