// ============================================================================
// components/home/InstagramGallery.jsx — the "From the Showroom Floor" photo
// grid, styled like an Instagram feed (links out to instagram.com — update
// the href below once a real account exists).
//
// Deliberately reads from imageManifest.json directly (rather than
// data/products.js) and pulls ONE photo from EACH of the 7 raw folders
// (bride, groom, couple, jewellery-bride, jewellery-groom, pagdi, jutti),
// so this section shows the breadth of categories that aren't otherwise
// featured elsewhere on the homepage (e.g. pagdi, jutti rarely appear in
// other sections). The `(fi * 17 + 6) % files.length` math is just a fixed,
// arbitrary-but-deterministic way to pick "some photo other than the very
// first one" from each folder, for a bit of visual variety.
// CARD SIZE: fixed 210px squares in a horizontally-scrolling rail — ~30%
// larger than the previous fluid grid (7 equal columns spanning the
// max-w-7xl container worked out to roughly 160px per card; 160 × 1.3 ≈
// 210px) — per an explicit follow-up request. Switched from a CSS grid to
// a fixed-size rail (same rail-scroll pattern as CategoryRail.jsx) because
// a fluid grid's card size is entirely a function of container width ÷
// column count — there's no way to make it "30% bigger" and still fill
// the same container edge-to-edge without either shrinking to fewer
// columns (an approximation) or fixing the pixel size directly, which is
// what this does precisely.
// ============================================================================
import manifest from '../../data/imageManifest.json'
import SectionHeading from '../ui/SectionHeading'

const FOLDERS = ['bride', 'groom', 'jewellery-bride', 'couple', 'pagdi', 'jutti', 'jewellery-groom']

// Picks one representative image filename from each folder in FOLDERS.
function pick() {
  const out = []
  FOLDERS.forEach((folder, fi) => {
    const files = manifest[folder] || []
    const idx = (fi * 17 + 6) % files.length
    if (files[idx]) out.push(`assets/${folder}/${files[idx]}`)
  })
  return out
}

export default function InstagramGallery() {
  const images = pick()
  return (
    <section className="py-24 px-6 sm:px-10 max-w-7xl mx-auto">
      <SectionHeading eyebrow="@vivahtrousseau" title="From the Showroom Floor" />
      <div className="flex gap-3 overflow-x-auto rail-scroll pb-2 mt-12 -mx-6 px-6 sm:mx-0 sm:px-0">
        {images.map((src, i) => (
          <a key={i} href="https://instagram.com" target="_blank" rel="noreferrer"
             className="flex-shrink-0 w-[210px] h-[210px] rounded-xl overflow-hidden group">
            <img src={src} alt="Showroom" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
          </a>
        ))}
      </div>
    </section>
  )
}
