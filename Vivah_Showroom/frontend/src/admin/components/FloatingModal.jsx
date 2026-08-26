// ============================================================================
// admin/components/FloatingModal.jsx — the floating window every "Add" /
// "Edit" action in the admin CMS opens (per the brief: a floating form
// window with an image upload box, rather than navigating to a separate
// page). Just a reusable shell — the actual fields are passed as children
// by each manager screen (ProductsManager.jsx, BannersManager.jsx, etc).
// ============================================================================
import { X } from 'lucide-react'

export default function FloatingModal({ title, onClose, onSubmit, submitLabel = 'Save', busy, children, wide, hideSubmit }) {
  return (
    <div
      className="fixed inset-0 z-[300] bg-black/70 flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`bg-ivory dark:bg-charcoal rounded-3xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} p-6 sm:p-8 relative my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-ink/10 dark:bg-ivory/10 text-ink dark:text-ivory grid place-items-center hover:bg-ink/20 dark:hover:bg-ivory/20">
          <X size={18} />
        </button>
        <h2 className="font-display italic text-2xl text-ink dark:text-ivory pr-10">{title}</h2>

        {hideSubmit ? (
          <div className="mt-6 space-y-4">{children}</div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit?.()
            }}
            className="mt-6 space-y-4"
          >
            {children}

            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={busy}
                      className="flex-1 px-6 py-3 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium disabled:opacity-50">
                {busy ? 'Saving…' : submitLabel}
              </button>
              <button type="button" onClick={onClose}
                      className="px-6 py-3 rounded-full border border-ink/20 dark:border-ivory/20 text-ink dark:text-ivory text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
