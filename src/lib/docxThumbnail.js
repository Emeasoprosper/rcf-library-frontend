// Requires:  npm install docx-preview html2canvas
//
// docx-preview renders a .docx into real HTML/CSS page elements; html2canvas
// then rasterizes the first of those into an image. Word layouts vary a lot
// more than PDFs, so treat a thrown error as "no preview for this file" —
// but we log *why* so it's actually debuggable instead of just silently
// falling back to the icon.
//
// Returns { dataUrl, blob } — dataUrl feeds the local <img> preview,
// blob is the actual file that gets uploaded to the backend so the real
// rendered page (not a generated placeholder) becomes the stored thumbnail.
export async function renderDocxFirstPage(file) {
  const [{ renderAsync }, html2canvas] = await Promise.all([
    import('docx-preview'),
    import('html2canvas').then((m) => m.default),
  ])

  const container = document.createElement('div')
  // opacity: 0 (not off-screen / display:none) — the element still gets a
  // real layout and paint pass this way, which html2canvas needs. Off-screen
  // positioning is where this tends to silently break.
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '794px', // ~A4 at 96dpi, matches docx-preview's default page width
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  })
  document.body.appendChild(container)

  try {
    const arrayBuffer = await file.arrayBuffer()
    await renderAsync(arrayBuffer, container, undefined, {
      inWrapper: true,
      ignoreLastRenderedPageBreak: false,
    })

    // Let the browser actually paint before we ask html2canvas to read it.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    const target =
      container.querySelector('.docx-wrapper section.docx') ||
      container.querySelector('.docx-wrapper > *') ||
      container.firstElementChild ||
      container

    const canvas = await html2canvas(target, {
      scale: 0.5,
      backgroundColor: '#ffffff',
      useCORS: true,
      windowWidth: 794,
    })

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))

    return { dataUrl, blob }
  } catch (err) {
    console.error('[renderDocxFirstPage] failed for', file.name, err)
    throw err
  } finally {
    document.body.removeChild(container)
  }
}