// ============================================================================
// admin/components/ImageUploadField.jsx — the "drag/click to upload an
// image, see a preview, replace or remove it" control used by every image
// field across the CMS (product cover/gallery, banner image, category
// banner, gallery photo). This is what makes uploading images work
// without touching code — no code-editing, no Cloudinary dashboard, just
// pick a file here.
//
// Props:
//   value      -> current image URL (or '' / null if none yet)
//   onChange   -> (url) => void, called with the new Cloudinary/disk URL
//                 once the upload finishes
//   label      -> field label shown above the box
//   usedIn     -> optional tag sent to the backend (see models/Media.js)
//                 so the Media Library can filter by where an image is used
// ============================================================================
import { useRef, useState } from 'react'
import { UploadCloud, X, Loader2, ImageOff } from 'lucide-react'
import { uploadImage } from '../../api/adminApi'

export default function ImageUploadField({ value, onChange, label, usedIn }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file) {
    if (!file) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG or WEBP images are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setError('')
    setUploading(true)
    try {
      const { media } = await uploadImage(file, usedIn)
      onChange(media.url)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label && <p className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2">{label}</p>}

      <div
        className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-ink/20 dark:border-ivory/20 overflow-hidden bg-ink/5 dark:bg-ivory/5 grid place-items-center cursor-pointer group"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files?.[0])
        }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-ivory text-xs font-label tracking-wide">Click to replace</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/70 text-ivory grid place-items-center hover:bg-ink"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-ink/50 dark:text-ivory/50">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink/40 dark:text-ivory/40 px-4 text-center">
            <UploadCloud size={22} />
            <span className="text-xs">Click or drag an image here<br />JPG, PNG or WEBP · up to 5MB</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><ImageOff size={12} /> {error}</p>
      )}
    </div>
  )
}
