import AppRoutes from './routes/AppRoutes'
import { ActiveResourceProvider } from './contexts/ActiveResourceContext'
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
      <ActiveResourceProvider>
        <DesktopHeader />
        <LeftSidebarNav />
        <AppRoutes />
        <RightSidebarPanel />
        <InstallPrompt />
        <ApkUpdateBanner />
        <SpotlightTour />
      </ActiveResourceProvider>
      </TourProvider>
    </AppLoader>
  )
}

export default App