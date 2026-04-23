import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
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
          // 🔍 ดึงข้อมูลเสริมจาก Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()
            // ✨ รวมร่างข้อมูลจาก Auth และ Firestore เข้าด้วยกัน
            setCurrentUser({ 
              uid: user.uid, 
              email: user.email, 
              ...userData 
            })
            setUserRole(userData?.role || 'user')
          } else {
            // กรณีมีใน Auth แต่ยังไม่มีใน Firestore (เผื่อไว้)
            setCurrentUser(user)
            setUserRole('user')
          }
        } else {
          // ล้างข้อมูลเมื่อ Logout
          setCurrentUser(null)
          setUserRole(null)
        }
      } catch (error) {
        console.error("Auth state error:", error)
        setCurrentUser(null)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  /**
   * ✨ ฟังก์ชันอัปเดตข้อมูลผู้ใช้แบบ Merge
   * ป้องกันปัญหาอัปเดตฟิลด์เดียวแล้วฟิลด์อื่น (เช่น ชื่อ) หาย
   */
  const updateCurrentUser = (newData) => {
    setCurrentUser(prev => {
      // 1. ถ้าข้อมูลใหม่เป็น null (สั่งล้างค่า) ให้คืนค่า null ทันที
      if (newData === null) return null;
      
      // 2. ถ้ามีข้อมูลเก่าอยู่ ให้เอามา "รวมร่าง" กับข้อมูลใหม่
      // ข้อมูลเดิมที่ไม่ได้ส่งมา (เช่น name, email) จะไม่หายไปไหน
      return prev ? { ...prev, ...newData } : newData;
    });
  };

  /**
   * 🚪 ฟังก์ชันออกจากระบบ
   */
  const logout = async () => {
    try {
      setLoading(true)
      await signOut(auth)
      // เมื่อ signOut สำเร็จ onAuthStateChanged ด้านบนจะทำงานเองอัตโนมัติ
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppContext.Provider value={{ 
      currentUser, 
      userRole, 
      loading, 
      updateCurrentUser, 
      logout 
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}