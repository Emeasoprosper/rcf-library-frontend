import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import MultiFileUpload from '../components/ui/MultiFileUpload'
import { uploadResourceFile, resourcesApi } from '../services/api'
import { createRipple } from '../lib/ripple'

const resourceTypes = [
  {
    id: 'book',
    slug: 'book',
    icon: 'book',
    title: 'Book',
    description: 'Full textbooks, academic publications, or monographs in PDF or EPUB format.',
    accept: '.pdf,.epub,application/epub+zip',
    color: 'text-blue-400',
  },
  {
    id: 'past_question',
    slug: 'past_question',
    icon: 'quiz',
    title: 'Past Question',
    description: 'Previous examination papers, tests, and assessment materials for specific courses.',
    accept: '.pdf,image/*',
    color: 'text-amber-400',
  },
  {
    id: 'research_paper',
    slug: 'research_paper',
    icon: 'article',
    title: 'Research Paper',
    description: 'Peer-reviewed articles, journals, theses, or dissertation documents.',
    accept: '.pdf,.doc,.docx',
    color: 'text-purple-400',
  },
  {
    id: 'lecture_notes',
    slug: 'lecture_notes',
    icon: 'description',
    title: 'Lecture Notes',
    description: 'Course summaries, seminar materials, or handwritten digitized notes.',
    accept: '.pdf,.doc,.docx,image/*',
    color: 'text-cyan-400',
  },
  {
    id: 'video_course',
    slug: 'video',
    icon: 'video_library',
    title: 'Video Course',
    description: 'Recorded lectures, educational tutorials, or laboratory demonstrations.',
    accept: 'video/*',
    color: 'text-rose-400',
    authorLabel: 'Tutor',
  },
  {
    id: 'audio',
    slug: 'audio',
    icon: 'graphic_eq',
    title: 'Audio Recording',
    description: 'Recorded lectures, interviews, or study sessions in audio form.',
    accept: 'audio/*',
    color: 'text-emerald-400',
    authorLabel: 'Artist',
  },
  {
    id: 'other',
    slug: 'other',
    icon: 'more_horiz',
    title: 'Other',
    description: 'Datasets, software, or specialized educational media not listed above.',
    accept: '',
    color: 'text-slate-400',
  },
]

function SubmitResource() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('type') // 'type' | 'upload'
  const [selectedType, setSelectedType] = useState(null)
  const [files, setFiles] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    resourcesApi
      .allCategories()
      .then((data) => setCategories(data.items || []))
      .catch(() => setCategories([]))
  }, [])

  const handleCreateCategory = async (name) => {
    const created = await resourcesApi.createCategory(name)
    setCategories((prev) => {
      if (prev.some((c) => String(c.id) === String(created.id))) return prev
      return [...prev, { id: created.id, name: created.name }].sort((a, b) => a.name.localeCompare(b.name))
    })
    return created
  }

  const selectedTypeData = resourceTypes.find((t) => t.id === selectedType)
  const canSubmit = files.length > 0 && files.every((f) => f.name.trim() !== '') && !uploading

  const handleSelectType = (event, type) => {
    createRipple(event)
    window.setTimeout(() => {
      setSelectedType(type.id)
      setFiles([])
      setPhase('upload')
    }, 160)
  }

  const handleBack = () => {
    if (phase === 'upload') {
      setPhase('type')
      return
    }
    navigate(-1)
  }

  const handleSubmit = async () => {
    setUploading(true)
    setProgress(0)
    setUploadError('')

    const total = files.length
    let completed = 0

    try {
      for (const entry of files) {
        const formData = new FormData()
        formData.append('file', entry.file)
        formData.append('title', entry.name.trim())
        if (entry.author) formData.append('author', entry.author)
        if (entry.courseCode) formData.append('courseCode', entry.courseCode)
        if (entry.description) formData.append('description', entry.description)
        if (entry.categoryId) formData.append('categoryId', entry.categoryId)
        formData.append('resourceTypeSlug', selectedTypeData?.slug || 'other')

        await uploadResourceFile(formData, (pct) => {
          setProgress(Math.round(((completed + pct / 100) / total) * 100))
        })
        completed += 1
        setProgress(Math.round((completed / total) * 100))
      }
      setSubmitted(true)
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col items-center justify-center px-margin-mobile text-center">
        <span className="material-symbols-outlined text-primary text-5xl mb-stack-md">check_circle</span>
        <h2 className="font-headline-lg text-headline-lg font-display text-on-surface mb-2">Submitted for Review</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg max-w-xs">
          {files.length > 1
            ? `Your ${files.length} resources are now with our reviewers. You'll be notified as each is approved.`
            : "Your resource is now with our reviewers. You'll be notified once it's approved."}
        </p>
        <button
          onClick={() => navigate('/contribute')}
          className="w-full max-w-xs py-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md active:scale-[0.98] hover:opacity-90 transition-all"
        >
          Back to Contribute
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar
        title="Submit a Resource"
        showBack
        onBack={handleBack}
        rightIcons={
          <span className="font-label-sm text-label-sm text-on-surface-variant px-3 py-1 bg-surface-container rounded-full">
            Step {phase === 'type' ? 1 : 2} of 2
          </span>
        }
      />

      {phase === 'type' && (
        <main className="pb-32 pt-[68px] px-margin-mobile">
          <section className="mb-stack-lg">
            <p className="font-body-md text-body-md text-on-surface-variant">
              What kind of material are you contributing? This decides which file types we'll ask for next.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-stack-md">
            {resourceTypes.map((type) => (
              <button
                key={type.id}
                onClick={(e) => handleSelectType(e, type)}
                className="relative overflow-hidden flex items-start gap-4 p-stack-md text-left rounded-xl border border-outline bg-surface-container hover:border-on-surface-variant transition-all active:scale-[0.99]"
              >
                <span className={`material-symbols-outlined text-3xl flex-none ${type.color}`}>{type.icon}</span>
                <div className="flex-1">
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{type.title}</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </main>
      )}

      {phase === 'upload' && (
        <>
          <main className="pb-40 pt-[68px] px-margin-mobile">
            <section className="mb-stack-lg">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Add your {selectedTypeData?.title.toLowerCase()} file{selectedTypeData?.id !== 'other' ? 's' : ''} below.
                Tap the pencil on each to fill in its title, {(selectedTypeData?.authorLabel || 'author').toLowerCase()}, category, and description.
              </p>
            </section>

            <div className="flex flex-col gap-stack-md">
              <MultiFileUpload
                files={files}
                onFilesChange={setFiles}
                accept={selectedTypeData?.accept}
                authorLabel={selectedTypeData?.authorLabel || 'Author'}
                categories={categories}
                onCreateCategory={handleCreateCategory}
              />

              {uploadError && (
                <div className="p-stack-md rounded-xl bg-error/10 border border-error/30">
                  <p className="font-body-md text-body-md text-error">{uploadError}</p>
                </div>
              )}

              {uploading && (
                <div className="p-stack-md rounded-xl bg-surface-container border border-outline">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-label-md text-label-md text-on-surface">Uploading…</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{progress}%</p>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-150 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </main>

          <footer className="fixed bottom-0 w-full bg-surface border-t border-outline z-50 px-margin-mobile py-stack-md">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-4 rounded-lg font-headline-md text-headline-md transition-all ${
                canSubmit
                  ? 'bg-primary text-on-primary active:scale-[0.98] hover:opacity-90'
                  : 'bg-primary text-on-primary opacity-50 cursor-not-allowed'
              }`}
            >
              {uploading ? `Uploading ${progress}%` : files.length > 1 ? `Submit ${files.length} Resources` : 'Submit'}
            </button>
          </footer>
        </>
      )}
    </div>
  )
}

export default SubmitResource