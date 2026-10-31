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
import MissingDetailsPrompt from './components/ui/MissingDetailsPrompt'
import BirthdayCelebration from './components/ui/BirthdayCelebration'
import NewMonthCelebration from './components/ui/NewMonthCelebration'
import LeaveSiteDialog from './components/ui/LeaveSiteDialog'
import AmbientOwl from './components/ui/AmbientOwl'
import DailyWordPopup from './components/ui/DailyWordPopup'
import PushPermissionAsk from './components/ui/PushPermissionAsk'
import DownloadFx from './components/ui/DownloadFx'
import NetworkStatusBanner from './components/ui/NetworkStatusBanner'
import { PresenceProvider } from './contexts/PresenceContext'
import FloatingStudyButton from './components/ui/FloatingStudyButton'

function App() {
  return (
    <AppLoader>
      <LanguageProvider>
      <TourProvider>
      <ActiveResourceProvider>
        <HeaderAmbientProvider>
          <NotificationsModalProvider>
          <PresenceProvider>
            <LayoutModeSync />
            <NetworkStatusBanner />
            <DesktopHeader />
            <LeftSidebarNav />
            <AppRoutes />
            <RightSidebarPanel />
            <InstallPrompt />
            <ApkUpdateBanner />
            <SpotlightTour />
            <MissingDetailsPrompt />
            <BirthdayCelebration />
            <NewMonthCelebration />
            <DailyWordPopup />
            <PushPermissionAsk />
            <DownloadFx />
            <LeaveSiteDialog />
            <AmbientOwl />
            <NotificationsModal />
            <FloatingStudyButton />
          </PresenceProvider>
          </NotificationsModalProvider>
        </HeaderAmbientProvider>
      </ActiveResourceProvider>
      </TourProvider>
      </LanguageProvider>
    </AppLoader>
  )
}

export default App