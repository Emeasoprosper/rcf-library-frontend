import AppRoutes from './routes/AppRoutes'
import AppLoader from './components/ui/AppLoader'
import InstallPrompt from './components/ui/InstallPrompt'
import ApkUpdateBanner from './components/ui/ApkUpdateBanner'
import { TourProvider } from './contexts/TourContext'
import SpotlightTour from './components/tour/SpotlightTour'

function App() {
  return (
    <AppLoader>
      <TourProvider>
        <AppRoutes />
        <InstallPrompt />
        <ApkUpdateBanner />
        <SpotlightTour />
      </TourProvider>
    </AppLoader>
  )
}

export default App