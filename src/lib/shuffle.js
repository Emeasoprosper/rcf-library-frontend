// Fisher–Yates shuffle. Used in Home.jsx so a rail's first card isn't
// pinned to the same item on every load — call it once per fetch (not
// per render) so cards don't jump around while the user is looking.
export function shuffle(arr = []) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}