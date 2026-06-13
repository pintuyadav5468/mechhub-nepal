import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Eye, EyeOff, Check } from 'lucide-react'
import { register } from '../api'
import { useAuth } from '../context/AuthContext'
import { SPECIALTIES, VEHICLE_TYPES, PARTNER_TYPES } from '../constants'

const ROLES = [
  { key: 'driver',   emoji: '🚗', title: 'Driver',   desc: 'I need roadside help' },
  { key: 'mechanic', emoji: '🔧', title: 'Mechanic', desc: 'I provide repair services' },
  { key: 'partner',  emoji: '🏪', title: 'Partner',  desc: 'Petrol pump, EV station, or hotel' },
]

export default function Register() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [step, setStep] = useState(1)
  const [role, setRole] = useState(params.get('role') || '')
  const [partnerType, setPartnerType] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    vehicleType: 'car', vehicleMake: '', vehicleModel: '', vehiclePlate: '',
    specialties: [],
    businessName: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggleSpecialty = (key) => setForm(f => ({
    ...f,
    specialties: f.specialties.includes(key)
      ? f.specialties.filter(s => s !== key)
      : [...f.specialties, key]
  }))

  const totalSteps = role === 'partner' ? 4 : 3

  function next() {
    if (step === 1 && !role) return setError('Please select a role')
    if (step === 2 && role === 'partner' && !partnerType) return setError('Please select partner type')
    setError('')
    setStep(s => s + 1)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return setError('All fields required')
    setLoading(true)
    setError('')
    try {
      const finalRole = role === 'partner' ? partnerType : role
      const payload = {
        ...form,
        role: finalRole,
        specialties: form.specialties.join(','),
      }
      const res = await register(payload)
      signIn(res.data.token, res.data.user)
      if (finalRole === 'driver')                            navigate('/driver')
      else if (finalRole === 'mechanic')                     navigate('/mechanic')
      else                                                   navigate('/partner')
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const progress = ((step - 1) / totalSteps) * 100

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        {step > 1
          ? <button onClick={() => setStep(s => s - 1)} className="p-1 text-mh-text2 hover:text-mh-text transition-colors"><ChevronLeft size={20} /></button>
          : <Link to="/login" className="p-1 text-mh-text2 hover:text-mh-text transition-colors"><ChevronLeft size={20} /></Link>
        }
        <div className="flex-1 h-1.5 bg-mh-surface2 rounded-full overflow-hidden">
          <div className="h-full bg-mh-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-mh-text3 font-medium">{step}/{totalSteps}</span>
      </div>

      {/* Step 1: Role selection */}
      {step === 1 && (
        <div className="animate-fade-up">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">👋</div>
            <h1 className="text-2xl font-bold text-mh-text">Who are you?</h1>
            <p className="text-sm text-mh-text2 mt-1">Choose how you'll use MechHub</p>
          </div>
          <div className="space-y-3 mb-6">
            {ROLES.map(r => (
              <button key={r.key} onClick={() => { setRole(r.key); setError('') }}
                className={`w-full card p-4 flex items-center gap-4 transition-all ${role === r.key ? 'border-mh-accent ring-2 ring-mh-accent/20' : 'hover:border-mh-border-dark'}`}>
                <span className="text-3xl">{r.emoji}</span>
                <div className="text-left flex-1">
                  <p className="font-semibold text-mh-text">{r.title}</p>
                  <p className="text-xs text-mh-text2">{r.desc}</p>
                </div>
                {role === r.key && <Check size={16} className="text-mh-accent flex-shrink-0" />}
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-mh-danger mb-3">{error}</p>}
          <button onClick={next} className="btn-primary w-full" disabled={!role}>
            Continue <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Partner type (only if partner) */}
      {step === 2 && role === 'partner' && (
        <div className="animate-fade-up">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🏪</div>
            <h1 className="text-2xl font-bold text-mh-text">Partner Type</h1>
            <p className="text-sm text-mh-text2 mt-1">What kind of business do you run?</p>
          </div>
          <div className="space-y-3 mb-6">
            {Object.entries(PARTNER_TYPES).map(([k, p]) => (
              <button key={k} onClick={() => { setPartnerType(k); setError('') }}
                className={`w-full card p-4 flex items-center gap-4 transition-all ${partnerType === k ? 'border-mh-accent ring-2 ring-mh-accent/20' : 'hover:border-mh-border-dark'}`}>
                <span className="text-3xl">{p.emoji}</span>
                <p className="font-semibold text-mh-text">{p.label}</p>
                {partnerType === k && <Check size={16} className="text-mh-accent ml-auto flex-shrink-0" />}
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-mh-danger mb-3">{error}</p>}
          <button onClick={next} className="btn-primary w-full" disabled={!partnerType}>
            Continue <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2 (driver/mechanic) or Step 3 (partner): Basic info */}
      {((step === 2 && role !== 'partner') || (step === 3 && role === 'partner')) && (
        <form onSubmit={(e) => { e.preventDefault(); next() }} className="animate-fade-up">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📋</div>
            <h1 className="text-2xl font-bold text-mh-text">Your Details</h1>
            <p className="text-sm text-mh-text2 mt-1">Create your MechHub account</p>
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" placeholder="Hari Bahadur Shrestha"
                value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@gmail.com"
                value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" placeholder="98XXXXXXXX"
                value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10"
                  placeholder="Min 6 characters" value={form.password}
                  onChange={set('password')} required minLength={6} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mh-text3">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-mh-danger mb-3">{error}</p>}
          <button type="submit" className="btn-primary w-full">
            Continue <ChevronRight size={16} />
          </button>
        </form>
      )}

      {/* Final step: Role-specific details */}
      {((step === 3 && role !== 'partner') || (step === 4 && role === 'partner')) && (
        <form onSubmit={handleSubmit} className="animate-fade-up">
          {role === 'driver' && (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🚗</div>
                <h1 className="text-2xl font-bold text-mh-text">Your Vehicle</h1>
                <p className="text-sm text-mh-text2 mt-1">This helps us calculate your service cost</p>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="label">Vehicle Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(VEHICLE_TYPES).map(([k, v]) => (
                      <button key={k} type="button"
                        onClick={() => setForm(f => ({ ...f, vehicleType: k }))}
                        className={`card p-3 text-center transition-all ${form.vehicleType === k ? 'border-mh-accent ring-2 ring-mh-accent/20' : ''}`}>
                        <div className="text-xl mb-1">{v.emoji}</div>
                        <p className="text-xs font-medium text-mh-text">{v.label.split(' ')[0]}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Make (optional)</label>
                  <input type="text" className="input" placeholder="Honda, Yamaha, Toyota..."
                    value={form.vehicleMake} onChange={set('vehicleMake')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Model</label>
                    <input type="text" className="input" placeholder="Activa, City..."
                      value={form.vehicleModel} onChange={set('vehicleModel')} />
                  </div>
                  <div>
                    <label className="label">Plate No.</label>
                    <input type="text" className="input" placeholder="BA 1 KHA 1234"
                      value={form.vehiclePlate} onChange={set('vehiclePlate')} />
                  </div>
                </div>
              </div>
            </>
          )}

          {role === 'mechanic' && (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🔧</div>
                <h1 className="text-2xl font-bold text-mh-text">Your Skills</h1>
                <p className="text-sm text-mh-text2 mt-1">Select the services you provide</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {SPECIALTIES.map(s => (
                  <button key={s.key} type="button"
                    onClick={() => toggleSpecialty(s.key)}
                    className={`card p-3 flex items-center gap-2 transition-all ${form.specialties.includes(s.key) ? 'border-mh-accent ring-2 ring-mh-accent/20 bg-mh-accent-light' : ''}`}>
                    <span className="text-lg">{s.emoji}</span>
                    <span className="text-xs font-medium text-mh-text">{s.label}</span>
                    {form.specialties.includes(s.key) && <Check size={12} className="text-mh-accent ml-auto" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {role === 'partner' && (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">{PARTNER_TYPES[partnerType]?.emoji || '🏪'}</div>
                <h1 className="text-2xl font-bold text-mh-text">Business Info</h1>
                <p className="text-sm text-mh-text2 mt-1">Tell us about your {PARTNER_TYPES[partnerType]?.label}</p>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="label">Business Name</label>
                  <input type="text" className="input" placeholder="Shrestha Petrol Pump"
                    value={form.businessName} onChange={set('businessName')} required />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-xs text-mh-danger mb-3">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
            {loading
              ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Create Account →'}
          </button>
        </form>
      )}

      <p className="text-xs text-center text-mh-text3 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-mh-accent font-semibold">Sign In</Link>
      </p>
    </div>
  )
}
