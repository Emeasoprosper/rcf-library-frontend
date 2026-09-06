import AppRoutes from './routes/AppRoutes'
import AppLoader from './components/ui/AppLoader'
import InstallPrompt from './components/ui/InstallPrompt'
import ApkUpdateBanner from './components/ui/ApkUpdateBanner'
import DesktopHeader from './components/layout/DesktopHeader'
import LeftSidebarNav from './components/layout/LeftSidebarNav'
import RightSidebarPanel from './components/layout/RightSidebarPanel'
import { TourProvider } from './contexts/TourContext'
import SpotlightTour from './components/tour/SpotlightTour'

function App() {
  return (
    <AppLoader>
      <TourProvider>
        <DesktopHeader />
        <LeftSidebarNav />
        <AppRoutes />
        <RightSidebarPanel />
        <InstallPrompt />
        <ApkUpdateBanner />
        <SpotlightTour />
      </TourProvider>
    </AppLoader>
  )
}

export default App