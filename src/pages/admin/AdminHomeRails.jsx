import { useState, useEffect, useCallback } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import { adminApi } from '../../services/api'

function AdminHomeRails() {
  const [rails, setRails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [openRailId, setOpenRailId] = useState(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const load = useCallback(() => {
    return adminApi
      .homeRails()
      .then((res) => {
        setRails(res.items || [])
        setError('')
      })
      .catch((err) => setError(err.message || 'Could not load rails'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Resource picker for the open rail: approved resources, searchable.
  useEffect(() => {
    if (!openRailId) return
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(() => {
      adminApi
        .resources({ status: 'approved', search: search.trim(), pageSize: 10 })
        .then((res) => { if (!cancelled) setResults(res.items || []) })
        .catch((err) => { if (!cancelled) setError(err.message || 'Search failed') })
        .finally(() => { if (!cancelled) setSearching(false) })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [openRailId, search])

  const run = async (railId, action) => {
    setBusyId(railId)
    setError('')
    try {
      await action()
      await load()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusyId(null)
    }
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setError('')
    try {
      await adminApi.createHomeRail(newTitle.trim())
      setNewTitle('')
      await load()
    } catch (err) {
      setError(err.message || 'Could not create the rail')
    } finally {
      setCreating(false)
    }
  }

  const handleImageSelect = (railId, file) =>
    run(railId, () => adminApi.uploadHomeRailImage(railId, file))

  // Swaps with the neighbour, then renumbers every rail 0..n-1 so there
  // are never ties or gaps in sort_order.
  const move = (railId, direction) =>
    run(railId, async () => {
      const index = rails.findIndex((r) => r.id === railId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= rails.length) return
      const reordered = [...rails]
      ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
      await Promise.all(reordered.map((r, i) => adminApi.updateHomeRail(r.id, { sortOrder: i })))
    })

  const toggleActive = (rail) =>
    run(rail.id, () => adminApi.updateHomeRail(rail.id, { isActive: !rail.is_active }))

  const handleDelete = (rail) => {
    if (!window.confirm(`Delete the rail "${rail.title}"? The resources themselves are not deleted.`)) return
    run(rail.id, () => adminApi.deleteHomeRail(rail.id))
  }

  const addResource = (rail, resource) =>
    run(rail.id, () => adminApi.addHomeRailItem(rail.id, resource.id))

  const removeResource = (rail, resource) =>
    run(rail.id, () => adminApi.removeHomeRailItem(rail.id, resource.id))

  const toggleOpen = (railId) => {
    setOpenRailId((prev) => (prev === railId ? null : railId))
    setSearch('')
    setResults([])
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Home Rails" showBack />
      <main className="px-margin-mobile pt-[68px] md:pt-24 md:max-w-2xl md:mx-auto pb-32">
        <div className="flex gap-2 mb-stack-lg">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            placeholder="New rail title, e.g. Christian Living"
            className="flex-grow h-11 px-3 bg-surface-container-low border border-outline rounded-lg text-on-surface"
          />
          <button onClick={handleCreate} disabled={creating} className="px-4 rounded-lg bg-primary text-on-primary font-label-md disabled:opacity-50">
            {creating ? '…' : 'Create'}
          </button>
        </div>

        {error && (
          <div className="mb-stack-md p-stack-sm rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && <p className="text-on-surface-variant text-center py-stack-lg">Loading…</p>}

        {!loading && rails.length === 0 && (
          <p className="text-on-surface-variant text-center py-stack-lg">
            No rails yet. Create one above, then open it to add resources.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {rails.map((rail, index) => {
            const isOpen = openRailId === rail.id
            const busy = busyId === rail.id
            const statusNote = !rail.is_active
              ? 'Hidden on Home'
              : rail.resources.length === 0
              ? 'Empty — not shown on Home until you add resources'
              : `${rail.resources.length} resource${rail.resources.length === 1 ? '' : 's'}`

            return (
              <div key={rail.id} className={`rounded-xl bg-surface-container border border-outline ${busy ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3 p-stack-sm">
                  <label className="w-12 h-12 flex-none rounded-full overflow-hidden bg-surface-container-high border border-outline cursor-pointer flex items-center justify-center">
                    {rail.image_url ? (
                      <img src={rail.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">add_photo_alternate</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) handleImageSelect(rail.id, file)
                      }}
                    />
                  </label>

                  <div className="flex-grow min-w-0">
                    <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{rail.title}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{statusNote}</p>
                  </div>

                  <div className="flex items-center gap-1 flex-none">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => move(rail.id, -1)} disabled={index === 0 || busy} aria-label="Move up" className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container-high disabled:opacity-30">
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                      <button onClick={() => move(rail.id, 1)} disabled={index === rails.length - 1 || busy} aria-label="Move down" className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container-high disabled:opacity-30">
                        <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      </button>
                    </div>
                    <button onClick={() => toggleActive(rail)} disabled={busy} aria-label={rail.is_active ? 'Hide rail' : 'Show rail'} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high">
                      <span className="material-symbols-outlined text-[20px]">{rail.is_active ? 'visibility' : 'visibility_off'}</span>
                    </button>
                    <button onClick={() => handleDelete(rail)} disabled={busy} aria-label="Delete rail" className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error">
                      <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                    </button>
                    <button onClick={() => toggleOpen(rail.id)} aria-label={isOpen ? 'Close' : 'Edit resources'} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high">
                      <span className="material-symbols-outlined text-[20px]">{isOpen ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-outline p-stack-sm flex flex-col gap-stack-sm">
                    <p className="font-label-md text-label-md font-semibold text-on-surface-variant">In this rail</p>
                    {rail.resources.length === 0 && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Nothing yet. Search below and tap Add.</p>
                    )}
                    {rail.resources.map((r) => (
                      <div key={r.id} className="flex items-center gap-2">
                        <p className="flex-grow min-w-0 truncate font-body-md text-body-md text-on-surface">{r.title}</p>
                        <button onClick={() => removeResource(rail, r)} disabled={busy} aria-label="Remove from rail" className="w-8 h-8 flex-none rounded-full flex items-center justify-center text-on-surface-variant hover:text-error">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ))}

                    <p className="font-label-md text-label-md font-semibold text-on-surface-variant mt-stack-sm">Add resources</p>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search approved resources…"
                      className="h-10 px-3 bg-surface-container-low border border-outline rounded-lg text-on-surface"
                    />
                    {searching && <p className="font-label-sm text-label-sm text-on-surface-variant">Searching…</p>}
                    {results.map((r) => {
                      const added = rail.resources.some((x) => x.id === r.id)
                      return (
                        <div key={r.id} className="flex items-center gap-2">
                          <div className="flex-grow min-w-0">
                            <p className="truncate font-body-md text-body-md text-on-surface">{r.title}</p>
                            {r.author && <p className="truncate font-label-sm text-label-sm text-on-surface-variant">{r.author}</p>}
                          </div>
                          <button
                            onClick={() => addResource(rail, r)}
                            disabled={added || busy}
                            className="px-3 h-8 flex-none rounded-full bg-primary text-on-primary font-label-sm text-label-sm disabled:opacity-40"
                          >
                            {added ? 'Added' : 'Add'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default AdminHomeRails