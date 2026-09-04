import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'

// Shared by OrganizeResources.jsx (assigning a leftover resource) and
// CollectionPage.jsx's admin-only "Move to another collection" action —
// same picker, same behavior, wherever it's opened from.
function CollectionPickerSheet({ open, resource, collections, onClose, onPicked, onCreated }) {
  const [mode, setMode] = useState('pick')
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
      <div className="w-full max-h-[80vh] overflow-y-auto bg-surface rounded-t-2xl p-stack-md" onClick={(e) => e.stopPropagation()}>
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Collection title"
              className="h-11 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author / Department (optional)"
              className="h-11 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
            <div className="flex gap-2">
              <button onClick={() => setMode('pick')} className="flex-1 h-11 rounded-lg border border-outline text-on-surface font-label-sm text-label-sm">
                Back
              </button>
              <button onClick={handleCreate} disabled={saving || !title.trim()}
                className="flex-1 h-11 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-50">
                {saving ? 'Creating…' : 'Create & Add'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CollectionPickerSheet