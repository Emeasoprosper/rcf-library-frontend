// Candidate seek points, most-to-least preferred: 10% into the clip
// first (usually past any loading/intro screen), then 25%, 45%, 65%.
// Each is floored at 1s and kept below the clip's own duration.
function buildCandidateSeeks(duration) {
  const safeDuration = duration && isFinite(duration) ? duration : 4
  const fractions = [0.10, 0.25, 0.45, 0.65]
  const seen = new Set()
  const seeks = []
  for (const f of fractions) {
    const t = Math.min(Math.max(safeDuration * f, 1), Math.max(safeDuration - 0.1, 1))
    const rounded = Math.round(t * 10) / 10
    if (!seen.has(rounded)) {
      seen.add(rounded)
      seeks.push(rounded)
    }
  }
  return seeks
}

// Same "too dark to use" idea as the backend's isFrameTooDark — average
// RGB brightness on a 0-255 scale, sampled from the canvas we just drew
// the frame onto. Downsamples to a small grid instead of walking every
// pixel, since this only needs to be roughly right, not exact.
function isCanvasFrameTooDark(canvas, ctx) {
  const sampleSize = 24
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let sum = 0
  let count = 0
  const stepX = Math.max(1, Math.floor(canvas.width / sampleSize))
  const stepY = Math.max(1, Math.floor(canvas.height / sampleSize))
  for (let y = 0; y < canvas.height; y += stepY) {
    for (let x = 0; x < canvas.width; x += stepX) {
      const i = (y * canvas.width + x) * 4
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3
      count++
    }
  }
  const avgBrightness = count ? sum / count : 0
  return avgBrightness < 18
}

function seekTo(video, time) {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
      resolve()
    }
    const onError = () => {
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
      reject(new Error('Could not seek video'))
    }
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onError)
    video.currentTime = time
  })
}

export function renderVideoFirstFrame(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    // 'auto' (not 'metadata') — metadata-only preload frequently never
    // fires 'loadeddata' since that event requires a decoded frame, not
    // just duration/dimensions. That was leaving this promise unresolved
    // forever, which is why the preview silently never appeared.
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true

    const url = URL.createObjectURL(file)
    video.src = url

    const cleanup = () => URL.revokeObjectURL(url)

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out reading video (unsupported codec or corrupt file)'))
    }, 8000)
    const clearGuard = () => clearTimeout(timeout)

    // loadedmetadata is guaranteed once duration/dimensions are known,
    // regardless of preload mode — safe to seek from here.
    video.onloadedmetadata = async () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')

        // Tries each candidate seek point in turn — screen recordings
        // very often open on a loading screen or blank desktop, so a
        // single fixed seek point kept grabbing black. Stops at the
        // first frame that isn't too dark; if every candidate is dark,
        // the last one attempted is used anyway rather than failing the
        // whole upload preview.
        const candidates = buildCandidateSeeks(video.duration)
        let dataUrl = null

        for (const seek of candidates) {
          await seekTo(video, seek)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          dataUrl = canvas.toDataURL('image/jpeg', 0.82)
          if (!isCanvasFrameTooDark(canvas, ctx)) break
        }

        clearGuard()
        cleanup()
        resolve(dataUrl)
      } catch (err) {
        clearGuard()
        cleanup()
        reject(err)
      }
    }

    video.onerror = () => {
      clearGuard()
      cleanup()
      reject(new Error('Could not read video'))
    }
  })
}