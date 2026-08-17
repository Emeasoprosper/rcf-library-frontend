// Samples an image's average color via canvas and derives a
// complementary, vibrant background gradient — so a Browse Categories
// tile's backdrop actually relates to and pairs with the real thumbnail
// sitting on it (red art gets a background that suits red, green gets
// one that suits green), instead of either a random fixed brand color
// or (the previous bug) a dark, desaturated, murky-looking blend that
// erased the original hue.
//
// CAVEAT: reading pixel data requires the image to not taint the canvas —
// same-origin, or served with a permissive CORS header. Your thumbnails
// come from GET /resources/:id/thumbnail on your own backend; if that
// route doesn't send `Access-Control-Allow-Origin`, extraction throws a
// SecurityError below and this quietly resolves null, so the caller
// falls back to its static gradient instead of crashing.

const cache = new Map()

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

// Inverse of rgbToHsl — h in 0-360, s/l in 0-100, returns [r, g, b] 0-255.
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

// Raw pixel-average RGB tends to be muddy/desaturated on busy thumbnails
// (lots of white text, mixed colors, etc. cancel each other out toward
// brown/grey) — this recovers the image's actual dominant HUE but forces
// it into a vivid, punchy saturation/lightness range, the way Spotify's
// "extract dominant color" treatment reads as a bold, saturated swatch
// rather than a flat average. Used by both functions below so a video's
// player background and a category tile's backdrop pull from the same
// vividness logic.
function toVividRgb(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b)
  const vividS = Math.max(s, 62)
  const vividL = Math.min(Math.max(l, 38), 52)
  return hslToRgb(h, vividS, vividL)
}

export function extractAccentGradient(imageUrl) {
  if (!imageUrl) return Promise.resolve(null)
  if (cache.has(imageUrl)) return cache.get(imageUrl)

  const promise = new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]
          count++
        }
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)

        const [hue] = rgbToHsl(r, g, b)

        // Complementary pairing: background sits opposite the image's
        // dominant hue on the color wheel, so it visually suits the
        // photo rather than clashing or matching it exactly.
        const bgHue = (hue + 165) % 360
        const bgHue2 = (bgHue + 25) % 360

        // Vibrant, not murky: matches the saturation/lightness range of
        // the original Tailwind brand gradients (from-amber-500,
        // from-emerald-500, etc. sit around 70-85% sat / 45-60% light)
        // instead of the previous dark/desaturated 24%/14% lightness,
        // which flattened every hue into the same dim olive-grey.
        return resolve(
          `linear-gradient(135deg, hsl(${bgHue} 78% 46%) 0%, hsl(${bgHue2} 70% 34%) 100%)`
        )
      } catch (err) {
        console.warn('[extractAccentGradient] could not sample', imageUrl, err.message)
        resolve(null)
      }
    }

    img.onerror = () => resolve(null)
    img.src = imageUrl
  })

  cache.set(imageUrl, promise)
  return promise
}

// --- Dominant color mixed with black --------------------------------
//
// Different purpose from extractAccentGradient above: that one shifts to
// a COMPLEMENTARY hue for category tiles. This one keeps the image's own
// dominant hue and darkens it by blending toward the app's near-black
// tone — for the Continue card / player backgrounds, where the
// background should feel like it came FROM the cover, not paired
// against it.
//
// Blends toward #15100D (the app's --color-surface-container-lowest,
// see index.css) rather than pure #000 — keeps mixed backgrounds in the
// same warm-black family as the rest of the dark theme instead of
// reintroducing flat black.
const MIX_TARGET = [0x15, 0x10, 0x0d]
const mixedCache = new Map()

function mixWithTarget([r, g, b], amount) {
  return [
    Math.round(r * (1 - amount) + MIX_TARGET[0] * amount),
    Math.round(g * (1 - amount) + MIX_TARGET[1] * amount),
    Math.round(b * (1 - amount) + MIX_TARGET[2] * amount),
  ]
}

// mixAmount: 0 = full vivid sampled color, 1 = full near-black. Two stops
// (light mix → heavier mix) so the card reads as a subtle top-to-bottom
// gradient rather than a flat swatch. Default lowered from 0.55 to 0.35
// (and the second stop's spread widened) so the top of the card actually
// shows the vivid color clearly — like the Spotify reference — before
// fading to near-black at the bottom, instead of starting already mostly
// blackened out.
export function extractAccentColorMixedWithBlack(imageUrl, mixAmount = 0.35) {
  if (!imageUrl) return Promise.resolve(null)
  const cacheKey = `${imageUrl}|${mixAmount}`
  if (mixedCache.has(cacheKey)) return mixedCache.get(cacheKey)

  const promise = new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]
          count++
        }
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)

        // Recover a vivid, saturated swatch from the (often muddy)
        // pixel-average before mixing toward black — this is the actual
        // fix for the washed-out brownish result.
        const [vr, vg, vb] = toVividRgb(r, g, b)

        const [r1, g1, b1] = mixWithTarget([vr, vg, vb], mixAmount)
        const [r2, g2, b2] = mixWithTarget([vr, vg, vb], Math.min(1, mixAmount + 0.45))

        resolve(
          `linear-gradient(135deg, rgb(${r1}, ${g1}, ${b1}) 0%, rgb(${r2}, ${g2}, ${b2}) 100%)`
        )
      } catch (err) {
        console.warn('[extractAccentColorMixedWithBlack] could not sample', imageUrl, err.message)
        resolve(null)
      }
    }

    img.onerror = () => resolve(null)
    img.src = imageUrl
  })

  mixedCache.set(cacheKey, promise)
  return promise
}