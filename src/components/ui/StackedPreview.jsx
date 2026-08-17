function StackedPreview({ id, thumbnailUrl, icon = 'notifications', count = 1, size = 40 }) {
  const layers = Math.min(Math.max(count, 1), 3)

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      {Array.from({ length: layers }).map((_, i) => {
        const depth = layers - 1 - i
        const offset = depth * 4
        const rotate = depth * 6
        const isFront = i === layers - 1

        return (
          <div
            key={i}
            className="absolute inset-0 rounded-lg border border-outline bg-surface-container-highest overflow-hidden flex items-center justify-center"
            style={{
              transform: `translate(${offset}px, ${-offset}px) rotate(${isFront ? 0 : rotate}deg)`,
              zIndex: i,
            }}
          >
            {isFront && thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
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