// Requires: npm install music-metadata-browser buffer
//
// Same idea as pdfThumbnail (grab page 1) and videoThumbnail (grab the
// first frame): if the audio file already has embedded cover art — an
// ID3v2 APIC frame on MP3s, or a 'covr' atom on MP4/M4A — use that as
// the real thumbnail instead of the generic waveform icon. Not every
// audio file has embedded art (plenty don't), so returning null here is
// a normal, expected outcome, not a failure — the caller falls back to
// the icon + gradient treatment in that case.

// music-metadata-browser's tag parsers use Node's `Buffer` internally.
// Vite (unlike Webpack) doesn't polyfill Node globals automatically, so
// without this every parseBlob() call throws "Buffer is not defined"
// before it ever reads a single tag — this isn't "no cover art found",
// it's crashing before it looks. Assigning window.Buffer once, before
// the library is imported, is enough; the 'buffer' package is a small
// pure-JS polyfill with no native dependencies.
import { Buffer } from 'buffer'
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer
}

export async function extractAudioCoverArt(file) {
  const { parseBlob } = await import('music-metadata-browser')

  let metadata
  try {
    metadata = await parseBlob(file)
  } catch (err) {
    // Malformed/unsupported tag data shouldn't break the upload flow —
    // just means no cover art thumbnail, same as a file with no art at all.
    console.warn(`[extractAudioCoverArt] could not parse metadata for ${file.name}:`, err)
    return null
  }

  const picture = metadata.common?.picture?.[0]
  if (!picture) return null

  // picture.data is a Uint8Array — wrap it as a Blob and read it back out
  // as a data URL, so the result is the same data-URL shape every other
  // thumbnail type in this app already produces (keeps FilePreviewCard's
  // cleanup logic simple — nothing here needs URL.revokeObjectURL).
  const blob = new Blob([picture.data], { type: picture.format })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read embedded cover art'))
    reader.readAsDataURL(blob)
  })
}