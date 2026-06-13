import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Wrench } from 'lucide-react'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form)
      signIn(res.data.token, res.data.user)
      const role = res.data.user.role
      if (role === 'driver')                         navigate('/driver')
      else if (role === 'mechanic')                  navigate('/mechanic')
      else                                           navigate('/partner')
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      {/* Back */}
      <Link to="/" className="text-sm text-mh-text2 mb-8 inline-flex items-center gap-1 hover:text-mh-text">
        ← Back
      </Link>

      {/* Logo */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🔧</div>
        <h1 className="text-2xl font-bold text-mh-text">Welcome back</h1>
        <p className="text-sm text-mh-text2 mt-1">Sign in to your MechHub account</p>
      </div>

      {/* Demo hint */}
      <div className="bg-mh-info-light border border-blue-100 rounded-xl p-3 mb-6 text-xs text-blue-700">
        <strong>Demo Mechanic:</strong> ram@mechhub.np / demo123
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="you@example.com"
            value={form.email} onChange={set('email')} required autoFocus />
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} className="input pr-10"
              placeholder="••••••••" value={form.password} onChange={set('password')} required />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mh-text3 hover:text-mh-text2 transition-colors">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-mh-danger bg-mh-danger-light rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
        </button>
      </form>

      <p className="text-sm text-center text-mh-text2 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-mh-accent font-semibold hover:underline">Sign Up</Link>
      </p>
    </div>
  )
}
