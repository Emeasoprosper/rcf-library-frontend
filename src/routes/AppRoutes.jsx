// RCFMOUAULIBRARYreact/student-dashboard/src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Splash from '../pages/Splash'
import SignIn from '../pages/SignIn'
import Home from '../pages/Home'
import Library from '../pages/Library'
import Search from '../pages/Search'
import Contribute from '../pages/Contribute'
import MyContributions from '../pages/MyContributions'
import SuggestMaterial from '../pages/SuggestMaterial'
import SubmitResource from '../pages/SubmitResource'
import Leaderboard from '../pages/Leaderboard'
import Profile from '../pages/Profile'
import Downloads from '../pages/Downloads'
import ReadingHistory from '../pages/ReadingHistory'
import HelpSupport from '../pages/HelpSupport'
import SavedResources from '../pages/SavedResources'
import Settings from '../pages/Settings'
import GettingStarted from '../pages/GettingStarted'
import Licensing from '../pages/Licensing'
import CitationTools from '../pages/CitationTools'
import Notifications from '../pages/Notifications'
import NewsDetail from '../pages/NewsDetail'
import HeadsUp from '../pages/HeadsUp'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUploads from '../pages/admin/AdminUploads'
import AdminRequests from '../pages/admin/AdminRequests'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminAnnouncements from '../pages/admin/AdminAnnouncements'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import { useAuth } from '../contexts/AuthContext'
import RequestMaterial from '../pages/RequestMaterial'
import CompleteProfile from '../pages/CompleteProfile'
import ResourceDetail from '../pages/ResourceDetail'
import ResourceReader from '../pages/ResourceReader'
import AdminResources from '../pages/admin/AdminResources'

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Splash />
  return <Navigate to={isAuthenticated ? '/home' : '/signin'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/shelf" element={<ProtectedRoute><Library /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/contribute" element={<ProtectedRoute><Contribute /></ProtectedRoute>} />
      <Route path="/contributions" element={<ProtectedRoute><MyContributions /></ProtectedRoute>} />
      <Route path="/contribute/request" element={<ProtectedRoute><RequestMaterial /></ProtectedRoute>} />
      <Route path="/contribute/suggest" element={<ProtectedRoute><SuggestMaterial /></ProtectedRoute>} />
      <Route path="/contribute/submit" element={<ProtectedRoute><SubmitResource /></ProtectedRoute>} />
      <Route path="/contribute/heads-up" element={<ProtectedRoute><HeadsUp /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/downloads" element={<ProtectedRoute><Downloads /></ProtectedRoute>} />
      <Route path="/reading-history" element={<ProtectedRoute><ReadingHistory /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
      <Route path="/saved" element={<ProtectedRoute><SavedResources /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
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
      <Route path="/resources/:id" element={<ResourceDetail />} />
      <Route path="/resources/:id/read" element={<ResourceReader />} />
      <Route path="/admin/resources" element={<AdminRoute><AdminResources /></AdminRoute>} />
    </Routes>
  )
}

export default AppRoutes