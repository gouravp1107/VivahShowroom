// ============================================================================
// vite.config.js — build/dev-server configuration for the frontend.
// Read by both `npm run dev` (local development) and `npm run build`
// (production build) — see package.json's "scripts" for those commands.
//
// PLUGINS:
//   react()          -> standard React support (JSX, fast refresh in dev)
//   tailwindcss()     -> Tailwind CSS v4's Vite plugin (reads design tokens
//                        from src/index.css's @theme block)
//   viteSingleFile()  -> inlines ALL built JS and CSS directly into
//                        dist/index.html as one big self-contained file,
//                        instead of the usual separate .js/.css files.
//                        This is NOT the default Vite behavior — it's here
//                        specifically so the built site can be opened
//                        straight from disk via "Open Site.html" (project
//                        root). Browsers refuse to load separate <script
//                        type="module"> files over the file:// protocol
//                        (a CORS restriction), so bundling everything into
//                        one file sidesteps that entirely. This works
//                        identically when deployed to a real web server too
//                        (e.g. Vercel) — there's no separate "web build."
//
// base: './'  -> makes all built asset URLs RELATIVE instead of absolute
//                (e.g. "assets/x.jpg" instead of "/assets/x.jpg"), which
//                also matters for opening the build from disk — absolute
//                paths starting with "/" resolve to your filesystem root
//                under file://, not the dist folder.
//
// build.cssCodeSplit: false / assetsInlineLimit: a huge number
//   -> both are here to help vite-plugin-singlefile successfully inline
//      everything; cssCodeSplit keeps CSS as one file (not split per route/
//      component) and the inline limit ensures small imported assets get
//      base64-inlined rather than emitted as separate files.
//
// NOTE: product photography in public/assets/ is NOT affected by any of
// this — those are static files copied as-is into dist/assets/, referenced
// by plain string paths in the code (see data/products.js), not by Vite's
// import/asset pipeline.
// ============================================================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  server: { port: 5173 }, // local dev server port — visit http://localhost:5173
  build: {
    // Inlined into one HTML file by vite-plugin-singlefile, so no chunking needed.
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
})
