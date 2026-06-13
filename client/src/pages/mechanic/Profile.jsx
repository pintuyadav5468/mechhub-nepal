import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, Phone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function MechanicProfile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      <div className="px-5 pt-12 pb-6 border-b border-mh-border">
        <h1 className="text-xl font-bold text-mh-text">Profile</h1>
      </div>
      <div className="px-5 py-6 space-y-4">
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full bg-mh-accent-light text-4xl flex items-center justify-center mb-3">🔧</div>
          <h2 className="text-lg font-bold text-mh-text">{user?.name}</h2>
          <span className="text-xs bg-mh-surface text-mh-text3 px-3 py-1 rounded-full mt-1 border border-mh-border">Mechanic</span>
        </div>
        <div className="card p-4 space-y-3">
          {user?.email && <div className="flex items-center gap-3 text-sm"><Mail size={15} className="text-mh-text3" /><span>{user.email}</span></div>}
          {user?.phone && <div className="flex items-center gap-3 text-sm"><Phone size={15} className="text-mh-text3" /><span>{user.phone}</span></div>}
        </div>
        <button onClick={handleSignOut} className="btn-secondary w-full text-mh-danger border-mh-danger/20">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}
