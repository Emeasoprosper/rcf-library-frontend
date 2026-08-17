// RCFMOUAULIBRARYreact/student-dashboard/src/pages/admin/AdminAnnouncements.jsx
import { useState, useRef, useEffect } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import { adminApi } from '../../services/api'
import { formatBytes } from '../../lib/formatBytes'
import PreviewEditModal from '../../components/ui/PreviewEditModal'

const typeConfig = {
  announcement: { label: 'Popup Notification', icon: 'campaign', cta: 'Send Popup Notification' },
  news: { label: 'News', icon: 'newspaper', cta: 'Publish News' },
  advert: { label: 'Advert', icon: 'ads_click', cta: 'Publish Advert' },
}

function AdminAnnouncements() {
  const [type, setType] = useState('announcement')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const [attachmentPreview, setAttachmentPreview] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dailyStartTime, setDailyStartTime] = useState('')
  const [dailyEndTime, setDailyEndTime] = useState('')
  // New: popup style + hidden detail + link — only meaningful for
  // type === 'announcement' (the actual popup notifications).
  const [popupStyle, setPopupStyle] = useState('rich') // 'rich' | 'image_only'
  const [hiddenDetail, setHiddenDetail] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [sentLog, setSentLog] = useState([])
  const [loadingSentLog, setLoadingSentLog] = useState(true)
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    adminApi
      .listAnnouncements()
      .then((res) => {
        if (!cancelled) setSentLog(res.items || [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingSentLog(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAttachment(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setAttachmentPreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setAttachmentPreview(null)
    }
  }

  const removeAttachment = () => {
    setAttachment(null)
    setAttachmentPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return
    setSending(true)
    setError('')

    try {
      let uploadedUrl = null
      let uploadedMime = null

      if (attachment) {
        // Images and PDFs now both go through — the old "images only"
        // block is gone since the backend accepts PDFs too.
        const { url, mime } = await adminApi.uploadAnnouncementAttachment(attachment)
        uploadedUrl = url
        uploadedMime = mime
      }

      const { id } = await adminApi.createAnnouncement({
        type,
        title: title.trim(),
        message: message.trim(),
        attachmentUrl: uploadedUrl,
        attachmentMime: uploadedMime,
        sendEmail,
        startsAt: startDate ? `${startDate}T00:00:00` : null,
        endsAt: endDate ? `${endDate}T23:59:59` : null,
        dailyStartTime: dailyStartTime || null,
        dailyEndTime: dailyEndTime || null,
        popupStyle: type === 'announcement' ? popupStyle : 'rich',
        hiddenDetail: hiddenDetail.trim() || null,
        linkUrl: linkUrl.trim() || null,
      })

      setSentLog((prev) => [
        {
          id,
          type,
          title,
          message,
          send_email: sendEmail,
          attachment_url: uploadedUrl,
          attachment_mime: uploadedMime,
          created_at: new Date().toISOString(),
          starts_at: startDate ? `${startDate}T00:00:00` : null,
          ends_at: endDate ? `${endDate}T23:59:59` : null,
          daily_start_time: dailyStartTime || null,
          daily_end_time: dailyEndTime || null,
          popup_style: type === 'announcement' ? popupStyle : 'rich',
          hidden_detail: hiddenDetail.trim() || null,
          link_url: linkUrl.trim() || null,
        },
        ...prev,
      ])
      setTitle('')
      setMessage('')
      setSendEmail(false)
      setStartDate('')
      setEndDate('')
      setDailyStartTime('')
      setDailyEndTime('')
      setPopupStyle('rich')
      setHiddenDetail('')
      setLinkUrl('')
      removeAttachment()
    } catch (err) {
      setError(err.message || 'Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await adminApi.deleteAnnouncement(id)
      setSentLog((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const config = typeConfig[type]

  const editorFields = [
    { key: 'title', label: 'Title', value: title, type: 'text' },
    { key: 'message', label: 'Message', value: message, type: 'textarea' },
  ]

  const handleEditorSave = (key, value) => {
    if (key === 'title') setTitle(value)
    if (key === 'message') setMessage(value)
  }

  function formatSchedule(item) {
    const parts = []
    if (item.starts_at || item.ends_at) {
      const start = item.starts_at ? new Date(item.starts_at).toLocaleDateString() : '…'
      const end = item.ends_at ? new Date(item.ends_at).toLocaleDateString() : '…'
      parts.push(`${start} – ${end}`)
    }
    if (item.daily_start_time && item.daily_end_time) {
      parts.push(`${item.daily_start_time.slice(0, 5)}–${item.daily_end_time.slice(0, 5)} daily`)
    }
    return parts.join(' • ')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Announcements" showBack />

      <main className="pb-32 pt-[68px] px-margin-mobile">
        <div className="flex gap-2 mb-stack-lg">
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex-1 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                type === key ? 'bg-primary text-on-primary' : 'bg-surface-container border border-outline text-on-surface-variant'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-stack-md mb-stack-lg">
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-4 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
            />
          </div>

          <div>
            <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md resize-none"
            />
          </div>

          <div>
            <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">
              Attachment (image or PDF)
            </label>
            {!attachment ? (
              <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border border-dashed border-outline bg-surface-container cursor-pointer hover:border-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">attach_file</span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Tap to attach an image or document
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-outline bg-surface-container flex gap-4 p-stack-md">
                {attachmentPreview ? (
                  <img
                    src={attachmentPreview}
                    alt={attachment.name}
                    className="w-16 h-20 rounded-lg object-cover flex-none border border-outline"
                  />
                ) : (
                  <div className="w-16 h-20 rounded-lg bg-surface-container-highest border border-outline flex items-center justify-center flex-none">
                    <span className="material-symbols-outlined text-on-surface-variant">picture_as_pdf</span>
                  </div>
                )}

                <div className="flex-grow min-w-0 flex flex-col justify-center gap-1">
                  <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{attachment.name}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{formatBytes(attachment.size)}</p>
                </div>

                <div className="flex flex-col items-end justify-between flex-none">
                  <button
                    onClick={() => setEditorOpen(true)}
                    className="w-8 h-8 rounded-full bg-surface-container-highest hover:bg-surface-container-high transition-colors flex items-center justify-center"
                    aria-label="Edit title and message"
                  >
                    <span className="material-symbols-outlined text-on-surface text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={removeAttachment}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                    aria-label="Remove attachment"
                  >
                    <span className="material-symbols-outlined text-[22px]">cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {type === 'announcement' && (
            <>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">
                  Popup style
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPopupStyle('rich')}
                    className={`flex-1 py-2.5 rounded-lg font-label-md text-label-md transition-colors ${
                      popupStyle === 'rich' ? 'bg-primary text-on-primary' : 'bg-surface-container border border-outline text-on-surface-variant'
                    }`}
                  >
                    Rich (text + attachment)
                  </button>
                  <button
                    onClick={() => setPopupStyle('image_only')}
                    className={`flex-1 py-2.5 rounded-lg font-label-md text-label-md transition-colors ${
                      popupStyle === 'image_only' ? 'bg-primary text-on-primary' : 'bg-surface-container border border-outline text-on-surface-variant'
                    }`}
                  >
                    Image only
                  </button>
                </div>
                {popupStyle === 'image_only' && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                    The popup will show only the attached image (no border, transparent background). Title/message/hidden details still get shown when the user taps it to read more.
                  </p>
                )}
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">
                  Extra details (only shown on the full read page, optional)
                </label>
                <textarea
                  rows={3}
                  value={hiddenDetail}
                  onChange={(e) => setHiddenDetail(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md resize-none"
                />
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full h-12 px-4 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
                />
              </div>
            </>
          )}

          <div>
            <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">
              Show only during this date range (optional)
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 h-12 px-4 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 h-12 px-4 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
              />
            </div>
          </div>

          <div>
            <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">
              And only during this time each day (optional)
            </label>
            <div className="flex gap-3">
              <input
                type="time"
                value={dailyStartTime}
                onChange={(e) => setDailyStartTime(e.target.value)}
                className="flex-1 h-12 px-4 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
              />
              <input
                type="time"
                value={dailyEndTime}
                onChange={(e) => setDailyEndTime(e.target.value)}
                className="flex-1 h-12 px-4 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
              />
            </div>
          </div>

          {type === 'announcement' && (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-5 h-5 rounded border-outline accent-black"
              />
              <span className="font-body-md text-body-md text-on-surface">Also send via email</span>
            </label>
          )}

          {error && (
            <div className="p-stack-md rounded-xl bg-error/10 border border-error/30">
              <p className="font-body-md text-body-md text-error">{error}</p>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!title.trim() || !message.trim() || sending}
            className={`w-full py-4 rounded-lg font-headline-md text-headline-md transition-all ${
              title.trim() && message.trim() && !sending
                ? 'bg-primary text-on-primary active:scale-[0.98] hover:opacity-90'
                : 'bg-primary text-on-primary opacity-50 cursor-not-allowed'
            }`}
          >
            {sending ? 'Sending…' : config.cta}
          </button>
        </div>

        {!loadingSentLog && sentLog.length > 0 && (
          <section>
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">
              Sent
            </h2>
            <div className="flex flex-col gap-gutter">
              {sentLog.map((item) => (
                <div key={item.id} className="p-stack-md rounded-xl bg-surface-container border border-outline">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-primary text-[16px]">
                        {typeConfig[item.type].icon}
                      </span>
                      <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</p>
                      {item.type === 'announcement' && item.popup_style === 'image_only' && (
                        <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] uppercase tracking-wide flex-none">
                          Image only
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      aria-label="Delete"
                      className="flex-none w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {deletingId === item.id ? 'hourglass_empty' : 'delete'}
                      </span>
                    </button>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{item.message}</p>
                  {item.attachment_url && (
                    <img
                      src={item.attachment_url}
                      alt=""
                      className="w-full max-w-[160px] rounded mt-2 border border-outline"
                    />
                  )}
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                    {new Date(item.created_at).toLocaleString()}
                    {item.send_email ? ' • queued for email (not yet wired)' : ''}
                  </p>
                  {formatSchedule(item) && (
                    <p className="font-label-sm text-label-sm text-primary mt-1">{formatSchedule(item)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <PreviewEditModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        seed={attachment ? `${attachment.name}-${attachment.size}` : type}
        previewUrl={attachmentPreview}
        fallbackIcon={typeConfig[type].icon}
        fields={editorFields}
        onFieldSave={handleEditorSave}
      />

      <AdminNav />
    </div>
  )
}

export default AdminAnnouncements