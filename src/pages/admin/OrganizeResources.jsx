import { useState, useEffect, useCallback } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import { adminApi } from '../../services/api'

function CreateCollectionForm({ onCreated }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    try {
      const { collection } = await adminApi.createCollection({ title: title.trim(), author: author.trim() })
      onCreated(collection)
      setTitle('')
      setAuthor('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <form onSubmit={handleCreate} className="p-stack-sm rounded-xl bg-surface-container border border-outline flex flex-col gap-2">
      <p className="font-label-sm text-label-sm font-bold text-primary uppercase">New Collection</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Collection title"
        className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
      <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author / Department (optional)"
        className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
      <button type="submit" disabled={creating || !title.trim()}
        className="h-10 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-50">
        {creating ? 'Creating…' : '+ Add Collection'}
      </button>
    </form>
  )
}

function EditCollectionInline({ collection, onSaved, onCancel }) {
  const [title, setTitle] = useState(collection.title)
  const [author, setAuthor] = useState(collection.author || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.updateCollection(collection.id, { title: title.trim(), author: author.trim() })
      onSaved({ ...collection, title: title.trim(), author: author.trim() })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-stack-sm rounded-xl bg-surface-container border border-primary flex flex-col gap-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
      <input value={author} onChange={(e) => setAuthor(e.target.value)}
        className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 h-9 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} className="flex-1 h-9 rounded-lg border border-outline text-on-surface font-label-sm text-label-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}

function OrganizeResources() {
  const [collections, setCollections] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [unassigned, setUnassigned] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)

  const loadCollections = useCallback(async () => {
    const res = await resourceCollectionsApi.list().catch(() => ({ items: [] }))
    setCollections(res.items || [])
    return res.items || []
  }, [])

  const loadUnassigned = useCallback(async () => {
    const res = await adminApi.needsOrganizing().catch(() => ({ items: [] }))
    setUnassigned(res.items || [])
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadCollections(), loadUnassigned()]).then(([cols]) => {
      if (cols.length > 0) setSelectedId(cols[0].id)
      setLoading(false)
    })
  }, [loadCollections, loadUnassigned])

  const handleCreated = (newCol) => {
    setCollections((prev) => [newCol, ...prev])
    setSelectedId(newCol.id)
  }

  // No section decision here on purpose — the admin only ever says
  // "this belongs with that collection"; the backend figures out the
  // right section automatically from the resource's own type.
  const handleAssign = async (resource) => {
    setAssigningId(resource.id)
    try {
      const d = resource.detected || {}
      await adminApi.organizeResource(resource.id, {
        collectionId: selectedId,
        chapter: d.chapter || null,
        part: d.part || null,
        volume: d.volume || null,
        edition: d.edition || null,
      })
      setUnassigned((prev) => prev.filter((r) => r.id !== resource.id))
    } finally {
      setAssigningId(null)
    }
  }

  const selectedCollection = collections.find((c) => c.id === selectedId)

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Organize Resources" showBack />
      <main className="px-margin-mobile pt-[68px] pb-32">
        {loading && <p className="text-on-surface-variant text-center py-stack-lg">Loading…</p>}

        {!loading && (
          <div className="flex flex-col gap-stack-lg mt-stack-md">
            <CreateCollectionForm onCreated={handleCreated} />

            <section>
              <h3 className="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase mb-stack-sm">
                Collections ({collections.length})
              </h3>
              <div className="flex flex-col gap-2">
                {collections.map((c) =>
                  editingId === c.id ? (
                    <EditCollectionInline
                      key={c.id}
                      collection={c}
                      onCancel={() => setEditingId(null)}
                      onSaved={(updated) => {
                        setCollections((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                        setEditingId(null)
                      }}
                    />
                  ) : (
                    <div key={c.id}
                      className={`flex items-center gap-3 p-stack-sm rounded-xl border cursor-pointer ${
                        selectedId === c.id ? 'bg-primary/10 border-primary' : 'bg-surface-container border-outline'
                      }`}
                    >
                      <button onClick={() => setSelectedId(c.id)} className="flex items-center gap-3 flex-grow min-w-0 text-left">
                        <div className="w-10 h-10 flex-none rounded-lg overflow-hidden bg-surface-container-high border border-outline/50">
                          {c.cover_url ? (
                            <img src={c.cover_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">library_books</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{c.title}</p>
                          {c.author && <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{c.author}</p>}
                        </div>
                      </button>
                      <button onClick={() => setEditingId(c.id)} className="w-8 h-8 flex-none rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    </div>
                  )
                )}
              </div>
            </section>

            {selectedCollection && (
              <section>
                <h3 className="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase mb-stack-sm">
                  Add to "{selectedCollection.title}"
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
                          onClick={() => handleAssign(r)}
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
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default OrganizeResources