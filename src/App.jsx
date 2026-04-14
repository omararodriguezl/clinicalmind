import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { FullPageLoader } from './components/ui/LoadingSpinner'

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
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
      <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
      <Route path="/safety" element={<ProtectedRoute><SafetyPlans /></ProtectedRoute>} />
      <Route path="/staffing" element={<ProtectedRoute><Staffing /></ProtectedRoute>} />
      <Route path="/dsm" element={<ProtectedRoute><DSMReference /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1d24',
              color: '#f1f5f9',
              border: '1px solid #2a2f3d',
              fontSize: '13px',
              borderRadius: '8px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#0a0c10' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0a0c10' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
