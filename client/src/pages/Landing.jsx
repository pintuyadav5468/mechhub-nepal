import { useNavigate } from 'react-router-dom'
import { Wrench, Zap, Shield, Clock, Star, MapPin, Phone, ChevronRight } from 'lucide-react'

const FEATURES = [
  { icon: Clock,   title: '< 10 Min Response',  desc: 'Mechanics reach you within minutes, not hours' },
  { icon: Shield,  title: 'Verified Mechanics',  desc: 'All mechanics background-checked and rated' },
  { icon: Star,    title: 'Fixed Fair Prices',   desc: 'No surprises. See the exact price before you confirm' },
  { icon: Phone,   title: '24/7 Available',      desc: 'Day or night, rain or shine — help is always a tap away' },
]

const SERVICES = [
  { emoji: '🛞', name: 'Puncture Fix',   price: 'से रू ३५०' },
  { emoji: '⚡', name: 'Battery Start',   price: 'से रू ४५०' },
  { emoji: '⚙️', name: 'Engine Help',    price: 'से रू ६००' },
  { emoji: '⛽', name: 'Fuel Delivery',  price: 'से रू ३००' },
  { emoji: '🔌', name: 'EV Charging',    price: 'से रू ८००' },
  { emoji: '🚗', name: 'Towing',         price: 'से रू १५००' },
]

const STATS = [
  { value: '5,000+', label: 'Happy Drivers' },
  { value: '200+',   label: 'Verified Mechanics' },
  { value: '4.9★',   label: 'Average Rating' },
  { value: '8 min',  label: 'Avg. Arrival Time' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-mh-bg">
      {/* Header */}
      <header className="sticky top-0 bg-mh-bg/90 backdrop-blur border-b border-mh-border z-10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          <div>
            <p className="font-bold text-mh-text text-sm leading-none">MechHub</p>
            <p className="text-xs text-mh-text3 leading-none">Nepal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/login')} className="text-sm font-medium text-mh-text2 hover:text-mh-text px-3 py-2 transition-colors">
            Sign In
          </button>
          <button onClick={() => navigate('/register')} className="btn-primary text-sm py-2 px-4">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-12 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-mh-accent-light text-mh-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-mh-accent animate-pulse" />
          Nepal's #1 Roadside Rescue App
        </div>
        <h1 className="text-4xl font-extrabold text-mh-text leading-tight mb-4">
          Stranded?<br />
          <span className="text-mh-accent">Help is on the way.</span>
        </h1>
        <p className="text-mh-text2 text-base leading-relaxed mb-8 max-w-xs mx-auto">
          Connect with verified mechanics in minutes. Fixed prices, real-time tracking, secure payments.
        </p>
        <div className="space-y-3">
          <button onClick={() => navigate('/register')} className="btn-primary w-full text-base py-4">
            I Need Help Now <ChevronRight size={18} />
          </button>
          <button onClick={() => navigate('/register?role=mechanic')} className="btn-secondary w-full text-base py-4">
            I'm a Mechanic — Join Us
          </button>
        </div>
      </section>

      {/* Stats bar */}
      <div className="mx-4 bg-mh-accent rounded-2xl p-4 grid grid-cols-2 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="text-center">
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Services */}
      <section className="px-5 mt-10">
        <h2 className="text-lg font-bold text-mh-text mb-4">Services Available</h2>
        <div className="grid grid-cols-3 gap-2">
          {SERVICES.map(s => (
            <div key={s.name} className="card p-3 text-center">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <p className="text-xs font-semibold text-mh-text leading-tight">{s.name}</p>
              <p className="text-xs text-mh-accent font-medium mt-0.5">{s.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 mt-10">
        <h2 className="text-lg font-bold text-mh-text mb-4">Why MechHub?</h2>
        <div className="space-y-3">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-mh-accent-light rounded-xl flex items-center justify-center flex-shrink-0">
                <f.icon size={18} className="text-mh-accent" />
              </div>
              <div>
                <p className="font-semibold text-mh-text text-sm">{f.title}</p>
                <p className="text-xs text-mh-text2 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 mt-10">
        <h2 className="text-lg font-bold text-mh-text mb-4">How It Works</h2>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Pick a Service', desc: 'Tell us what help you need with your vehicle' },
            { step: '2', title: 'Get Matched',    desc: 'Nearest verified mechanic is dispatched instantly' },
            { step: '3', title: 'Track Live',     desc: 'See your mechanic approach in real time' },
            { step: '4', title: 'Pay Securely',   desc: 'eSewa, Khalti, or cash — your choice' },
          ].map(h => (
            <div key={h.step} className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-mh-accent text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                {h.step}
              </div>
              <div>
                <p className="font-semibold text-mh-text text-sm">{h.title}</p>
                <p className="text-xs text-mh-text2">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-5 mt-10 mb-12 text-center">
        <div className="bg-mh-surface rounded-2xl p-6">
          <p className="text-2xl mb-2">🏔️</p>
          <h3 className="font-bold text-mh-text mb-1">Built for Nepal</h3>
          <p className="text-xs text-mh-text2 mb-4">Works in Kathmandu, Pokhara, Chitwan, and growing.</p>
          <button onClick={() => navigate('/register')} className="btn-primary w-full">
            Join MechHub Nepal →
          </button>
        </div>
      </section>
    </div>
  )
}
