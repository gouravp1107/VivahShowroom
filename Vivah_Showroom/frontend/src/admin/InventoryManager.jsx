import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Minus, AlertTriangle, History } from 'lucide-react'
import { fetchInventory, fetchInventorySummary, updateInventory, adjustInventory, fetchInventoryHistory } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'
import FloatingModal from './components/FloatingModal'

const EMPTY = {
  productId: '', sku: '', location: '', totalUnits: 1, reservedUnits: 0,
  damagedUnits: 0, lowStockThreshold: 2, costPrice: '', notes: '', sizeStock: [],
}

export default function InventoryManager() {
  const { forceLockOut } = useAdmin()
  const [inventory, setInventory] = useState([])
  const [summary, setSummary] = useState(null)
  const [search, setSearch] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [historyFor, setHistoryFor] = useState(null) // item currently showing history
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [inv, stats] = await Promise.all([
        fetchInventory(lowOnly ? '?lowStock=1' : ''),
        fetchInventorySummary(),
      ])
      setInventory(inv.inventory || [])
      setSummary(stats)
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [lowOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return inventory
    return inventory.filter((i) => `${i.product?.name || ''} ${i.sku || ''} ${i.location || ''}`.toLowerCase().includes(q))
  }, [inventory, search])

  function openEdit(item) {
    setEditing(item)
    setForm({
      productId: item.productId,
      sku: item.sku || '',
      location: item.location || '',
      totalUnits: item.totalUnits,
      reservedUnits: item.reservedUnits,
      damagedUnits: item.damagedUnits,
      lowStockThreshold: item.lowStockThreshold,
      costPrice: item.costPrice ?? '',
      notes: item.notes || '',
      sizeStock: Array.isArray(item.sizeStock) ? item.sizeStock : [],
    })
  }

  function updateSize(size, field, value) {
    setForm((current) => ({
      ...current,
      sizeStock: current.sizeStock.map((row) => row.size === size ? { ...row, [field]: Math.max(0, Number(value || 0)) } : row),
    }))
  }

  async function save() {
    setBusy(true); setError('')
    try {
      await updateInventory(form.productId, {
        sku: form.sku || null,
        location: form.location || null,
        totalUnits: Number(form.totalUnits),
        reservedUnits: Number(form.reservedUnits),
        damagedUnits: Number(form.damagedUnits),
        lowStockThreshold: Number(form.lowStockThreshold),
        costPrice: form.costPrice === '' ? null : Number(form.costPrice),
        notes: form.notes || null,
        sizeStock: form.sizeStock,
      })
      setEditing(null)
      await load()
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setBusy(false) }
  }

  async function adjust(productId, field, delta) {
    try {
      await adjustInventory(productId, field, delta)
      await load()
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  async function openHistory(item) {
    setHistoryFor(item)
    setHistoryLoading(true)
    try {
      const { history } = await fetchInventoryHistory(item.productId)
      setHistory(history || [])
    } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setHistoryLoading(false) }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Inventory</h1>
          <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Owner stock control for physical rental pieces.</p>
        </div>
      </div>

      {summary && (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            ['Items', summary.totalItems],
            ['Total units', summary.totalUnits],
            ['Reserved / rented', summary.reservedUnits],
            ['Damaged', summary.damagedUnits],
            ['Available', summary.availableUnits],
          ].map(([label, value]) => (
            <div key={label} className="p-4 rounded-2xl bg-ivory dark:bg-charcoal border border-ink/10 dark:border-ivory/10">
              <p className="text-[11px] uppercase tracking-wide text-ink/45 dark:text-ivory/45">{label}</p>
              <p className="mt-1 font-display text-2xl text-ink dark:text-ivory">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-ivory/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product, SKU, location…"
            className="pl-9 pr-4 py-2 rounded-full border border-ink/20 dark:border-ivory/20 bg-transparent text-sm text-ink dark:text-ivory w-72" />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/60 dark:text-ivory/60">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 rounded-2xl border border-ink/10 dark:border-ivory/10 overflow-x-auto bg-ivory dark:bg-charcoal">
        {loading ? <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">Loading inventory…</p> : rows.length === 0 ? (
          <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">No inventory records match.</p>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-left text-ink/40 dark:text-ivory/40 text-xs uppercase border-b border-ink/10 dark:border-ivory/10">
              <tr><th className="p-4">Product</th><th className="p-4">SKU</th><th className="p-4">Total</th><th className="p-4">Reserved</th><th className="p-4">Damaged</th><th className="p-4">Available</th><th className="p-4">Location</th><th className="p-4"></th></tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-b border-ink/5 dark:border-ivory/5 last:border-0 align-middle">
                  <td className="p-4 text-ink dark:text-ivory">
                    <div className="flex items-center gap-3">
                      <img src={item.product?.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-ink/10" />
                      <div><div>{item.product?.name || 'Deleted product'}</div>{item.lowStock && <div className="text-[11px] text-amber-600 flex items-center gap-1"><AlertTriangle size={11}/> Low stock</div>}</div>
                    </div>
                  </td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{item.sku || '—'}</td>
                  <td className="p-4"><span className="inline-flex items-center gap-1"><button onClick={() => adjust(item.productId, 'totalUnits', -1)} className="w-6 h-6 rounded border border-ink/15 dark:border-ivory/15 grid place-items-center"><Minus size={12}/></button>{item.totalUnits}<button onClick={() => adjust(item.productId, 'totalUnits', 1)} className="w-6 h-6 rounded border border-ink/15 dark:border-ivory/15 grid place-items-center"><Plus size={12}/></button></span></td>
                  <td className="p-4"><span className="inline-flex items-center gap-1"><button onClick={() => adjust(item.productId, 'reservedUnits', -1)} className="w-6 h-6 rounded border border-ink/15 dark:border-ivory/15 grid place-items-center"><Minus size={12}/></button>{item.reservedUnits}<button onClick={() => adjust(item.productId, 'reservedUnits', 1)} className="w-6 h-6 rounded border border-ink/15 dark:border-ivory/15 grid place-items-center"><Plus size={12}/></button></span></td>
                  <td className="p-4">{item.damagedUnits}</td>
                  <td className="p-4 font-medium">{item.lowStock ? <span className="text-amber-600">{item.availableUnits}</span> : item.availableUnits}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{item.location || '—'}</td>
                  <td className="p-4"><div className="flex items-center gap-1">
                    <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-full grid place-items-center hover:bg-ink/10 dark:hover:bg-ivory/10 text-ink dark:text-ivory"><Pencil size={14}/></button>
                    <button onClick={() => openHistory(item)} title="Stock history" className="w-8 h-8 rounded-full grid place-items-center hover:bg-ink/10 dark:hover:bg-ivory/10 text-ink dark:text-ivory"><History size={14}/></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <FloatingModal title={`Edit inventory — ${editing.product?.name || 'Product'}`} onClose={() => setEditing(null)} onSubmit={save} busy={busy} wide>
          <div className="grid sm:grid-cols-2 gap-4">
            {['totalUnits','reservedUnits','damagedUnits','lowStockThreshold'].map((field) => (
              <div key={field}>
                <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input type="number" min="0" value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
              </div>
            ))}
            <div><label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">SKU</label><input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" /></div>
            <div><label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Location</label><input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" placeholder="Rack A1" /></div>
            <div><label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Cost price (₹, owner-only)</label><input type="number" min="0" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" /></div>
          </div>

          {form.sizeStock.length > 0 && (
            <div className="mt-5">
              <label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Size inventory</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {form.sizeStock.map((row) => (
                  <div key={row.size} className="rounded-xl border border-ink/10 dark:border-ivory/10 p-3">
                    <div className="text-xs font-medium text-ink dark:text-ivory">{row.size}</div>
                    <label className="block text-[10px] mt-2 text-ink/50 dark:text-ivory/50">Total</label>
                    <input type="number" min="0" value={row.totalUnits} onChange={(e) => updateSize(row.size, 'totalUnits', e.target.value)} className="w-full px-2 py-1 rounded border bg-transparent" />
                    <label className="block text-[10px] mt-2 text-ink/50 dark:text-ivory/50">Reserved</label>
                    <input type="number" min="0" value={row.reservedUnits} onChange={(e) => updateSize(row.size, 'reservedUnits', e.target.value)} className="w-full px-2 py-1 rounded border bg-transparent" />
                    <label className="block text-[10px] mt-2 text-ink/50 dark:text-ivory/50">Damaged</label>
                    <input type="number" min="0" value={row.damagedUnits} onChange={(e) => updateSize(row.size, 'damagedUnits', e.target.value)} className="w-full px-2 py-1 rounded border bg-transparent" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5"><label className="text-xs uppercase tracking-wide text-ink/60 dark:text-ivory/60">Notes</label><textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows="3" className="w-full mt-1 px-3 py-2 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" /></div>
          <p className="mt-4 text-xs text-ink/50 dark:text-ivory/50">Available is calculated automatically as Total − Reserved − Damaged. Booking and return actions update these counts automatically.</p>
        </FloatingModal>
      )}

      {historyFor && (
        <FloatingModal title={`Stock history — ${historyFor.product?.name || 'Product'}`} onClose={() => { setHistoryFor(null); setHistory([]) }} hideSubmit>
          {historyLoading ? (
            <p className="text-sm text-ink/40 dark:text-ivory/40">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-ivory/40">No changes recorded yet for this product.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((m) => (
                <div key={m.id} className="rounded-xl border border-ink/10 dark:border-ivory/10 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink dark:text-ivory capitalize">{m.action}{m.field ? ` — ${m.field.replace(/([A-Z])/g, ' $1')}` : ''}</span>
                    <span className="text-[11px] text-ink/40 dark:text-ivory/40">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-ink/60 dark:text-ivory/60 mt-1">By {m.adminEmail}</div>
                  {(m.previousValue !== null || m.newValue !== null) && (
                    <div className="text-xs text-ink/50 dark:text-ivory/50 mt-1">
                      {JSON.stringify(m.previousValue)} → {JSON.stringify(m.newValue)}
                    </div>
                  )}
                  {m.reason && <div className="text-xs italic text-ink/50 dark:text-ivory/50 mt-1">"{m.reason}"</div>}
                </div>
              ))}
            </div>
          )}
        </FloatingModal>
      )}
    </div>
  )
}
