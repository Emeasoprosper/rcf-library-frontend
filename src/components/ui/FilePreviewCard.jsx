import { useEffect, useRef, useState } from 'react'
import { getFileGradient } from '../../lib/fileGradient'
import { renderPdfFirstPage } from '../../lib/pdfThumbnail'
import { renderVideoFirstFrame } from '../../lib/videoThumbnail'
import { renderDocxFirstPage } from '../../lib/docxThumbnail'
import { extractAudioCoverArt } from '../../lib/audioThumbnail'
import { formatBytes } from '../../lib/formatBytes'
import { analyzeResource } from '../../services/api'
import PreviewEditModal from './PreviewEditModal'
import DocumentTypeIcon from './DocumentTypeIcon'

const docxTypes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const legacyDocTypes = ['application/msword']

function getFileKind(file) {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  if (docxTypes.includes(file.type) || file.name.toLowerCase().endsWith('.docx')) return 'docx'
  if (legacyDocTypes.includes(file.type) || file.name.toLowerCase().endsWith('.doc')) return 'doc-legacy'
  return 'other'
}

const kindIcon = {
  pdf: 'picture_as_pdf',
  image: 'image',
  audio: 'graphic_eq',
  video: 'movie',
  docx: 'description',
  'doc-legacy': 'description',
  other: 'description',
}

// Only these kinds currently produce a real AI suggestion server-side
// (services/aiAnalysis.js only extracts text from PDFs and sends images
// directly — see rcf-library-backend). Gating the call here too, not just
// trusting the backend to return null quickly, avoids firing a network
// request at all for kinds that can never benefit from one.
const ANALYZABLE_KINDS = new Set(['pdf', 'image'])

function FilePreviewCard({
  file,
  name,
  author = '',
  authorLabel = 'Author',
  categoryId,
  courseCode = '',
  description = '',
  tags = '',
  categories = [],
  resourceTypeSlug,
  onNameChange,
  onAuthorChange,
  onCategoryIdChange,
  onCourseCodeChange,
  onDescriptionChange,
  onTagsChange,
  onCreateCategory,
  onThumbnailChange,   // NEW — reports the real client-rendered thumbnail Blob up to MultiFileUpload.jsx
  onRemove,
}) {
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailFailed, setThumbnailFailed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [courseNotFound, setCourseNotFound] = useState(null) // holds the detected code when it's not in the courses table
  const analysisStartedRef = useRef(false)

  const kind = getFileKind(file)
  const gradient = getFileGradient(`${file.name}-${file.size}`)
  const seed = `${file.name}-${file.size}`

  useEffect(() => {
    let cancelled = false

    async function buildThumbnail() {
      try {
        if (kind === 'pdf') {
          const dataUrl = await renderPdfFirstPage(file)
          if (!cancelled) setThumbnail(dataUrl)
        } else if (kind === 'image') {
          const reader = new FileReader()
          reader.onload = () => !cancelled && setThumbnail(reader.result)
          reader.readAsDataURL(file)
        } else if (kind === 'video') {
          const dataUrl = await renderVideoFirstFrame(file)
          if (!cancelled) setThumbnail(dataUrl)
        } else if (kind === 'docx') {
          const { dataUrl, blob } = await renderDocxFirstPage(file)
          if (!cancelled) {
            setThumbnail(dataUrl)
            onThumbnailChange?.(blob)
          }
        } else if (kind === 'audio') {
          const coverUrl = await extractAudioCoverArt(file)
          if (!cancelled && coverUrl) setThumbnail(coverUrl)
        } else if (kind === 'doc-legacy') {
          if (!cancelled) setThumbnailFailed(true)
        }
      } catch (err) {
        console.error(`[FilePreviewCard] thumbnail failed for ${file.name} (${kind}):`, err)
        if (!cancelled) setThumbnailFailed(true)
      }
    }
    buildThumbnail()
    return () => { cancelled = true }
  }, [file, kind])

  useEffect(() => {
    if (kind !== 'audio') return
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, kind])

  // Fires once per file, right when it's added — never on every render,
  // never re-triggered by later edits (feature 12: don't call AI more
  // than necessary). Suggestions only fill fields that are still blank at
  // the moment the response arrives, so anything the user already typed
  // in the few seconds this takes is never overwritten.
  useEffect(() => {
    if (analysisStartedRef.current) return
    if (!ANALYZABLE_KINDS.has(kind)) return

    // For a PDF, wait until the client-side page-1 thumbnail has finished
    // (successfully or not) before analyzing — if the PDF has no
    // extractable text layer, that same rendered image is sent up as a
    // fallback so Gemini can still read the cover page visually. Images
    // don't need this wait: the raw file is already sent to Gemini directly.
    if (kind === 'pdf' && thumbnail === null && !thumbnailFailed) return

    analysisStartedRef.current = true

    let cancelled = false
    setAnalyzing(true)

    analyzeResource(file, resourceTypeSlug, kind === 'pdf' ? thumbnail : null)
      .then(({ suggestion }) => {
        if (cancelled || !suggestion) return

        if (!name?.trim() && suggestion.title) onNameChange(suggestion.title)
        if (!author?.trim() && suggestion.author) onAuthorChange?.(suggestion.author)
        if (!description?.trim() && suggestion.description) onDescriptionChange?.(suggestion.description)
        if (!tags?.trim() && suggestion.tags?.length) onTagsChange?.(suggestion.tags.join(', '))

        if (!courseCode?.trim() && suggestion.course?.code) {
          onCourseCodeChange?.(suggestion.course.code)
          if (!suggestion.course.found) setCourseNotFound(suggestion.course.code)
        }

        if (!categoryId && suggestion.category?.categoryId) {
          onCategoryIdChange(String(suggestion.category.categoryId))
        }
        // A suggested category with no existing match (isNew) is
        // deliberately NOT auto-applied as free text — categoryId expects
        // a real id. The user sees it via the "+ Write your own category"
        // flow instead if they open the edit modal and want to use it.
      })
      .catch((err) => {
        // AI being unavailable is never an error state for the uploader —
        // manual entry just works exactly as before.
        console.warn(`[FilePreviewCard] AI analysis skipped for ${file.name}:`, err.message)
      })
      .finally(() => {
        if (!cancelled) setAnalyzing(false)
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, kind, thumbnail, thumbnailFailed])

  const categoryName = categories.find((c) => String(c.id) === String(categoryId))?.name

  const fields = [
    { key: 'name', label: 'Name', value: name, type: 'text' },
    { key: 'author', label: authorLabel, value: author, type: 'text' },
    {
      key: 'categoryId',
      label: 'Category',
      value: categoryId,
      type: 'category',
      categories,
      onCreateCategory,
    },
    { key: 'courseCode', label: 'Course Code', value: courseCode, type: 'text' },
    { key: 'description', label: 'Description', value: description, type: 'textarea' },
    { key: 'tags', label: 'Tags (comma separated)', value: tags, type: 'text' },
  ]

  const handleFieldSave = (key, value) => {
    if (key === 'name') onNameChange(value)
    if (key === 'author') onAuthorChange?.(value)
    if (key === 'categoryId') onCategoryIdChange(value)
    if (key === 'courseCode') {
      onCourseCodeChange?.(value)
      setCourseNotFound(null) // user took over — stop showing the stale AI note
    }
    if (key === 'description') onDescriptionChange?.(value)
    if (key === 'tags') onTagsChange?.(value)
  }

  return (
    <>
      <div
        className="relative rounded-xl overflow-hidden border border-outline flex gap-4 p-stack-md"
        style={{ background: gradient }}
      >
        <div className="w-16 h-20 flex-none rounded-lg bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center relative">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          ) : kind === 'docx' || kind === 'doc-legacy' ? (
            <DocumentTypeIcon className="w-full h-full p-2.5" />
          ) : (
            <span className="material-symbols-outlined text-white/70 text-2xl">
              {kindIcon[kind]}
            </span>
          )}
          {analyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-grow min-w-0 flex flex-col justify-center gap-1">
          <p className={`font-body-md text-body-md font-semibold truncate ${name ? 'text-white' : 'text-white/60 italic'}`}>
            {name || 'Untitled — tap the pencil to add a title'}
          </p>
          <p className="font-label-sm text-label-sm text-white/70 truncate">
            {categoryName || 'Uncategorized'} · {formatBytes(file.size)}
          </p>
          {analyzing && (
            <p className="font-label-sm text-label-sm text-white/50 italic">Analyzing…</p>
          )}
          {!analyzing && thumbnailFailed && (
            <p className="font-label-sm text-label-sm text-white/50 italic">
              {kind === 'doc-legacy' ? 'Old .doc format — preview generated after upload' : 'Preview unavailable'}
            </p>
          )}
          {!analyzing && courseNotFound && (
            <p className="font-label-sm text-label-sm text-amber-300 italic truncate">
              New course ({courseNotFound}) — admin will review
            </p>
          )}
          {kind === 'audio' && audioUrl && (
            <audio
              controls
              src={audioUrl}
              className="w-full h-8 mt-1"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>

        <div className="flex flex-col items-end justify-between flex-none">
          <button
            onClick={() => setModalOpen(true)}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 transition-colors flex items-center justify-center"
            aria-label="Edit details"
          >
            <span className="material-symbols-outlined text-white text-[16px]">edit</span>
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="Remove file"
          >
            <span className="material-symbols-outlined text-[22px]">cancel</span>
          </button>
        </div>
      </div>

      <PreviewEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        seed={seed}
        previewUrl={thumbnail}
        fallbackIcon={kindIcon[kind]}
        fallbackNode={kind === 'docx' || kind === 'doc-legacy' ? <DocumentTypeIcon className="w-full h-full p-6" /> : null}
        fields={fields}
        onFieldSave={handleFieldSave}
      />
    </>
  )
}

export default FilePreviewCard