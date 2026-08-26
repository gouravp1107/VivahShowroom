// ============================================================================
// main.jsx — the entry point of the whole React app.
// This is the FIRST file that runs in the browser. Vite loads this via the
// <script> tag in index.html (see index.html's <div id="root"> + script tag).
//
// What it does, in order:
//   1. Finds the empty <div id="root"> in index.html.
//   2. Wraps the entire app (<App />) in three "providers" (context wrappers)
//      that make shared data available to every page/component without
//      having to pass props down manually through every level:
//
//        HashRouter        -> from react-router-dom. Enables page navigation
//                              (Home, Category, Product, etc.) using URL
//                              hashes like "#/category/bridal-lehenga".
//                              We use HashRouter (not the more common
//                              BrowserRouter) specifically so the site also
//                              works when opened directly from disk via
//                              "Open Site.html" (see project root) — regular
//                              routers need a real web server to handle page
//                              refreshes/deep links, HashRouter doesn't.
//
//        ThemeProvider      -> from context/ThemeContext.jsx. Controls
//                              light/dark mode and remembers the choice in
//                              localStorage so it persists between visits.
//
//        ShowroomProvider   -> from context/ShowroomContext.jsx. Holds the
//                              wishlist, rental bag, and logged-in user —
//                              the "shopping" state used across Navbar,
//                              ProductCard, Wishlist page, Bag page, etc.
//   3. Renders <App /> (see App.jsx) inside all of that.
//
// StrictMode is a React development helper that double-invokes some
// functions to help catch bugs — it has no effect in production.
// ============================================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css' // Tailwind + design tokens (colors, fonts) — see that file for the full design system
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { ShowroomProvider } from './context/ShowroomContext'
import { AdminProvider } from './context/AdminContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <ShowroomProvider>
          <AdminProvider>
            <App />
          </AdminProvider>
        </ShowroomProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
