import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star, Heart } from 'lucide-react'
import { getJob, rateJob } from '../../api'
import { SERVICES } from '../../constants'

const EMOJIS = ['😞', '😕', '😐', '😊', '🤩']
const TIPS = [0, 50, 100, 200]

export default function DriverComplete() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [tip, setTip] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getJob(jobId).then(res => setJob(res.data)).catch(() => {})
  }, [jobId])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await rateJob(jobId, { rating, comment, tip })
      setDone(true)
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-slide-up">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-mh-text mb-2">Thank You!</h2>
      <p className="text-sm text-mh-text2 mb-8">Your feedback helps us improve MechHub Nepal for everyone.</p>
      <div className="card p-5 w-full mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-mh-text2">Total Paid</span>
          <span className="font-bold text-mh-text">रू {job?.fare}</span>
        </div>
        {tip > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-mh-text2">Tip Sent</span>
            <span className="font-medium text-mh-success">+ रू {tip}</span>
          </div>
        )}
      </div>
      <button onClick={() => navigate('/driver')} className="btn-primary w-full text-base py-4">
        Back to Home →
      </button>
    </div>
  )

  if (!job) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-mh-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const service = SERVICES[job.service_type]
  const displayRating = hover || rating

  return (
    <div className="min-h-screen flex flex-col px-5">
      <div className="pt-12 pb-6 text-center">
        <div className="text-5xl mb-2">{EMOJIS[displayRating - 1]}</div>
        <h1 className="text-2xl font-bold text-mh-text">Rate Your Experience</h1>
        <p className="text-sm text-mh-text2 mt-1">How did {job.mechanic_name?.split(' ')[0] || 'your mechanic'} do?</p>
      </div>

      <div className="space-y-5">
        {/* Stars */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform active:scale-90">
              <Star size={36}
                className={`transition-colors ${s <= displayRating ? 'text-yellow-400 fill-yellow-400' : 'text-mh-surface2'}`} />
            </button>
          ))}
        </div>

        {/* Comment */}
        <div>
          <label className="label">Leave a comment (optional)</label>
          <textarea className="input resize-none" rows={3}
            placeholder="Great service! Fixed quickly..."
            value={comment} onChange={e => setComment(e.target.value)} />
        </div>

        {/* Tip */}
        <div>
          <p className="label flex items-center gap-1.5">
            <Heart size={12} className="text-mh-danger" /> Add a Tip (optional)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TIPS.map(t => (
              <button key={t} onClick={() => setTip(t)}
                className={`card py-2.5 text-center text-sm font-semibold transition-all ${tip === t ? 'border-mh-accent ring-2 ring-mh-accent/20 text-mh-accent' : 'text-mh-text2'}`}>
                {t === 0 ? 'None' : `+रू${t}`}
              </button>
            ))}
          </div>
        </div>

        {/* Mechanic card */}
        {job.mechanic_name && (
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-mh-accent-light flex items-center justify-center text-xl">🔧</div>
            <div>
              <p className="font-semibold text-mh-text text-sm">{job.mechanic_name}</p>
              <p className="text-xs text-mh-text3">{service?.name}</p>
            </div>
            <div className="ml-auto">
              <p className="text-sm font-bold text-mh-text">रू {job.fare}</p>
              {tip > 0 && <p className="text-xs text-mh-success">+ रू {tip} tip</p>}
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full text-base py-4">
          {submitting
            ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : 'Submit Rating →'}
        </button>
      </div>
    </div>
  )
}
