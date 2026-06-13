import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Phone, MapPin, Check, ChevronLeft, Navigation } from 'lucide-react'
import { getJob, updateJobStatus } from '../../api'
import { useSocket } from '../../context/SocketContext'
import { SERVICES, JOB_STATUS_STEPS } from '../../constants'

const MECHANIC_STEPS = [
  { status: 'en_route',    label: 'Heading to Driver', action: 'I\'m on my way', icon: Navigation },
  { status: 'arrived',     label: 'Arrived at Location', action: 'I\'ve arrived', icon: MapPin },
  { status: 'in_progress', label: 'Working on Vehicle', action: 'Started working', icon: '⚙️' },
  { status: 'completed',   label: 'Job Complete', action: 'Mark as Complete', icon: Check },
]

const STATUS_ORDER_MECH = ['accepted', 'en_route', 'arrived', 'in_progress', 'completed']

export default function MechanicActiveJob() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { jobStatus, clearJobStatus } = useSocket()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [xpEarned, setXpEarned] = useState(null)

  async function fetchJob() {
    try {
      const res = await getJob(jobId)
      setJob(res.data)
    } catch {}
  }

  useEffect(() => {
    fetchJob().finally(() => setLoading(false))
  }, [jobId])

  useEffect(() => {
    if (jobStatus && jobStatus.jobId == jobId) {
      setJob(j => j ? { ...j, status: jobStatus.status } : j)
      clearJobStatus()
    }
  }, [jobStatus, jobId, clearJobStatus])

  async function advanceStatus() {
    if (!job) return
    const currentIdx = STATUS_ORDER_MECH.indexOf(job.status)
    if (currentIdx >= STATUS_ORDER_MECH.length - 2) return

    const nextStatus = STATUS_ORDER_MECH[currentIdx + 1]
    setUpdating(true)
    try {
      await updateJobStatus(jobId, nextStatus)
      setJob(j => ({ ...j, status: nextStatus }))

      if (nextStatus === 'completed') {
        const service = SERVICES[job.service_type]
        setXpEarned(service?.xp || 50)
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-mh-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="flex items-center justify-center h-screen text-center px-6">
      <div>
        <p className="text-4xl mb-3">😕</p>
        <p className="font-semibold text-mh-text mb-4">Job not found</p>
        <button onClick={() => navigate('/mechanic')} className="btn-primary">Back</button>
      </div>
    </div>
  )

  if (xpEarned !== null) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-slide-up">
      <div className="text-6xl mb-4">⭐</div>
      <h2 className="text-2xl font-bold text-mh-text mb-1">Job Complete!</h2>
      <p className="text-sm text-mh-text2 mb-2">Great work!</p>
      <div className="bg-mh-accent text-white rounded-2xl px-6 py-3 mb-2 text-xl font-bold">
        +{xpEarned} XP
      </div>
      <p className="text-sm text-mh-success font-semibold mb-1">
        +रू {Math.round(job.fare * 0.9)} earned
      </p>
      <p className="text-xs text-mh-text3 mb-8">Wait for the driver's rating</p>
      <button onClick={() => navigate('/mechanic')} className="btn-primary w-full text-base py-4">
        Back to Dashboard →
      </button>
    </div>
  )

  const service = SERVICES[job.service_type]
  const currentIdx = STATUS_ORDER_MECH.indexOf(job.status)
  const nextStep = MECHANIC_STEPS.find(s => STATUS_ORDER_MECH.indexOf(s.status) === currentIdx + 1)
  const mechanicEarning = Math.round(job.fare * 0.9)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-mh-border">
        <button onClick={() => navigate('/mechanic')} className="p-1 text-mh-text2 hover:text-mh-text">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="font-bold text-mh-text">Active Job</h1>
          <p className="text-xs text-mh-text3">{service?.name}</p>
        </div>
        <div className="ml-auto">
          <span className="bg-mh-accent-light text-mh-accent text-xs font-semibold px-3 py-1.5 rounded-full capitalize">
            {job.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4">
        {/* Driver info */}
        <div className="card p-4">
          <p className="text-xs text-mh-text3 mb-3 font-medium uppercase tracking-wide">Driver</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-mh-info-light flex items-center justify-center text-xl flex-shrink-0">
              🚗
            </div>
            <div className="flex-1">
              <p className="font-bold text-mh-text">{job.driver_name || 'Driver'}</p>
              <div className="flex items-center gap-1 text-xs text-mh-text3 mt-0.5">
                <MapPin size={10} />
                <span>{job.location_name || 'Current Location'}</span>
              </div>
            </div>
            {job.driver_phone && (
              <a href={`tel:${job.driver_phone}`}
                className="w-10 h-10 rounded-full bg-mh-success-light flex items-center justify-center">
                <Phone size={16} className="text-mh-success" />
              </a>
            )}
          </div>
        </div>

        {/* Job details */}
        <div className="card p-4">
          <p className="text-xs text-mh-text3 mb-3 font-medium uppercase tracking-wide">Job Details</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-mh-text2">Service</span>
              <span className="font-medium text-mh-text">{service?.emoji} {service?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mh-text2">Vehicle</span>
              <span className="font-medium text-mh-text capitalize">{job.vehicle_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mh-text2">Your Earnings</span>
              <span className="font-bold text-mh-success text-base">रू {mechanicEarning}</span>
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="card p-4">
          <p className="text-xs text-mh-text3 mb-4 font-medium uppercase tracking-wide">Progress</p>
          <div className="space-y-3">
            {MECHANIC_STEPS.map((step, i) => {
              const stepIdx = STATUS_ORDER_MECH.indexOf(step.status)
              const isDone = currentIdx >= stepIdx
              const isCurrent = currentIdx + 1 === stepIdx
              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isDone ? 'bg-mh-success text-white' : isCurrent ? 'bg-mh-accent-light border-2 border-mh-accent' : 'bg-mh-surface2'
                  }`}>
                    {isDone ? <Check size={14} /> : <span className="text-xs font-bold text-mh-text3">{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDone ? 'text-mh-success' : isCurrent ? 'text-mh-accent' : 'text-mh-text3'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action button */}
        {nextStep && job.status !== 'completed' && (
          <button onClick={advanceStatus} disabled={updating}
            className={`w-full text-base py-4 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all ${
              nextStep.status === 'completed'
                ? 'btn-primary bg-mh-success hover:bg-emerald-600'
                : 'btn-primary'
            }`}>
            {updating
              ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : nextStep.action + ' →'}
          </button>
        )}

        {job.status === 'completed' && !xpEarned && (
          <div className="text-center py-4">
            <p className="text-sm text-mh-text2">Waiting for driver's payment and rating...</p>
          </div>
        )}
      </div>
    </div>
  )
}
