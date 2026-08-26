// ============================================================================
// components/ui/Toast.jsx — renders the small floating popup message (e.g.
// "Added to your rental bag") at the bottom-center of the screen. Rendered
// once in App.jsx so it can appear over any page. The actual message text
// and timing (shows for ~2.4s then disappears) is controlled by
// ShowroomContext.jsx's `notify()` function — this component just displays
// whatever `toast` currently holds, or renders nothing if it's empty.
// ============================================================================
import { useShowroom } from '../../context/ShowroomContext'

export default function Toast() {
  const { toast } = useShowroom()
  if (!toast) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full bg-ink text-ivory dark:bg-ivory dark:text-ink text-sm shadow-xl animate-fade-up">
      {toast}
    </div>
  )
}
