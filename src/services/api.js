// RCFMOUAULIBRARYreact/student-dashboard/src/services/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/google', '/auth/logout', '/auth/login', '/auth/signup']

async function rawFetch(path, options) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

export async function apiFetch(path, options = {}, _isRetry = false) {
  const res = await rawFetch(path, options)

  if (res.status === 401 && !_isRetry && !NO_REFRESH_PATHS.includes(path)) {
    try {
      await rawFetchOk('/auth/refresh', { method: 'POST' })
      return apiFetch(path, options, true)
    } catch {
      window.dispatchEvent(new Event('auth:expired'))
      throw new Error('Your session expired — please sign in again.')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function rawFetchOk(path, options) {
  const res = await rawFetch(path, options)
  if (!res.ok) throw new Error('refresh failed')
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// POST /uploads/analyze — multipart, so it deliberately does NOT go
// through apiFetch/rawFetch (those always set Content-Type:
// application/json, which breaks a FormData body's multipart boundary).
// Mirrors apiFetch's 401-refresh-then-retry behavior by hand instead.
export async function analyzeResource(file, resourceTypeSlug, _isRetry = false) {
  const formData = new FormData()
  formData.append('file', file)
  if (resourceTypeSlug) formData.append('resourceTypeSlug', resourceTypeSlug)

  const res = await fetch(`${API_BASE}/uploads/analyze`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (res.status === 401 && !_isRetry) {
    try {
      await authApi.refresh()
      return analyzeResource(file, resourceTypeSlug, true)
    } catch {
      window.dispatchEvent(new Event('auth:expired'))
      throw new Error('Your session expired — please sign in again.')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Analysis failed (${res.status})`)
  }

  return res.json()
}

export function uploadResourceFile(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/uploads`)
    xhr.withCredentials = true

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = async () => {
      if (xhr.status === 401) {
        try {
          await rawFetchOk('/auth/refresh', { method: 'POST' })
          uploadResourceFile(formData, onProgress).then(resolve).catch(reject)
          return
        } catch {
          window.dispatchEvent(new Event('auth:expired'))
          reject(new Error('Your session expired — please sign in again.'))
          return
        }
      }

      let body = {}
      try {
        body = JSON.parse(xhr.responseText || '{}')
      } catch {
        // fall through to status check below
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body)
      } else {
        reject(new Error(body.error || `Upload failed (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
}

export function analyzeResource(file, resourceTypeSlug) {
  const formData = new FormData()
  formData.append('file', file)
  if (resourceTypeSlug) formData.append('resourceTypeSlug', resourceTypeSlug)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/uploads/analyze`)
    xhr.withCredentials = true

    xhr.onload = async () => {
      if (xhr.status === 401) {
        try {
          await rawFetchOk('/auth/refresh', { method: 'POST' })
          analyzeResource(file, resourceTypeSlug).then(resolve).catch(reject)
          return
        } catch {
          window.dispatchEvent(new Event('auth:expired'))
          reject(new Error('Your session expired — please sign in again.'))
          return
        }
      }

      let body = {}
      try {
        body = JSON.parse(xhr.responseText || '{}')
      } catch {
        // fall through to status check below
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body)
      } else {
        reject(new Error(body.error || `Analysis failed (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during analysis'))
    xhr.send(formData)
  })
}

export function uploadAnnouncementAttachment(file) {
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/admin/announcements/upload`)
    xhr.withCredentials = true

    xhr.onload = async () => {
      if (xhr.status === 401) {
        try {
          await rawFetchOk('/auth/refresh', { method: 'POST' })
          uploadAnnouncementAttachment(file).then(resolve).catch(reject)
          return
        } catch {
          window.dispatchEvent(new Event('auth:expired'))
          reject(new Error('Your session expired — please sign in again.'))
          return
        }
      }

      let body = {}
      try {
        body = JSON.parse(xhr.responseText || '{}')
      } catch {
        // fall through to status check below
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body)
      } else {
        reject(new Error(body.error || `Upload failed (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
}

export const authApi = {
  googleSignIn: (idToken) =>
    apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),
  checkEmail: (email) =>
    apiFetch('/auth/check-email', { method: 'POST', body: JSON.stringify({ email }) }),
  emailLogin: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  emailSignup: (email, password, name) =>
    apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  me: () => apiFetch('/auth/me'),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  refresh: () => apiFetch('/auth/refresh', { method: 'POST' }),
  completeProfile: (payload) =>
    apiFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  updateMe: (payload) =>
    apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),
}

export const resourcesApi = {
  list: (params = {}, { signal } = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiFetch(`/resources${query ? `?${query}` : ''}`, { signal })
  },
  get: (id) => apiFetch(`/resources/${id}`),
  categories: () => apiFetch('/resources/meta/categories'),
  allCategories: () => apiFetch('/resources/meta/all-categories'),
  createCategory: (name) =>
    apiFetch('/resources/meta/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  departments: () => apiFetch('/resources/meta/departments'),
  download: (id) => apiFetch(`/resources/${id}/download`, { method: 'POST' }),
  bookmark: (id, collectionId) =>
    apiFetch(`/resources/${id}/bookmark`, { method: 'POST', body: JSON.stringify({ collectionId }) }),
  unbookmark: (id) => apiFetch(`/resources/${id}/bookmark`, { method: 'DELETE' }),
  updateProgress: (id, progressPercent) =>
    apiFetch(`/resources/${id}/progress`, { method: 'PUT', body: JSON.stringify({ progressPercent }) }),
  streamUrl: (id) => `${API_BASE}/resources/${id}/stream`,
  // NEW: points at the backend's own thumbnail proxy (resources.js ->
  // GET /:id/thumbnail), which streams the cover through our API origin
  // rather than exposing Drive's webContentLink directly. Used both for
  // normal <img> display and — critically — as the fetch source when
  // embedding a thumbnail for offline storage, since it's reliably
  // same-origin/CORS-safe in a way a raw Drive link is not.
  thumbnailUrl: (id) => `${API_BASE}/resources/${id}/thumbnail`,
  createShareLink: (id) => apiFetch(`/resources/${id}/share`, { method: 'POST' }),
  resolveShareToken: (token) => apiFetch(`/resources/share/${token}/resolve`),
  downloadFileForOffline: async (id) => {
    const res = await fetch(`${API_BASE}/resources/${id}/download-file`, { credentials: 'include' })
    if (!res.ok) throw new Error('Failed to download file')
    const blob = await res.blob()
    return { blob, mimeType: res.headers.get('Content-Type') }
  },
}

const ANALYTICS_BASE = '/analytics'

export const analyticsApi = {
  frequentlyViewed: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiFetch(`${ANALYTICS_BASE}/resources/frequently-viewed${query ? `?${query}` : ''}`)
  },
  similar: (resourceId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiFetch(`${ANALYTICS_BASE}/resources/${resourceId}/similar${query ? `?${query}` : ''}`)
  },
  recommended: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiFetch(`${ANALYTICS_BASE}/recommended${query ? `?${query}` : ''}`)
  },
  logView: (resourceId) =>
    apiFetch(`${ANALYTICS_BASE}/resources/${resourceId}/view`, { method: 'POST' }),
}

export const communityApi = {
  createRequest: (payload) => apiFetch('/requests', { method: 'POST', body: JSON.stringify(payload) }),
  myRequests: () => apiFetch('/me/requests'),
  createSuggestion: (payload) => apiFetch('/suggestions', { method: 'POST', body: JSON.stringify(payload) }),
  trendingSuggestions: () => apiFetch('/suggestions/trending'),
  voteSuggestion: (id) => apiFetch(`/suggestions/${id}/vote`, { method: 'POST' }),

  suggestionReplies: (id) => apiFetch(`/suggestions/${id}/replies`),
  addReply: (suggestionId, { body, parentReplyId }) =>
    apiFetch(`/suggestions/${suggestionId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body, parentReplyId }),
    }),
  deleteReply: (id) => apiFetch(`/replies/${id}`, { method: 'DELETE' }),

  reactToSuggestion: (id, kind) =>
    apiFetch(`/suggestions/${id}/react`, { method: 'POST', body: JSON.stringify({ kind }) }),
  unreactSuggestion: (id) => apiFetch(`/suggestions/${id}/react`, { method: 'DELETE' }),
  reactToReply: (id, kind) =>
    apiFetch(`/replies/${id}/react`, { method: 'POST', body: JSON.stringify({ kind }) }),
  unreactReply: (id) => apiFetch(`/replies/${id}/react`, { method: 'DELETE' }),

  notifications: () => apiFetch('/notifications'),
  markNotificationRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
  deleteNotification: (id) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }),
  bookmarks: () => apiFetch('/bookmarks'),
  readingHistory: () => apiFetch('/reading-history'),
  downloads: () => apiFetch('/downloads'),
  myUploads: () => apiFetch('/me/uploads'),
  deleteMyUpload: (id) => apiFetch(`/me/uploads/${id}`, { method: 'DELETE' }),
  leaderboard: () => apiFetch('/leaderboard'),
}

export const adminApi = {
  dashboard: () => apiFetch('/admin/dashboard'),
  pendingUploads: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiFetch(`/admin/uploads${query ? `?${query}` : ''}`)
  },
  previewToken: (id) => apiFetch(`/admin/uploads/${id}/preview-token`),
  previewStreamUrl: (id, token) => `${API_BASE}/admin/uploads/${id}/preview-stream?token=${encodeURIComponent(token)}`,
  claimReview: (id) => apiFetch(`/admin/uploads/${id}/claim`, { method: 'POST' }),
  releaseReview: (id) => apiFetch(`/admin/uploads/${id}/release`, { method: 'POST' }),
  approveUpload: (id) => apiFetch(`/admin/uploads/${id}/approve`, { method: 'PATCH' }),
  rejectUpload: (id, reason) =>
    apiFetch(`/admin/uploads/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  resources: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiFetch(`/admin/resources${query ? `?${query}` : ''}`)
  },
  deleteResource: (id) => apiFetch(`/admin/resources/${id}`, { method: 'DELETE' }),
  users: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiFetch(`/admin/users${query ? `?${query}` : ''}`)
  },
  setUserRole: (id, role) =>
    apiFetch(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  suspendUser: (id, suspended) =>
    apiFetch(`/admin/users/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ suspended }) }),
  requests: () => apiFetch('/admin/requests'),
  resolveRequest: (id, status, fulfilledResourceId) =>
    apiFetch(`/admin/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, fulfilledResourceId }),
    }),
  createAnnouncement: (payload) =>
    apiFetch('/admin/announcements', { method: 'POST', body: JSON.stringify(payload) }),
  uploadAnnouncementAttachment: (file) => uploadAnnouncementAttachment(file),
  listAnnouncements: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiFetch(`/admin/announcements${query ? `?${query}` : ''}`)
  },
  deleteAnnouncement: (id) => apiFetch(`/admin/announcements/${id}`, { method: 'DELETE' }),
  lockStatus: (id) => apiFetch(`/admin/uploads/${id}/lock-status`),
}

export const newsApi = {
  latest: () => apiFetch('/news'),
  get: (id) => apiFetch(`/news/${id}`),
}

