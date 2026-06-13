import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapPin, ChevronLeft, Check } from 'lucide-react'
import { createJob } from '../../api'
import { useSocket } from '../../context/SocketContext'
import { SERVICES, VEHICLE_TYPES, calculateFare } from '../../constants'

const SERVICE_KEYS = Object.keys(SERVICES)

export default function DriverRequest() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { jobAccepted, clearJobAccepted } = useSocket()

  const [step, setStep] = useState('pick')  // pick | vehicle | searching | matched
  const [serviceType, setServiceType] = useState(params.get('service') || '')
  const [vehicleType, setVehicleType] = useState('car')
  const [jobId, setJobId] = useState(null)
  const [mechanic, setMechanic] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  // Listen for socket job_accepted event
  useEffect(() => {
    if (jobAccepted && step === 'searching') {
      setMechanic(jobAccepted.mechanic)
      setJobId(jobAccepted.jobId)
      clearJobAccepted()
      clearTimeout(timerRef.current)
      setStep('matched')
    }
  }, [jobAccepted, step, clearJobAccepted])

  // If SOS, skip to vehicle step with empty service selection
  useEffect(() => {
    if (params.get('sos') === '1') setStep('vehicle')
  }, [])

  function confirmService() {
    if (!serviceType) return setError('Please select a service')
    setError('')
    setStep('vehicle')
  }

  async function submitRequest() {
    setLoading(true)
    setError('')
    try {
      const res = await createJob({
        serviceType,
        vehicleType,
        locationName: 'Current Location, Kathmandu',
        lat: 27.7172,
        lng: 85.3240,
      })
      setJobId(res.data.id)
      setStep('searching')

      // Fallback: if socket doesn't fire within 5s, poll manually
      timerRef.current = setTimeout(async () => {
        try {
          const { getJob } = await import('../../api')
          const jobRes = await getJob(res.data.id)
          if (jobRes.data.status === 'accepted' && jobRes.data.mechanic_id) {
            setMechanic({
              id: jobRes.data.mechanic_id,
              name: jobRes.data.mechanic_name,
              phone: jobRes.data.mechanic_phone,
              rating: jobRes.data.mechanic_rating,
              jobsDone: jobRes.data.mechanic_jobs_done,
              specialties: jobRes.data.mechanic_specialties?.split(',') || [],
            })
            setStep('matched')
          }
        } catch {}
      }, 5000)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create request')
      setLoading(false)
    }
  }

  const fare = serviceType ? calculateFare(serviceType, vehicleType) : 0
  const service = SERVICES[serviceType]

  return (
    <div className="min-h-screen bg-mh-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-mh-border">
        {step === 'pick' || step === 'vehicle' ? (
          <button onClick={() => step === 'vehicle' ? setStep('pick') : navigate('/driver')}
            className="p-1 text-mh-text2 hover:text-mh-text">
            <ChevronLeft size={22} />
          </button>
        ) : null}
        <h1 className="font-bold text-mh-text">
          {step === 'pick' ? 'Choose Service' : step === 'vehicle' ? 'Vehicle Info' : step === 'searching' ? 'Finding Help...' : 'Mechanic Found!'}
        </h1>
      </div>

      {/* Step: Pick service */}
      {step === 'pick' && (
        <div className="flex-1 px-5 py-6">
          <p className="text-sm text-mh-text2 mb-4">What do you need help with?</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {SERVICE_KEYS.map(key => {
              const s = SERVICES[key]
              return (
                <button key={key} onClick={() => { setServiceType(key); setError('') }}
                  className={`card p-4 text-left transition-all ${serviceType === key ? 'border-mh-accent ring-2 ring-mh-accent/20 bg-mh-accent-light' : 'hover:shadow-card-lg'}`}>
                  <div className="text-2xl mb-2">{s.emoji}</div>
                  <p className="text-sm font-semibold text-mh-text">{s.name}</p>
                  <p className="text-xs text-mh-text3 mt-0.5">{s.time}</p>
                  <p className="text-sm font-bold text-mh-accent mt-1">रू {s.basePrice}+</p>
                  {serviceType === key && (
                    <div className="absolute top-3 right-3">
                      <Check size={14} className="text-mh-accent" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {error && <p className="text-xs text-mh-danger mb-3">{error}</p>}
          <button onClick={confirmService} className="btn-primary w-full" disabled={!serviceType}>
            Continue →
          </button>
        </div>
      )}

      {/* Step: Vehicle */}
      {step === 'vehicle' && (
        <div className="flex-1 px-5 py-6 animate-fade-up">
          {service && (
            <div className="card p-4 mb-6 flex items-center gap-3">
              <span className="text-3xl">{service.emoji}</span>
              <div>
                <p className="font-semibold text-mh-text">{service.name}</p>
                <p className="text-xs text-mh-text2">{service.time}</p>
              </div>
            </div>
          )}

          <p className="text-sm font-medium text-mh-text2 mb-3">Your vehicle type</p>
          <div className="space-y-2 mb-6">
            {Object.entries(VEHICLE_TYPES).map(([k, v]) => (
              <button key={k} onClick={() => setVehicleType(k)}
                className={`w-full card p-4 flex items-center justify-between transition-all ${vehicleType === k ? 'border-mh-accent ring-2 ring-mh-accent/20' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{v.emoji}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-mh-text">{v.label}</p>
                    <p className="text-xs text-mh-text3">{v.multiplier > 1 ? `×${v.multiplier} fare` : 'Base fare'}</p>
                  </div>
                </div>
                {vehicleType === k && <Check size={16} className="text-mh-accent" />}
              </button>
            ))}
          </div>

          <div className="bg-mh-surface rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-mh-text2">Estimated Fare</span>
              <span className="font-bold text-mh-text text-base">रू {fare}</span>
            </div>
            <div className="flex justify-between text-xs text-mh-text3">
              <span>You pay mechanic directly</span>
              <span>10% platform fee included</span>
            </div>
          </div>

          {!serviceType && (
            <div className="mb-4">
              <p className="text-sm font-medium text-mh-text2 mb-3">Select service</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {SERVICE_KEYS.map(key => (
                  <button key={key} onClick={() => setServiceType(key)}
                    className={`card p-2 text-center text-xs ${serviceType === key ? 'border-mh-accent ring-2 ring-mh-accent/20' : ''}`}>
                    <div>{SERVICES[key].emoji}</div>
                    <div className="font-medium truncate">{SERVICES[key].name.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-mh-danger mb-3">{error}</p>}
          <button onClick={submitRequest} disabled={loading || !serviceType} className="btn-primary w-full text-base py-4">
            {loading ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Request Help Now →'}
          </button>
        </div>
      )}

      {/* Step: Searching / Radar */}
      {step === 'searching' && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 animate-fade-up">
          {/* Radar */}
          <div className="relative w-48 h-48 mb-8">
            {/* Rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-2 border-mh-accent/20 radar-ring" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border-2 border-mh-accent/30 radar-ring radar-ring-delay-1" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-mh-accent/40 radar-ring radar-ring-delay-2" />
            </div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-mh-accent flex items-center justify-center shadow-lg">
                <span className="text-2xl">{service?.emoji || '🔧'}</span>
              </div>
            </div>
            {/* Blip dots */}
            {[45, 120, 230].map((deg, i) => (
              <div key={i} className="absolute w-2.5 h-2.5 rounded-full bg-mh-success border-2 border-white shadow"
                style={{
                  top: `${50 + 38 * Math.sin((deg * Math.PI) / 180)}%`,
                  left: `${50 + 38 * Math.cos((deg * Math.PI) / 180)}%`,
                  transform: 'translate(-50%, -50%)',
                }} />
            ))}
          </div>
          <h2 className="text-xl font-bold text-mh-text mb-2">Finding a Mechanic</h2>
          <p className="text-sm text-mh-text2 text-center mb-1">Searching for nearby verified mechanics...</p>
          <p className="text-xs text-mh-text3 text-center">Usually takes under 30 seconds</p>

          <div className="mt-8 w-full card p-4 flex items-center gap-3">
            <MapPin size={16} className="text-mh-accent flex-shrink-0" />
            <div>
              <p className="text-xs text-mh-text2">Your location</p>
              <p className="text-sm font-medium text-mh-text">Current Location, Kathmandu</p>
            </div>
          </div>

          <button onClick={() => navigate('/driver')} className="mt-4 text-xs text-mh-text3 hover:text-mh-text2 underline transition-colors">
            Cancel Request
          </button>
        </div>
      )}

      {/* Step: Matched */}
      {step === 'matched' && mechanic && (
        <div className="flex-1 px-5 py-6 animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-mh-success-light border-2 border-mh-success flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-mh-success" />
            </div>
            <h2 className="text-lg font-bold text-mh-text">Mechanic Found!</h2>
            <p className="text-sm text-mh-text2">On their way to you</p>
          </div>

          <div className="card p-5 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-mh-accent-light flex items-center justify-center text-2xl flex-shrink-0">
                🔧
              </div>
              <div>
                <p className="font-bold text-mh-text text-base">{mechanic.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-medium text-mh-text">{mechanic.rating}</span>
                  <span className="text-xs text-mh-text3">· {mechanic.jobsDone} jobs</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(mechanic.specialties || []).map(s => (
                <span key={s} className="text-xs bg-mh-surface text-mh-text2 px-2.5 py-1 rounded-full border border-mh-border capitalize">
                  {SERVICES[s]?.name || s}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-mh-text2">Estimated Arrival</span>
              <span className="font-bold text-mh-accent">~8 minutes</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-mh-text2">Service</span>
              <span className="font-medium text-mh-text">{service?.name}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-mh-text2">Fare</span>
              <span className="font-bold text-mh-text">रू {fare}</span>
            </div>
          </div>

          <button onClick={() => navigate(`/driver/tracking/${jobId}`)} className="btn-primary w-full text-base py-4">
            Track Live →
          </button>
        </div>
      )}
    </div>
  )
}
