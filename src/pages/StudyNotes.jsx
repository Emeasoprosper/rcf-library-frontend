// student-dashboard/src/pages/StudyNotes.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TopAppBar from '../components/layout/TopAppBar'
import BottomNav from '../components/layout/BottomNav'
import LibraryLoader from '../components/ui/LibraryLoader'
import { studyApi } from '../services/api'

const inputClass =
  'w-full h-12 px-4 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md'

function StudyNotes() {
  const [params] = useSearchParams()
  const resourceId = params.get('resource')
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | { id?, title, body }
  const [saving, setSaving] = useState(false)

  const load = useCallback(
    () => studyApi.notes(resourceId).then((res) => setNotes(res.items || [])),
    [resourceId]
  )

  useEffect(() => {
    load()
      .catch((err) => setError(err.message || 'Could not load your notes.'))
      .finally(() => setLoading(false))
  }, [load])

  const handleSave = async () => {
    if (!editing?.title.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      if (editing.id) {
        await studyApi.updateNote(editing.id, { title: editing.title.trim(), body: editing.body })
      } else {
        await studyApi.createNote({ title: editing.title.trim(), body: editing.body, resourceId: resourceId || null })
      }
      setEditing(null)
      await load()
    } catch (err) {
      setError(err.message || 'Could not save the note.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await studyApi.deleteNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      setError(err.message || 'Could not delete the note.')
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md md:pl-[var(--sb-left)] lg:pr-[var(--sb-right)] transition-[padding] duration-300 ease-in-out">
      <TopAppBar title="My notes" showBack />

      <main className="pb-24 pt-[68px] md:pt-24 md:max-w-3xl md:mx-auto px-margin-mobile">
        {error && (
          <div className="mb-stack-md p-stack-md rounded-xl bg-error/10 border border-error/30">
            <p className="font-body-md text-body-md text-error">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-stack-md">
          <p className="font-label-md text-label-md text-on-surface-variant">
            {resourceId ? 'Notes for this material' : 'All notes'}
            {resourceId && (
              <Link to="/reading-space/notes" className="text-primary ml-2">Show all</Link>
            )}
          </p>
          {!editing && (
            <button
              onClick={() => setEditing({ title: '', body: '' })}
              className="flex items-center gap-1 px-3 h-9 rounded-full bg-primary text-on-primary font-label-md text-label-md active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New note
            </button>
          )}
        </div>

        {editing && (
          <div className="flex flex-col gap-stack-md mb-stack-lg p-stack-md rounded-xl bg-surface-container border border-outline">
            <input
              type="text"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              maxLength={120}
              placeholder="Title"
              className={inputClass}
            />
            <textarea
              rows={8}
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              maxLength={20000}
              placeholder="Write your note…"
              className="w-full px-4 py-3 bg-surface-container-low border border-outline rounded text-on-surface focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-body-md resize-y"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-3 rounded-lg bg-surface-container-low border border-outline font-label-md text-label-md text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editing.title.trim() || saving}
                className={`flex-1 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold ${
                  !editing.title.trim() || saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>
        )}

        {loading && <LibraryLoader size={120} fullScreen />}

        {!loading && notes.length === 0 && !editing && !error && (
          <div className="flex flex-col items-center text-center py-stack-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-stack-sm">edit_note</span>
            <p className="font-body-md text-body-md text-on-surface-variant">No notes yet. Write your first one.</p>
          </div>
        )}

        <div className="flex flex-col gap-gutter">
          {notes.map((note) => (
            <div key={note.id} className="p-stack-md rounded-xl bg-surface-container border border-outline">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-body-md text-body-md font-semibold text-on-surface">{note.title}</p>
                  {note.resource_title && (
                    <p className="font-label-sm text-label-sm text-primary truncate">{note.resource_title}</p>
                  )}
                </div>
                <div className="flex flex-none gap-1">
                  <button
                    onClick={() => setEditing({ id: note.id, title: note.title, body: note.body })}
                    aria-label="Edit note"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    aria-label="Delete note"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
              {note.body && (
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 whitespace-pre-wrap line-clamp-6">
                  {note.body}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default StudyNotes