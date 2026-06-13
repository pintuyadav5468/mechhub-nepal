import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('mechhub_token')
    if (!token) { setLoading(false); return }

    getMe()
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('mechhub_token'))
      .finally(() => setLoading(false))
  }, [])

  function signIn(token, userData) {
    localStorage.setItem('mechhub_token', token)
    setUser(userData)
  }

  function signOut() {
    localStorage.removeItem('mechhub_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
