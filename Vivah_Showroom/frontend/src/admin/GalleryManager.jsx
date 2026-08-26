// ============================================================================
// admin/GalleryManager.jsx — the Moments Gallery / lookbook CRUD (see
// backend/src/models/Gallery.js). Very similar shape to BannersManager.jsx.
// ============================================================================
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { fetchAdminGallery, createGalleryImage, updateGalleryImage, deleteGalleryImage } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'
import FloatingModal from './components/FloatingModal'
import ImageUploadField from './components/ImageUploadField'

const BLANK = { image: '', caption: '', category: '', order: 0, isActive: true }

export default function GalleryManager() {
  const { forceLockOut } = useAdmin()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try { setItems((await fetchAdminGallery()).gallery) } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openAdd() { setEditing(null); setForm(BLANK); setModalOpen(true) }
  function openEdit(g) { setEditing(g); setForm({ ...BLANK, ...g }); setModalOpen(true) }

  async function handleSubmit() {
    setBusy(true); setError('')
    try {
      if (editing) await updateGalleryImage(editing._id, form)
      else await createGalleryImage(form)
      setModalOpen(false); load()
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setBusy(false) }
  }

  async function handleDelete(g) {
    if (!confirm('Delete this gallery image?')) return
    try { await deleteGalleryImage(g._id); load() } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Gallery / Lookbook</h1>
          <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Curated moments shown in the homepage gallery.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium">
          <Plus size={16} /> Add Image
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? <p className="text-sm text-ink/40 dark:text-ivory/40">Loading…</p> : items.map((g) => (
          <div key={g._id} className="rounded-2xl overflow-hidden border border-ink/10 dark:border-ivory/10 bg-ivory dark:bg-charcoal group relative">
            <div className="aspect-square bg-ink/5">{g.image && <img src={g.image} alt="" className="w-full h-full object-cover" />}</div>
            <div className="p-3">
              <p className="text-xs text-ink dark:text-ivory truncate">{g.caption || 'Untitled'}</p>
              <p className="text-[10px] text-ink/40 dark:text-ivory/40">{g.isActive ? 'Visible' : 'Hidden'}</p>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
              <button onClick={() => openEdit(g)} className="w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center"><Pencil size={12} /></button>
              <button onClick={() => handleDelete(g)} className="w-7 h-7 rounded-full bg-black/60 text-red-300 grid place-items-center"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <FloatingModal title={editing ? 'Edit Gallery Image' : 'Add Gallery Image'} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} busy={busy}>
          <ImageUploadField label="Image" value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} usedIn="gallery" />
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Caption</label>
            <input value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                   className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Category / Collection Label</label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Display Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="gallery-active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            <label htmlFor="gallery-active" className="text-sm text-ink dark:text-ivory">Visible on site</label>
          </div>
        </FloatingModal>
      )}
    </div>
  )
}
