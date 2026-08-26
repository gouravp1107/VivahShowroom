// ============================================================================
// admin/CouponsManager.jsx — offers/coupons the Rent Now booking flow's
// offer step reads from (see backend/src/models/Coupon.js,
// frontend/src/pages/RentBooking.jsx).
// ============================================================================
import { useEffect, useState } from 'react'
import { Plus, Trash2, Power } from 'lucide-react'
import { fetchAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'
import FloatingModal from './components/FloatingModal'

const BLANK = { code: '', description: '', discountType: 'percent', discountValue: '', minOrderAmount: 0, maxDiscountAmount: '', expiresAt: '', usageLimit: '', isActive: true }

export default function CouponsManager() {
  const { forceLockOut } = useAdmin()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try { setCoupons((await fetchAdminCoupons()).coupons) } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleSubmit() {
    setBusy(true); setError('')
    try {
      await createCoupon({
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
      })
      setModalOpen(false); setForm(BLANK); load()
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setBusy(false) }
  }

  async function toggleActive(c) {
    try { await updateCoupon(c._id, { isActive: !c.isActive }); load() } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  async function handleDelete(c) {
    if (!confirm(`Delete coupon "${c.code}"?`)) return
    try { await deleteCoupon(c._id); load() } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Offers / Coupons</h1>
          <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Discount codes customers can apply during booking.</p>
        </div>
        <button onClick={() => { setForm(BLANK); setModalOpen(true) }} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-2xl border border-ink/10 dark:border-ivory/10 overflow-hidden bg-ivory dark:bg-charcoal">
        {loading ? <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">Loading…</p> : coupons.length === 0 ? (
          <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">No coupons yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink/40 dark:text-ivory/40 text-xs uppercase border-b border-ink/10 dark:border-ivory/10">
              <tr><th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Min Order</th><th className="p-4">Used</th><th className="p-4">Active</th><th className="p-4"></th></tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-b border-ink/5 dark:border-ivory/5 last:border-0">
                  <td className="p-4 text-ink dark:text-ivory font-mono">{c.code}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">₹{c.minOrderAmount}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                  <td className="p-4">{c.isActive ? 'Yes' : 'No'}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => toggleActive(c)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-ink/10 dark:hover:bg-ivory/10 text-ink dark:text-ivory"><Power size={14} /></button>
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
        <FloatingModal title="Add Coupon" onClose={() => setModalOpen(false)} onSubmit={handleSubmit} busy={busy}>
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Code</label>
            <input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="VIVAH20"
                   className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Description</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                   className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Type</label>
              <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory">
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Value</label>
              <input required type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Min Order (₹)</label>
              <input type="number" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Max Discount (₹, optional)</label>
              <input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Expires (optional)</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Usage Limit (optional)</label>
              <input type="number" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
          </div>
        </FloatingModal>
      )}
    </div>
  )
}
