// RCFMOUAULIBRARYreact/student-dashboard/src/routes/AppRoutes.jsx
import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import { useAuth } from '../contexts/AuthContext'
// The pages people land on first load with the app itself.
import Splash from '../pages/Splash'
import SignIn from '../pages/SignIn'
import Home from '../pages/Home'
import Library from '../pages/Library'
import Search from '../pages/Search'

// Everything else (and all admin pages, and the PDF reader) downloads only
// when it is first opened, so the first visit is much lighter. The service
// worker still keeps every page for offline use once it has them.
const Contribute = lazy(() => import('../pages/Contribute'))
const MyContributions = lazy(() => import('../pages/MyContributions'))
const SuggestMaterial = lazy(() => import('../pages/SuggestMaterial'))
const SubmitResource = lazy(() => import('../pages/SubmitResource'))
const Leaderboard = lazy(() => import('../pages/Leaderboard'))
const Profile = lazy(() => import('../pages/Profile'))
const Downloads = lazy(() => import('../pages/Downloads'))
const ReadingHistory = lazy(() => import('../pages/ReadingHistory'))
const HelpSupport = lazy(() => import('../pages/HelpSupport'))
const SavedResources = lazy(() => import('../pages/SavedResources'))
const Settings = lazy(() => import('../pages/Settings'))
const NotificationSettings = lazy(() => import('../pages/NotificationSettings'))
const GettingStarted = lazy(() => import('../pages/GettingStarted'))
const Licensing = lazy(() => import('../pages/Licensing'))
const CitationTools = lazy(() => import('../pages/CitationTools'))
const Notifications = lazy(() => import('../pages/Notifications'))
const NewsDetail = lazy(() => import('../pages/NewsDetail'))
const HeadsUp = lazy(() => import('../pages/HeadsUp'))
const ReadingSpace = lazy(() => import('../pages/ReadingSpace'))
const StudySaved = lazy(() => import('../pages/StudySaved'))
const StudyNotes = lazy(() => import('../pages/StudyNotes'))
const StudyPractice = lazy(() => import('../pages/StudyPractice'))
const RequestMaterial = lazy(() => import('../pages/RequestMaterial'))
const CompleteProfile = lazy(() => import('../pages/CompleteProfile'))
const ResourceDetail = lazy(() => import('../pages/ResourceDetail'))
const CollectionPage = lazy(() => import('../pages/CollectionPage'))
const ResourceReader = lazy(() => import('../pages/ResourceReader'))
const ShareRedirect = lazy(() => import('../pages/ShareRedirect'))
const Achievements = lazy(() => import('../pages/Achievements'))
const ReadingPath = lazy(() => import('../pages/ReadingPath'))
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const AdminUploads = lazy(() => import('../pages/admin/AdminUploads'))
const AdminRequests = lazy(() => import('../pages/admin/AdminRequests'))
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'))
const AdminAnnouncements = lazy(() => import('../pages/admin/AdminAnnouncements'))
const AdminResources = lazy(() => import('../pages/admin/AdminResources'))
const OrganizeResources = lazy(() => import('../pages/admin/OrganizeResources'))
const AdminHomeRails = lazy(() => import('../pages/admin/AdminHomeRails'))
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'))
const AdminWhatsApp = lazy(() => import('../pages/admin/AdminWhatsApp'))
const AdminBirthdays = lazy(() => import('../pages/admin/AdminBirthdays'))

// Shown for the moment a page's code is still downloading.
function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading">
      <span className="w-9 h-9 rounded-full border-[3px] border-outline border-t-orange-500 animate-spin" />
    </div>
  )
}

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Splash />
  if (isAuthenticated) {
    // Set by SignIn.jsx before a Google redirect sign-in when the user
    // was originally headed somewhere other than /home (e.g. a share
    // link). Read once and cleared immediately.
    const pending = sessionStorage.getItem('rcf_post_login_return_to')
    if (pending) {
      sessionStorage.removeItem('rcf_post_login_return_to')
      return <Navigate to={pending} replace />
    }
    return <Navigate to="/home" replace />
  }
  return <Navigate to="/signin" replace />
}

// Page entrance animation: on every route change, <html> gets
// .rcf-route-enter for a moment, and index.css fades the new page in and
// rises its sections one after another. No wrapper element, so page
// layouts are untouched.
function RouteMotion() {
  const { pathname } = useLocation()
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('rcf-route-enter')
    void root.offsetWidth // restart the animation
    root.classList.add('rcf-route-enter')
    const timer = setTimeout(() => root.classList.remove('rcf-route-enter'), 900)
    return () => clearTimeout(timer)
  }, [pathname])
  return null
}

function AppRoutes() {
  return (
    <>
    <RouteMotion />
    <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/shelf" element={<ProtectedRoute><Library /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/contribute" element={<ProtectedRoute><Contribute /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
      <Route path="/reading-path" element={<ProtectedRoute><ReadingPath /></ProtectedRoute>} />
      <Route path="/contributions" element={<ProtectedRoute><MyContributions /></ProtectedRoute>} />
      <Route path="/contribute/request" element={<ProtectedRoute><RequestMaterial /></ProtectedRoute>} />
      <Route path="/contribute/suggest" element={<ProtectedRoute><SuggestMaterial /></ProtectedRoute>} />
      <Route path="/contribute/submit" element={<ProtectedRoute><SubmitResource /></ProtectedRoute>} />
      <Route path="/contribute/heads-up" element={<ProtectedRoute><HeadsUp /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/downloads" element={<ProtectedRoute><Downloads /></ProtectedRoute>} />
      <Route path="/reading-history" element={<ProtectedRoute><ReadingHistory /></ProtectedRoute>} />
      <Route path="/reading-space" element={<ProtectedRoute><ReadingSpace /></ProtectedRoute>} />
      <Route path="/reading-space/saved" element={<ProtectedRoute><StudySaved /></ProtectedRoute>} />
      <Route path="/reading-space/notes" element={<ProtectedRoute><StudyNotes /></ProtectedRoute>} />
      <Route path="/reading-space/practice" element={<ProtectedRoute><StudyPractice /></ProtectedRoute>} />
      <Route path="/reading-space/practice/:setId" element={<ProtectedRoute><StudyPractice /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
      <Route path="/saved" element={<ProtectedRoute><SavedResources /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      <Route path="/help/getting-started" element={<ProtectedRoute><GettingStarted /></ProtectedRoute>} />
      <Route path="/help/licensing" element={<ProtectedRoute><Licensing /></ProtectedRoute>} />
      <Route path="/help/citation-tools" element={<ProtectedRoute><CitationTools /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/news/:id" element={<ProtectedRoute><NewsDetail /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/uploads" element={<AdminRoute><AdminUploads /></AdminRoute>} />
      <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
      <Route path="/resources/:id/read" element={<ProtectedRoute><ResourceReader /></ProtectedRoute>} />
      <Route path="/s/:token" element={<ProtectedRoute><ShareRedirect /></ProtectedRoute>} />
      <Route path="/admin/resources" element={<AdminRoute><AdminResources /></AdminRoute>} />
      <Route path="/admin/organize" element={<AdminRoute><OrganizeResources /></AdminRoute>} />
      <Route path="/admin/home-rails" element={<AdminRoute><AdminHomeRails /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/whatsapp" element={<AdminRoute><AdminWhatsApp /></AdminRoute>} />
      <Route path="/admin/birthdays" element={<AdminRoute><AdminBirthdays /></AdminRoute>} />
      <Route path="/library/:id" element={<ResourceDetail />} />
      <Route path="/collections/:id" element={<CollectionPage />} />
    </Routes>
    </Suspense>
    </>
  )
}

export default AppRoutes