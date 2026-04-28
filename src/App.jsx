import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'
import { FullPageLoader } from './components/ui/LoadingSpinner'
import { UpdatePrompt } from './components/ui/UpdatePrompt'

// Pages
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Sessions from './pages/Sessions'
import SessionDetail from './pages/SessionDetail'
import SafetyPlans from './pages/SafetyPlans'
import Staffing from './pages/Staffing'
import DSMReference from './pages/DSMReference'
import Settings from './pages/Settings'
import ResetPassword from './pages/ResetPassword'
import GroupSessions from './pages/GroupSessions'
import NewSession from './pages/NewSession'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup"         element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clients"        element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/clients/:id"    element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
      <Route path="/sessions"       element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      <Route path="/sessions/new"   element={<ProtectedRoute><NewSession /></ProtectedRoute>} />
      <Route path="/sessions/:id"   element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
      <Route path="/safety"         element={<ProtectedRoute><SafetyPlans /></ProtectedRoute>} />
      <Route path="/staffing"       element={<ProtectedRoute><Staffing /></ProtectedRoute>} />
      <Route path="/dsm"            element={<ProtectedRoute><DSMReference /></ProtectedRoute>} />
      <Route path="/settings"       element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/groups"         element={<ProtectedRoute><GroupSessions /></ProtectedRoute>} />
      <Route path="/"               element={<Navigate to="/dashboard" replace />} />
      <Route path="*"               element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <UpdatePrompt />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--cm-surface)',
                color: 'var(--cm-ink)',
                border: '1px solid var(--cm-line)',
                fontSize: '13px',
                borderRadius: '2px',
                fontFamily: '"Inter", system-ui, sans-serif',
              },
              success: { iconTheme: { primary: 'var(--cm-od)',     secondary: 'var(--cm-surface)' } },
              error:   { iconTheme: { primary: 'var(--cm-danger)', secondary: 'var(--cm-surface)' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
