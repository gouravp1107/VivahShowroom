// ============================================================================
// components/ui/FormField.jsx — a label + input wrapper used on every form
// in the site (Login, Register, Contact, BookAppointment). Pass the actual
// <input>/<select>/<textarea> as `children`, and this handles the label
// styling and, if react-hook-form reports a validation error for this
// field, shows the error message underneath. See any page in src/pages
// that uses react-hook-form's `register()` for a usage example.
// ============================================================================
export default function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <span className="text-xs text-red-600 mt-1 block">{error.message}</span>}
    </label>
  )
}
