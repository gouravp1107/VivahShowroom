// ============================================================================
// components/admin/EditOverlay.jsx — the small pencil/trash button cluster
// that appears in the top-right corner of a card ONLY when
// hooks/useAdminEditMode.js reports an active admin session. Renders
// nothing at all (not even an empty wrapper) for anyone else — a logged-out
// visitor or a logged-in customer never sees any trace of these controls,
// per the requirement that editing affordances stay completely invisible
// until an admin is signed in.
//
// DESIGN: rather than building a full inline WYSIWYG editor on every public
// page (a much larger, separate undertaking), Edit routes into the matching
// screen of the admin CMS that already exists (ProductsManager,
// CategoriesManager, BannersManager, GalleryManager — see admin/*.jsx) —
// `editTo` is that URL, optionally with a query param the target screen can
// read to highlight/pre-open the right item. Delete, where wired up (see
// `onDelete`), calls the real admin API directly from the public page and
// asks for confirmation first, since that action doesn't need a form.
//
// USAGE: place inside any `relative`-positioned card:
//   <div className="relative ...">
//     ...card content...
//     <EditOverlay label="Bridal Lehenga" editTo="/admin/products?highlight=123" onDelete={handleDelete} />
//   </div>
// ============================================================================
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { useAdminEditMode } from '../../hooks/useAdminEditMode'

export default function EditOverlay({ label, editTo, onDelete, position = 'top-right', className = '', style }) {
  const isAdmin = useAdminEditMode()
  const navigate = useNavigate()
  if (!isAdmin) return null

  const positionClass = position === 'top-left' ? 'top-2 left-2' : 'top-2 right-2'

  return (
    <div
      style={style}
      className={`absolute ${positionClass} z-20 flex gap-1.5 ${className}`}
      // Cards this sits inside are usually themselves a <Link>/<button> —
      // stop the click from also triggering that outer navigation.
      onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
    >
      {editTo && (
        // A <button> here (not a nested <Link>/<a>) on purpose — this
        // overlay usually sits inside an outer card that's ALREADY a
        // <Link>, and nested <a> tags are invalid HTML.
        <button type="button" aria-label={`Edit ${label || 'item'}`} onClick={() => navigate(editTo)}
                className="w-8 h-8 rounded-full bg-ink/80 text-ivory grid place-items-center hover:bg-wine transition-colors backdrop-blur-sm">
          <Pencil size={14} />
        </button>
      )}
      {onDelete && (
        <button type="button" aria-label={`Delete ${label || 'item'}`}
                onClick={() => { if (window.confirm(`Delete "${label || 'this item'}"? This can\u2019t be undone.`)) onDelete() }}
                className="w-8 h-8 rounded-full bg-ink/80 text-ivory grid place-items-center hover:bg-red-600 transition-colors backdrop-blur-sm">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
