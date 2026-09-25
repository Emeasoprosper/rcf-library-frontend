import AppRoutes from './routes/AppRoutes'
import { ActiveResourceProvider } from './contexts/ActiveResourceContext'
import AppLoader from './components/ui/AppLoader'
import InstallPrompt from './components/ui/InstallPrompt'
import ApkUpdateBanner from './components/ui/ApkUpdateBanner'
import DesktopHeader from './components/layout/DesktopHeader'
import LeftSidebarNav from './components/layout/LeftSidebarNav'
import RightSidebarPanel from './components/layout/RightSidebarPanel'
import NotificationsModal from './components/layout/NotificationsModal'
import LayoutModeSync from './components/layout/LayoutModeSync'
import { NotificationsModalProvider } from './contexts/NotificationsModalContext'
import { HeaderAmbientProvider } from './contexts/HeaderAmbientContext'
import { TourProvider } from './contexts/TourContext'
import { LanguageProvider } from './contexts/LanguageContext'
import SpotlightTour from './components/tour/SpotlightTour'

function App() {
  return (
    <AppLoader>
      <LanguageProvider>
      <TourProvider>
      <ActiveResourceProvider>
        <HeaderAmbientProvider>
          <NotificationsModalProvider>
            <LayoutModeSync />
            <DesktopHeader />
            <LeftSidebarNav />
            <AppRoutes />
            <RightSidebarPanel />
            <InstallPrompt />
            <ApkUpdateBanner />
            <SpotlightTour />
            <NotificationsModal />
          </NotificationsModalProvider>
        </HeaderAmbientProvider>
      </ActiveResourceProvider>
      </TourProvider>
      </LanguageProvider>
    </AppLoader>
  )
}

export default App