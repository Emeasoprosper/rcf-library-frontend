import AppRoutes from './routes/AppRoutes'
import AppLoader from './components/ui/AppLoader'
import InstallPrompt from './components/ui/InstallPrompt'

function App() {
  return (
    <AppLoader>
      <AppRoutes />
      <InstallPrompt />
    </AppLoader>
  )
}

export default App