import { useState, useEffect, useCallback } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import { adminApi, resourceCollectionsApi } from '../../services/api'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

// Bottom sheet: pick an existing collection (thumbnail + name + count)
// or create a new one (same-size square tile with a plus icon, "Add
// New" label beside it) — matches an existing-vs-new picker pattern
// rather than a bare form.
function CollectionPickerSheet({ open, resource, collections, onClose, onPicked, onCreated }) {
  const [mode, setMode] = useState('pick') // 'pick' | 'create'
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setMode('pick')
      setTitle('')
      setAuthor('')
      setCoverFile(null)
      setCoverPreview(null)
    }
  }, [open])

  if (!open) return null

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const { collection } = await adminApi.createCollection({ title: title.trim(), author: author.trim() })
      let finalCollection = collection

      if (coverFile) {
        const { coverUrl } = await adminApi.uploadCollectionCover(collection.id, coverFile)
        finalCollection = { ...collection, cover_url: coverUrl }
      }

      onCreated(finalCollection)
      onPicked(finalCollection.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end" onClick={onClose}>
      <div
        className="w-full max-h-[80vh] overflow-y-auto bg-surface rounded-t-2xl p-stack-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-outline rounded-full mx-auto mb-stack-md" />

        {mode === 'pick' && (
          <>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-sm truncate">
              Add "{resource?.title}" to…
            </p>
            <div className="grid grid-cols-3 gap-3">
              {collections.map((c) => (
                <button key={c.id} onClick={() => onPicked(c.id)} className="flex flex-col items-center gap-1 text-center">
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface-container-high border border-outline">
                    {c.cover_url ? (
                      <img src={c.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant text-2xl">library_books</span>
                      </div>
                    )}
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface truncate w-full">{c.title}</p>
                  <p className="font-label-sm text-[10px] text-on-surface-variant">
                    {c.resource_count ?? 0} resource{c.resource_count === 1 ? '' : 's'}
                  </p>
                </button>
              ))}

              <button onClick={() => setMode('create')} className="flex flex-col items-center gap-1 text-center">
                <div className="w-full aspect-square rounded-xl border-2 border-dashed border-outline flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">add</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface">Add New</p>
              </button>
            </div>
          </>
        )}

        {mode === 'create' && (
          <div className="flex flex-col gap-3">
            <p className="font-label-sm text-label-sm font-bold text-primary uppercase">New Collection</p>

            <label className="w-24 h-24 mx-auto rounded-xl border-2 border-dashed border-outline flex items-center justify-center overflow-hidden cursor-pointer bg-surface-container-high">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">add_photo_alternate</span>
              )}
              <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Collection title"
              className="h-11 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author / Department (optional)"
              className="h-11 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface"
            />

            <div className="flex gap-2">
              <button onClick={() => setMode('pick')} className="flex-1 h-11 rounded-lg border border-outline text-on-surface font-label-sm text-label-sm">
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !title.trim()}
                className="flex-1 h-11 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create & Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OrganizeResources() {
  const [collections, setCollections] = useState([])
  const [unassigned, setUnassigned] = useState([])
  const [loading, setLoading] = useState(true)
  const [pickerResource, setPickerResource] = useState(null)
  const [assigningId, setAssigningId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null) // { id, title } | null
  const [deletingId, setDeletingId] = useState(null)

  const loadCollections = useCallback(async () => {
    const res = await resourceCollectionsApi.list().catch(() => ({ items: [] }))
    setCollections(res.items || [])
  }, [])

  const loadUnassigned = useCallback(async () => {
    const res = await adminApi.needsOrganizing().catch(() => ({ items: [] }))
    setUnassigned(res.items || [])
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadCollections(), loadUnassigned()]).finally(() => setLoading(false))
  }, [loadCollections, loadUnassigned])

  const confirmDeleteCollection = async () => {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setPendingDelete(null)
    setDeletingId(id)
    try {
      await adminApi.deleteCollection(id)
      setCollections((prev) => prev.filter((c) => c.id !== id))
      loadUnassigned() // resources from the deleted collection reappear here
    } finally {
      setDeletingId(null)
    }
  }

  const handlePicked = async (collectionId) => {
    const resource = pickerResource
    setPickerResource(null)
    setAssigningId(resource.id)
    try {
      const d = resource.detected || {}
      await adminApi.organizeResource(resource.id, {
        collectionId,
        chapter: d.chapter || null,
        part: d.part || null,
        volume: d.volume || null,
        edition: d.edition || null,
      })
      setUnassigned((prev) => prev.filter((r) => r.id !== resource.id))
      loadCollections()
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Collections" showBack />
      <main className="px-margin-mobile pt-[68px] pb-32">
        {loading && <p className="text-on-surface-variant text-center py-stack-lg">Loading…</p>}

        {!loading && (
          <>
            <section className="mt-stack-md mb-stack-lg">
              <h3 className="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase mb-stack-sm">
                Needs Organizing ({unassigned.length})
              </h3>
              {unassigned.length === 0 ? (
                <p className="font-label-sm text-label-sm text-on-surface-variant py-stack-sm">
                  Nothing left to organize — everything's assigned.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {unassigned.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-stack-sm rounded-xl bg-surface-container border border-outline">
                      <div className="w-12 h-16 flex-none rounded-lg overflow-hidden bg-surface-container-high border border-outline/50">
                        {r.thumbnail_url ? (
                          <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                              {r.thumbnail_status === 'processing' ? 'hourglass_top' : 'description'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{r.title}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                          {r.author || r.course_code || r.file_name}
                        </p>
                      </div>
                      <button
                        onClick={() => setPickerResource(r)}
                        disabled={assigningId === r.id}
                        className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-[12px] font-bold disabled:opacity-50 flex-none"
                      >
                        {assigningId === r.id ? '…' : '+ Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase mb-stack-sm">
                All Collections ({collections.length})
              </h3>
              <div className="flex flex-col gap-2">
                {collections.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-stack-sm rounded-xl bg-surface-container border border-outline">
                    <div className="w-12 h-12 flex-none rounded-lg overflow-hidden bg-surface-container-high border border-outline/50">
                      {c.cover_url ? (
                        <img src={c.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">library_books</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{c.title}</p>
                      {c.author && <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{c.author}</p>}
                    </div>
                    <button
                      onClick={() => setPendingDelete({ id: c.id, title: c.title })}
                      disabled={deletingId === c.id}
                      className="w-9 h-9 flex-none rounded-full bg-red-500/10 text-red-400 flex items-center justify-center disabled:opacity-50"
                      aria-label={`Delete ${c.title}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {deletingId === c.id ? 'progress_activity' : 'delete'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <CollectionPickerSheet
        open={!!pickerResource}
        resource={pickerResource}
        collections={collections}
        onClose={() => setPickerResource(null)}
        onPicked={handlePicked}
        onCreated={(c) => setCollections((prev) => [c, ...prev])}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this collection?"
        message={pendingDelete ? `Delete "${pendingDelete.title}"? Its resources won't be deleted — they'll move back to Needs Organizing.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteCollection}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

export default OrganizeResources