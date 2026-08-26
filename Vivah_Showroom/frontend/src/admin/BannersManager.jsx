// ============================================================================
// admin/BannersManager.jsx — homepage hero/promo banner CRUD (see
// backend/src/models/Banner.js). Public Home.jsx hero should read from
// GET /api/banners (active only) — connecting that without changing the
// hero's visual design is listed as a follow-up in the project README.
// ============================================================================
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { fetchAdminBanners, createBanner, updateBanner, deleteBanner } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'
import FloatingModal from './components/FloatingModal'
import ImageUploadField from './components/ImageUploadField'

const BLANK = { title: '', subtitle: '', image: '', ctaLabel: '', ctaLink: '', placement: 'hero', order: 0, isActive: true }

export default function BannersManager() {
  const { forceLockOut } = useAdmin()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try { setBanners((await fetchAdminBanners()).banners) } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openAdd() { setEditing(null); setForm(BLANK); setModalOpen(true) }
  function openEdit(b) { setEditing(b); setForm({ ...BLANK, ...b }); setModalOpen(true) }

  async function handleSubmit() {
    setBusy(true); setError('')
    try {
      if (editing) await updateBanner(editing._id, form)
      else await createBanner(form)
      setModalOpen(false); load()
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setBusy(false) }
  }

  async function handleDelete(b) {
    if (!confirm('Delete this banner?')) return
    try { await deleteBanner(b._id); load() } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Banners / Hero</h1>
          <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Homepage hero slides and promo banners.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="text-sm text-ink/40 dark:text-ivory/40">Loading…</p> : banners.map((b) => (
          <div key={b._id} className="rounded-2xl overflow-hidden border border-ink/10 dark:border-ivory/10 bg-ivory dark:bg-charcoal">
            <div className="aspect-video bg-ink/5">{b.image && <img src={b.image} alt="" className="w-full h-full object-cover" />}</div>
            <div className="p-4">
              <p className="text-ink dark:text-ivory font-medium">{b.title || 'Untitled'}</p>
              <p className="text-xs text-ink/40 dark:text-ivory/40">{b.placement} · order {b.order} · {b.isActive ? 'Active' : 'Hidden'}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(b)} className="text-xs px-3 py-1.5 rounded-full border border-ink/20 dark:border-ivory/20 text-ink dark:text-ivory flex items-center gap-1"><Pencil size={12} /> Edit</button>
                <button onClick={() => handleDelete(b)} className="text-xs px-3 py-1.5 rounded-full border border-red-500/30 text-red-600 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <FloatingModal title={editing ? 'Edit Banner' : 'Add Banner'} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} busy={busy}>
          <ImageUploadField label="Banner Image" value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} usedIn="banner" />
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                   className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Subtitle</label>
            <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                   className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">CTA Label</label>
              <input value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">CTA Link</label>
              <input value={form.ctaLink} onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Placement</label>
              <select value={form.placement} onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory">
                <option value="hero">Hero</option>
                <option value="category">Category</option>
                <option value="promo">Promo</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Display Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="banner-active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            <label htmlFor="banner-active" className="text-sm text-ink dark:text-ivory">Active (visible on site)</label>
          </div>
        </FloatingModal>
      )}
    </div>
  )
}
