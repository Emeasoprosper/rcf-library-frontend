// pages/CompleteProfile.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../services/api'

const LEVELS = ['100', '200', '300', '400', '500', 'PG']

function CompleteProfile() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!department.trim() || !level || !studentId.trim()) {
      setError('All fields are required.')
      return
    }

    setSubmitting(true)
    try {
      await authApi.completeProfile({ department: department.trim(), level, studentId: studentId.trim() })
      await refreshUser()
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex flex-col min-h-screen w-full px-margin-mobile py-16 bg-surface-container-lowest text-on-surface">
      <div className="flex flex-col gap-stack-sm max-w-sm w-full mx-auto text-center mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg font-display text-primary">
          Welcome, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="font-body-md text-on-surface-variant">
          A few more details to confirm you're a MOUAU student before you can access the library.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-gutter mx-auto">
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Department</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Computer Science"
            className="w-full py-3 px-4 rounded-lg bg-surface-container-low border border-outline text-on-surface font-body-md focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Level</label>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`py-3 rounded-lg border font-label-md text-label-md transition-colors ${
                  level === lvl
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface border-outline'
                }`}
              >
                {lvl === 'PG' ? 'PG' : `${lvl}L`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Matric / Student ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. 2021/123456"
            className="w-full py-3 px-4 rounded-lg bg-surface-container-low border border-outline text-on-surface font-body-md focus:outline-none focus:border-primary"
          />
        </div>

        {error && <p className="font-label-sm text-label-sm text-error text-center">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md active:scale-[0.98] hover:opacity-90 transition-all disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Continue to Library'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/home')}
          className="font-label-md text-label-md text-on-surface-variant text-center py-2"
        >
          Skip for now
        </button>
      </form>
    </main>
  )
}

export default CompleteProfile