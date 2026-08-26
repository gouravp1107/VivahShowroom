// ============================================================================
// components/home/BrandStory.jsx — the simple centered "Our Story" text
// block on the homepage, between the video banner and the FAQ. Static
// content only (no data dependencies) — edit the text directly here if the
// brand story copy needs to change.
// ============================================================================
export default function BrandStory() {
  return (
    <section className="py-24 px-6 sm:px-10 max-w-4xl mx-auto text-center">
      <span className="font-label text-xs tracking-[0.4em] uppercase text-gold dark:text-gold-dark">Our Story</span>
      <h2 className="font-display italic text-3xl sm:text-4xl mt-4 text-ink dark:text-ivory leading-relaxed">
        We started Vivah Trousseau with one belief: a wedding wardrobe should be
        as unforgettable as the wedding itself — without asking a family to buy
        twelve outfits they'll wear once.
      </h2>
      <p className="mt-6 text-ink/60 dark:text-ivory/60 max-w-xl mx-auto">
        Every piece in our showroom is professionally cleaned, tailored to fit,
        and delivered with a trial appointment — so renting feels like owning,
        for the days that matter.
      </p>
    </section>
  )
}
