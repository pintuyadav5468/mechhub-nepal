import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Phone, MessageSquare, ChevronLeft } from 'lucide-react'
import { getJob } from '../../api'
import { useSocket } from '../../context/SocketContext'
import { SERVICES, JOB_STATUS_STEPS } from '../../constants'

const STATUS_ORDER = ['accepted', 'en_route', 'arrived', 'in_progress', 'completed']

function EtaTimer({ startMin = 8 }) {
  const [seconds, setSeconds] = useState(startMin * 60)
  useEffect(() => {
    if (seconds <= 0) return
    const t = setInterval(() => setSeconds(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [seconds])
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return <span>{m}:{s}</span>
}

export default function DriverTracking() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { jobStatus, clearJobStatus } = useSocket()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef(null)

  async function fetchJob() {
    try {
      const res = await getJob(jobId)
      setJob(res.data)
      if (res.data.status === 'completed') {
        clearInterval(pollRef.current)
        setTimeout(() => navigate(`/driver/payment/${jobId}`), 1200)
      }
    } catch {}
  }

  useEffect(() => {
    fetchJob().finally(() => setLoading(false))
    pollRef.current = setInterval(fetchJob, 5000)
    return () => clearInterval(pollRef.current)
  }, [jobId])

  // Socket live updates
  useEffect(() => {
    if (jobStatus && jobStatus.jobId == jobId) {
      setJob(j => j ? { ...j, status: jobStatus.status } : j)
      clearJobStatus()
      if (jobStatus.status === 'completed') {
        navigate(`/driver/payment/${jobId}`)
      }
    }
  }, [jobStatus, jobId, clearJobStatus, navigate])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-mh-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="flex items-center justify-center h-screen text-center px-6">
      <div>
        <p className="text-4xl mb-3">😕</p>
        <p className="font-semibold text-mh-text">Job not found</p>
        <button onClick={() => navigate('/driver')} className="btn-primary mt-4">Go Home</button>
      </div>
    </div>
  )

  const service = SERVICES[job.service_type]
  const currentStatusIndex = STATUS_ORDER.indexOf(job.status)
  const currentStep = JOB_STATUS_STEPS.find(s => s.key === job.status) || JOB_STATUS_STEPS[0]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-mh-border">
        <button onClick={() => navigate('/driver')} className="p-1 text-mh-text2 hover:text-mh-text">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="font-bold text-mh-text">Live Tracking</h1>
          <p className="text-xs text-mh-text3">{service?.name}</p>
        </div>
      </div>

      {/* Map placeholder with animated route */}
      <div className="relative h-44 bg-mh-surface overflow-hidden">
        {/* Simple animated map visualization */}
        <svg className="w-full h-full" viewBox="0 0 320 176">
          {/* Road grid */}
          <line x1="0" y1="88" x2="320" y2="88" stroke="#E5E7EB" strokeWidth="12" />
          <line x1="160" y1="0" x2="160" y2="176" stroke="#E5E7EB" strokeWidth="8" />
          <line x1="0" y1="44" x2="320" y2="44" stroke="#F3F4F6" strokeWidth="4" />
          <line x1="0" y1="132" x2="320" y2="132" stroke="#F3F4F6" strokeWidth="4" />
          {/* Route line */}
          <polyline points="60,88 160,88 160,44 240,44" stroke="#F97316" strokeWidth="3"
            strokeDasharray="8 4" strokeLinecap="round">
            <animate attributeName="stroke-dashoffset" values="24;0" dur="1.2s" repeatCount="indefinite" />
          </polyline>
          {/* Mechanic dot (moving) */}
          <circle cx="60" cy="88" r="8" fill="#F97316">
            <animate attributeName="cx" values="60;160;160;200" dur="4s" repeatCount="indefinite" />
            <animate attributeName="cy" values="88;88;88;44" dur="4s" repeatCount="indefinite" />
          </circle>
          {/* Driver pin */}
          <circle cx="240" cy="44" r="10" fill="white" stroke="#F97316" strokeWidth="2.5" />
          <circle cx="240" cy="44" r="5" fill="#F97316" />
        </svg>
        {/* ETA badge */}
        <div className="absolute top-3 right-3 bg-mh-bg rounded-xl px-3 py-2 shadow-card">
          <p className="text-xs text-mh-text2">ETA</p>
          <p className="text-base font-bold text-mh-accent">
            {job.status === 'accepted' || job.status === 'en_route'
              ? <EtaTimer startMin={8} />
              : job.status === 'arrived' ? 'Arrived' : 'Working'}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-4 space-y-4">
        {/* Status */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-mh-accent animate-pulse" />
            <p className="text-xs font-semibold text-mh-accent uppercase tracking-wide">Status</p>
          </div>
          <p className="font-bold text-mh-text text-base">{currentStep.label}</p>
          <p className="text-xs text-mh-text2 mt-0.5">{currentStep.desc}</p>

          {/* Progress steps */}
          <div className="flex items-center mt-4 gap-1">
            {STATUS_ORDER.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-full h-1.5 rounded-full transition-all duration-700 ${
                  i <= currentStatusIndex ? 'bg-mh-accent' : 'bg-mh-surface2'
                }`} />
                {i < STATUS_ORDER.length - 1 && <div className="w-1" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-mh-text3">Found</span>
            <span className="text-xs text-mh-text3">Done</span>
          </div>
        </div>

        {/* Mechanic card */}
        {job.mechanic_id && (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-mh-accent-light flex items-center justify-center text-xl flex-shrink-0">
                🔧
              </div>
              <div className="flex-1">
                <p className="font-bold text-mh-text">{job.mechanic_name || 'Your Mechanic'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-yellow-400 text-xs">★</span>
                  <span className="text-xs text-mh-text2">{job.mechanic_rating} · {job.mechanic_jobs_done} jobs</span>
                </div>
              </div>
              <div className="flex gap-2">
                {job.mechanic_phone && (
                  <a href={`tel:${job.mechanic_phone}`}
                    className="w-9 h-9 rounded-full bg-mh-success-light flex items-center justify-center">
                    <Phone size={16} className="text-mh-success" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Job summary */}
        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-mh-text2">Service</span>
            <span className="font-medium text-mh-text">{service?.emoji} {service?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-mh-text2">Vehicle</span>
            <span className="font-medium text-mh-text capitalize">{job.vehicle_type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-mh-text2">Fare</span>
            <span className="font-bold text-mh-text">रू {job.fare}</span>
          </div>
        </div>

        {/* Complete button (for demo — driver can simulate) */}
        {(job.status === 'in_progress') && (
          <button onClick={() => navigate(`/driver/payment/${jobId}`)} className="btn-primary w-full">
            Job Done → Pay Now
          </button>
        )}
      </div>
    </div>
  )
}
