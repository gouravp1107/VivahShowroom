// ============================================================================
// admin/ProductsManager.jsx — the CMS's Products/Rentals screen: list with
// search/status filter, plus Add/Edit via the floating modal (see
// admin/components/FloatingModal.jsx + ImageUploadField.jsx). Also where
// Product content is managed here. Physical stock/reserved/damaged inventory
// is managed in the dedicated /admin/inventory screen (PostgreSQL/Prisma).
// ============================================================================
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { fetchAdminProducts, createProduct, updateProduct, deleteProduct, fetchAdminCategories } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'
import FloatingModal from './components/FloatingModal'
import ImageUploadField from './components/ImageUploadField'

const BLANK = {
  name: '', category: '', description: '', shortDescription: '',
  rentalPrice: '', deposit: '', stock: 1, sizes: '', colorway: '',
  status: 'published', isFeatured: false, tags: '',
  coverImage: '', images: [], sizeStock: [], sections: [],
}

export default function ProductsManager() {
  const { forceLockOut } = useAdmin()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const [{ products }, { categories }] = await Promise.all([
        fetchAdminProducts(`?${params.toString()}`),
        fetchAdminCategories(),
      ])
      setProducts(products)
      setCategories(categories)
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, status]) // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditing(null)
    setForm(BLANK)
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditing(p)
    setForm({
      ...BLANK,
      ...p,
      category: p.category?._id || p.category || '',
      sizes: (p.sizes || []).join(', '),
      tags: (p.tags || []).join(', '),
      sizeStock: p.sizeStock || [],
      images: p.images || [],
      sections: p.sections || [],
    })
    setModalOpen(true)
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateSizeStock(size, quantity) {
    setForm((f) => {
      const existing = f.sizeStock.find((s) => s.size === size)
      const sizeStock = existing
        ? f.sizeStock.map((s) => (s.size === size ? { ...s, quantity: Number(quantity) } : s))
        : [...f.sizeStock, { size, quantity: Number(quantity) }]
      return { ...f, sizeStock }
    })
  }

  function addGalleryImage(url) {
    if (!url) return
    setForm((f) => ({ ...f, images: [...f.images, url] }))
  }
  function removeGalleryImage(idx) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  async function handleSubmit() {
    setBusy(true)
    setError('')
    try {
      const payload = {
        ...form,
        rentalPrice: Number(form.rentalPrice) || 0,
        deposit: Number(form.deposit) || 0,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      }
      if (!editing) {
        payload.stock = form.sizeStock.length ? form.sizeStock.reduce((s, r) => s + Number(r.quantity || 0), 0) : Number(form.stock) || 0
        payload.sizeStock = form.sizeStock
      } else {
        delete payload.stock
        delete payload.sizeStock
        delete payload.lowStockThreshold
      }
      if (editing) await updateProduct(editing._id, payload)
      else await createProduct(payload)
      setModalOpen(false)
      load()
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone. Consider Archiving instead if you may need it later.`)) return
    try {
      await deleteProduct(p._id)
      load()
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  async function quickStatus(p, newStatus) {
    try {
      await updateProduct(p._id, { status: newStatus })
      load()
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Products / Rentals</h1>
          <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Create, edit, publish and manage inventory for the rental catalog.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-ivory/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
                 className="pl-9 pr-4 py-2 rounded-full border border-ink/20 dark:border-ivory/20 bg-transparent text-sm text-ink dark:text-ivory" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2 rounded-full border border-ink/20 dark:border-ivory/20 bg-transparent text-sm text-ink dark:text-ivory">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-2xl border border-ink/10 dark:border-ivory/10 overflow-hidden bg-ivory dark:bg-charcoal">
        {loading ? (
          <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">Loading…</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">No products yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink/40 dark:text-ivory/40 text-xs uppercase border-b border-ink/10 dark:border-ivory/10">
              <tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Price/day</th><th className="p-4">Stock</th><th className="p-4">Status</th><th className="p-4"></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-ink/5 dark:border-ivory/5 last:border-0">
                  <td className="p-4 flex items-center gap-3">
                    <img src={p.coverImage || p.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-ink/10" />
                    <span className="text-ink dark:text-ivory">{p.name}</span>
                    {p.isFeatured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold-dark">Featured</span>}
                  </td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{p.category?.name || '—'}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">₹{p.rentalPrice}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{p.stock}{p.stock <= (p.lowStockThreshold ?? 2) && <span className="ml-1 text-amber-600 text-xs">low</span>}</td>
                  <td className="p-4">
                    <select value={p.status} onChange={(e) => quickStatus(p, e.target.value)}
                            className="text-xs px-2 py-1 rounded-full border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-ink/10 dark:hover:bg-ivory/10 text-ink dark:text-ivory"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-red-500/10 text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <FloatingModal title={editing ? `Edit ${editing.name}` : 'Add Product'} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} busy={busy} wide>
          <div className="grid sm:grid-cols-2 gap-4">
            <ImageUploadField label="Cover Image" value={form.coverImage} onChange={(url) => updateField('coverImage', url)} usedIn="product" />
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Name</label>
                <input required value={form.name} onChange={(e) => updateField('name', e.target.value)}
                       className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Category</label>
                <select required value={form.category} onChange={(e) => updateField('category', e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory">
                  <option value="">Select…</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="featured" checked={form.isFeatured} onChange={(e) => updateField('isFeatured', e.target.checked)} />
                <label htmlFor="featured" className="text-sm text-ink dark:text-ivory">Featured on homepage</label>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Rental Price / day (₹)</label>
              <input required type="number" value={form.rentalPrice} onChange={(e) => updateField('rentalPrice', e.target.value)}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Security Deposit (₹)</label>
              <input type="number" value={form.deposit} onChange={(e) => updateField('deposit', e.target.value)}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Short Description</label>
            <input value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)}
                   className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Full Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Sizes (comma separated)</label>
              <input value={form.sizes} onChange={(e) => updateField('sizes', e.target.value)} placeholder="S, M, L, XL"
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Tags / Occasions (comma separated)</label>
              <input value={form.tags} onChange={(e) => updateField('tags', e.target.value)} placeholder="wedding, reception"
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
          </div>

          {/* Initial per-size inventory for a brand-new product. Existing stock is managed in the dedicated Inventory screen. */}
          {form.sizes && !editing && (
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Stock per size</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {form.sizes.split(',').map((s) => s.trim()).filter(Boolean).map((size) => (
                  <div key={size} className="flex items-center gap-2">
                    <span className="text-xs w-8 text-ink/60 dark:text-ivory/60">{size}</span>
                    <input type="number" min="0"
                           value={form.sizeStock.find((r) => r.size === size)?.quantity ?? 0}
                           onChange={(e) => updateSizeStock(size, e.target.value)}
                           className="w-full px-2 py-1.5 rounded-lg border border-ink/20 dark:border-ivory/20 bg-transparent text-sm text-ink dark:text-ivory" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {editing && (
            <div className="rounded-xl border border-ink/10 dark:border-ivory/10 p-4 text-sm text-ink/60 dark:text-ivory/60">
              Physical stock, reserved/rented units, damaged units, SKU, location and cost price are managed from <strong>Admin → Inventory</strong>.
            </div>
          )}

          {/* Gallery images */}
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Gallery Images</label>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeGalleryImage(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100">✕</button>
                </div>
              ))}
              <div className="aspect-square">
                <ImageUploadField value="" onChange={addGalleryImage} usedIn="product" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Status</label>
            <select value={form.status} onChange={(e) => updateField('status', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory">
              <option value="draft">Draft — not visible publicly</option>
              <option value="published">Published — visible on site</option>
              <option value="archived">Archived — hidden, kept in records</option>
            </select>
          </div>
        </FloatingModal>
      )}
    </div>
  )
}
