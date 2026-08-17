// Deterministic gradient per file — same name+size always produces the same look.
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getFileGradient(key) {
  const hash = hashString(key)
  const hueA = hash % 360
  const hueB = (hueA + 35 + (hash % 20)) % 360 // close, analogous hue — stays elegant, not clashing
  return `linear-gradient(135deg, hsl(${hueA} 65% 42%) 0%, hsl(${hueB} 60% 28%) 100%)`
}