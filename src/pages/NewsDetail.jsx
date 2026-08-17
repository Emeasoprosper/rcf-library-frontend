// RCFMOUAULIBRARYreact/student-dashboard/src/pages/NewsDetail.jsx
// The dedicated "read it fully" page. Both popup styles land here.
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import { newsApi } from '../services/api'

function NewsDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    newsApi
      .get(id)
      .then((data) => { if (!cancelled) setItem(data) })
      .catch(() => { if (!cancelled) setError("This item isn't available anymore.") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const isImage = item?.attachment_url && (item.attachment_mime ? item.attachment_mime.startsWith('image/') : true)
  const isDoc = item?.attachment_url && !isImage

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title={item?.type === 'announcement' ? 'Announcement' : 'News'} showBack />

      <main className="pb-32 pt-[68px] px-margin-mobile">
        {loading && (
          <p className="font-body-md text-body-md text-on-surface-variant text-center py-stack-lg">Loading…</p>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">error</span>
            <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
            <button
              onClick={() => navigate('/notifications')}
              className="mt-stack-md px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md"
            >
              Back to Notifications
            </button>
          </div>
        )}

        {!loading && !error && item && (
          <div className="flex flex-col gap-stack-md pt-stack-md">
            {isImage && (
              <img
                src={item.attachment_url}
                alt=""
                className="w-full h-auto rounded-2xl border border-outline object-contain"
              />
            )}

            {isDoc && (
              <a
                href={item.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-stack-md rounded-2xl bg-surface-container border border-outline"
              >
                <span className="material-symbols-outlined text-primary text-2xl">description</span>
                <span className="font-body-md text-body-md text-on-surface">Open attached document</span>
              </a>
            )}

            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-wide">
                {item.type === 'announcement' ? 'Announcement' : 'News'}
              </span>
              <h1 className="font-headline-lg text-headline-lg font-display text-on-surface mt-1 mb-2">
                {item.title}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-wrap">
                {item.message}
              </p>
            </div>

            {item.hidden_detail && (
              <div className="p-stack-md rounded-2xl bg-surface-container border border-outline">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-1">
                  More details
                </p>
                <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">
                  {item.hidden_detail}
                </p>
              </div>
            )}

            {item.link_url && (
              <a
                href={item.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-lg font-label-md text-label-md font-semibold bg-orange-500 text-white text-center active:scale-[0.98] transition-transform"
              >
                Open Link
              </a>
            )}

            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default NewsDetail