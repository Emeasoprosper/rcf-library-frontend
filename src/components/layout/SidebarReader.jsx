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
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
  return 'unsupported' // image deferred for now
}

function DocxMiniReader({ resource }) {
  const containerRef = useRef(null)
  const docxContainerRef = useRef(null)
  const docxSourceRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(true)
  const [error, setError] = useState(false)
  const [zoom, setZoom] = useState(1)

  function zoomIn() { setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2))) }
  function zoomOut() { setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))) }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
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
        docxSourceRef.current = arrayBuffer
        setLoading(false)
      } catch {
        if (!cancelled) { setError(true); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [resource.id])

  useEffect(() => {
    if (loading || error || !docxSourceRef.current || !docxContainerRef.current) return
    let cancelled = false
    async function renderDocx() {
      setRendering(true)
      const container = docxContainerRef.current
      container.innerHTML = ''
      try {
        const { renderAsync } = await import('docx-preview')
        await renderAsync(docxSourceRef.current, container, undefined, {
          inWrapper: true,
          ignoreLastRenderedPageBreak: false,
          useBase64URL: true,
        })
        if (!cancelled) setRendering(false)
      } catch {
        if (!cancelled) { setRendering(false); setError(true) }
      }
    }
    renderDocx()
    return () => { cancelled = true }
  }, [loading, error])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><span className="w-5 h-5 border-2 border-outline border-t-primary rounded-full animate-spin" /></div>
  }
  if (error) {
    return <p className="px-4 py-6 text-center font-label-sm text-label-sm text-on-surface-variant">Couldn't load this document.</p>
  }

  return (
    <div ref={containerRef} className="relative flex-1 min-h-0 overflow-auto bg-surface-container-low">
      <ReaderSettingsPanel onZoomIn={zoomIn} onZoomOut={zoomOut} containerRef={containerRef} />
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low">
          <span className="material-symbols-outlined text-on-surface-variant text-2xl animate-spin">progress_activity</span>
        </div>
      )}
      <div className="flex justify-center py-4" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
        <div ref={docxContainerRef} className="docx-reader-container" />
      </div>
    </div>
  )
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2]
const SLEEP_OPTIONS = [null, 15, 30, 45, 60]

function PdfMiniReader({ resource }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const pdfRef = useRef(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [renderedThumbs, setRenderedThumbs] = useState({})
  const renderedThumbSet = useRef(new Set())
  const thumbObserverRef = useRef(null)

  function zoomIn() { setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2))) }
  function zoomOut() { setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))) }

  async function renderThumb(index) {
    if (renderedThumbSet.current.has(index) || !pdfRef.current) return
    renderedThumbSet.current.add(index)
    try {
      const page = await pdfRef.current.getPage(index + 1)
      const unscaled = page.getViewport({ scale: 1 })
      const scale = 56 / unscaled.width
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport }).promise
      setRenderedThumbs((prev) => ({ ...prev, [index]: canvas.toDataURL() }))
    } catch {
      renderedThumbSet.current.delete(index)
    }
  }

  const thumbRefCallback = useRef((node, index) => {
    if (!node) return
    if (!thumbObserverRef.current) {
      thumbObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) renderThumb(Number(entry.target.dataset.thumbIndex))
          })
        },
        { threshold: 0.1 }
      )
    }
    node.dataset.thumbIndex = index
    thumbObserverRef.current.observe(node)
  }).current

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
    <div ref={containerRef} className="relative flex flex-col flex-1 min-h-0">
      <ReaderSettingsPanel onZoomIn={zoomIn} onZoomOut={zoomOut} containerRef={containerRef} />
      <div className="flex-1 overflow-auto px-3 py-2 flex justify-center">
        <canvas ref={canvasRef} className="rounded shadow" />
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border-t border-outline">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="w-8 h-8 flex-none rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-surface-container-high border border-outline bg-surface-container text-on-surface"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
          {Array.from({ length: numPages }, (_, i) => (
            <button
              key={i}
              ref={(node) => thumbRefCallback(node, i)}
              onClick={() => setCurrentPage(i + 1)}
              className={`flex-none w-9 h-12 rounded border-2 overflow-hidden bg-surface-container-high relative ${
                currentPage === i + 1 ? 'border-primary' : 'border-transparent'
              }`}
            >
              {renderedThumbs[i] ? (
                <img src={renderedThumbs[i]} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[9px] text-on-surface-variant">{i + 1}</span>
                </div>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
          className="w-8 h-8 flex-none rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-surface-container-high border border-outline bg-surface-container text-on-surface"
          aria-label="Next page"
        >
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
  const [waveformPeaks, setWaveformPeaks] = useState(null)
  const waveformRef = useRef(null)
  const [isDraggingWaveform, setIsDraggingWaveform] = useState(false)

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
    if (kind !== 'audio' || !mediaUrl) return
    let cancelled = false
    async function computeWaveform() {
      try {
        const res = mediaUrl.startsWith('blob:')
          ? await fetch(mediaUrl)
          : await fetch(mediaUrl, { credentials: 'include' })
        if (!res.ok) throw new Error('fetch failed')
        const arrayBuffer = await res.arrayBuffer()
        if (cancelled) return
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        const audioCtx = new AudioCtx()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        if (cancelled) { audioCtx.close(); return }
        const rawData = audioBuffer.getChannelData(0)
        const samples = 40
        const blockSize = Math.max(1, Math.floor(rawData.length / samples))
        const peaks = []
        for (let i = 0; i < samples; i++) {
          const start = i * blockSize
          let sum = 0
          for (let j = 0; j < blockSize; j++) sum += Math.abs(rawData[start + j] || 0)
          peaks.push(sum / blockSize)
        }
        const max = Math.max(...peaks, 0.0001)
        if (!cancelled) setWaveformPeaks(peaks.map((p) => p / max))
        audioCtx.close()
      } catch {
        if (!cancelled) setWaveformPeaks(null)
      }
    }
    computeWaveform()
    return () => { cancelled = true }
  }, [mediaUrl, kind])

  function seekFromPointerEvent(e) {
    const rect = waveformRef.current?.getBoundingClientRect()
    if (!rect || !duration) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const newTime = fraction * duration
    setCurrentTime(newTime)
    if (mediaRef.current) mediaRef.current.currentTime = newTime
  }

  function handleWaveformPointerDown(e) {
    e.preventDefault()
    waveformRef.current?.setPointerCapture?.(e.pointerId)
    setIsDraggingWaveform(true)
    seekFromPointerEvent(e)
  }

  useEffect(() => {
    if (!isDraggingWaveform) return
    function onMove(e) { seekFromPointerEvent(e) }
    function onUp() { setIsDraggingWaveform(false) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingWaveform, duration])

  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    function onLoaded() { setDuration(el.duration || 0) }
    function onTime() { if (!isDraggingWaveform) setCurrentTime(el.currentTime || 0) }
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

  const sleepTimeoutRef = useRef(null)
  const [sleepMinutes, setSleepMinutes] = useState(null)

  function cycleSleepTimer() {
    const idx = SLEEP_OPTIONS.indexOf(sleepMinutes)
    const next = SLEEP_OPTIONS[(idx + 1) % SLEEP_OPTIONS.length]
    setSleepMinutes(next)
    if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current)
    if (next) {
      sleepTimeoutRef.current = setTimeout(() => {
        mediaRef.current?.pause()
        setSleepMinutes(null)
      }, next * 60 * 1000)
    }
  }

  useEffect(() => {
    return () => { if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current) }
  }, [])

  const videoContainerRef = useRef(null)
  const [videoRotation, setVideoRotation] = useState(0)

  function rotateVideo() {
    setVideoRotation((r) => (r + 90) % 360)
  }
  function toggleFullscreen() {
    const container = videoContainerRef.current
    if (!container) return
    if (document.fullscreenElement) document.exitFullscreen()
    else container.requestFullscreen?.()
  }

  if (kind === 'video') {
    return (
      <div className="p-3">
        <div ref={videoContainerRef} className="relative bg-black rounded-lg overflow-hidden">
          {mediaUrl && (
            <video
              ref={mediaRef}
              src={mediaUrl}
              poster={resource.thumbnail_url}
              controls
              style={{ transform: `rotate(${videoRotation}deg)`, transition: 'transform 0.25s ease' }}
              className="w-full bg-black"
            />
          )}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <button onClick={rotateVideo} aria-label="Rotate video" className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">screen_rotation</span>
            </button>
            <button onClick={toggleFullscreen} aria-label="Fullscreen" className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">fullscreen</span>
            </button>
          </div>
        </div>
        <p className="mt-2 font-label-md text-label-md font-semibold text-on-surface truncate">{resource.title}</p>
      </div>
    )
  }

  // audio — persistent Spotify-style mini player. Fixed to the panel's
  // full height with no scroll: art shrinks (min-h-0 + flex-1) instead
  // of forcing the column taller than its container.
  return (
    <div className="h-full p-4 flex flex-col gap-2 overflow-hidden" style={{ background: bgGradient || undefined }}>
      {mediaUrl && <audio ref={mediaRef} src={mediaUrl} className="hidden" />}
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-surface-container-high border border-outline flex items-center justify-center">
        {resource.thumbnail_url ? (
          <img src={resource.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant text-4xl">headphones</span>
        )}
      </div>
      <div className="flex-none">
        <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{resource.title}</p>
        {resource.author && <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{resource.author}</p>}
      </div>
      <div className="flex-none flex flex-col gap-1">
        {waveformPeaks ? (
          <div
            ref={waveformRef}
            className="flex items-end gap-[2px] h-8 cursor-pointer touch-none select-none"
            onPointerDown={handleWaveformPointerDown}
          >
            {waveformPeaks.map((p, i) => {
              const played = duration ? i / waveformPeaks.length <= currentTime / duration : false
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${played ? 'bg-primary' : 'bg-on-surface-variant/30'}`}
                  style={{ height: `${Math.max(10, p * 100)}%` }}
                />
              )
            })}
          </div>
        ) : (
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => { const v = Number(e.target.value); if (mediaRef.current) mediaRef.current.currentTime = v; setCurrentTime(v) }}
            className="w-full accent-primary"
          />
        )}
        <div className="flex justify-between font-label-sm text-[11px] text-on-surface-variant">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="flex-none flex items-center justify-center gap-6">
        <button onClick={() => skip(-10)} className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container-high border border-outline text-on-surface hover:bg-surface-container-highest">
          <span className="material-symbols-outlined text-[20px]">replay_10</span>
        </button>
        <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        <button onClick={() => skip(10)} className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container-high border border-outline text-on-surface hover:bg-surface-container-highest">
          <span className="material-symbols-outlined text-[20px]">forward_10</span>
        </button>
      </div>
      <div className="flex-none flex items-center justify-center gap-2">
        <button onClick={cycleSleepTimer} className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high border border-outline text-label-sm font-label-sm text-on-surface">
          <span className="material-symbols-outlined text-[14px]">bedtime</span>
          {sleepMinutes ? `${sleepMinutes}m` : 'Sleep'}
        </button>
        <button onClick={cycleSpeed} className="px-3 py-1 rounded-full bg-surface-container-high border border-outline text-label-sm font-label-sm text-on-surface">
          {speed}x
        </button>
      </div>
    </div>
  )
}

function SidebarReader() {
  const { activeResource, closeResource } = useActiveResource()
  if (!activeResource) return null
  const kind = getViewerKind(activeResource.file_type)

  return (
    <div className="relative flex flex-col h-full">
      <button
        onClick={closeResource}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-surface-container border border-outline shadow-lg hover:bg-surface-container-high text-on-surface"
        aria-label="Close"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>

      {kind === 'pdf' && <PdfMiniReader resource={activeResource} />}
      {kind === 'docx' && <DocxMiniReader resource={activeResource} />}
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