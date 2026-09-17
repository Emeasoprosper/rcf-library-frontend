// Renders inside RightSidebarPanel when a resource is active. Ported
// from pages/ResourceReader.jsx's loading + playback logic, scoped down
// to fit a 320px column. DEFERRED vs. the old full-page reader: PDF
// zoom/rotate/filmstrip/horizontal mode, docx rendering, image viewer,
// sleep timer, custom video controls/rotate, offline "no copy" screen.
// PDF and video/audio still work — just single-page-at-a-time / native
// controls instead of the richer old UI.
import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { resourcesApi } from '../../services/api'
import { getOffline, saveReadingProgress } from '../../lib/offlineStorage'
import { useActiveResource } from '../../contexts/ActiveResourceContext'
import { extractAccentColorMixedWithBlack } from '../../lib/extractAccentColor'
import ReaderSettingsPanel from '../resource/ReaderSettingsPanel'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

function getViewerKind(fileType = '') {
  if (fileType === 'application/pdf') return 'pdf'
  if (fileType.startsWith('audio/')) return 'audio'
  if (fileType.startsWith('video/')) return 'video'
  if (
    fileType === 'application/msword' ||
    fileType === 'application/vnd.ms-powerpoint' ||
    fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) return 'pdf' // backend converts these to PDF on stream, same as ResourceReader.jsx
  return 'unsupported' // docx/image deferred for now
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2]

function PdfMiniReader({ resource }) {
  const canvasRef = useRef(null)
  const pdfRef = useRef(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [zoom, setZoom] = useState(1)

  function zoomIn() { setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2))) }
  function zoomOut() { setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))) }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setCurrentPage(1)

    async function load() {
      try {
        const offlineEntry = await getOffline(resource.id)
        let arrayBuffer
        if (offlineEntry) {
          arrayBuffer = await offlineEntry.blob.arrayBuffer()
        } else {
          const res = await fetch(resourcesApi.streamUrl(resource.id), { credentials: 'include' })
          if (!res.ok) throw new Error('stream failed')
          arrayBuffer = await res.arrayBuffer()
        }
        if (cancelled) return
        const pdf = await getDocument({ data: arrayBuffer }).promise
        if (cancelled) return
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setLoading(false)
      } catch {
        if (!cancelled) { setError(true); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [resource.id])

  useEffect(() => {
    if (!pdfRef.current || !canvasRef.current) return
    let cancelled = false
    async function renderPage() {
      const page = await pdfRef.current.getPage(currentPage)
      if (cancelled) return
      const containerWidth = canvasRef.current.parentElement?.clientWidth || 280
      const unscaled = page.getViewport({ scale: 1 })
      const fitScale = containerWidth / unscaled.width
      const scale = fitScale * zoom
      const viewport = page.getViewport({ scale })
      const dpr = window.devicePixelRatio || 1
      const canvas = canvasRef.current
      canvas.width = Math.round(viewport.width * dpr)
      canvas.height = Math.round(viewport.height * dpr)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      const context = canvas.getContext('2d')
      context.scale(dpr, dpr)
      await page.render({ canvasContext: context, viewport }).promise
    }
    renderPage()
    return () => { cancelled = true }
  }, [currentPage, numPages, zoom])

  useEffect(() => {
    if (!numPages) return
    resourcesApi.updateProgress(resource.id, Math.round((currentPage / numPages) * 100)).catch(() => {})
    saveReadingProgress(resource.id, currentPage).catch(() => {})
  }, [currentPage, numPages, resource.id])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><span className="w-5 h-5 border-2 border-outline border-t-primary rounded-full animate-spin" /></div>
  }
  if (error) {
    return <p className="px-4 py-6 text-center font-label-sm text-label-sm text-on-surface-variant">Couldn't load this document.</p>
  }

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      <ReaderSettingsPanel onZoomIn={zoomIn} onZoomOut={zoomOut} />
      <div className="flex-1 overflow-auto px-3 py-2 flex justify-center">
        <canvas ref={canvasRef} className="rounded shadow" />
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-outline">
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-surface-container-high">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <span className="font-label-sm text-label-sm text-on-surface-variant">{currentPage} / {numPages}</span>
        <button onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-surface-container-high">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

function MediaMiniPlayer({ resource, kind }) {
  const mediaRef = useRef(kind === 'video' ? null : null)
  const [mediaUrl, setMediaUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [bgGradient, setBgGradient] = useState(null)

  useEffect(() => {
    let cancelled = false
    setBgGradient(null)
    if (resource.thumbnail_url) {
      extractAccentColorMixedWithBlack(resource.thumbnail_url)
        .then((gradient) => { if (!cancelled) setBgGradient(gradient) })
        .catch(() => {})
    }
    return () => { cancelled = true }
  }, [resource.thumbnail_url])

  useEffect(() => {
    let cancelled = false
    setMediaUrl(null)
    async function load() {
      const offlineEntry = await getOffline(resource.id)
      if (cancelled) return
      setMediaUrl(offlineEntry ? URL.createObjectURL(offlineEntry.blob) : resourcesApi.streamUrl(resource.id))
    }
    load()
  }, [resource.id])

  useEffect(() => {
    return () => { if (mediaUrl?.startsWith('blob:')) URL.revokeObjectURL(mediaUrl) }
  }, [mediaUrl])

  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    function onLoaded() { setDuration(el.duration || 0) }
    function onTime() { setCurrentTime(el.currentTime || 0) }
    function onPlay() { setIsPlaying(true) }
    function onPause() {
      setIsPlaying(false)
      if (duration) resourcesApi.updateProgress(resource.id, Math.round((el.currentTime / duration) * 100)).catch(() => {})
    }
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [mediaUrl, duration, resource.id])

  useEffect(() => {
    if (!isPlaying || !duration) return
    const interval = setInterval(() => {
      resourcesApi.updateProgress(resource.id, Math.round((mediaRef.current.currentTime / duration) * 100)).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [isPlaying, duration, resource.id])

  function togglePlay() {
    const el = mediaRef.current
    if (!el) return
    if (el.paused) el.play().catch(() => {}); else el.pause()
  }
  function skip(sec) {
    const el = mediaRef.current
    if (!el) return
    el.currentTime = Math.min(Math.max(0, el.currentTime + sec), duration || 0)
  }
  function cycleSpeed() {
    const idx = SPEED_OPTIONS.indexOf(speed)
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]
    setSpeed(next)
    if (mediaRef.current) mediaRef.current.playbackRate = next
  }

  if (kind === 'video') {
    return (
      <div className="p-3">
        {mediaUrl && (
          <video ref={mediaRef} src={mediaUrl} poster={resource.thumbnail_url} controls className="w-full rounded-lg bg-black" />
        )}
        <p className="mt-2 font-label-md text-label-md font-semibold text-on-surface truncate">{resource.title}</p>
      </div>
    )
  }

  // audio — persistent Spotify-style mini player
  return (
    <div className="p-4 flex flex-col gap-3" style={{ background: bgGradient || undefined }}>
      {mediaUrl && <audio ref={mediaRef} src={mediaUrl} className="hidden" />}
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface-container-high border border-outline">
        {resource.thumbnail_url ? (
          <img src={resource.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl">headphones</span>
          </div>
        )}
      </div>
      <div>
        <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{resource.title}</p>
        {resource.author && <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{resource.author}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(e) => { const v = Number(e.target.value); if (mediaRef.current) mediaRef.current.currentTime = v; setCurrentTime(v) }}
          className="w-full accent-primary"
        />
        <div className="flex justify-between font-label-sm text-[11px] text-on-surface-variant">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-6">
        <button onClick={() => skip(-10)} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined">replay_10</span>
        </button>
        <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        <button onClick={() => skip(10)} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined">forward_10</span>
        </button>
      </div>
      <button onClick={cycleSpeed} className="self-center px-3 py-1 rounded-full bg-surface-container-high text-label-sm font-label-sm text-on-surface-variant">
        {speed}x
      </button>
    </div>
  )
}

function SidebarReader() {
  const { activeResource, closeResource } = useActiveResource()
  if (!activeResource) return null
  const kind = getViewerKind(activeResource.file_type)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline">
        <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wide">Now {kind === 'audio' ? 'Playing' : 'Reading'}</span>
        <button onClick={closeResource} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high" aria-label="Close">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {kind === 'pdf' && <PdfMiniReader resource={activeResource} />}
      {(kind === 'audio' || kind === 'video') && <MediaMiniPlayer resource={activeResource} kind={kind} />}
      {kind === 'unsupported' && (
        <p className="px-4 py-6 text-center font-label-sm text-label-sm text-on-surface-variant">
          Preview for this file type isn't available in the sidebar yet.
        </p>
      )}
    </div>
  )
}

export default SidebarReader