// lib/mixInCollections.js
//
// Inserts one collection card every `every` items, cycling back to the
// start of `collectionRows` if a rail is longer than the number of
// collections available. Shared by Home.jsx and CollectionPage.jsx so
// both use identical mixing behavior — never duplicate this logic.
export function mixInCollections(items, collectionRows, toRailItem, every = 4) {
  if (!collectionRows || collectionRows.length === 0) return items
  const result = []
  items.forEach((item, i) => {
    result.push(item)
    if ((i + 1) % every === 0) {
      result.push(toRailItem(collectionRows[Math.floor(i / every) % collectionRows.length]))
    }
  })
  return result
}