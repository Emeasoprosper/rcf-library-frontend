// RCFMOUAULIBRARYreact/student-dashboard/src/lib/readingPath.js
// "My Reading Path": a short questionnaire (goals, reader type, how they
// learn, time) turned into a reader card, a weekly reading log and shelves
// of real library items. Answers are kept on this device.

const KEY = 'rcf_reading_path_v1'

export const GOALS = [
  { key: 'exams', title: 'Ace my exams', hint: 'Past questions, notes, textbooks', focus: 'Exam prep', shelf: 'For your exams', search: ['past questions', 'lecture notes', 'textbook'], types: ['past_question', 'lecture_notes', 'book'] },
  { key: 'faith', title: 'Grow spiritually', hint: 'Devotionals, sermons, Christian living', focus: 'Faith', shelf: 'For your walk with God', search: ['prayer', 'faith', 'devotional'], types: ['devotional', 'audio'] },
  { key: 'career', title: 'Build my career', hint: 'Skills, business, tech, work', focus: 'Career', shelf: 'For your career', search: ['career', 'business', 'skills', 'success', 'money', 'entrepreneur', 'work'], types: ['book', 'video'] },
  { key: 'lead', title: 'Become a leader', hint: 'Leadership, influence, service', focus: 'Leadership', shelf: 'For the leader in you', search: ['leadership', 'leader', 'influence', 'vision', 'excellence', 'wisdom'], types: ['book', 'audio'] },
  { key: 'growth', title: 'Grow as a person', hint: 'Habits, purpose, relationships', focus: 'Personal growth', shelf: 'For personal growth', search: ['purpose', 'habits', 'relationship'], types: ['book', 'audio'] },
  { key: 'fun', title: 'Read for joy', hint: 'Stories, biographies, history', focus: 'Reading for joy', shelf: 'For the joy of reading', search: ['story', 'biography', 'history'], types: ['book'] },
]

export const TYPES = [
  {
    key: 'planner', title: 'The Planner', line: 'I like order, schedules and finishing what I start.',
    about: 'You do best with structure. Short, steady sessions at the same time each day will take you far.',
    strengths: ['Consistent', 'Finishes books', 'Strong at revision'],
    tip: 'Pick one book per goal and finish it before starting another. Tick off chapters as you go.',
  },
  {
    key: 'explorer', title: 'The Explorer', line: 'I get curious and jump between many topics.',
    about: 'Curiosity is your engine. Variety keeps you reading, so mix formats and topics on purpose.',
    strengths: ['Curious', 'Connects ideas', 'Learns fast'],
    tip: 'Keep three books on the go and rotate them. Write one line about what each taught you.',
  },
  {
    key: 'achiever', title: 'The Achiever', line: 'Give me a target and I will hit it.',
    about: 'Goals and progress move you. Streaks, weekly targets and badges are made for you.',
    strengths: ['Driven', 'Competitive', 'Results-focused'],
    tip: 'Set a weekly goal slightly above comfortable, and protect your streak.',
  },
  {
    key: 'thinker', title: 'The Deep Thinker', line: 'I love to reflect and go deep on one idea.',
    about: 'You read to understand, not to rush. Fewer, richer books with time to think suit you best.',
    strengths: ['Reflective', 'Deep understanding', 'Wise'],
    tip: 'Read slowly and keep a notebook. After each session, write the one sentence you want to remember.',
  },
  {
    key: 'connector', title: 'The Connector', line: 'I learn best by talking and sharing with others.',
    about: 'Ideas come alive for you in conversation. Reading with friends will keep you going.',
    strengths: ['Encouraging', 'Explains well', 'Team player'],
    tip: 'Find a reading partner and share one quote with them every week.',
  },
]

export const STYLES = [
  { key: 'read', title: 'Reading', hint: 'Books and PDFs', verb: 'Read', types: ['book', 'lecture_notes', 'devotional'] },
  { key: 'listen', title: 'Listening', hint: 'Audio and sermons', verb: 'Listen', types: ['audio'] },
  { key: 'watch', title: 'Watching', hint: 'Video lessons', verb: 'Watch', types: ['video'] },
  { key: 'practice', title: 'Practising', hint: 'Past questions', verb: 'Practise', types: ['past_question'] },
]

export const TIMES = [
  { key: 'short', title: '10 to 15 minutes', hint: 'A little, every day', minutes: 15, weekly: 3 },
  { key: 'mid', title: 'About 30 minutes', hint: 'A solid daily habit', minutes: 30, weekly: 5 },
  { key: 'long', title: 'An hour or more', hint: 'Serious reader', minutes: 60, weekly: 7 },
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

// A week of reading: each day leans on one goal and one way of learning, so
// the log reads like a plan ("Faith · Listen · 15 min"), with a lighter Sunday.
export function weeklyPlan(answers) {
  const goals = answers.goals.map((k) => GOALS.find((g) => g.key === k)).filter(Boolean)
  const styles = answers.styles.map((k) => STYLES.find((s) => s.key === k)).filter(Boolean)
  const time = TIMES.find((t) => t.key === answers.time) || TIMES[0]
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days.map((day, i) =>
    i === 6
      ? { day, focus: 'Rest and reflect', how: 'Re-read your notes', minutes: Math.round(time.minutes / 2) }
      : {
          day,
          focus: goals[i % goals.length]?.focus || 'Reading',
          how: styles.length ? styles[i % styles.length].verb : 'Read',
          minutes: time.minutes,
        }
  )
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
