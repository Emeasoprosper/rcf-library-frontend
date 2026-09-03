// RCFMOUAULIBRARYreact/student-dashboard/src/components/resource/HorizontalRail.jsx
import { getMediaKind, MEDIA_KIND_STYLE } from '../../lib/mediaKind'

function splitProgress(subtitle) {
  if (!subtitle) return null
  const match = /^(\d+%)\s*(.*)$/.exec(subtitle)
  if (!match) return null
  return { percent: match[1], rest: match[2] }
}

function HorizontalRail({ title, items }) {
  if (!items || items.length === 0) return null

  return (
    <section className="mb-stack-lg">
      <div className="px-margin-mobile mb-stack-sm">
        <h2 className="font-headline-lg text-headline-lg font-display text-on-surface">{title}</h2>
      </div>
      <div className="relative">
        {/*
          padding-left/right on this container used to be silently
          dropped at rest scroll position in iOS Safari once
          overflow-x-auto + snap-x-mandatory are both present — the
          first/last card would sit flush against the screen edge even
          though the section title above (not a scroll container)
          showed the correct margin. Real spacer flex items instead of
          padding fixes it reliably across browsers. snap-align: none
          on the spacers keeps them out of the scroll-snap sequence so
          they never become a snap stop themselves.
        */}
        <div className="flex gap-gutter overflow-x-auto no-scrollbar snap-x snap-mandatory [mask-image:linear-gradient(to_right,black_90%,transparent)]">
          <div className="flex-none w-margin-mobile" style={{ scrollSnapAlign: 'none' }} aria-hidden="true" />

          {items.map((item) => {
            const kind = getMediaKind(item.fileType)
            const style = MEDIA_KIND_STYLE[kind]
            const progress = splitProgress(item.subtitle)

            const contributorLabel = item.isAdminUpload
              ? 'Admin'
              : item.contributorName || null

            return (
              <div
                key={item.id || item.title}
                onClick={item.onClick}
                className={`flex-none ${style.railWidth} snap-start group cursor-pointer`}
              >
                <div className="rounded-xl overflow-hidden transition-all mb-stack-sm">
                  <div className={`relative ${style.aspect} w-full bg-surface-container`}>
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant text-3xl">
                          {item.thumbnailStatus === 'processing' ? 'hourglass_top' : style.gridIcon}
                        </span>
                      </div>
                    )}

                    {kind === 'video' && item.thumbnailUrl && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">play_arrow</span>
                        </span>
                      </span>
                    )}
                    {kind === 'audio' && item.thumbnailUrl && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">headphones</span>
                        </span>
                      </span>
                    )}

                  </div>

                  <div className="bg-surface-container-high px-2 py-1.5">
                    <h4 className="font-label-md text-label-md font-bold text-on-surface truncate">{item.title}</h4>

                    {progress ? (
                      <p className="font-label-sm text-label-sm truncate">
                        <span className="text-orange-400 font-bold">{progress.percent}</span>
                        {progress.rest && <span className="text-on-surface-variant"> {progress.rest}</span>}
                      </p>
                    ) : (
                      item.subtitle && (
                        <p className="font-label-sm text-label-sm text-[#8CA0BD] truncate">{item.subtitle}</p>
                      )
                    )}

                    {contributorLabel && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.contributorAvatarUrl ? (
                          <img
                            src={item.contributorAvatarUrl}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover flex-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-surface-container-highest flex-none flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant text-[10px]">
                              {item.isAdminUpload ? 'shield_person' : 'person'}
                            </span>
                          </span>
                        )}
                        <span className="font-label-sm text-label-sm text-[#8CA0BD] truncate">
                          {contributorLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex-none w-margin-mobile" style={{ scrollSnapAlign: 'none' }} aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

export default HorizontalRail