// Desktop-only "View all" destination — the exact same notifications
// content as the mobile /notifications page (imported directly, not
// duplicated), shown as a centered popup instead of taking over the
// center column. Mirrors the audio/video rule: desktop never shows the
// full mobile page, always the popup version.
import { useNotificationsModal } from '../../contexts/NotificationsModalContext'
import { NotificationsContent } from '../../pages/Notifications'

function NotificationsModal() {
  const { open, closeModal } = useNotificationsModal()
  if (!open) return null

  return (
    <div className="hidden md:flex fixed inset-0 z-[100] items-center justify-center bg-black/50" onClick={closeModal}>
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col bg-surface border border-outline rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline flex-none">
          <h2 className="font-headline-md text-headline-md font-display text-on-surface">Notifications</h2>
          <button onClick={closeModal} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high" aria-label="Close">
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NotificationsContent />
        </div>
      </div>
    </div>
  )
}

export default NotificationsModal