// ============================================================================
// components/admin/AddCardTile.jsx — a dashed-border "+ Add" tile that
// appears ONLY when hooks/useAdminEditMode.js reports an active admin
// session (renders nothing at all otherwise) — the counterpart to
// components/admin/EditOverlay.jsx's per-card Edit/Delete buttons. Drop
// one at the end of any card grid/rail so an admin can jump straight into
// creating a new item for that section, without leaving the public page
// they were just looking at.
//
// Like EditOverlay, this routes into the existing admin CMS screen that
// owns creation for that resource (Products, Categories, Banners,
// Gallery, ...) rather than opening an inline creation form directly on
// the public page.
//
// USAGE — sizing is the caller's job (pass className to match the
// surrounding cards, e.g. the same aspect-[3/4] a ProductCard grid uses,
// or a fixed w-[400px] h-[500px] to match MomentsGallery's cards):
//   <AddCardTile label="Add Product" to="/admin/products" className="aspect-[3/4] rounded-3xl" />
// ============================================================================
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdminEditMode } from '../../hooks/useAdminEditMode'

export default function AddCardTile({ label = 'Add New', to, className = '', style }) {
  const isAdmin = useAdminEditMode()
  const navigate = useNavigate()
  if (!isAdmin) return null

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      aria-label={label}
      style={style}
      className={`flex-shrink-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-wine/40 dark:border-gold-dark/40 text-wine dark:text-gold-dark hover:bg-wine/5 dark:hover:bg-gold-dark/10 transition-colors ${className}`}
    >
      <span className="w-10 h-10 rounded-full bg-wine/10 dark:bg-gold-dark/10 grid place-items-center">
        <Plus size={18} />
      </span>
      <span className="font-label text-xs tracking-wider uppercase">{label}</span>
    </button>
  )
}
