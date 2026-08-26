// ============================================================================
// App.jsx — the site's page router / master layout.
// Rendered by main.jsx, inside HashRouter + ThemeProvider + ShowroomProvider.
//
// Structure of every page on this site:
//   Navbar (always visible, top)
//     -> main content area, swapped based on URL (the <Routes> block below)
//   Footer (always visible, bottom)
//   FloatingSocial (WhatsApp/call buttons, floats on top of everything)
//   Toast (small popup notifications, e.g. "Added to wishlist")
//
// HOW ROUTING WORKS:
// Each <Route path="..." element={<Page />} /> maps a URL path to a page
// component from src/pages/. Because we use HashRouter (see main.jsx), the
// real URLs look like "yoursite.com/#/bride/bridal-lehenga".
//
// THE NESTED SHOPPING NAVIGATION (Bride / Groom / Jewellery):
// Bride and Groom each have a HUB page (/bride, /groom) and a PRODUCT page
// one level deeper (/bride/:slug, /groom/:slug) — both routes render the
// SAME pages/CategoryHub.jsx component, just with a different `hub` prop
// telling it which set of categories to show tabs for (see that file's
// comments for exactly how the :slug param is used, or defaulted when
// absent). Jewellery has one extra level: /jewellery (choose Bridal or
// Groom side + see everything mixed) -> /jewellery/bride or
// /jewellery/groom (choose a jewellery TYPE) -> optionally /jewellery/bride/:slug
// for one specific type's products. See data/categories.js's big comment
// block at the top for a diagram of this whole hierarchy, and
// components/layout/HubHeader.jsx for the shared tab-bar + back-button UI
// every one of these pages uses.
//
// Couple Collection has no hub of its own — it's still just
// /category/:slug (pages/Category.jsx), since it's a single flat category
// with nothing to drill into.
//
// ":slug" and ":id" are URL PARAMETERS — e.g. visiting
// "/category/couple-collection" makes slug === "couple-collection"
// available inside Category.jsx via the useParams() hook. Same idea for
// Product.jsx reading :id.
// "*" is a catch-all — any URL that doesn't match another route renders
// NotFound.jsx (a simple 404 page).
//
// WHERE TO ADD A NEW PAGE:
//   1. Create the component in src/pages/YourPage.jsx
//   2. Import it above and add a <Route path="/your-path" element={<YourPage />} />
//   3. Link to it from somewhere (Navbar, Footer, a button, etc.) using
//      React Router's <Link to="/your-path"> component.
// ============================================================================
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import FloatingSocial from './components/layout/FloatingSocial'
import Toast from './components/ui/Toast'
import Home from './pages/Home'
import Spotlight from './pages/Spotlight'
import Trending from './pages/Trending'
import CategoryHub from './pages/CategoryHub'
import JewelleryHub from './pages/JewelleryHub'
import JewelleryTypeHub from './pages/JewelleryTypeHub'
import Category from './pages/Category'
import Product from './pages/Product'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import BookAppointment from './pages/BookAppointment'
import Contact from './pages/Contact'
import Wishlist from './pages/Wishlist'
import Bag from './pages/Bag'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import RentBooking from './pages/RentBooking'
import MyOrders from './pages/MyOrders'
import AdminApp from './admin/AdminApp'

// The public site (Navbar + routed page + Footer + FloatingSocial + Toast) —
// pulled out of App() so /admin/* below can skip all of this and render its
// own separate shell instead (see admin/AdminApp.jsx + admin/components/AdminLayout.jsx).
function PublicSite() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky top navigation — logo, category mega-menu, theme toggle, wishlist/bag/account icons */}
      <Navbar />

      {/* flex-1 pushes the footer to the bottom even on short pages */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Spotlight: a single curated cross-category showcase (see
              pages/Spotlight.jsx). Trending: "Show All Trending" from the
              homepage's TrendingRentals section (see pages/Trending.jsx). */}
          <Route path="/spotlight" element={<Spotlight />} />
          <Route path="/trending" element={<Trending />} />

          {/* Bride hub: /bride shows the first bride category by default,
              /bride/:slug shows one specific one — both handled by the
              same component (see pages/CategoryHub.jsx). */}
          <Route path="/bride" element={<CategoryHub hub="bride" />} />
          <Route path="/bride/:slug" element={<CategoryHub hub="bride" />} />

          {/* Groom hub — identical pattern to Bride, above. */}
          <Route path="/groom" element={<CategoryHub hub="groom" />} />
          <Route path="/groom/:slug" element={<CategoryHub hub="groom" />} />

          {/* Jewellery: one extra level deep (Bridal/Groom side, THEN type). */}
          <Route path="/jewellery" element={<JewelleryHub />} />
          <Route path="/jewellery/bride" element={<JewelleryTypeHub side="bride" />} />
          <Route path="/jewellery/bride/:slug" element={<JewelleryTypeHub side="bride" />} />
          <Route path="/jewellery/groom" element={<JewelleryTypeHub side="groom" />} />
          <Route path="/jewellery/groom/:slug" element={<JewelleryTypeHub side="groom" />} />

          {/* Standalone category page — currently only Couple Collection. */}
          <Route path="/category/:slug" element={<Category />} />

          <Route path="/product/:id" element={<Product />} />

          {/* Rent Now booking flow — a dedicated full page (NOT the old
              WhatsApp-redirect modal). Clicking "Rent Now" anywhere on the
              site (ProductCard, Product page, SpotlightCard — see
              pages/RentBooking.jsx's header comment for the full list of
              call sites that were updated) navigates here instead. */}
          <Route path="/rent/:id" element={<RentBooking />} />
          <Route path="/orders" element={<MyOrders />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/book-appointment" element={<BookAppointment />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/bag" element={<Bag />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />

      {/* Fixed-position WhatsApp/call bubbles, visible on every page */}
      <FloatingSocial />

      {/* Renders the current toast message from ShowroomContext, if any (e.g. after adding to wishlist) */}
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* /admin/* is a COMPLETELY separate branch — no public Navbar/Footer/
          FloatingSocial, no link to it anywhere in the public UI (see
          admin/AdminApp.jsx). This is what keeps the admin login invisible
          to ordinary visitors. */}
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<PublicSite />} />
    </Routes>
  )
}
