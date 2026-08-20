// Renders 1–3 fanned cards. Pass `thumbnails` (an array, front-most
// first) to give each fanned layer its own real image — used by
// AppOfflineShell.jsx so each downloaded resource shows its own cover,
// not just the front one. If `thumbnails` isn't passed, falls back to
// the original single-thumbnailUrl-on-the-front-layer behavior (e.g.
// notification badges elsewhere in the app), so nothing else that
// already uses this component is affected.
function StackedPreview({ id, thumbnailUrl, thumbnails, icon = 'notifications', count = 1, size = 40, width, height }) {
  const w = width ?? size
  const h = height ?? size
  const layerCount = thumbnails ? thumbnails.length : count
  const layers = Math.min(Math.max(layerCount, 1), 3)

  return (
    <div className="relative flex-none" style={{ width: w, height: h }}>
      {Array.from({ length: layers }).map((_, i) => {
        const depth = layers - 1 - i
        const offset = depth * 4
        const rotate = depth * 6
        const isFront = i === layers - 1
        const layerThumbnail = thumbnails ? thumbnails[depth] : (isFront ? thumbnailUrl : null)

        return (
          <div
            key={i}
            className="absolute inset-0 rounded-lg border border-outline bg-surface-container-highest overflow-hidden flex items-center justify-center"
            style={{
              transform: `translate(${offset}px, ${-offset}px) rotate(${isFront ? 0 : rotate}deg)`,
              zIndex: i,
            }}
          >
            {layerThumbnail ? (
              <img src={layerThumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              isFront && (
                <span className="material-symbols-outlined text-on-surface-variant text-lg">{icon}</span>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

export default StackedPreview