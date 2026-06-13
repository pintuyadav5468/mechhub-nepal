import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [pendingJob, setPendingJob] = useState(null)   // incoming job for mechanics
  const [jobAccepted, setJobAccepted] = useState(null) // { jobId, mechanic } for drivers
  const [jobStatus, setJobStatus] = useState(null)     // { jobId, status } live updates

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }

    const socket = io('http://localhost:3002', { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('register', user.id)
    })

    // Mechanic receives a new job ping
    socket.on('new_job', (data) => {
      if (user.role === 'mechanic') setPendingJob(data)
    })

    // Driver's job was accepted by a mechanic
    socket.on('job_accepted', (data) => {
      setJobAccepted(data)
    })

    // Either party: job status changed
    socket.on('job_status_update', (data) => {
      setJobStatus(data)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  const dismissPendingJob = useCallback(() => setPendingJob(null), [])
  const clearJobAccepted = useCallback(() => setJobAccepted(null), [])
  const clearJobStatus = useCallback(() => setJobStatus(null), [])

  return (
    <SocketContext.Provider value={{
      socket: socketRef,
      pendingJob, dismissPendingJob,
      jobAccepted, clearJobAccepted,
      jobStatus, clearJobStatus,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
