// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/StepShell.jsx
// Layout for one-question-at-a-time screens (sign-up details, missing
// details popup). Mobile: picture on top, question below. Desktop: picture
// on the left, question on the right.

import { STEP_THEMES } from './stepOptions'

export function Progress({ step, total }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i === step ? 'w-8 bg-on-surface' : i < step ? 'w-3 bg-on-surface/60' : 'w-3 bg-on-surface/20'
          }`}
        />
      ))}
    </div>
  )
}

// A big colourful answer card, like the reference "quest" cards.
export function OptionCard({ theme = 'blue', emoji, label, hint, selected = false, onClick, disabled = false, tall = false }) {
  const t = STEP_THEMES[theme] || STEP_THEMES.blue
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`rcf-lift rcf-press relative overflow-hidden text-left rounded-[22px] p-4 ${tall ? 'min-h-[132px]' : 'min-h-[92px]'} ${t.card} text-white flex flex-col justify-between gap-2 disabled:opacity-60 transition-shadow ${
        selected ? 'ring-4 ring-offset-2 ring-offset-surface-container ring-white/90 shadow-xl' : ''
      }`}
    >
      {emoji && <span className="text-[30px] leading-none drop-shadow-sm" aria-hidden="true">{emoji}</span>}
      <span>
        <span className="block font-body-md text-[17px] font-bold leading-tight">{label}</span>
        {hint && <span className="block font-label-sm text-label-sm text-white/80 mt-0.5">{hint}</span>}
      </span>
      {selected && (
        <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">check</span>
        </span>
      )}
      <span className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-white/10" aria-hidden="true" />
    </button>
  )
}

// mode 'modal' = popup over the app; 'page' = full page (sign-up).
function StepShell({ mode = 'modal', theme = 'blue', art, step, total, title, subtitle, children, footer, onClose, stepKey }) {
  const t = STEP_THEMES[theme] || STEP_THEMES.blue
  const isModal = mode === 'modal'

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-6'
          : 'min-h-screen w-full flex items-stretch md:items-center justify-center bg-surface-container-lowest md:p-8'
      }
      role={isModal ? 'dialog' : undefined}
      aria-modal={isModal ? 'true' : undefined}
      aria-label={isModal ? title : undefined}
    >
      <div
        className={`rcf-pop relative w-full bg-surface-container text-on-surface overflow-hidden flex flex-col md:grid md:grid-cols-[0.95fr_1.05fr] ${
          isModal
            ? 'max-h-[94vh] rounded-t-[28px] md:rounded-[32px] md:max-w-4xl md:min-h-[560px]'
            : 'min-h-screen md:min-h-[640px] md:max-w-5xl md:rounded-[32px]'
        } md:shadow-2xl md:border md:border-outline`}
      >
        {/* Picture panel: top on mobile, left on desktop */}
        <div
          className={`rcf-gradient relative bg-gradient-to-br ${t.panel} flex items-center justify-center overflow-hidden flex-none h-[30vh] min-h-[190px] md:h-auto`}
        >
          <span className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" aria-hidden="true" />
          <span className="absolute bottom-6 right-8 w-16 h-16 rounded-full bg-white/10" aria-hidden="true" />
          <div key={stepKey} className="rcf-pop w-[58%] max-w-[260px] md:w-[70%] md:max-w-[340px]">
            {art}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="md:hidden absolute top-4 right-4 w-9 h-9 rounded-full bg-black/25 text-white flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Question panel */}
        <div className="flex flex-col min-h-0 flex-grow">
          <div className="flex items-center justify-between gap-3 px-6 pt-5 md:px-10 md:pt-9">
            {total > 1 ? <Progress step={step} total={total} /> : <span />}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="hidden md:flex w-10 h-10 rounded-full bg-surface-container-high items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          <div key={stepKey} className="rcf-step flex-grow overflow-y-auto px-6 pt-4 pb-4 md:px-10 md:pt-6">
            <h2 className="font-display text-[30px] md:text-[40px] leading-[1.05] font-extrabold tracking-tight text-on-surface">
              {title}
            </h2>
            {subtitle && <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-md">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>

          {footer && <div className="px-6 pb-6 pt-3 md:px-10 md:pb-9 border-t border-outline/60">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

export default StepShell
