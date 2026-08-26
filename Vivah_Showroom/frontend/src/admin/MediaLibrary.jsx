// ============================================================================
// admin/MediaLibrary.jsx — the "Google Drive-like" image browser: every
// image ever uploaded through the CMS (see backend/src/models/Media.js),
// browsable and deletable independent of which product/banner/gallery item
// it's attached to. Also doubles as a quick standalone upload tool.
// ============================================================================
import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { fetchMedia, deleteMedia } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'
import ImageUploadField from './components/ImageUploadField'

export default function MediaLibrary() {
  const { forceLockOut } = useAdmin()
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try { setMedia((await fetchMedia()).media) } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleDelete(m) {
    if (!confirm('Delete this image from the library? If it is still used on a product/banner/gallery item, replace it there first.')) return
    try { await deleteMedia(m._id); load() } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Media Library</h1>
      <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Every image uploaded through the CMS, in one place — like a photo drive.</p>

      <div className="mt-6 max-w-xs">
        <ImageUploadField label="Quick upload" value="" onChange={() => load()} usedIn="library" />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {loading ? <p className="text-sm text-ink/40 dark:text-ivory/40">Loading…</p> : media.map((m) => (
          <div key={m._id} className="relative aspect-square rounded-xl overflow-hidden group border border-ink/10 dark:border-ivory/10">
            <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button onClick={() => navigator.clipboard.writeText(m.url)} className="text-[10px] px-2 py-1 rounded-full bg-white/90 text-ink">Copy URL</button>
              <button onClick={() => handleDelete(m)} className="w-7 h-7 rounded-full bg-red-600 text-white grid place-items-center"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
