// ============================================================================
// components/ui/input.css.js — a single shared Tailwind class string for
// every plain <input>/<select>/<textarea> on the site's forms, so they all
// look consistent without repeating this long class list in every page.
// Import { inputClass } and spread it onto className — see pages/Login.jsx,
// Register.jsx, Contact.jsx, BookAppointment.jsx for usage.
// ============================================================================
export const inputClass = "w-full px-4 py-3 rounded-xl border border-ink/15 dark:border-ivory/15 bg-transparent text-ink dark:text-ivory placeholder:text-ink/30 dark:placeholder:text-ivory/30 focus:border-gold dark:focus:border-gold-dark outline-none transition-colors"
