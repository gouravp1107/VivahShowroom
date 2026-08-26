// ============================================================================
// components/home/Hero.jsx — the fullscreen auto-rotating slider at the very
// top of the homepage (the first thing every visitor sees).
//
// SLIDES below is a hand-picked array (NOT generated from data/products.js)
// — each slide needs a specific hero-quality image, headline, CTA button
// text, and destination category. The 4 hero images live in
// frontend/public/assets/hero/ (bride-hero.jpg, groom-hero.jpg,
// jewellery-hero.jpg, couple-hero.jpg) — these were hand-selected from
// uploaded photos specifically for this banner (sharper/more polished than
// the auto-generated product photos), so if you want to swap them again,
// replace those 4 files directly and keep the same filenames, or update the
// paths below.
//
// The slider auto-advances every 5.5 seconds via setInterval (see the
// useEffect below) and also supports manual navigation via the small dot
// buttons at the bottom. `active` tracks which slide (0-3) is currently shown.
// ============================================================================
import { useEffect, useState } from 'react'
import Button from '../ui/Button'

const SLIDES = [
  { image: 'assets/hero/bride-hero.jpg', eyebrow: 'The Wedding Edit', title: 'Your bridal look,\nwithout the price of ownership.', cta: 'Explore Bridal Lehengas', to: '/bride/bridal-lehenga' },
  { image: 'assets/hero/groom-hero.jpg', eyebrow: 'For the Groom', title: 'Sherwanis built\nfor the mandap.', cta: 'Shop Groom Sherwani', to: '/groom/groom-sherwani' },
  { image: 'assets/hero/jewellery-hero.jpg', eyebrow: 'Kundan & Polki', title: 'Heirloom jewellery,\nrented by the day.', cta: 'View Bridal Jewellery', to: '/jewellery/bride/bridal-jewellery' },
  { image: 'assets/hero/couple-hero.jpg', eyebrow: 'Coordinated Looks', title: 'Dressed as one story,\nnot two closets.', cta: 'See Couple Collection', to: '/category/couple-collection' },
]

export default function Hero() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 5500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative h-[92vh] min-h-[560px] overflow-hidden">
      {SLIDES.map((slide, i) => (
        <div key={slide.to}
             className={`absolute inset-0 transition-opacity duration-1000 ${i === active ? 'opacity-100' : 'opacity-0'}`}>
          <img src={slide.image} alt="" className="w-full h-full object-cover scale-105" loading={i === 0 ? 'eager' : 'lazy'} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/40" />
        </div>
      ))}

      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-end pb-24">
        <span className="font-label text-xs tracking-[0.4em] uppercase text-gold-bright animate-fade-up">
          {SLIDES[active].eyebrow}
        </span>
        <h1 key={active} className="font-display italic text-white text-4xl sm:text-6xl lg:text-7xl leading-[1.05] mt-4 max-w-2xl whitespace-pre-line animate-fade-up">
          {SLIDES[active].title}
        </h1>
        <div className="flex flex-wrap gap-4 mt-8 animate-fade-up">
          <Button to={SLIDES[active].to} variant="primary">{SLIDES[active].cta}</Button>
          <Button to="/book-appointment" variant="outline" className="!text-white !border-white/50 hover:!bg-white hover:!text-ink">
            Book a Fitting
          </Button>
        </div>

        <div className="flex gap-2 mt-10">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} aria-label={`Slide ${i + 1}`}
                    className={`h-1 rounded-full transition-all ${i === active ? 'w-8 bg-gold-bright' : 'w-4 bg-white/40'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
