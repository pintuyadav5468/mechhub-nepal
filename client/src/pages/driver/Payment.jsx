import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { getJob, payJob, updateJobStatus } from '../../api'
import { SERVICES } from '../../constants'

const PAY_METHODS = [
  { key: 'esewa',  label: 'eSewa',   emoji: '🟢', desc: 'Pay via eSewa digital wallet' },
  { key: 'khalti', label: 'Khalti',  emoji: '🟣', desc: 'Pay via Khalti wallet' },
  { key: 'cash',   label: 'Cash',    emoji: '💵', desc: 'Pay mechanic directly in cash' },
]

export default function DriverPayment() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [payMethod, setPayMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    setLoading(true)
    getJob(jobId).then(res => setJob(res.data)).finally(() => setLoading(false))
  }, [jobId])

  async function handlePay() {
    if (!payMethod) return
    setPaying(true)
    try {
      await payJob(jobId, payMethod)
      // Mark job as completed
      await updateJobStatus(jobId, 'completed')
      navigate(`/driver/complete/${jobId}`)
    } catch (e) {
      alert(e.response?.data?.error || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  if (loading || !job) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-mh-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const service = SERVICES[job.service_type]
  const platformFee = Math.round(job.fare * 0.1)
  const mechanicPay = job.fare - platformFee

  return (
    <div className="min-h-screen flex flex-col px-5">
      <div className="pt-12 pb-6 text-center border-b border-mh-border">
        <div className="w-16 h-16 rounded-full bg-mh-success-light flex items-center justify-center mx-auto mb-3">
          <Check size={28} className="text-mh-success" />
        </div>
        <h1 className="text-xl font-bold text-mh-text">Job Completed!</h1>
        <p className="text-sm text-mh-text2 mt-1">Please pay for the service</p>
      </div>

      <div className="py-6 space-y-4">
        {/* Bill */}
        <div className="card p-5">
          <h2 className="font-semibold text-mh-text mb-3">Bill Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-mh-text2">{service?.emoji} {service?.name}</span>
              <span className="text-mh-text">रू {mechanicPay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-mh-text2">Platform fee (10%)</span>
              <span className="text-mh-text">रू {platformFee}</span>
            </div>
            <div className="border-t border-mh-border pt-2 flex justify-between">
              <span className="font-semibold text-mh-text">Total</span>
              <span className="font-bold text-xl text-mh-text">रू {job.fare}</span>
            </div>
          </div>
        </div>

        {/* Mechanic */}
        {job.mechanic_name && (
          <div className="flex items-center gap-3 card p-4">
            <div className="w-10 h-10 rounded-full bg-mh-accent-light flex items-center justify-center text-lg flex-shrink-0">🔧</div>
            <div>
              <p className="text-sm font-semibold text-mh-text">{job.mechanic_name}</p>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-xs">★</span>
                <span className="text-xs text-mh-text2">{job.mechanic_rating}</span>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-mh-text3">Mechanic earns</p>
              <p className="text-sm font-bold text-mh-success">रू {mechanicPay}</p>
            </div>
          </div>
        )}

        {/* Payment methods */}
        <div>
          <p className="text-sm font-medium text-mh-text2 mb-3">Choose Payment Method</p>
          <div className="space-y-2">
            {PAY_METHODS.map(p => (
              <button key={p.key} onClick={() => setPayMethod(p.key)}
                className={`w-full card p-4 flex items-center gap-3 transition-all ${payMethod === p.key ? 'border-mh-accent ring-2 ring-mh-accent/20' : ''}`}>
                <span className="text-2xl">{p.emoji}</span>
                <div className="text-left flex-1">
                  <p className="font-semibold text-mh-text text-sm">{p.label}</p>
                  <p className="text-xs text-mh-text3">{p.desc}</p>
                </div>
                {payMethod === p.key && <Check size={16} className="text-mh-accent flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Pay button */}
        <button onClick={handlePay} disabled={!payMethod || paying} className="btn-primary w-full text-base py-4 mt-2">
          {paying
            ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : `Pay रू ${job.fare} via ${payMethod ? PAY_METHODS.find(p => p.key === payMethod)?.label : '...'}`}
        </button>
      </div>
    </div>
  )
}
