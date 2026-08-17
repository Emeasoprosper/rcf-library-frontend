function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative w-11 h-6 rounded-full transition-colors flex-none ${
        checked ? 'bg-primary' : 'bg-surface-container-highest border border-outline'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-background transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default ToggleSwitch
