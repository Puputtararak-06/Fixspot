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

  // ✨ เพิ่ม Field pdpaAccepted: false เข้าไปตั้งแต่ตอนสมัคร
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    name: name, 
    email: email,
    role: 'user',
    pdpaAccepted: false, // ✨ ตั้งค่าเริ่มต้นเป็น false
    createdAt: new Date().toISOString()
  })

  return user // คืนค่า user object กลับไปเพื่อให้หน้า Register เอาไปใช้ต่อได้
}

// เข้าสู่ระบบ
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // ดึงข้อมูลทั้งหมดจาก Firestore (รวมทั้ง role และ pdpaAccepted)
  const userDoc = await getDoc(doc(db, 'users', user.uid))
  const userData = userDoc.data()

  // คืนค่ากลับไปเป็น Object เพื่อให้หน้า Login เช็คต่อได้ง่ายๆ
  return { 
    user, 
    role: userData?.role || 'user',
    pdpaAccepted: userData?.pdpaAccepted || false // ✨ ส่งค่านี้กลับไปด้วย
  }
}

// ออกจากระบบ
export const logoutUser = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.log('Logout error:', error)
    throw error
  }
}

// ส่ง email รีเซ็ตรหัสผ่าน (โค้ดของนายดีอยู่แล้ว พี่เก็บไว้ให้ครบ)
export const resetPassword = async (email) => {
  if (!email || !email.trim()) {
    throw new Error('Please enter your email')
  }

  try {
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