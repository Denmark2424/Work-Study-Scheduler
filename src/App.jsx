// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SchedulePage from './pages/SchedulePage.jsx'
import DeadlinesPage from './pages/DeadlinesPage.jsx'
import ConflictsPage from './pages/ConflictsPage.jsx'
import SubscriptionPage from './pages/SubscriptionPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import Layout from './components/Layout.jsx'

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useApp()
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 600 }}>
        Loading...
      </div>
    )
  }
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isLoggedIn, loading } = useApp()

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 600 }}>
        Loading...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={isLoggedIn ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/deadlines" element={<DeadlinesPage />} />
        <Route path="/conflicts" element={<ConflictsPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
