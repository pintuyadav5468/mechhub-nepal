import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Clock, User, Wrench, BarChart3, BriefcaseBusiness } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import JobPingOverlay from './JobPingOverlay'

function DriverNav() {
  return (
    <>
      <NavLink to="/driver" end className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${isActive ? 'text-mh-accent' : 'text-mh-text3 hover:text-mh-text2'}`
      }>
        <Home size={20} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/driver/history" className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${isActive ? 'text-mh-accent' : 'text-mh-text3 hover:text-mh-text2'}`
      }>
        <Clock size={20} />
        <span>History</span>
      </NavLink>
      <NavLink to="/driver/profile" className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${isActive ? 'text-mh-accent' : 'text-mh-text3 hover:text-mh-text2'}`
      }>
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </>
  )
}

function MechanicNav() {
  return (
    <>
      <NavLink to="/mechanic" end className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${isActive ? 'text-mh-accent' : 'text-mh-text3 hover:text-mh-text2'}`
      }>
        <BarChart3 size={20} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/mechanic/profile" className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${isActive ? 'text-mh-accent' : 'text-mh-text3 hover:text-mh-text2'}`
      }>
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </>
  )
}

function PartnerNav() {
  return (
    <>
      <NavLink to="/partner" end className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${isActive ? 'text-mh-accent' : 'text-mh-text3 hover:text-mh-text2'}`
      }>
        <BriefcaseBusiness size={20} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/partner/profile" className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${isActive ? 'text-mh-accent' : 'text-mh-text3 hover:text-mh-text2'}`
      }>
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </>
  )
}

export default function Layout() {
  const { user } = useAuth()
  const { pendingJob } = useSocket()

  return (
    <div className="app-shell">
      <div className="page-content">
        <Outlet />
      </div>

      <nav className="bottom-nav">
        {user?.role === 'driver'                              && <DriverNav />}
        {user?.role === 'mechanic'                           && <MechanicNav />}
        {['petrol','ev','hotel'].includes(user?.role)        && <PartnerNav />}
      </nav>

      {pendingJob && <JobPingOverlay job={pendingJob} />}
    </div>
  )
}
