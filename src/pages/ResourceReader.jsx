import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { resourcesApi } from '../services/api'
import { getOffline, saveOffline } from '../lib/offlineStorage'
import { getFileGradient } from '../lib/fileGradient'
import { getMediaKind } from '../lib/mediaKind'
import { extractAccentColorMixedWithBlack } from '../lib/extractAccentColor'
import HorizontalRail from '../components/resource/HorizontalRail'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

function getViewerKind(fileType = '') {
  if (fileType === 'application/pdf') return 'pdf'
  if (fileType.startsWith('audio/')) return 'audio'
  if (fileType.startsWith('video/')) return 'video'
  return 'unsupported'
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function relatedScore(candidate, current) {
  let score = 0
  if (current.category && candidate.category === current.category) score += 3
  if (current.department && candidate.department === current.department) score += 2
  if (current.course_code && candidate.course_code === current.course_code) score += 2
  return score
}

const AUDIO_SUBTYPE_LABEL = {
  single: 'Single Speaker',
  panel: 'Panel / Multiple Speakers',
}
const VIDEO_SUBTYPE_LABEL = {
  sermon: 'Sermon',
  lecture: 'Lecture',
  interview: 'Interview',
  recording: 'Recording',
  testimony: 'Testimony',
  other: 'Other',
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2]
const SLEEP_OPTIONS = [null, 15, 30, 45, 60]

function ResourceReader() {
  const { id } = useParams()
  const navigate = useNavigate()

  const containerRef = useRef(null)
  const pdfRef = useRef(null)
  const canvasRefs = useRef([])
  const pageObserverRef = useRef(null)
  const pageContainerRefs = useRef([])
  const thumbObserverRef = useRef(null)
  const renderedThumbSet = useRef(new Set())
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [pageJumpValue, setPageJumpValue] = useState('')
  const [renderedThumbs, setRenderedThumbs] = useState({})
  const [filmstripOpen, setFilmstripOpen] = useState(true)
  const [readingMode, setReadingMode] = useState('vertical')

  const mediaRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)

  const videoContainerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [videoRotation, setVideoRotation] = useState(0)
  const [videoContainerSize, setVideoContainerSize] = useState({ w: 0, h: 0 })

  const [waveformPeaks, setWaveformPeaks] = useState(null)
  const [sleepMinutes, setSleepMinutes] = useState(null)
  const sleepTimeoutRef = useRef(null)
  const waveformRef = useRef(null)
  const [isDraggingWaveform, setIsDraggingWaveform] = useState(false)

  // True once the browser has buffered enough of the video/audio to
  // actually start playback. Before this, the center play button did
  // nothing when tapped — there was nothing ready to play yet, which is
  // exactly what looked like a broken button. Now a spinner ring shows
  // instead until this flips true.
  const [mediaReady, setMediaReady] = useState(false)

  const [resource, setResource] = useState(null)
  const [viewerKind, setViewerKind] = useState(null)
  const [mediaUrl, setMediaUrl] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const [related, setRelated] = useState([])

  const [bgGradient, setBgGradient] = useState(null)

  useEffect(() => {
    let cancelled = false
    setBgGradient(null)
    if (resource?.thumbnail_url) {
      extractAccentColorMixedWithBlack(resource.thumbnail_url).then((gradient) => {
        if (!cancelled) setBgGradient(gradient)
      })
    }
    return () => { cancelled = true }
  }, [resource?.thumbnail_url])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const metaRes = await resourcesApi.get(id)
        if (cancelled) return
        setResource(metaRes.resource)
        const kind = getViewerKind(metaRes.resource.file_type)
        setViewerKind(kind)

        const offlineEntry = await getOffline(id)
        if (cancelled) return

        if (kind === 'pdf') {
          let arrayBuffer
          if (offlineEntry) {
            arrayBuffer = await offlineEntry.blob.arrayBuffer()
          } else {
            const streamRes = await fetch(resourcesApi.streamUrl(id), { credentials: 'include' })
            if (!streamRes.ok) throw new Error('Failed to load file')
            arrayBuffer = await streamRes.arrayBuffer()
          }
          if (cancelled) return

          const pdf = await getDocument({ data: arrayBuffer }).promise
          if (cancelled) return

          pdfRef.current = pdf
          setNumPages(pdf.numPages)
          canvasRefs.current = new Array(pdf.numPages).fill(null)
        } else if (kind === 'audio' || kind === 'video') {
          if (offlineEntry) {
            setMediaUrl(URL.createObjectURL(offlineEntry.blob))
          } else {
            setMediaUrl(resourcesApi.streamUrl(id))
          }

          if (kind === 'video') {
            const relatedRes = await resourcesApi.list({ sort: 'popular', pageSize: 30 })
            if (cancelled) return
            const sameKindItems = (relatedRes.items || []).filter(
              (r) => r.id !== id && getMediaKind(r.file_type) === kind
            )
            const ranked = sameKindItems
              .map((r) => ({ r, score: relatedScore(r, metaRes.resource) }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 6)
              .map(({ r }) => ({
                id: r.id,
                title: r.title,
                subtitle: r.author,
                thumbnailUrl: r.thumbnail_url,
                thumbnailStatus: r.thumbnail_status,
                fileType: r.file_type,
                contributorName: r.contributor_name,
                contributorAvatarUrl: r.contributor_avatar_url,
                isAdminUpload: r.is_admin_upload,
                onClick: () => navigate(`/resources/${r.id}/read`),
              }))
            setRelated(ranked)
          }
        }

        if (!cancelled) setLoading(false)
      } catch {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, navigate])

  useEffect(() => {
    async function checkOffline() {
      const entry = await getOffline(id)
      setDownloaded(Boolean(entry))
    }
    checkOffline()
  }, [id])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await resourcesApi.download(id)
      const { blob, mimeType } = await resourcesApi.downloadFileForOffline(id)
      await saveOffline(id, blob, mimeType)
      setDownloaded(true)
    } catch {
      alert('Download failed — please try again.')
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (mediaUrl?.startsWith('blob:')) URL.revokeObjectURL(mediaUrl)
    }
  }, [mediaUrl])

  useEffect(() => {
    if (viewerKind !== 'pdf' || !pdfRef.current || numPages === 0) return
    let cancelled = false

    async function renderAllPages() {
      const containerWidth = containerRef.current?.clientWidth || 360
      const containerHeight = containerRef.current?.clientHeight || 600

      for (let i = 1; i <= numPages; i++) {
        if (cancelled) return
        const canvas = canvasRefs.current[i - 1]
        if (!canvas) continue

        const page = await pdfRef.current.getPage(i)
        const unscaled = page.getViewport({ scale: 1, rotation })
        const fitScale = readingMode === 'horizontal'
          ? containerHeight / unscaled.height
          : containerWidth / unscaled.width
        const scale = fitScale * zoom
        const viewport = page.getViewport({ scale, rotation })

        canvas.width = viewport.width
        canvas.height = viewport.height
        const context = canvas.getContext('2d')
        await page.render({ canvasContext: context, viewport }).promise
      }
    }

    renderAllPages()

    function handleResize() {
      renderAllPages()
    }
    window.addEventListener('resize', handleResize)
    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
    }
  }, [numPages, viewerKind, zoom, rotation, readingMode])

  const pageRefCallback = useCallback((node, index) => {
    pageContainerRefs.current[index] = node
    if (!pageObserverRef.current) {
      pageObserverRef.current = new IntersectionObserver(
        (entries) => {
          const visible = entries.find((e) => e.isIntersecting)
          if (visible) {
            const pageIndex = Number(visible.target.dataset.pageIndex)
            setCurrentPage(pageIndex + 1)
          }
        },
        { threshold: 0.5 }
      )
    }
    if (node) {
      node.dataset.pageIndex = index
      pageObserverRef.current.observe(node)
    }
  }, [])

  async function renderThumb(index) {
    if (renderedThumbSet.current.has(index) || !pdfRef.current) return
    renderedThumbSet.current.add(index)
    try {
      const page = await pdfRef.current.getPage(index + 1)
      const unscaled = page.getViewport({ scale: 1 })
      const scale = 64 / unscaled.width
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

  const thumbRefCallback = useCallback((node, index) => {
    if (!node) return
    if (!thumbObserverRef.current) {
      thumbObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              renderThumb(Number(entry.target.dataset.thumbIndex))
            }
          })
        },
        { threshold: 0.1 }
      )
    }
    node.dataset.thumbIndex = index
    thumbObserverRef.current.observe(node)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function zoomIn() { setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2))) }
  function zoomOut() { setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))) }
  function rotate() { setRotation((r) => (r + 90) % 360) }

  function scrollToPage(pageNumber) {
    const clamped = Math.min(Math.max(1, pageNumber), numPages)
    pageContainerRefs.current[clamped - 1]?.scrollIntoView({
      behavior: 'smooth',
      block: readingMode === 'vertical' ? 'start' : 'nearest',
      inline: readingMode === 'horizontal' ? 'start' : 'nearest',
    })
  }

  function handlePageJumpSubmit(e) {
    e.preventDefault()
    const num = parseInt(pageJumpValue, 10)
    if (!isNaN(num)) scrollToPage(num)
    setPageJumpValue('')
  }

  useEffect(() => {
    if (viewerKind !== 'pdf' || !numPages) return
    const percent = Math.round((currentPage / numPages) * 100)
    resourcesApi.updateProgress(id, percent).catch(() => {})
  }, [currentPage, numPages, id, viewerKind])

  useEffect(() => {
    setMediaReady(false)
  }, [mediaUrl])

  useEffect(() => {
    const el = mediaRef.current
    if (!el || (viewerKind !== 'audio' && viewerKind !== 'video')) return

    function handleDurationValue() {
      if (!isFinite(el.duration)) {
        el.currentTime = 1e101
        const onSeeked = () => {
          el.removeEventListener('timeupdate', onSeeked)
          setMediaDuration(el.duration || 0)
          el.currentTime = 0
        }
        el.addEventListener('timeupdate', onSeeked)
      } else {
        setMediaDuration(el.duration)
      }
    }

    function onLoadedMetadata() { handleDurationValue() }
    function onDurationChange() { handleDurationValue() }
    function onTimeUpdate() { if (!isDraggingWaveform) setCurrentTime(el.currentTime || 0) }
    function onPlay() { setIsPlaying(true) }
    function onPause() { setIsPlaying(false) }
    function onEnded() { setIsPlaying(false) }
    function onCanPlay() { setMediaReady(true) }
    function onWaiting() { setMediaReady(false) }
    function onPlaying() { setMediaReady(true) }

    el.addEventListener('loadedmetadata', onLoadedMetadata)
    el.addEventListener('durationchange', onDurationChange)
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    el.addEventListener('canplay', onCanPlay)
    el.addEventListener('waiting', onWaiting)
    el.addEventListener('playing', onPlaying)

    return () => {
      el.removeEventListener('loadedmetadata', onLoadedMetadata)
      el.removeEventListener('durationchange', onDurationChange)
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('canplay', onCanPlay)
      el.removeEventListener('waiting', onWaiting)
      el.removeEventListener('playing', onPlaying)
    }
  }, [mediaUrl, viewerKind, isDraggingWaveform])

  useEffect(() => {
    if (mediaRef.current) mediaRef.current.playbackRate = playbackRate
  }, [mediaUrl, playbackRate])

  useEffect(() => {
    if ((viewerKind !== 'audio' && viewerKind !== 'video') || !isPlaying || !mediaDuration) return
    const interval = setInterval(() => {
      const el = mediaRef.current
      if (!el) return
      const percent = Math.min(100, Math.round((el.currentTime / mediaDuration) * 100))
      resourcesApi.updateProgress(id, percent).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [isPlaying, mediaDuration, id, viewerKind])

  useEffect(() => {
    const el = mediaRef.current
    if (!el || (viewerKind !== 'audio' && viewerKind !== 'video')) return
    function onPauseSave() {
      if (!mediaDuration) return
      const percent = Math.min(100, Math.round((el.currentTime / mediaDuration) * 100))
      resourcesApi.updateProgress(id, percent).catch(() => {})
    }
    el.addEventListener('pause', onPauseSave)
    return () => el.removeEventListener('pause', onPauseSave)
  }, [mediaUrl, viewerKind, mediaDuration, id])

  function togglePlay() {
    const el = mediaRef.current
    if (!el) return
    if (el.paused) el.play().catch(() => {})
    else el.pause()
  }

  function skip(seconds) {
    const el = mediaRef.current
    if (!el) return
    el.currentTime = Math.min(Math.max(0, el.currentTime + seconds), mediaDuration || el.duration || 0)
  }

  function handleSeek(e) {
    const el = mediaRef.current
    if (!el) return
    const value = Number(e.target.value)
    el.currentTime = value
    setCurrentTime(value)
  }

  function cycleSpeed() {
    const idx = SPEED_OPTIONS.indexOf(playbackRate)
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]
    setPlaybackRate(next)
  }

  function showControlsTemporarily() {
    setControlsVisible(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (mediaRef.current && !mediaRef.current.paused) setControlsVisible(false)
    }, 3000)
  }

  useEffect(() => {
    if (viewerKind === 'video') showControlsTemporarily()
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerKind])

  function toggleFullscreen() {
    const container = videoContainerRef.current
    if (!container) return
    if (document.fullscreenElement) document.exitFullscreen()
    else container.requestFullscreen?.()
  }

  function rotateVideo() {
    setVideoRotation((r) => (r + 90) % 360)
  }

  useEffect(() => {
    const el = videoContainerRef.current
    if (!el || viewerKind !== 'video') return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setVideoContainerSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewerKind])

  useEffect(() => {
    if (viewerKind !== 'audio' || !mediaUrl) return
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
        const samples = 48
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
  }, [mediaUrl, viewerKind])

  function seekFromPointerEvent(e) {
    const rect = waveformRef.current?.getBoundingClientRect()
    if (!rect || !mediaDuration) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const newTime = fraction * mediaDuration
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
  }, [isDraggingWaveform, mediaDuration])

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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl">error</span>
        <p className="text-on-surface-variant font-body-md">This resource couldn't be opened.</p>
        <button onClick={() => navigate(-1)} className="text-primary font-label-md">Go back</button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant text-3xl animate-spin">
          progress_activity
        </span>
      </div>
    )
  }

  if (viewerKind === 'video') {
    const isRotatedSideways = videoRotation === 90 || videoRotation === 270
    const videoStyle = {
      transform: `rotate(${videoRotation}deg)`,
      transition: 'transform 0.25s ease',
      ...(isRotatedSideways && videoContainerSize.w && videoContainerSize.h
        ? {
            width: `${videoContainerSize.h}px`,
            height: `${videoContainerSize.w}px`,
            maxWidth: 'none',
            maxHeight: 'none',
          }
        : {}),
    }

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div
          ref={videoContainerRef}
          className="relative w-full bg-black aspect-video max-h-[70vh] flex items-center justify-center overflow-hidden"
          onMouseMove={showControlsTemporarily}
        >
          {mediaUrl && (
            <video
              ref={mediaRef}
              src={mediaUrl}
              poster={resource?.thumbnail_url || undefined}
              className="w-full h-full object-contain"
              style={videoStyle}
              onClick={togglePlay}
              playsInline
            />
          )}

          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center transition-opacity duration-300"
            style={{ opacity: controlsVisible ? 1 : 0 }}
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>

          {(!isPlaying || controlsVisible) && (
            <button
              onClick={mediaReady ? togglePlay : undefined}
              className="absolute w-16 h-16 rounded-full bg-black/50 backdrop-blur flex items-center justify-center transition-transform hover:scale-105"
              aria-label={!mediaReady ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
              disabled={!mediaReady}
            >
              {mediaReady ? (
                <span className="material-symbols-outlined text-white text-4xl">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              ) : (
                <span className="w-8 h-8 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
              )}
            </button>
          )}

          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-3 px-4 flex flex-col gap-3 transition-opacity duration-300"
            style={{ opacity: controlsVisible ? 1 : 0 }}
          >
            <input
              type="range"
              min="0"
              max={mediaDuration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-primary"
            />
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <button onClick={() => skip(-10)} aria-label="Back 10 seconds" className="hover:opacity-70 transition-opacity">
                  <span className="material-symbols-outlined">replay_10</span>
                </button>
                <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className="hover:opacity-70 transition-opacity">
                  <span className="material-symbols-outlined">{isPlaying ? 'pause' : 'play_arrow'}</span>
                </button>
                <button onClick={() => skip(10)} aria-label="Forward 10 seconds" className="hover:opacity-70 transition-opacity">
                  <span className="material-symbols-outlined">forward_10</span>
                </button>
                <span className="text-xs font-mono text-white/80 ml-1">
                  {formatTime(currentTime)} / {formatTime(mediaDuration)}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white/10 backdrop-blur rounded-full px-1 py-1">
                <button
                  onClick={cycleSpeed}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-full hover:bg-white/15 transition-colors"
                >
                  {playbackRate}x
                </button>
                <button
                  onClick={rotateVideo}
                  aria-label="Rotate video"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
                >
                  <span className="material-symbols-outlined text-[19px]">screen_rotation</span>
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading || downloaded}
                  aria-label="Download for offline"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {downloading ? 'progress_activity' : downloaded ? 'download_done' : 'download'}
                  </span>
                </button>
                <button
                  onClick={toggleFullscreen}
                  aria-label="Fullscreen"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
                >
                  <span className="material-symbols-outlined text-[19px]">fullscreen</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="px-margin-mobile py-stack-md flex flex-col gap-3 bg-background isolate relative z-10"
          style={{ background: bgGradient || undefined }}
        >
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-headline-lg text-headline-lg font-display text-on-surface">{resource?.title}</h1>
            {resource?.media_subtype && VIDEO_SUBTYPE_LABEL[resource.media_subtype] && (
              <span className="flex-none text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full">
                {VIDEO_SUBTYPE_LABEL[resource.media_subtype]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-on-surface-variant text-label-md font-label-md">
            {resource?.author && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">person</span>{resource.author}
              </span>
            )}
            {resource?.department && <span>{resource.department}</span>}
            {resource?.level && <span>{resource.level} Level</span>}
          </div>
          {resource?.description && (
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{resource.description}</p>
          )}
        </div>

        {related.length > 0 && (
          <div className="bg-background relative z-10">
            <HorizontalRail title="More Videos Like This" items={related} />
          </div>
        )}
      </div>
    )
  }

  if (viewerKind === 'audio') {
    return (
      <div
        className="h-screen overflow-hidden bg-background flex flex-col px-margin-mobile py-stack-md"
        style={{ background: bgGradient || undefined }}
      >
        <div className="flex-none flex items-center justify-between mb-stack-sm">
          <button onClick={() => navigate(-1)} aria-label="Close">
            <span className="material-symbols-outlined text-on-surface">expand_more</span>
          </button>
          <span className="font-label-md text-label-md text-on-surface-variant tracking-widest uppercase">Now Playing</span>
          <button
            onClick={handleDownload}
            disabled={downloading || downloaded}
            className="disabled:opacity-60"
            aria-label="Download for offline"
          >
            <span className="material-symbols-outlined text-on-surface">
              {downloading ? 'progress_activity' : downloaded ? 'download_done' : 'download'}
            </span>
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 max-w-sm mx-auto w-full overflow-hidden">
          <div
            className="rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{
              width: 'min(52vw, 30vh)',
              height: 'min(52vw, 30vh)',
              background: !resource?.thumbnail_url ? getFileGradient(id) : undefined,
            }}
          >
            {resource?.thumbnail_url ? (
              <img src={resource.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white/70 text-6xl">graphic_eq</span>
            )}
          </div>

          <div className="text-center flex flex-col items-center gap-1 flex-shrink-0">
            {resource?.media_subtype && AUDIO_SUBTYPE_LABEL[resource.media_subtype] && (
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {AUDIO_SUBTYPE_LABEL[resource.media_subtype]}
              </span>
            )}
            <h1 className="font-headline-md text-headline-md font-display text-on-surface">{resource?.title}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {[resource?.author, resource?.department, resource?.level ? `${resource.level} Level` : null]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>

          <div className="w-full flex-shrink-0">
            {waveformPeaks ? (
              <div
                ref={waveformRef}
                className="flex items-end gap-[3px] h-10 cursor-pointer touch-none select-none"
                onPointerDown={handleWaveformPointerDown}
              >
                {waveformPeaks.map((p, i) => {
                  const played = mediaDuration ? i / waveformPeaks.length <= currentTime / mediaDuration : false
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-colors ${played ? 'bg-primary' : 'bg-white/25'}`}
                      style={{ height: `${Math.max(8, p * 100)}%` }}
                    />
                  )
                })}
              </div>
            ) : (
              <input
                type="range"
                min="0"
                max={mediaDuration || 0}
                step="1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-primary"
              />
            )}
            <div className="flex justify-between text-xs font-mono text-white/70 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(mediaDuration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 flex-shrink-0">
            <button onClick={() => skip(-10)} aria-label="Back 10 seconds" className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-3xl">replay_10</span>
            </button>
            <button
              onClick={mediaReady ? togglePlay : undefined}
              className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center"
              aria-label={!mediaReady ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
              disabled={!mediaReady}
            >
              {mediaReady ? (
                <span className="material-symbols-outlined text-3xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
              ) : (
                <span className="w-7 h-7 rounded-full border-[3px] border-on-primary/30 border-t-on-primary animate-spin" />
              )}
            </button>
            <button onClick={() => skip(10)} aria-label="Forward 10 seconds" className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-3xl">forward_10</span>
            </button>
          </div>

          {/* FIX: these two pills previously used bg-surface-container-high —
              a fixed neutral gray-brown from the theme that does not adapt
              to bgGradient (the color sampled from the resource's own
              thumbnail). On a vivid background like green album art, that
              fixed color reads as a flat, mismatched "cotton" patch. Now
              using the same translucent bg-white/10 + backdrop-blur
              treatment the video player's control bar already uses, which
              sits correctly on top of any sampled accent color instead of
              fighting it. */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={cycleSleepTimer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/10 text-white/90 text-xs font-label-sm hover:bg-white/15 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">bedtime</span>
              {sleepMinutes ? `${sleepMinutes}m` : 'Sleep Timer'}
            </button>
            <button
              onClick={cycleSpeed}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/10 text-white/90 text-xs font-label-sm hover:bg-white/15 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">speed</span>
              {playbackRate}x
            </button>
          </div>
        </div>

        {mediaUrl && <audio ref={mediaRef} src={mediaUrl} className="hidden" />}
      </div>
    )
  }

  if (viewerKind === 'pdf') {
    return (
      <div className="h-screen overflow-hidden bg-background flex flex-col">
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-outline bg-background">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex-shrink-0 flex items-center justify-center" aria-label="Close">
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>

          <div className="min-w-0 flex-1">
            <p className="font-label-md text-label-md font-semibold text-on-surface truncate">
              {resource?.title || 'Loading…'}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Page {currentPage} of {numPages}
            </p>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading || downloaded}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center disabled:opacity-60"
            aria-label="Download for offline"
          >
            <span className="material-symbols-outlined text-on-surface">
              {downloading ? 'progress_activity' : downloaded ? 'download_done' : 'download'}
            </span>
          </button>
        </div>

        <div
          ref={containerRef}
          className={
            readingMode === 'horizontal'
              ? 'flex-grow overflow-x-auto overflow-y-hidden relative flex flex-row snap-x snap-mandatory no-scrollbar'
              : 'flex-grow overflow-y-auto overflow-x-auto relative'
          }
        >
          <div className="fixed right-3 top-1/3 z-20 flex flex-col bg-surface-container border border-outline rounded-xl overflow-hidden shadow-lg">
            <button onClick={zoomIn} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high" aria-label="Zoom in">
              <span className="material-symbols-outlined text-on-surface text-[20px]">zoom_in</span>
            </button>
            <div className="h-px bg-outline" />
            <button onClick={zoomOut} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high" aria-label="Zoom out">
              <span className="material-symbols-outlined text-on-surface text-[20px]">zoom_out</span>
            </button>
            <div className="h-px bg-outline" />
            <button onClick={rotate} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high" aria-label="Rotate page">
              <span className="material-symbols-outlined text-on-surface text-[20px]">rotate_right</span>
            </button>
            <div className="h-px bg-outline" />
            <button
              onClick={() => setReadingMode((m) => (m === 'vertical' ? 'horizontal' : 'vertical'))}
              className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high"
              aria-label={readingMode === 'vertical' ? 'Switch to left/right scroll' : 'Switch to up/down scroll'}
            >
              <span className="material-symbols-outlined text-on-surface text-[20px]">
                {readingMode === 'vertical' ? 'swap_horiz' : 'swap_vert'}
              </span>
            </button>
          </div>

          <div className={readingMode === 'horizontal' ? 'flex flex-row items-center h-full' : 'flex flex-col items-center gap-4 py-4'}>
            {Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                ref={(node) => pageRefCallback(node, i)}
                className={
                  readingMode === 'horizontal'
                    ? 'flex-none h-full flex items-center justify-center snap-start px-2'
                    : 'w-full flex justify-center'
                }
              >
                <canvas
                  ref={(node) => { canvasRefs.current[i] = node }}
                  className="rounded shadow-lg block"
                />
              </div>
            ))}
          </div>
        </div>

        {numPages > 0 && (
          <div className="sticky bottom-0 border-t border-outline bg-background z-20">
            <button
              onClick={() => setFilmstripOpen((v) => !v)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label={filmstripOpen ? 'Hide page strip' : 'Show page strip'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {filmstripOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
              </span>
              <span className="font-label-sm text-label-sm">
                {filmstripOpen ? 'Hide pages' : 'Show pages'}
              </span>
            </button>

            {filmstripOpen && (
              <>
                <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 py-3">
                  {Array.from({ length: numPages }, (_, i) => (
                    <button
                      key={i}
                      ref={(node) => thumbRefCallback(node, i)}
                      onClick={() => scrollToPage(i + 1)}
                      className={`flex-none w-12 h-16 rounded border-2 overflow-hidden bg-surface-container-high relative ${
                        currentPage === i + 1 ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      {renderedThumbs[i] ? (
                        <img src={renderedThumbs[i]} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[10px] text-on-surface-variant">{i + 1}</span>
                        </div>
                      )}
                      <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/60 text-white text-[9px] leading-tight font-mono">
                        {i + 1}
                      </span>
                    </button>
                  ))}
                </div>
                <form onSubmit={handlePageJumpSubmit} className="flex items-center justify-between gap-3 px-4 pb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={numPages}
                      value={pageJumpValue}
                      onChange={(e) => setPageJumpValue(e.target.value)}
                      placeholder={String(currentPage)}
                      className="w-16 h-9 px-2 rounded border border-outline bg-surface-container text-on-surface text-sm text-center"
                    />
                    <button type="submit" className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center" aria-label="Go to page">
                      <span className="material-symbols-outlined text-[18px] text-on-surface">keyboard_return</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="w-9 h-9 rounded flex items-center justify-center disabled:opacity-30"
                      aria-label="Previous page"
                    >
                      <span className="material-symbols-outlined text-on-surface">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToPage(currentPage + 1)}
                      disabled={currentPage >= numPages}
                      className="w-9 h-9 rounded flex items-center justify-center disabled:opacity-30"
                      aria-label="Next page"
                    >
                      <span className="material-symbols-outlined text-on-surface">chevron_right</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-outline bg-background">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex-shrink-0 flex items-center justify-center" aria-label="Close">
          <span className="material-symbols-outlined text-on-surface">close</span>
        </button>
        <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{resource?.title}</p>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-4xl">description</span>
        <p className="text-on-surface-variant font-body-md">
          In-app preview isn't available for this file type yet.
        </p>
      </div>
    </div>
  )
}

export default ResourceReader