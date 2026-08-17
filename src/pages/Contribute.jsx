// RCFMOUAULIBRARYreact/student-dashboard/src/pages/Contribute.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import StatusBadge from '../components/ui/StatusBadge'
import LibraryLoader from '../components/ui/LibraryLoader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { communityApi } from '../services/api'
import { grainyGradientStyle } from '../lib/grainyGradient'
import { rippleThenNavigate } from '../lib/ripple'

const requestGradient = grainyGradientStyle('linear-gradient(135deg, #6D5DF6 0%, #4338CA 100%)')
// Renamed from suggestGradient — same warm amber tone, now backs the
// "Heads Up" tile instead of the old Suggest Material tile.
const headsUpGradient = grainyGradientStyle('linear-gradient(135deg, #FFB74D 0%, #FB8C00 100%)')
const submitGradient = grainyGradientStyle('linear-gradient(135deg, #26C6DA 0%, #0097A7 100%)')
const contributorsGradient = grainyGradientStyle('linear-gradient(135deg, #F06AAE 0%, #C2185B 100%)')

const bgIconWrapStyle = { color: 'rgba(255,255,255,0.2)', zIndex: 0 }

const smoothClipStyle = {
  WebkitMaskImage: '-webkit-radial-gradient(white, black)',
  maskImage: 'radial-gradient(white, black)',
}

function IconSearchInsights(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
      <path d="M8 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Replaces IconAutoAwesome (the star burst) — a megaphone, matching the
// "campaign" icon already used elsewhere for admin announcements.
function IconCampaign(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M3 11v2a2 2 0 002 2h1l3 5V6L6 11H5a2 2 0 00-2 0z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 6l9-3v18l-9-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 9a3 3 0 010 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCloudUpload(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M7 18a4.5 4.5 0 01-.7-8.94A5.5 5.5 0 0117 8.5a4 4 0 01-.5 7.98" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v7" strokeLinecap="round" />
      <path d="M9 15l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrophy(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M8 4h8v5a4 4 0 01-8 0V4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5H5a3 3 0 003 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 5h3a3 3 0 01-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v3" strokeLinecap="round" />
      <path d="M9 20h6" strokeLinecap="round" />
      <path d="M10 16h4l1 4H9l1-4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconDescription(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M7 3h7l4 4v14H7V3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  )
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateString).toLocaleDateString()
}

function Contribute() {
  const navigate = useNavigate()
  const [myUploads, setMyUploads] = useState([])
  const [topContributors, setTopContributors] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      communityApi.myUploads().catch(() => ({ items: [] })),
      communityApi.leaderboard().catch(() => ({ items: [] })),
    ]).then(([uploadsRes, leaderboardRes]) => {
      if (cancelled) return
      setMyUploads(uploadsRes.items || [])
      setTopContributors(leaderboardRes.items || [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  async function confirmDelete() {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setPendingDelete(null)
    setDeletingId(id)
    try {
      await communityApi.deleteMyUpload(id)
      setMyUploads((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setErrorMsg(err.message || 'Could not delete this submission.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Contribute" />

      <main className="pb-32 pt-[68px]">
        <section className="px-margin-mobile pt-stack-md pb-stack-md">
          <h2 className="font-display text-display text-on-surface">Contribute</h2>
          <p className="font-body-md text-on-surface-variant mt-1">Help grow the library.</p>
        </section>

        <section className="px-margin-mobile grid grid-cols-1 gap-gutter">
          <button
            onClick={(e) => rippleThenNavigate(e, () => navigate('/contribute/request'))}
            style={{ ...requestGradient, ...smoothClipStyle }}
            className="border border-outline p-stack-md rounded-2xl text-left flex flex-col justify-between h-40 relative overflow-hidden isolate active:scale-[0.98] transition-transform"
          >
            <IconSearchInsights
              className="absolute -top-10 -right-10 w-[220px] h-[220px] pointer-events-none select-none"
              style={bgIconWrapStyle}
            />
            <div className="relative z-10">
              <h3 className="font-headline-md text-headline-md text-white">Request Material</h3>
              <p className="font-label-md text-label-md text-white/70 mt-1">Can't find a book?</p>
            </div>
            <span className="relative z-10 text-label-sm font-label-sm py-1 px-3 rounded-full bg-white text-on-primary w-fit">
              NEW REQUEST
            </span>
          </button>

          <div className="grid grid-cols-2 gap-gutter">
            <button
              onClick={(e) => rippleThenNavigate(e, () => navigate('/contribute/heads-up'))}
              style={{ ...headsUpGradient, ...smoothClipStyle }}
              className="border border-outline p-stack-md rounded-2xl text-left flex flex-col justify-end min-h-[140px] relative overflow-hidden isolate active:scale-[0.98] transition-transform"
            >
              <IconCampaign
                className="absolute -top-8 -right-8 w-[160px] h-[160px] pointer-events-none select-none"
                style={bgIconWrapStyle}
              />
              <h3 className="relative z-10 font-headline-md text-headline-md text-white leading-tight">
                Heads
                <br />
                Up
              </h3>
            </button>

            <button
              onClick={(e) => rippleThenNavigate(e, () => navigate('/contribute/submit'))}
              style={{ ...submitGradient, ...smoothClipStyle }}
              className="border border-outline p-stack-md rounded-2xl text-left flex flex-col justify-end min-h-[140px] relative overflow-hidden isolate active:scale-[0.98] transition-transform"
            >
              <IconCloudUpload
                className="absolute -top-8 -right-8 w-[160px] h-[160px] pointer-events-none select-none"
                style={bgIconWrapStyle}
              />
              <h3 className="relative z-10 font-headline-md text-headline-md text-white leading-tight">
                Submit
                <br />
                Resource
              </h3>
            </button>
          </div>
        </section>

        <section className="mt-stack-lg px-margin-mobile">
          <div className="flex justify-between items-end mb-stack-md">
            <h3 className="font-headline-md text-headline-md text-on-surface">My Contributions</h3>
            {myUploads.length > 0 && (
              <button onClick={() => navigate('/contributions')} className="text-label-md font-label-md text-primary">
                View All
              </button>
            )}
          </div>

          {loading && <LibraryLoader size={500} fullScreen />}

          {!loading && myUploads.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant py-stack-sm">Nothing submitted yet.</p>
          )}

          {errorMsg && (
            <p className="font-label-sm text-label-sm text-red-400 mb-stack-sm">{errorMsg}</p>
          )}

          <div className="flex flex-col gap-gutter">
            {myUploads.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-outline/30 last:border-0">
                <div className="w-12 h-16 flex-none bg-surface-container-highest rounded overflow-hidden border border-outline/50 flex items-center justify-center">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <IconDescription className="w-6 h-6 text-on-surface-variant" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.title}</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Submitted • {timeAgo(item.created_at)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
                {item.status !== 'approved' && (
                  <button
                    onClick={() => setPendingDelete({ id: item.id, title: item.title })}
                    disabled={deletingId === item.id}
                    className="w-9 h-9 flex-none rounded-full bg-red-500/10 text-red-400 flex items-center justify-center disabled:opacity-50"
                    aria-label={`Delete ${item.title}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {deletingId === item.id ? 'progress_activity' : 'delete'}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-stack-lg px-margin-mobile">
          <div style={{ ...contributorsGradient, ...smoothClipStyle }} className="rounded-2xl p-stack-md border border-outline relative overflow-hidden isolate">
            <IconTrophy
              className="absolute -top-10 -right-10 w-[200px] h-[200px] pointer-events-none select-none"
              style={bgIconWrapStyle}
            />

            <div className="relative z-10">
              <h4 className="font-headline-md text-headline-md text-white mb-stack-sm">Top Contributors</h4>

              {topContributors.length === 0 && !loading ? (
                <p className="font-label-md text-label-md text-white/70">Be the first.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {topContributors.slice(0, 3).map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between gap-3 bg-black/15 rounded-xl p-stack-sm border border-white/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 flex-none rounded-full bg-white/20 border border-white/20 overflow-hidden flex items-center justify-center font-label-sm text-label-sm text-white">
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            initials(person.name)
                          )}
                        </div>
                        <span className="font-body-md text-body-md font-semibold text-white truncate">{person.name}</span>
                      </div>
                      {(person.uploads_count ?? person.contributions ?? person.score) != null && (
                        <span className="font-label-sm text-label-sm text-white/80 flex-none">
                          {person.uploads_count ?? person.contributions ?? person.score}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate('/leaderboard')}
                className="mt-stack-md flex items-center gap-1 font-label-sm text-label-sm text-white/90 uppercase tracking-widest hover:text-white transition-colors"
              >
                View Leaderboard
                <IconArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this submission?"
        message={pendingDelete ? `Delete "${pendingDelete.title}" permanently? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

export default Contribute