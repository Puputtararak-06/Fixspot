import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    try {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setCurrentUser({ ...user, ...userData })
          setUserRole(userData?.role || 'user')
        } else {
          // ถ้าไม่มี doc ใน Firestore
          setCurrentUser(user)
          setUserRole('user')
        }
      } else {
        setCurrentUser(null)
        setUserRole(null)
      }
    } catch (error) {
      console.log("Auth state error:", error)
      setCurrentUser(null)
      setUserRole(null)
    }

    setLoading(false)
  })

  return unsubscribe
}, [])

  const updateCurrentUser = (newData) => {
    setCurrentUser(prev => ({ ...prev, ...newData }))
  }

  return (
    <AppContext.Provider value={{ currentUser, userRole, loading, updateCurrentUser }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}