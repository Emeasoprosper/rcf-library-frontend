import { useState, useEffect, useCallback } from 'react'
import TopAppBar from '../../components/layout/TopAppBar'
import AdminNav from '../../components/layout/AdminNav'
import Pagination from '../../components/ui/Pagination'
import LibraryLoader from '../../components/ui/LibraryLoader'
import { adminApi } from '../../services/api'

const PAGE_SIZE = 15

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { items } = await adminApi.users({ search: query, page, pageSize: PAGE_SIZE })
      setUsers(items)
      // Same approximation note as AdminUploads — backend doesn't return a
      // total count here yet, so pagination display is a best-effort guess.
      setTotal(items.length < PAGE_SIZE ? (page - 1) * PAGE_SIZE + items.length : page * PAGE_SIZE + 1)
    } catch (err) {
      setError(err.message || 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [query, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const isAdminRole = (role) => role === 'admin' || role === 'superadmin'

  const toggleAdmin = async (user) => {
    setBusyId(user.id)
    const newRole = isAdminRole(user.role) ? 'student' : 'admin'
    try {
      await adminApi.setUserRole(user.id, newRole)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)))
    } catch (err) {
      setError(err.message || 'Could not update role.')
    } finally {
      setBusyId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleSearch = (value) => {
    setQuery(value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <TopAppBar title="Users" showBack />

      <main className="pb-24 pt-[68px] px-margin-mobile">
        <div className="relative mb-stack-sm">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full h-12 pl-12 pr-4 bg-surface-container-low border border-outline rounded-full text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md"
          />
        </div>

        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-stack-lg">
            <LibraryLoader size={80} />
          </div>
        )}

        {!loading && (
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-stack-md">
            {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        )}

        <div className="flex flex-col gap-gutter">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 p-stack-md rounded-xl bg-surface-container border border-outline">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline flex items-center justify-center flex-none overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{user.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {user.studentId || user.email}
                </p>
              </div>
              <button
                onClick={() => toggleAdmin(user)}
                disabled={busyId === user.id || user.role === 'superadmin'}
                className={`flex-none px-3 py-1.5 rounded-full font-label-sm text-label-sm border transition-colors disabled:opacity-50 ${
                  isAdminRole(user.role)
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {user.role === 'superadmin' ? 'Super Admin' : isAdminRole(user.role) ? 'Admin' : 'Make Admin'}
              </button>
            </div>
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <AdminNav />
    </div>
  )
}

export default AdminUsers