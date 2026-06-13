import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getJobHistory } from '../../api'
import { SERVICES } from '../../constants'

function formatDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DriverHistory() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJobHistory().then(res => setJobs(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalSpent = jobs.filter(j => j.status === 'completed').reduce((s, j) => s + (j.fare || 0), 0)
  const completed = jobs.filter(j => j.status === 'completed').length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 border-b border-mh-border">
        <h1 className="text-xl font-bold text-mh-text">Trip History</h1>
        <p className="text-xs text-mh-text3 mt-0.5">Your past service requests</p>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-mh-text">{completed}</p>
          <p className="text-xs text-mh-text2 mt-1">Jobs Completed</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-mh-accent">रू {totalSpent}</p>
          <p className="text-xs text-mh-text2 mt-1">Total Spent</p>
        </div>
      </div>

      {/* List */}
      <div className="px-5 py-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-mh-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🚗</p>
            <p className="font-semibold text-mh-text">No trips yet</p>
            <p className="text-xs text-mh-text3 mt-1">Your completed service requests will appear here</p>
            <button onClick={() => navigate('/driver')} className="btn-primary mt-6 px-6">
              Get Help Now →
            </button>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {jobs.map(job => {
              const service = SERVICES[job.service_type]
              const isCompleted = job.status === 'completed'
              return (
                <div key={job.id} className="card p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-mh-surface flex items-center justify-center text-xl flex-shrink-0">
                    {service?.emoji || '🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-mh-text text-sm">{service?.name}</p>
                    <p className="text-xs text-mh-text3 mt-0.5">{formatDate(job.created_at)}</p>
                    {job.mechanic_name && (
                      <p className="text-xs text-mh-text2">by {job.mechanic_name}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-mh-text text-sm">रू {job.fare}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isCompleted ? 'bg-mh-success-light text-mh-success' : 'bg-mh-danger-light text-mh-danger'
                    }`}>
                      {isCompleted ? 'Done' : 'Cancelled'}
                    </span>
                    {job.driver_rating && (
                      <p className="text-xs text-yellow-500 mt-0.5">{'★'.repeat(job.driver_rating)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
