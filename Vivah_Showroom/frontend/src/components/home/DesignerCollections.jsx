// ============================================================================
// components/home/DesignerCollections.jsx — the 3-card "Designer
// Collections" homepage section (Zardozi Edit / Raw Silk Sherwanis / Temple
// Jewellery). COLLECTIONS below is a hand-picked, curated list (not
// generated) — each entry just needs a name, a specific image path from
// frontend/public/assets/, and the category page it should link to.
// ============================================================================
import { Link } from 'react-router-dom'
import SectionHeading from '../ui/SectionHeading'

const COLLECTIONS = [
  { name: 'The Zardozi Edit', image: 'assets/bride/bride-020.jpg', to: '/bride/bridal-lehenga' },
  { name: 'Raw Silk Sherwanis', image: 'assets/groom/groom-055.jpg', to: '/groom/groom-sherwani' },
  { name: 'Temple Jewellery', image: 'assets/jewellery-bride/jewellery-bride-040.jpg', to: '/jewellery/bride/bridal-jewellery' },
]

export default function DesignerCollections() {
  return (
    <section className="py-24 px-6 sm:px-10 max-w-7xl mx-auto">
      <SectionHeading eyebrow="Curated Edits" title="Designer Collections" />
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {COLLECTIONS.map((c) => (
          <Link key={c.name} to={c.to} className="group relative h-96 rounded-[2rem] overflow-hidden">
            <img src={c.image} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-display italic text-2xl text-white">{c.name}</h3>
              <span className="font-label text-[11px] tracking-widest uppercase text-gold-bright">Discover →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
