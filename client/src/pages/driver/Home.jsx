import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, MapPin, ChevronRight, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { getCurrentJob } from '../../api'
import { SERVICES, VEHICLE_TYPES } from '../../constants'

const SERVICE_KEYS = Object.keys(SERVICES)

export default function DriverHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { jobAccepted, clearJobAccepted } = useSocket()
  const [activeJob, setActiveJob] = useState(null)
  const [vehicle, setVehicle] = useState(null)

  useEffect(() => {
    getCurrentJob().then(res => {
      if (res.data) {
        setActiveJob(res.data)
        const v = { type: res.data.vehicle_type }
        setVehicle(v)
      }
    }).catch(() => {})
  }, [])

  // If job was just accepted via socket, redirect to tracking
  useEffect(() => {
    if (jobAccepted) {
      clearJobAccepted()
      navigate(`/driver/tracking/${jobAccepted.jobId}`)
    }
  }, [jobAccepted, clearJobAccepted, navigate])

  function requestService(serviceType) {
    navigate(`/driver/request?service=${serviceType}`)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 bg-mh-bg border-b border-mh-border">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs text-mh-text3 font-medium">{greeting}</p>
            <h1 className="text-xl font-bold text-mh-text">{firstName} 👋</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-mh-surface flex items-center justify-center border border-mh-border">
            <Bell size={18} className="text-mh-text2" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-mh-text3 mt-2">
          <MapPin size={12} className="text-mh-accent" />
          <span>{user?.location_name || 'Kathmandu, Nepal'}</span>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Active job banner */}
        {activeJob && (
          <button onClick={() => navigate(`/driver/tracking/${activeJob.id}`)}
            className="w-full bg-mh-accent-light border border-mh-accent/30 rounded-2xl p-4 flex items-center justify-between animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-mh-accent animate-pulse" />
              <div className="text-left">
                <p className="text-xs text-mh-accent font-semibold">Active Job</p>
                <p className="text-sm font-bold text-mh-text">{SERVICES[activeJob.service_type]?.name}</p>
                <p className="text-xs text-mh-text2 capitalize">{activeJob.status.replace('_', ' ')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-mh-accent" />
          </button>
        )}

        {/* SOS Button */}
        <div className="flex justify-center py-4">
          <button onClick={() => navigate('/driver/request?sos=1')}
            className="relative w-36 h-36 rounded-full flex items-center justify-center group">
            {/* Pulse rings */}
            <span className="absolute inset-0 rounded-full bg-mh-danger/10 animate-ping-slow" />
            <span className="absolute inset-2 rounded-full bg-mh-danger/15 animate-ping-slow [animation-delay:0.5s]" />
            {/* Button */}
            <div className="relative w-28 h-28 rounded-full bg-mh-danger shadow-lg flex flex-col items-center justify-center group-active:scale-95 transition-transform">
              <Zap size={28} className="text-white mb-1" fill="white" />
              <p className="text-white font-extrabold text-lg tracking-widest">SOS</p>
              <p className="text-white/80 text-xs">Emergency</p>
            </div>
          </button>
        </div>
        <p className="text-center text-xs text-mh-text3">Tap SOS for immediate emergency rescue</p>

        {/* Services grid */}
        <div>
          <h2 className="text-sm font-semibold text-mh-text2 uppercase tracking-wide mb-3">Services</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {SERVICE_KEYS.map(key => {
              const s = SERVICES[key]
              return (
                <button key={key} onClick={() => requestService(key)}
                  className="card p-3 text-center hover:shadow-card-lg transition-shadow active:scale-95 transition-transform">
                  <div className="text-2xl mb-1.5">{s.emoji}</div>
                  <p className="text-xs font-semibold text-mh-text leading-tight">{s.name}</p>
                  <p className="text-xs text-mh-accent font-medium mt-1">रू {s.basePrice}+</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-2xl mb-1">⚡</p>
            <p className="text-xs font-semibold text-mh-text">Fast Response</p>
            <p className="text-xs text-mh-text2">Avg. 8 min arrival</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl mb-1">🛡️</p>
            <p className="text-xs font-semibold text-mh-text">Fixed Prices</p>
            <p className="text-xs text-mh-text2">No hidden charges</p>
          </div>
        </div>
      </div>
    </div>
  )
}
