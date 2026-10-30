// components/ui/AttachmentViewerModal.jsx
// Opens a notification/announcement's attachment INSIDE the app — never
// navigates to another tab or site. Images show directly; PDFs are drawn
// page by page with pdf.js (the same library the reader uses), so they
// work on phones too, where an <iframe> PDF would just download.
import { useEffect, useRef, useState } from 'react'
import { getPdfjs } from '../../utils/pdfPreview'

const MAX_PAGES = 60

function PdfPages({ url }) {
  const holderRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | failed
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const holder = holderRef.current
    ;(async () => {
      try {
        const pdfjs = await getPdfjs()
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const pdf = await pdfjs.getDocument({ data: await res.arrayBuffer(), wasmUrl: '/wasm/' }).promise
        if (cancelled) return
        setPageCount(pdf.numPages)
        const width = Math.min(holder.clientWidth || 600, 900)
        for (let n = 1; n <= Math.min(pdf.numPages, MAX_PAGES); n++) {
          const page = await pdf.getPage(n)
          if (cancelled) return
          const base = page.getViewport({ scale: 1 })
          const ratio = window.devicePixelRatio || 1
          const viewport = page.getViewport({ scale: (width / base.width) * ratio })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = '100%'
          canvas.className = 'block rounded-lg bg-white shadow mb-3'
          holder.appendChild(canvas)
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
          if (n === 1) setStatus('ready')
        }
      } catch (err) {
        console.error('In-app PDF view failed:', err.message)
        if (!cancelled) setStatus('failed')
      }
    })()
    return () => {
      cancelled = true
      if (holder) holder.innerHTML = ''
    }
  }, [url])

  return (
    <div className="w-full p-3">
      {status === 'loading' && <p className="font-label-md text-label-md text-on-surface-variant text-center py-stack-lg">Opening document…</p>}
      {status === 'failed' && <p className="font-label-md text-label-md text-on-surface-variant text-center py-stack-lg">This document couldn't be opened.</p>}
      <div ref={holderRef} />
      {pageCount > MAX_PAGES && (
        <p className="font-label-sm text-label-sm text-on-surface-variant text-center">Showing the first {MAX_PAGES} of {pageCount} pages.</p>
      )}
    </div>
  )
}

function AttachmentViewerModal({ open, onClose, title, url, mime = '' }) {
  if (!open) return null
  const isPdf = /pdf/i.test(mime) || /\.pdf($|\?)/i.test(url || '')

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-h-[90vh] bg-surface-container rounded-2xl overflow-hidden border border-outline flex flex-col ${isPdf ? 'max-w-3xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline flex-none">
          <p className="font-label-md text-label-md font-semibold text-on-surface truncate pr-2">{title}</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex-none rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface text-[20px]">close</span>
          </button>
        </div>
        <div className="overflow-auto flex-grow flex items-start justify-center bg-black/20">
          {!url ? (
            <p className="font-body-md text-body-md text-on-surface-variant py-stack-lg">No attachment.</p>
          ) : isPdf ? (
            <PdfPages url={url} />
          ) : (
            <img src={url} alt={title} className="max-w-full max-h-[75vh] object-contain m-auto" />
          )}
        </div>
      </div>
    </div>
  )
}

export default AttachmentViewerModal
