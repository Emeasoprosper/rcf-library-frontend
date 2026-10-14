import { useState, useEffect, useCallback } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import { adminApi } from '../../services/api'

function Cover({ url }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-10 h-14 flex-none rounded-md overflow-hidden bg-surface-container-high border border-outline/60 flex items-center justify-center">
      {url && !failed ? (
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">menu_book</span>
      )}
    </div>
  )
}

function CategoryChips({ categories }) {
  const list = (categories || []).filter(Boolean)
  if (list.length === 0) {
    return <span className="font-label-sm text-[11px] text-on-surface-variant">Uncategorised</span>
  }
  const shown = list.slice(0, 2)
  const extra = list.length - shown.length
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((name) => (
        <span key={name} className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 font-label-sm text-[11px] leading-4">
          {name}
        </span>
      ))}
      {extra > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-surface-container-high border border-outline/60 text-on-surface-variant font-label-sm text-[11px] leading-4">
          +{extra}
        </span>
      )}
    </div>
  )
}

function StatusPill({ rail }) {
  let label = 'Live'
  let tone = 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
  if (!rail.is_active) {
    label = 'Hidden'
    tone = 'bg-surface-container-high text-on-surface-variant border-outline/60'
  } else if (rail.resources.length === 0) {
    label = 'Empty'
    tone = 'bg-amber-500/15 text-amber-500 border-amber-500/25'
  }
  return (
    <span className={`px-2 py-0.5 rounded-full border font-label-sm text-[11px] leading-4 ${tone}`}>{label}</span>
  )
}

function ActionButton({ icon, label, onClick, disabled, danger = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-8 px-3 rounded-full flex items-center gap-1.5 font-label-sm text-label-sm border transition-colors disabled:opacity-30 ${
        danger
          ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
          : 'bg-surface-container-high border-outline/60 text-on-surface-variant hover:text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
    </button>
  )
}

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

  const liveCount = rails.filter((r) => r.is_active && r.resources.length > 0).length

  return (
    <div className="relative min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 100% 100%, rgba(249,115,22,0.13), transparent 52%), radial-gradient(circle at 0% 100%, rgba(59,130,246,0.08), transparent 48%)',
        }}
      />

      <TopAppBar title="Home Rails" showBack />

      <main className="relative z-10 px-margin-mobile pt-[68px] md:pt-24 md:max-w-2xl md:mx-auto pb-32">
        <div className="mt-stack-md mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg font-display text-on-surface">Curate Home</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Rails appear on Home in this order. A rail needs at least one resource to show.
          </p>
          {!loading && rails.length > 0 && (
            <p className="mt-1 font-label-md text-label-md text-orange-500">
              {liveCount} of {rails.length} rail{rails.length === 1 ? '' : 's'} live on Home
            </p>
          )}
        </div>

        <div className="flex gap-2 mb-stack-lg p-stack-sm rounded-2xl bg-surface-container border border-outline">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            placeholder="New rail title, e.g. Christian Living"
            className="flex-grow h-11 px-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim()}
            className="px-5 h-11 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-label-md text-label-md font-semibold disabled:opacity-40 active:scale-95 transition-transform"
          >
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
          <div className="flex flex-col items-center text-center py-stack-xl">
            <span className="material-symbols-outlined text-on-surface-variant text-[40px] mb-2">view_carousel</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              No rails yet. Create one above, then open it to add resources.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {rails.map((rail, index) => {
            const isOpen = openRailId === rail.id
            const busy = busyId === rail.id

            return (
              <div
                key={rail.id}
                className={`overflow-hidden rounded-2xl bg-surface-container border transition-colors ${
                  isOpen ? 'border-orange-500/40' : 'border-outline'
                } ${busy ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3 p-stack-sm">
                  <label className="relative w-14 h-14 flex-none cursor-pointer">
                    <span className="block w-full h-full rounded-full overflow-hidden bg-surface-container-high border border-outline flex items-center justify-center">
                      {rail.image_url ? (
                        <img src={rail.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-[22px]">image</span>
                      )}
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center border-2 border-surface-container">
                      <span className="material-symbols-outlined text-[12px]">photo_camera</span>
                    </span>
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

                  <button onClick={() => toggleOpen(rail.id)} className="flex-grow min-w-0 flex items-center gap-2 text-left">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{rail.title}</p>
                        <StatusPill rail={rail} />
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {rail.resources.length === 0
                          ? 'No resources yet'
                          : `${rail.resources.length} resource${rail.resources.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant flex-none">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 px-stack-sm pb-stack-sm">
                  <ActionButton icon="arrow_upward" label="Up" onClick={() => move(rail.id, -1)} disabled={index === 0 || busy} />
                  <ActionButton icon="arrow_downward" label="Down" onClick={() => move(rail.id, 1)} disabled={index === rails.length - 1 || busy} />
                  <ActionButton
                    icon={rail.is_active ? 'visibility_off' : 'visibility'}
                    label={rail.is_active ? 'Hide' : 'Show'}
                    onClick={() => toggleActive(rail)}
                    disabled={busy}
                  />
                  <ActionButton icon="delete_outline" label="Delete" onClick={() => handleDelete(rail)} disabled={busy} danger />
                </div>

                {isOpen && (
                  <div className="border-t border-outline bg-surface-container-low/60 p-stack-sm flex flex-col gap-stack-sm">
                    <p className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                      In this rail
                    </p>
                    {rail.resources.length === 0 && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        Nothing yet. Search below and tap Add.
                      </p>
                    )}
                    {rail.resources.map((r) => (
                      <div key={r.id} className="flex items-center gap-3">
                        <Cover url={r.thumbnail_url} />
                        <div className="flex-grow min-w-0 flex flex-col gap-1">
                          <p className="truncate font-body-md text-body-md font-semibold text-on-surface">{r.title}</p>
                          {r.author && <p className="truncate font-label-sm text-label-sm text-on-surface-variant">{r.author}</p>}
                          <CategoryChips categories={r.categories} />
                        </div>
                        <button
                          onClick={() => removeResource(rail, r)}
                          disabled={busy}
                          aria-label="Remove from rail"
                          className="w-8 h-8 flex-none rounded-full flex items-center justify-center text-on-surface-variant hover:text-red-500 hover:bg-red-500/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ))}

                    <p className="mt-stack-sm font-label-md text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                      Add resources
                    </p>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search approved resources…"
                        className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                    {searching && <p className="font-label-sm text-label-sm text-on-surface-variant">Searching…</p>}
                    {results.map((r) => {
                      const added = rail.resources.some((x) => x.id === r.id)
                      return (
                        <div key={r.id} className="flex items-center gap-3">
                          <Cover url={r.thumbnail_url} />
                          <div className="flex-grow min-w-0 flex flex-col gap-1">
                            <p className="truncate font-body-md text-body-md font-semibold text-on-surface">{r.title}</p>
                            {r.author && <p className="truncate font-label-sm text-label-sm text-on-surface-variant">{r.author}</p>}
                            <CategoryChips categories={r.categories} />
                          </div>
                          <button
                            onClick={() => addResource(rail, r)}
                            disabled={added || busy}
                            className={`px-4 h-8 flex-none rounded-full font-label-sm text-label-sm font-semibold ${
                              added
                                ? 'bg-surface-container-high text-on-surface-variant border border-outline/60'
                                : 'bg-orange-500 text-white'
                            } disabled:opacity-60`}
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