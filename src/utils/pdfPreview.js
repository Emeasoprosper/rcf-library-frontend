// utils/pdfPreview.js
// Renders a PDF's actual first page to a real image, client-side, the
// moment a file is selected — before any upload happens. Uses the same
// underlying library (pdfjs) as the backend's server-side renderer, just
// running in the browser instead.

let pdfjsLibPromise

async function getPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href
      return lib
    })
  }
  return pdfjsLibPromise
}

export async function renderPdfFirstPageThumbnail(file, maxWidth = 500) {
  const pdfjsLib = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)

  const unscaled = page.getViewport({ scale: 1 })
  const scale = maxWidth / unscaled.width
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

  return canvas.toDataURL('image/png')
}