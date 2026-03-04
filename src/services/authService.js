import { auth, db } from './firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

// สมัครสมาชิก
export const registerUser = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // เก็บข้อมูลเพิ่มเติมใน Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    name: name,
    email: email,
    role: 'user',
    createdAt: new Date().toISOString()
  })

  return user
}

// เข้าสู่ระบบ
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // ดึง role จาก Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid))
  const userData = userDoc.data()

  return { user, role: userData?.role || 'user' }
}

// ออกจากระบบ
export const logoutUser = async () => {
  try {
    await signOut(auth)
    // Firebase will update auth state and AppContext will handle cleanup
  } catch (error) {
    console.log('Logout error:', error)
    throw error
  }
}

// ส่ง email รีเซ็ตรหัสผ่าน
export const resetPassword = async (email) => {
  if (!email || !email.trim()) {
    throw new Error('Please enter your email')
  }

  try {
    // Send password reset email
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('Email not found')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.')
    } else {
      throw new Error('Failed to send reset email. Please check your email and try again.')
    }
  }
}