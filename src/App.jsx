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
import GlobalTopAppBar from './components/layout/GlobalTopAppBar'
import { NotificationsModalProvider } from './contexts/NotificationsModalContext'
import { HeaderAmbientProvider } from './contexts/HeaderAmbientContext'
import { TourProvider } from './contexts/TourContext'
import { PageHeaderProvider } from './contexts/PageHeaderContext'
import SpotlightTour from './components/tour/SpotlightTour'

function App() {
  return (
    <AppLoader>
      <TourProvider>
      <ActiveResourceProvider>
        <HeaderAmbientProvider>
          <NotificationsModalProvider>
            <PageHeaderProvider>
              <LayoutModeSync />
              <DesktopHeader />
              <LeftSidebarNav />
              <GlobalTopAppBar />
              <AppRoutes />
              <RightSidebarPanel />
              <InstallPrompt />
              <ApkUpdateBanner />
              <SpotlightTour />
              <NotificationsModal />
            </PageHeaderProvider>
          </NotificationsModalProvider>
        </HeaderAmbientProvider>
      </ActiveResourceProvider>
      </TourProvider>
    </AppLoader>
  )
}

export default App