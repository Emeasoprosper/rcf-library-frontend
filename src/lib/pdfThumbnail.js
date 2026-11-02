import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// pdf.js is large, so it is only downloaded the first time a preview is
// actually made (when someone picks a PDF to upload), not with the app.
let pdfjsReady = null
function loadPdfjs() {
  if (!pdfjsReady) {
    pdfjsReady = import('pdfjs-dist').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = pdfWorker
      return lib
    })
  }
  return pdfjsReady
}

// Renders page 1 of a PDF File object to a PNG data URL — real first-page
// preview, generated in the browser before upload even starts.
export async function renderPdfFirstPage(file) {
  const pdfjsLib = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: '/wasm/' }).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 0.6 })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const context = canvas.getContext('2d')

  await page.render({ canvasContext: context, viewport }).promise
  return canvas.toDataURL('image/png')
}
