import { useState, useEffect } from 'react'
import { Power, TrendingUp, Users, Clock } from 'lucide-react'
import { getPartnerDashboard, togglePartnerStatus } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { PARTNER_TYPES } from '../../constants'

const PARTNER_SERVICES = {
  petrol: [
    { emoji: '⛽', label: 'Emergency Fuel Delivery', desc: 'Deliver fuel to stranded drivers' },
    { emoji: '🛢️', label: 'Fill Up',                 desc: 'Drivers stop at your pump' },
  ],
  ev: [
    { emoji: '🔌', label: 'Mobile EV Charging',     desc: 'Dispatch charging unit to drivers' },
    { emoji: '⚡', label: 'Station Charging',         desc: 'Drivers charge at your station' },
  ],
  hotel: [
    { emoji: '🛏️', label: 'Emergency Stay',          desc: 'Stranded travellers find shelter' },
    { emoji: '☕', label: 'Rest Stop',               desc: 'Food and refreshments for drivers' },
  ],
}

export default function PartnerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [simCount, setSimCount] = useState(0)

  const partnerType = user?.role
  const pt = PARTNER_TYPES[partnerType]

  async function load() {
    try {
      const res = await getPartnerDashboard()
      setData(res.data)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleToggle() {
    setToggling(true)
    try {
      const res = await togglePartnerStatus()
      setData(d => d ? { ...d, profile: { ...d.profile, is_open: res.data.isOpen ? 1 : 0 } } : d)
    } catch {} finally {
      setToggling(false)
    }
  }

  function simulateRequest() {
    setSimCount(c => c + 1)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-mh-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const profile = data?.profile
  const isOpen = !!profile?.is_open
  const services = PARTNER_SERVICES[partnerType] || []

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 border-b border-mh-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{pt?.emoji}</span>
              <span className="text-xs text-mh-text3 font-medium">{pt?.label}</span>
            </div>
            <h1 className="text-xl font-bold text-mh-text">
              {profile?.business_name || user?.name}
            </h1>
          </div>
          {/* Status toggle */}
          <button onClick={handleToggle} disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              isOpen
                ? 'bg-mh-success-light text-mh-success border-mh-success/30'
                : 'bg-mh-surface text-mh-text3 border-mh-border'
            }`}>
            <Power size={14} />
            {toggling ? '...' : isOpen ? 'Open' : 'Closed'}
          </button>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Status card */}
        <div className={`rounded-2xl p-4 border ${
          isOpen ? 'bg-mh-success-light border-mh-success/30' : 'bg-mh-surface border-mh-border'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-mh-success animate-pulse' : 'bg-mh-text3'}`} />
            <p className={`text-sm font-semibold ${isOpen ? 'text-mh-success' : 'text-mh-text3'}`}>
              {isOpen ? 'Accepting Requests' : 'Not Accepting Requests'}
            </p>
          </div>
          <p className="text-xs text-mh-text2">
            {isOpen
              ? 'You are visible to nearby drivers on MechHub'
              : 'Drivers cannot see or request from you right now'}
          </p>
        </div>

        {/* Today's stats */}
        <div>
          <h2 className="text-sm font-semibold text-mh-text2 uppercase tracking-wide mb-3">Today's Activity</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <p className="text-xl font-bold text-mh-text">{simCount}</p>
              <p className="text-xs text-mh-text3 mt-1 flex items-center justify-center gap-0.5">
                <Users size={10} /> Requests
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xl font-bold text-mh-accent">रू {simCount * 380}</p>
              <p className="text-xs text-mh-text3 mt-1 flex items-center justify-center gap-0.5">
                <TrendingUp size={10} /> Revenue
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xl font-bold text-mh-text">4.9</p>
              <p className="text-xs text-mh-text3 mt-1">★ Rating</p>
            </div>
          </div>
        </div>

        {/* Services offered */}
        <div>
          <h2 className="text-sm font-semibold text-mh-text2 uppercase tracking-wide mb-3">Services You Offer</h2>
          <div className="space-y-2">
            {services.map(s => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <p className="font-semibold text-mh-text text-sm">{s.label}</p>
                  <p className="text-xs text-mh-text3">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulate a request (demo) */}
        <div className="card p-4 border-dashed">
          <p className="text-xs font-semibold text-mh-text3 uppercase tracking-wide mb-2">Demo</p>
          <p className="text-sm text-mh-text2 mb-3">Simulate an incoming request to test the system.</p>
          <button onClick={simulateRequest} disabled={!isOpen}
            className={isOpen ? 'btn-primary w-full' : 'btn-secondary w-full'} >
            {isOpen ? 'Simulate Request' : 'Go Online First'}
          </button>
        </div>

        {/* Simulated requests */}
        {simCount > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-mh-text2 uppercase tracking-wide mb-3">Recent Requests</h2>
            <div className="space-y-2">
              {Array.from({ length: simCount }, (_, i) => (
                <div key={i} className="card p-3 flex items-center gap-3">
                  <span className="text-xl">{services[i % services.length]?.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-mh-text">{services[i % services.length]?.label}</p>
                    <p className="text-xs text-mh-text3">Driver · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="text-xs bg-mh-success-light text-mh-success px-2 py-1 rounded-full font-medium">Done</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
