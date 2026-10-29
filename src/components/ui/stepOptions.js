// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/stepOptions.js
// Shared by the step-by-step screens (StepShell, MissingDetailsPrompt,
// CompleteProfile). Values are what the backend stores; labels/emoji are display only.

// Card colours, picked to stay readable with white text in light and dark mode.
export const STEP_THEMES = {
  blue: { panel: 'from-[#4f6cf7] via-[#5b7cfa] to-[#7c5cf5]', buddy: '#ffd166', card: 'bg-[#5b7cfa]' },
  pink: { panel: 'from-[#d946ef] via-[#e05cf0] to-[#f472b6]', buddy: '#7dd3fc', card: 'bg-[#d64fe6]' },
  green: { panel: 'from-[#4caf50] via-[#6cc04a] to-[#a3d65c]', buddy: '#5b7cfa', card: 'bg-[#5fae45]' },
  orange: { panel: 'from-[#f97316] via-[#fb923c] to-[#facc15]', buddy: '#a855f7', card: 'bg-[#f0782a]' },
  teal: { panel: 'from-[#0d9488] via-[#14b8a6] to-[#38bdf8]', buddy: '#f472b6', card: 'bg-[#14a394]' },
  slate: { panel: 'from-[#334155] via-[#3f4d63] to-[#475569]', buddy: '#facc15', card: 'bg-[#3f4d63]' },
}

export const CARD_ROTATION = ['blue', 'pink', 'green', 'orange', 'teal', 'slate']

export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male', emoji: '👨🏾' },
  { value: 'Female', label: 'Female', emoji: '👩🏾' },
]
export const RCF_OPTIONS = [
  { value: true, label: "Yes, I'm in RCF", emoji: '🙌' },
  { value: false, label: 'Not yet', emoji: '👋' },
]
export const JOIN_REASON_OPTIONS = [
  { value: 'Find study materials for school', label: 'Study materials', emoji: '📚' },
  { value: 'Grow spiritually', label: 'Grow spiritually', emoji: '🙏' },
  { value: 'Both of the above', label: 'Both of these', emoji: '✨' },
  { value: 'Just exploring', label: 'Just exploring', emoji: '🧭' },
]
export const HEARD_FROM_OPTIONS = [
  { value: 'A friend', label: 'A friend', emoji: '🤝' },
  { value: 'RCF fellowship meeting', label: 'Fellowship meeting', emoji: '⛪' },
  { value: 'Social media', label: 'Social media', emoji: '📱' },
  { value: 'Flyer/poster on campus', label: 'Flyer or poster', emoji: '📌' },
  { value: 'Church announcement', label: 'Announcement', emoji: '📣' },
  { value: 'Other', label: 'Somewhere else', emoji: '💬' },
]
