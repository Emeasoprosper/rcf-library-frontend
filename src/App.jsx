import AppRoutes from './routes/AppRoutes'
import AppLoader from './components/ui/AppLoader'
import InstallPrompt from './components/ui/InstallPrompt'
import ApkUpdateBanner from './components/ui/ApkUpdateBanner'

function App() {
  return (
    <AppLoader>
      <AppRoutes />
      <InstallPrompt />
      <ApkUpdateBanner />
    </AppLoader>
  )
}

export default App