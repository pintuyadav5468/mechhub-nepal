import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Award, Zap, Clock, ChevronRight, Power } from 'lucide-react'
import { getMechanicDashboard, toggleMechanicStatus } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { SERVICES, LEVEL_NAMES } from '../../constants'

function XpBar({ current, prev, next, level, levelName }) {
  const range = (next || current + 1) - prev
  const progress = Math.min(((current - prev) / range) * 100, 100)
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-mh-accent">{levelName} · Lvl {level}</span>
        <span className="text-xs text-mh-text3">{current} XP{next ? ` / ${next}` : ' (Max)'}</span>
      </div>
      <div className="h-2.5 bg-mh-surface2 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-mh-accent to-orange-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function MechanicDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  async function load() {
    try {
      const res = await getMechanicDashboard()
      setData(res.data)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleToggle() {
    setToggling(true)
    try {
      const res = await toggleMechanicStatus()
      setData(d => d ? { ...d, isOnline: res.data.isOnline, profile: { ...d.profile, is_online: res.data.isOnline ? 1 : 0 } } : d)
    } catch {} finally {
      setToggling(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-mh-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center h-screen text-center px-6">
      <p className="text-mh-text2">Could not load dashboard.</p>
    </div>
  )

  const { profile, earnings, recentJobs, levelInfo, isOnline, activeJob } = data
  const firstName = user?.name?.split(' ')[0] || 'Mechanic'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 bg-mh-bg border-b border-mh-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-mh-text3">Dashboard</p>
            <h1 className="text-xl font-bold text-mh-text">{firstName}</h1>
          </div>
          {/* Online toggle */}
          <button onClick={handleToggle} disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              isOnline
                ? 'bg-mh-success-light text-mh-success border border-mh-success/30'
                : 'bg-mh-surface text-mh-text3 border border-mh-border'
            }`}>
            <Power size={14} />
            {toggling ? '...' : isOnline ? 'Online' : 'Offline'}
          </button>
        </div>

        {/* XP bar */}
        {levelInfo && (
          <XpBar
            current={levelInfo.currentXp}
            prev={levelInfo.prevLevelXp}
            next={levelInfo.nextLevelXp}
            level={levelInfo.level}
            levelName={levelInfo.name}
          />
        )}
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Active job banner */}
        {activeJob && (
          <button onClick={() => navigate(`/mechanic/job/${activeJob.id}`)}
            className="w-full bg-mh-accent-light border border-mh-accent/30 rounded-2xl p-4 flex items-center justify-between animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-mh-accent animate-pulse" />
              <div className="text-left">
                <p className="text-xs text-mh-accent font-semibold">Active Job</p>
                <p className="text-sm font-bold text-mh-text">{SERVICES[activeJob.service_type]?.name}</p>
                <p className="text-xs text-mh-text2">Driver: {activeJob.driver_name}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-mh-accent" />
          </button>
        )}

        {/* Not online hint */}
        {!isOnline && (
          <div className="bg-mh-surface rounded-xl p-4 text-center border border-mh-border">
            <p className="text-sm text-mh-text2">
              You're <span className="font-semibold text-mh-danger">Offline</span>.
              Go online to start receiving job requests.
            </p>
          </div>
        )}

        {/* Earnings */}
        <div>
          <h2 className="text-sm font-semibold text-mh-text2 uppercase tracking-wide mb-3">Earnings</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-xs text-mh-text3 mb-1">Today</p>
              <p className="text-2xl font-bold text-mh-text">रू {earnings?.today || 0}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-mh-text3 mb-1">This Week</p>
              <p className="text-2xl font-bold text-mh-accent">रू {earnings?.week || 0}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-mh-text3 mb-1">This Month</p>
              <p className="text-xl font-bold text-mh-text">रू {earnings?.month || 0}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-mh-text3 mb-1">All Time</p>
              <p className="text-xl font-bold text-mh-text">रू {earnings?.allTime || 0}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-mh-text">{profile?.jobs_done || 0}</p>
            <p className="text-xs text-mh-text3">Jobs</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-yellow-500">★ {profile?.rating?.toFixed(1) || '5.0'}</p>
            <p className="text-xs text-mh-text3">Rating</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-lg font-bold text-mh-accent">{profile?.streak || 0}</p>
            <p className="text-xs text-mh-text3">🔥 Streak</p>
          </div>
        </div>

        {/* Specialties */}
        {profile?.specialties && (
          <div>
            <h2 className="text-sm font-semibold text-mh-text2 uppercase tracking-wide mb-3">Your Services</h2>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.split(',').map(s => (
                <span key={s} className="bg-mh-accent-light text-mh-accent text-xs font-medium px-3 py-1.5 rounded-full">
                  {SERVICES[s]?.emoji} {SERVICES[s]?.name || s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent jobs */}
        {recentJobs?.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-mh-text2 uppercase tracking-wide mb-3">Recent Jobs</h2>
            <div className="space-y-2">
              {recentJobs.map(j => (
                <div key={j.id} className="card p-3 flex items-center gap-3">
                  <span className="text-xl">{SERVICES[j.service_type]?.emoji || '🔧'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-mh-text">{SERVICES[j.service_type]?.name}</p>
                    <p className="text-xs text-mh-text3">{j.driver_name} · {j.vehicle_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-mh-success">+रू {Math.round(j.fare * 0.9)}</p>
                    {j.driver_rating && <p className="text-xs text-yellow-400">{'★'.repeat(j.driver_rating)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
