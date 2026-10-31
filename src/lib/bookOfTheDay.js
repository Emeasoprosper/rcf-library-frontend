// RCFMOUAULIBRARYreact/student-dashboard/src/lib/bookOfTheDay.js
// One book from the library per Lagos day. Everyone gets the same pick on
// the same day (day number -> position in the book list), and it is cached
// on the device so it doesn't change while the day lasts.
const KEY = 'rcf_book_of_the_day'

const lagosDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

export async function fetchBookOfTheDay(listResources) {
  const day = lagosDay()
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (cached?.day === day && cached.item) return cached.item
  } catch { /* storage blocked */ }

  const base = { type: 'book', sort: 'recent' }
  const first = await listResources({ ...base, pageSize: 1 })
  const total = Number(first?.total) || 0
  if (!total) return null
  // Spread consecutive days across the list instead of walking it in order.
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000)
  const index = (dayNumber * 7919) % total
  const pick = index === 0 ? first : await listResources({ ...base, pageSize: 1, page: index + 1 })
  const item = pick?.items?.[0] || first.items?.[0] || null

  try { localStorage.setItem(KEY, JSON.stringify({ day, item })) } catch { /* storage blocked */ }
  return item
}
