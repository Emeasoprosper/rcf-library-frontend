import { useState, useEffect, useCallback } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import { adminApi, resourceCollectionsApi, resourcesApi } from '../../services/api'

function OrganizeRow({ item, authors, categories, collections, onSaved }) {
  const detected = item.detected || {}
  const [authorName, setAuthorName] = useState(item.author || '')
  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [newCollectionTitle, setNewCollectionTitle] = useState('')
  const [sectionName, setSectionName] = useState(detected.sectionGuess || '')
  const [chapter, setChapter] = useState(detected.chapter || '')
  const [part, setPart] = useState(detected.part || '')
  const [volume, setVolume] = useState(detected.volume || '')
  const [edition, setEdition] = useState(detected.edition || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.organizeResource(item.id, {
        authorName: authorName || null,
        categoryId: categoryId === '__new__' ? null : categoryId || null,
        newCategoryName: categoryId === '__new__' ? newCategoryName : null,
        collectionId: collectionId === '__new__' ? null : collectionId || null,
        newCollectionTitle: collectionId === '__new__' ? newCollectionTitle : null,
        sectionName: sectionName || null,
        chapter: chapter || null,
        part: part || null,
        volume: volume || null,
        edition: edition || null,
      })
      setSaved(true)
      onSaved(item.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-stack-md rounded-xl bg-surface-container border border-outline">
      <p className="font-body-md text-body-md font-semibold text-on-surface mb-1">{item.title}</p>
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-3 truncate">{item.file_name}</p>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          list="author-suggestions"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Author"
          className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface"
        >
          <option value="">Category…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="__new__">+ New category</option>
        </select>
        {categoryId === '__new__' && (
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="col-span-2 h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface"
          />
        )}

        <select
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface"
        >
          <option value="">Collection…</option>
          {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          <option value="__new__">+ New collection</option>
        </select>
        <input
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          placeholder="Section (e.g. Book, Audio)"
          className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface"
        />
        {collectionId === '__new__' && (
          <input
            value={newCollectionTitle}
            onChange={(e) => setNewCollectionTitle(e.target.value)}
            placeholder="New collection title"
            className="col-span-2 h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface"
          />
        )}

        <input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapter"
          className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
        <input value={part} onChange={(e) => setPart(e.target.value)} placeholder="Part"
          className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
        <input value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="Volume"
          className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
        <input value={edition} onChange={(e) => setEdition(e.target.value)} placeholder="Edition"
          className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-sm text-on-surface" />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full h-10 rounded-lg font-label-md text-label-md ${
          saved ? 'bg-primary/20 text-primary' : 'bg-primary text-on-primary'
        } disabled:opacity-60`}
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓ — Save again' : 'Save'}
      </button>
    </div>
  )
}

function OrganizeResources() {
  const [items, setItems] = useState([])
  const [authors, setAuthors] = useState([])
  const [categories, setCategories] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [needsOrg, authorsRes, categoriesRes, collectionsRes] = await Promise.all([
      adminApi.needsOrganizing().catch(() => ({ items: [] })),
      adminApi.authors().catch(() => ({ items: [] })),
      resourcesApi.allCategories().catch(() => ({ items: [] })),
      resourceCollectionsApi.list().catch(() => ({ items: [] })),
    ])
    setItems(needsOrg.items || [])
    setAuthors(authorsRes.items || [])
    setCategories(categoriesRes.items || [])
    setCollections(collectionsRes.items || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // A saved row just moves to the bottom rather than disappearing — the
  // admin can immediately see it's done without losing their place in
  // an otherwise-unchanged list, and can still re-save if they made a
  // mistake without navigating away and back.
  const handleSaved = (id) => {
    setItems((prev) => {
      const saved = prev.find((i) => i.id === id)
      return [...prev.filter((i) => i.id !== id), saved]
    })
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Organize Resources" showBack />
      <main className="px-margin-mobile pt-[68px] pb-32">
        <p className="font-body-md text-body-md text-on-surface-variant mt-stack-md mb-stack-md">
          {items.length} resources with no collection assigned yet.
        </p>

        <datalist id="author-suggestions">
          {authors.map((a) => <option key={a.id} value={a.name} />)}
        </datalist>

        {loading && <p className="text-on-surface-variant text-center py-stack-lg">Loading…</p>}

        <div className="flex flex-col gap-gutter">
          {items.map((item) => (
            <OrganizeRow
              key={item.id}
              item={item}
              authors={authors}
              categories={categories}
              collections={collections}
              onSaved={handleSaved}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

export default OrganizeResources