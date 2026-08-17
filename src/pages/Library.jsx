// RCFMOUAULIBRARYreact/student-dashboard/src/pages/Library.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import ResourceCard from '../components/resource/ResourceCard'
import Pagination from '../components/ui/Pagination'
import LibraryLoader from '../components/ui/LibraryLoader'
import { useScrollDirection } from '../hooks/useScrollDirection'
import { resourcesApi } from '../services/api'

const ALL_TAB = { label: 'All Resources', category: null }

const PAGE_SIZE = 10

function formatMeta(item) {
  const parts = []
  if (item.author) parts.push(item.author)
  if (item.created_at) parts.push(new Date(item.created_at).getFullYear())
  return parts.join(' • ') || item.type_label
}

function formatTags(item) {
  const tags = [{ icon: item.type_icon || 'description', label: item.type_label }]
  if (item.file_size_bytes) {
    tags.push({ icon: 'download', label: `${(item.file_size_bytes / 1024 / 1024).toFixed(1)} MB` })
  }
  if (item.page_count) {
    tags.push({ icon: 'menu_book', label: `${item.page_count}p` })
  }
  return tags
}

function Library() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(ALL_TAB.label)
  const [searchInput, setSearchInput] = useState('')
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const headerHidden = useScrollDirection()

  const [categories, setCategories] = useState([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)

  useEffect(() => {
    resourcesApi
      .categories()
      .then((data) => setCategories(data.items || []))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoaded(true))
  }, [])

  // FIX: tabs (and every tab object inside it) was being rebuilt from
  // scratch on every single render — a plain array literal with .map()
  // has no memoization, so even though `categories` hadn't changed, the
  // objects were new references each time. useMemo keyed on `categories`
  // itself means tabs only gets rebuilt when the actual category data
  // changes, not on every render.
  const tabs = useMemo(
    () => [ALL_TAB, ...categories.map((c) => ({ label: c.name, category: c.name }))],
    [categories]
  )

  // FIX: this used to just be `tabs.find(...)`, recomputed inline every
  // render, and fetchResources' useCallback depended on that whole
  // object. Even with `tabs` now memoized, `activeTabData` itself was a
  // fresh derived value each render. Pulling out the one primitive value
  // fetchResources actually needs — the category string — breaks the
  // loop at the root: a string only changes when its value changes,
  // never just because a render happened.
  const activeCategory = useMemo(() => {
    const found = tabs.find((t) => t.label === activeTab)
    return found ? found.category : null
  }, [tabs, activeTab])

  const fetchResources = useCallback(async () => {
    if (!categoriesLoaded) return

    setLoading(true)
    setError('')
    try {
      const params = { page, pageSize: PAGE_SIZE, sort: 'recent' }
      if (activeCategory) params.category = activeCategory
      if (searchInput.trim()) params.search = searchInput.trim()

      const categoryFromUrl = searchParams.get('category')
      if (categoryFromUrl) params.category = categoryFromUrl

      const { items, total } = await resourcesApi.list(params)
      setItems(items)
      setTotal(total)
    } catch (err) {
      setError(err.message || 'Could not load the library right now.')
    } finally {
      setLoading(false)
    }
  }, [page, activeCategory, searchInput, searchParams, categoriesLoaded])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  const handleTabChange = (label) => {
    setActiveTab(label)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Library" />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <section
          className={`sticky z-40 w-full bg-background pt-stack-sm pb-stack-sm transition-[top] duration-300 ease-in-out ${
            headerHidden ? 'top-0' : 'top-[68px]'
          }`}
        >
          <div className="relative mb-stack-sm">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              placeholder="Search library resources..."
              className="w-full h-12 pl-12 pr-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
            />
          </div>

          <div className="relative">
            <div className="flex gap-stack-sm overflow-x-auto no-scrollbar snap-x snap-mandatory [mask-image:linear-gradient(to_right,black_92%,transparent)]">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => handleTabChange(tab.label)}
                  className={`flex-none snap-start px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
                    activeTab === tab.label
                      ? 'bg-orange-500 text-white'
                      : 'bg-surface-container border border-outline text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="flex justify-between items-center mt-stack-sm mb-stack-sm text-on-surface-variant">
          <span className="font-label-md text-label-md">
            {!loading && `${total} item${total !== 1 ? 's' : ''} found`}
          </span>
        </div>

        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && <LibraryLoader size={240} fullScreen />}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">
              search_off
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {searchInput ? 'No resources match your search.' : 'No resources here yet.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-gutter">
          {items.map((item) => (
            <ResourceCard
              key={item.id}
              title={item.title}
              meta={formatMeta(item)}
              tags={formatTags(item)}
              icon={item.type_icon}
              thumbnailUrl={item.thumbnail_url}
              thumbnailStatus={item.thumbnail_status}
              fileType={item.file_type}
              onClick={() => navigate(`/resources/${item.id}`)}
            />
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <BottomNav />
    </div>
  )
}

export default Library