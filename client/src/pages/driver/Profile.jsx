import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Car, Phone, Mail, MapPin } from 'lucide-react'
import { getUserProfile } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { VEHICLE_TYPES } from '../../constants'

export default function DriverProfile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getUserProfile().then(res => setProfile(res.data)).catch(() => {})
  }, [])

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  const vehicle = profile?.vehicle
  const vt = VEHICLE_TYPES[vehicle?.type]

  return (
    <div className="min-h-screen">
      <div className="px-5 pt-12 pb-6 border-b border-mh-border">
        <h1 className="text-xl font-bold text-mh-text">Profile</h1>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Avatar + name */}
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full bg-mh-accent-light text-4xl flex items-center justify-center mb-3 border-2 border-mh-accent/20">
            🚗
          </div>
          <h2 className="text-lg font-bold text-mh-text">{user?.name}</h2>
          <span className="text-xs bg-mh-surface text-mh-text3 px-3 py-1 rounded-full mt-1 border border-mh-border">Driver</span>
        </div>

        {/* Info */}
        <div className="card p-4 space-y-3">
          {user?.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail size={15} className="text-mh-text3 flex-shrink-0" />
              <span className="text-mh-text">{user.email}</span>
            </div>
          )}
          {user?.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone size={15} className="text-mh-text3 flex-shrink-0" />
              <span className="text-mh-text">{user.phone}</span>
            </div>
          )}
          {user?.location_name && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={15} className="text-mh-text3 flex-shrink-0" />
              <span className="text-mh-text">{user.location_name}</span>
            </div>
          )}
        </div>

        {/* Vehicle */}
        {vehicle && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car size={15} className="text-mh-text3" />
              <p className="text-sm font-semibold text-mh-text">Your Vehicle</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-mh-text2">Type</span>
                <span className="font-medium text-mh-text">{vt?.emoji} {vt?.label}</span>
              </div>
              {vehicle.make && (
                <div className="flex justify-between">
                  <span className="text-mh-text2">Make / Model</span>
                  <span className="font-medium text-mh-text">{vehicle.make} {vehicle.model}</span>
                </div>
              )}
              {vehicle.plate && (
                <div className="flex justify-between">
                  <span className="text-mh-text2">Plate</span>
                  <span className="font-medium text-mh-text font-mono">{vehicle.plate}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign out */}
        <button onClick={handleSignOut} className="btn-secondary w-full mt-4 text-mh-danger border-mh-danger/20">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}
