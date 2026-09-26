function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`w-11 h-6 rounded-full transition-colors flex-none flex items-center px-0.5 ${
        checked ? 'bg-primary justify-end' : 'bg-surface-container-highest border border-outline justify-start'
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow-sm flex-none" />
    </button>
  )
}

export default ToggleSwitch