import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from './authContext.js'
import api from '../services/api.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem('accessToken')))

  useEffect(() => {
    let active = true
    const token = localStorage.getItem('accessToken')

    if (!token) {
      return undefined
    }

    api.get('/api/auth/me')
      .then(({ data }) => {
        if (active) setUser(data.user)
      })
      .catch(() => {
        localStorage.removeItem('accessToken')
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function handleExpiredSession() {
      localStorage.removeItem('accessToken')
      setUser(null)
    }
    window.addEventListener('auth:expired', handleExpiredSession)
    return () => window.removeEventListener('auth:expired', handleExpiredSession)
  }, [])

  const signIn = useCallback(async (credentials) => {
    const { data } = await api.post('/api/auth/login', credentials)
    localStorage.setItem('accessToken', data.token)
    setUser(data.user)
    return data.user
  }, [])

  const updateProfile = useCallback(async (profile) => {
    const { data } = await api.patch('/api/auth/me', profile)
    setUser(data.user)
    return data.user
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user,
    isLoading,
    signIn,
    updateProfile,
    signOut,
  }), [user, isLoading, signIn, updateProfile, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
