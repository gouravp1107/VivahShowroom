// ============================================================================
// pages/Home.jsx — the "/" route (see App.jsx's <Route path="/" element={<Home />} />).
// This page is just a stack of section components in a fixed order — all
// the actual content/logic lives in each imported component under
// src/components/home/. To reorder homepage sections, reorder the JSX
// below; to add a new section, build it in components/home/ and add it here.
// ============================================================================
import Hero from '../components/home/Hero'
import CategoryRail from '../components/home/CategoryRail'
import TrendingRentals from '../components/home/TrendingRentals'
import DesignerCollections from '../components/home/DesignerCollections'
import CoupleSpotlight from '../components/home/CoupleSpotlight'
import MomentsGallery from '../components/home/MomentsGallery'
import VideoBanner from '../components/home/VideoBanner'
import Testimonials from '../components/home/Testimonials'
import InstagramGallery from '../components/home/InstagramGallery'
import BrandStory from '../components/home/BrandStory'
import FAQ from '../components/home/FAQ'
import ContactStrip from '../components/home/ContactStrip'
import Newsletter from '../components/home/Newsletter'

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryRail />
      <TrendingRentals />
      <DesignerCollections />
      <CoupleSpotlight />
      <MomentsGallery />
      <VideoBanner />
      <InstagramGallery />
      <Testimonials />
      <BrandStory />
      <FAQ />
      <ContactStrip />
      <Newsletter />
    </>
  )
}
