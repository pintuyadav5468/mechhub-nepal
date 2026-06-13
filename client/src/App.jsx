import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

import DriverHome from './pages/driver/Home'
import DriverRequest from './pages/driver/Request'
import DriverTracking from './pages/driver/Tracking'
import DriverPayment from './pages/driver/Payment'
import DriverComplete from './pages/driver/Complete'
import DriverHistory from './pages/driver/History'

import MechanicDashboard from './pages/mechanic/Dashboard'
import MechanicActiveJob from './pages/mechanic/ActiveJob'

import PartnerDashboard from './pages/partner/Dashboard'
import DriverProfile from './pages/driver/Profile'
import MechanicProfile from './pages/mechanic/Profile'
import PartnerProfile from './pages/partner/Profile'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.role === 'driver')                         return <Navigate to="/driver" replace />
  if (user.role === 'mechanic')                       return <Navigate to="/mechanic" replace />
  if (['petrol','ev','hotel'].includes(user.role))    return <Navigate to="/partner" replace />
  return <Navigate to="/" replace />
}

function RequireAuth({ role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-shell flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-mh-accent border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && (Array.isArray(role) ? !role.includes(user.role) : user.role !== role)) return <RoleRedirect />
  return null
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="app-shell flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="text-4xl mb-3">🔧</div>
        <div className="w-8 h-8 border-2 border-mh-accent border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <Routes>
        {/* Public */}
        <Route path="/" element={user ? <RoleRedirect /> : <Landing />} />
        <Route path="/login" element={user ? <RoleRedirect /> : <Login />} />
        <Route path="/register" element={user ? <RoleRedirect /> : <Register />} />

        {/* Driver */}
        <Route path="/driver" element={<><RequireAuth role="driver" /><Layout /></>}>
          <Route index element={<DriverHome />} />
          <Route path="request" element={<DriverRequest />} />
          <Route path="tracking/:jobId" element={<DriverTracking />} />
          <Route path="payment/:jobId" element={<DriverPayment />} />
          <Route path="complete/:jobId" element={<DriverComplete />} />
          <Route path="history" element={<DriverHistory />} />
          <Route path="profile" element={<DriverProfile />} />
        </Route>

        {/* Mechanic */}
        <Route path="/mechanic" element={<><RequireAuth role="mechanic" /><Layout /></>}>
          <Route index element={<MechanicDashboard />} />
          <Route path="job/:jobId" element={<MechanicActiveJob />} />
          <Route path="profile" element={<MechanicProfile />} />
        </Route>

        {/* Partners */}
        <Route path="/partner" element={<><RequireAuth role={['petrol','ev','hotel']} /><Layout /></>}>
          <Route index element={<PartnerDashboard />} />
          <Route path="profile" element={<PartnerProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
