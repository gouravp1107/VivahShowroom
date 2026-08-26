// ============================================================================
// admin/CategoriesManager.jsx — CRUD for Bride/Groom/Jewellery/Couple/
// Occasion categories (see backend/src/models/Category.js). Preserves
// existing category slugs/URLs — editing here never breaks the public
// navigation, it only changes what's shown.
// ============================================================================
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { fetchAdminCategories, createCategory, updateCategory, deleteCategory } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'
import FloatingModal from './components/FloatingModal'
import ImageUploadField from './components/ImageUploadField'

const BLANK = { name: '', slug: '', description: '', group: '', order: 0, isActive: true, bannerImage: '' }

export default function CategoriesManager() {
  const { forceLockOut } = useAdmin()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { categories } = await fetchAdminCategories()
      setCategories(categories)
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  function openAdd() { setEditing(null); setForm(BLANK); setModalOpen(true) }
  function openEdit(c) { setEditing(c); setForm({ ...BLANK, ...c }); setModalOpen(true) }

  async function handleSubmit() {
    setBusy(true); setError('')
    try {
      if (editing) await updateCategory(editing._id, form)
      else await createCategory(form)
      setModalOpen(false); load()
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setBusy(false) }
  }

  async function handleDelete(c) {
    if (!confirm(`Delete category "${c.name}"? Products in it will stay but lose this category link.`)) return
    try { await deleteCategory(c._id); load() } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Categories</h1>
          <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Bride, Groom, Jewellery, Couple &amp; Occasion groupings.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-2xl border border-ink/10 dark:border-ivory/10 overflow-hidden bg-ivory dark:bg-charcoal">
        {loading ? <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">Loading…</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink/40 dark:text-ivory/40 text-xs uppercase border-b border-ink/10 dark:border-ivory/10">
              <tr><th className="p-4">Name</th><th className="p-4">Group</th><th className="p-4">Slug</th><th className="p-4">Active</th><th className="p-4"></th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id} className="border-b border-ink/5 dark:border-ivory/5 last:border-0">
                  <td className="p-4 text-ink dark:text-ivory">{c.name}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{c.group}</td>
                  <td className="p-4 text-ink/40 dark:text-ivory/40">{c.slug}</td>
                  <td className="p-4">{c.isActive ? 'Yes' : 'No'}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-ink/10 dark:hover:bg-ivory/10 text-ink dark:text-ivory"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-red-500/10 text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <FloatingModal title={editing ? `Edit ${editing.name}` : 'Add Category'} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} busy={busy}>
          <ImageUploadField label="Category Banner (optional)" value={form.bannerImage} onChange={(url) => setForm((f) => ({ ...f, bannerImage: url }))} usedIn="category" />
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                   className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Slug (URL — leave blank to auto-generate)</label>
            <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                   className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Group / Hub</label>
            <select value={form.group} onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory">
              <option value="">Select…</option>
              <option value="bride">Bride</option>
              <option value="groom">Groom</option>
              <option value="bridal-jewellery">Bridal Jewellery</option>
              <option value="groom-jewellery">Groom Jewellery</option>
              <option value="couple">Couple</option>
              <option value="occasion">Occasion</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Display Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="cat-active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              <label htmlFor="cat-active" className="text-sm text-ink dark:text-ivory">Active (visible on site)</label>
            </div>
          </div>
        </FloatingModal>
      )}
    </div>
  )
}
