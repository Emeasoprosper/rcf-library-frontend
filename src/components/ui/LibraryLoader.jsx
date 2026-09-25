// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/LibraryLoader.jsx
function ShimmerStyles() {
  return (
    <style>{`
      .library-loader-shimmer {
        position: relative;
        overflow: hidden;
      }
      .library-loader-shimmer::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
        animation: library-loader-shimmer-sweep 1.6s ease-in-out infinite;
      }
      @keyframes library-loader-shimmer-sweep {
        100% { transform: translateX(100%); }
      }
    `}</style>
  )
}

function Block({ className = '' }) {
  return <div className={`library-loader-shimmer bg-surface-container-high rounded ${className}`} />
}

function LibraryLoader({ size = 240, fullScreen = false }) {
  const cardCount = Math.max(6, Math.round((size || 240) / 40))

  return (
    <div className={`w-full ${fullScreen ? 'min-h-[60vh]' : 'py-stack-lg'}`}>
      <ShimmerStyles />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-gutter">
        {Array.from({ length: cardCount }).map((_, i) => (
          <div key={i}>
            <Block className="aspect-[2/3] w-full rounded-lg mb-1.5" />
            <Block className="h-4 w-full mb-1" />
            <Block className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default LibraryLoader