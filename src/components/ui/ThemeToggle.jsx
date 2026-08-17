import { useTheme } from '../../contexts/ThemeContext'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-on-surface">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}

export default ThemeToggle