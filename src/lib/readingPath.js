// RCFMOUAULIBRARYreact/student-dashboard/src/lib/readingPath.js
// "My Reading Path": a short quiz (goals, reader type, how they learn, time)
// turned into a reader profile, a daily rhythm and shelves of real library
// items. Answers are kept on this device so the path is there next time.

const KEY = 'rcf_reading_path_v1'

export const GOALS = [
  { key: 'exams', icon: 'school', title: 'Ace my exams', hint: 'Past questions, notes, textbooks', shelf: 'For your exams', search: ['past questions', 'lecture notes', 'textbook'], types: ['past_question', 'lecture_notes', 'book'] },
  { key: 'faith', icon: 'auto_stories', title: 'Grow spiritually', hint: 'Devotionals, sermons, Christian living', shelf: 'For your walk with God', search: ['prayer', 'faith', 'devotional'], types: ['devotional', 'audio'] },
  { key: 'career', icon: 'work', title: 'Build my career', hint: 'Skills, business, tech, jobs', shelf: 'For your career', search: ['career', 'business', 'skills', 'success', 'money', 'entrepreneur', 'work'], types: ['book', 'video'] },
  { key: 'lead', icon: 'groups', title: 'Become a leader', hint: 'Leadership, influence, service', shelf: 'For the leader in you', search: ['leadership', 'leader', 'influence', 'vision', 'excellence', 'wisdom'], types: ['book', 'audio'] },
  { key: 'growth', icon: 'self_improvement', title: 'Grow as a person', hint: 'Habits, purpose, relationships', shelf: 'For personal growth', search: ['purpose', 'habits', 'relationship'], types: ['book', 'audio'] },
  { key: 'fun', icon: 'local_library', title: 'Read for joy', hint: 'Stories, biographies, history', shelf: 'For the joy of reading', search: ['story', 'biography', 'history'], types: ['book'] },
]

export const TYPES = [
  {
    key: 'planner', emoji: '🗂️', title: 'The Planner', line: 'I like order, schedules and finishing what I start.',
    gradient: 'from-[#5b7cfa] to-[#3f51b5]',
    about: 'You do best with structure. Short, steady sessions at the same time each day will take you far.',
    strengths: ['Consistent', 'Finishes books', 'Great at revision'],
    tip: 'Pick one book per goal and finish it before starting another. Tick off chapters as you go.',
  },
  {
    key: 'explorer', emoji: '🧭', title: 'The Explorer', line: 'I get curious and jump between many topics.',
    gradient: 'from-[#14b8a6] to-[#0e7490]',
    about: 'Curiosity is your engine. Variety keeps you reading, so mix formats and topics on purpose.',
    strengths: ['Curious', 'Connects ideas', 'Learns fast'],
    tip: 'Keep a "currently exploring" list of 3 items and rotate them. Write one line about what each taught you.',
  },
  {
    key: 'achiever', emoji: '🏆', title: 'The Achiever', line: 'Give me a target and I will hit it.',
    gradient: 'from-[#f59e0b] to-[#ea580c]',
    about: 'Goals and progress move you. Streaks, weekly targets and badges are made for you.',
    strengths: ['Driven', 'Competitive', 'Results-focused'],
    tip: 'Set a weekly goal slightly above comfortable, and protect your streak like a trophy.',
  },
  {
    key: 'thinker', emoji: '💭', title: 'The Deep Thinker', line: 'I love to reflect and go deep on one idea.',
    gradient: 'from-[#8b5cf6] to-[#6d28d9]',
    about: 'You read to understand, not to rush. Fewer, richer books with time to think suit you best.',
    strengths: ['Reflective', 'Deep understanding', 'Wise'],
    tip: 'Read slowly and journal. After each session, write the one sentence you want to remember.',
  },
  {
    key: 'connector', emoji: '🤝', title: 'The Connector', line: 'I learn best by talking and sharing with others.',
    gradient: 'from-[#ec4899] to-[#be185d]',
    about: 'Ideas come alive for you in conversation. Reading with friends will keep you going.',
    strengths: ['Encouraging', 'Great explainer', 'Team player'],
    tip: 'Start a two-person reading pair or study group, and share one quote a week with them.',
  },
]

export const STYLES = [
  { key: 'read', icon: 'menu_book', title: 'Reading', hint: 'Books and PDFs', types: ['book', 'lecture_notes', 'devotional'] },
  { key: 'listen', icon: 'headphones', title: 'Listening', hint: 'Audio and sermons', types: ['audio'] },
  { key: 'watch', icon: 'smart_display', title: 'Watching', hint: 'Video lessons', types: ['video'] },
  { key: 'practice', icon: 'quiz', title: 'Practising', hint: 'Past questions', types: ['past_question'] },
]

export const TIMES = [
  { key: 'short', icon: 'timer', title: '10–15 min a day', hint: 'A little, every day', minutes: 15, weekly: 3 },
  { key: 'mid', icon: 'schedule', title: '30 min a day', hint: 'A solid daily habit', minutes: 30, weekly: 5 },
  { key: 'long', icon: 'hourglass_top', title: '1 hour or more', hint: 'Serious reader mode', minutes: 60, weekly: 7 },
]

export function loadPath() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    return saved?.goals?.length && saved.type ? saved : null
  } catch {
    return null
  }
}

export function savePath(answers) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...answers, at: Date.now() })) } catch { /* storage blocked */ }
}

export function clearPath() {
  try { localStorage.removeItem(KEY) } catch { /* storage blocked */ }
}

// A simple weekly rhythm from their time and goals: which goal each day leans on.
export function weeklyPlan(answers) {
  const goals = answers.goals.map((k) => GOALS.find((g) => g.key === k)).filter(Boolean)
  const time = TIMES.find((t) => t.key === answers.time) || TIMES[0]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((day, i) => ({
    day,
    goal: i === 6 ? null : goals[i % goals.length],
    minutes: i === 6 ? Math.round(time.minutes / 2) : time.minutes,
  }))
}

// Shelves of real library items for each goal, leaning on how they like to learn.
// Several short searches per goal, merged and de-duplicated across shelves.
export async function buildShelves(answers, listResources) {
  const preferred = new Set(answers.styles.flatMap((k) => STYLES.find((s) => s.key === k)?.types || []))
  const used = new Set()
  const shelves = []

  for (const key of answers.goals) {
    const goal = GOALS.find((g) => g.key === key)
    if (!goal) continue
    const types = goal.types.filter((t) => preferred.has(t))
    const searches = [...goal.search, ...(answers.topic ? [answers.topic] : [])]
    const results = await Promise.allSettled(
      searches.map((search) => listResources({ search, pageSize: 12, ...(types.length ? { type: types.join(',') } : {}) }))
    )
    let items = results.flatMap((r) => (r.status === 'fulfilled' ? r.value?.items || [] : []))
    // Nothing in their preferred format: fall back to any format for this goal.
    if (items.length === 0 && types.length) {
      const any = await Promise.allSettled(goal.search.map((search) => listResources({ search, pageSize: 12 })))
      items = any.flatMap((r) => (r.status === 'fulfilled' ? r.value?.items || [] : []))
    }
    const unique = items.filter((it) => !used.has(it.id) && used.add(it.id)).slice(0, 12)
    shelves.push({ goal, items: unique })
  }
  return shelves
}
