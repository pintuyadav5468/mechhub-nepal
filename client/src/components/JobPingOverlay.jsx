import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, X } from 'lucide-react'
import { acceptJob } from '../api'
import { useSocket } from '../context/SocketContext'
import { SERVICES } from '../constants'

export default function JobPingOverlay({ job }) {
  const { dismissPendingJob } = useSocket()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(60)
  const [loading, setLoading] = useState(false)

  const service = SERVICES[job.job?.service_type] || SERVICES.puncture

  useEffect(() => {
    if (countdown <= 0) { dismissPendingJob(); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, dismissPendingJob])

  async function handleAccept() {
    setLoading(true)
    try {
      await acceptJob(job.job.id)
      dismissPendingJob()
      navigate(`/mechanic/job/${job.job.id}`)
    } catch (e) {
      alert(e.response?.data?.error || 'Could not accept job')
      setLoading(false)
    }
  }

  const pct = (countdown / 60) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ maxWidth: 384, left: '50%', transform: 'translateX(-50%)' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismissPendingJob} />

      {/* Panel */}
      <div className="relative w-full bg-mh-bg rounded-t-3xl p-6 animate-slide-up shadow-modal">
        {/* Timer ring */}
        <div className="absolute top-6 right-6 w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#E5E7EB" strokeWidth="4" />
            <circle cx="28" cy="28" r="24" fill="none" stroke="#EF4444" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
              strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-mh-danger">{countdown}</span>
        </div>

        {/* Job alert header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-mh-danger animate-pulse" />
          <span className="text-xs font-semibold text-mh-danger uppercase tracking-widest">New Job Request</span>
        </div>

        <h2 className="text-xl font-bold text-mh-text mb-4">
          {service.emoji} {service.name}
        </h2>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-mh-text2">
            <MapPin size={14} className="text-mh-accent flex-shrink-0" />
            <span>{job.job?.location_name || 'Nearby Location'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-mh-text2">
            <Clock size={14} className="text-mh-accent flex-shrink-0" />
            <span>Vehicle: {job.job?.vehicle_type || 'car'} • Fare: रू {job.job?.fare}</span>
          </div>
          {job.driverName && (
            <p className="text-sm text-mh-text2">Driver: <span className="font-medium text-mh-text">{job.driverName}</span></p>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={dismissPendingJob}
            className="flex-1 btn-secondary py-3">
            <X size={16} /> Decline
          </button>
          <button onClick={handleAccept} disabled={loading}
            className="flex-2 btn-primary py-3 flex-[2]">
            {loading ? 'Accepting...' : 'Accept Job →'}
          </button>
        </div>
      </div>
    </div>
  )
}
