import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('mechhub_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mechhub_token')
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')

// Jobs
export const createJob = (data) => api.post('/jobs', data)
export const getCurrentJob = () => api.get('/jobs/current')
export const getJob = (id) => api.get(`/jobs/${id}`)
export const updateJobStatus = (id, status) => api.patch(`/jobs/${id}/status`, { status })
export const acceptJob = (id) => api.patch(`/jobs/${id}/accept`)
export const payJob = (id, payMethod) => api.patch(`/jobs/${id}/payment`, { payMethod })
export const rateJob = (id, data) => api.patch(`/jobs/${id}/rate`, data)
export const getJobHistory = () => api.get('/jobs/history')

// Mechanics
export const getNearbyMechanics = () => api.get('/mechanics/nearby')
export const getMechanicDashboard = () => api.get('/mechanics/dashboard')
export const toggleMechanicStatus = () => api.patch('/mechanics/toggle')
export const getPendingJobs = () => api.get('/mechanics/pending')
export const updateLocation = (lat, lng) => api.patch('/mechanics/location', { lat, lng })

// Users
export const getUserProfile = () => api.get('/users/profile')
export const updateUserProfile = (data) => api.put('/users/profile', data)
export const updateVehicle = (data) => api.put('/users/vehicle', data)

// Partners
export const getPartnerDashboard = () => api.get('/partners/dashboard')
export const togglePartnerStatus = () => api.patch('/partners/toggle')

export default api
