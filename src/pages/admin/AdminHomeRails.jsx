import { useState, useEffect, useCallback } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import { adminApi, resourcesApi } from '../../services/api'

function AdminHomeRails() {
  const [rails, setRails] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    adminApi.homeRails().then((res) => setRails(res.items || [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await adminApi.createHomeRail(newTitle.trim())
      setNewTitle('')
      load()
    } finally {
      setCreating(false)
    }
  }

  const handleImageSelect = async (railId, file) => {
    // Reuses the collection-cover upload route (works for any image
    // meant to be shown small + circular) — see admin.js's coverUpload.
    const formData = new FormData()
    formData.append('file', file)
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
    await fetch(`${API_BASE}/admin/home-rails/${railId}/image`, {
      method: 'POST', credentials: 'include', body: formData,
    })
    load()
  }

  const move = async (rail, direction) => {
    const newOrder = rail.sort_order + direction
    await adminApi.updateHomeRail(rail.id, { sortOrder: newOrder })
    load()
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="Home Rails" showBack />
      <main className="px-margin-mobile pt-[68px] md:pt-24 md:max-w-2xl md:mx-auto pb-32">
        <div className="flex gap-2 mb-stack-lg">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New rail title, e.g. Christian Living"
            className="flex-grow h-11 px-3 bg-surface-container-low border border-outline rounded-lg text-on-surface"
          />
          <button onClick={handleCreate} disabled={creating} className="px-4 rounded-lg bg-primary text-on-primary font-label-md disabled:opacity-50">
            {creating ? '…' : 'Create'}
          </button>
        </div>

        {loading && <p className="text-on-surface-variant text-center py-stack-lg">Loading…</p>}

        <div className="flex flex-col gap-3">
          {rails.map((rail) => (
            <div key={rail.id} className="flex items-center gap-3 p-stack-sm rounded-xl bg-surface-container border border-outline">
              <label className="w-12 h-12 flex-none rounded-full overflow-hidden bg-surface-container-high border border-outline cursor-pointer flex items-center justify-center">
                {rail.image_url ? (
                  <img src={rail.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">add_photo_alternate</span>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(rail.id, e.target.files[0])} />
              </label>
              <div className="flex-grow min-w-0">
                <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{rail.title}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{rail.resources.length} resource{rail.resources.length === 1 ? '' : 's'}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => move(rail, -1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </button>
                <button onClick={() => move(rail, 1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default AdminHomeRails