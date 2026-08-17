// Single source of truth for turning a resource's file_type into a display
// "kind" (document / video / audio) and the shape that goes with it.
// Books/PDFs stay portrait (unchanged — that was already right). Video
// becomes a landscape rectangle. Audio becomes a square. Every card
// component reads from here so the shape rule only lives in one place.

export function getMediaKind(fileType) {
  if (typeof fileType !== 'string') return 'document'
  if (fileType.startsWith('video/')) return 'video'
  if (fileType.startsWith('audio/')) return 'audio'
  return 'document' // pdf, docx, and anything unrecognized reads like a book
}

export const MEDIA_KIND_STYLE = {
  document: {
    aspect: 'aspect-[3/4]', // portrait book cover — unchanged from before
    railWidth: 'w-32',
    gridIcon: 'menu_book',
  },
  video: {
    aspect: 'aspect-video', // 16:9 landscape
    railWidth: 'w-44',
    gridIcon: 'movie',
  },
  audio: {
    aspect: 'aspect-square', // 1:1
    railWidth: 'w-32',
    gridIcon: 'graphic_eq',
  },
}