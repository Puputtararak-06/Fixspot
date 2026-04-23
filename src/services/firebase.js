import { initializeApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth' // ✨ เปลี่ยนจาก getAuth
import { getFirestore } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage' // ✨ เพิ่มตัวนี้

const firebaseConfig = {
  apiKey: "AIzaSyDf0PQ_p_BzpIQPzc4KQypLA-Yy90xTexE",
  authDomain: "fixspot-14b8b.firebaseapp.com",
  projectId: "fixspot-14b8b",
  storageBucket: "fixspot-14b8b.firebasestorage.app",
  messagingSenderId: "443621045874",
  appId: "1:443621045874:web:cc0bf53014a071347eb4eb",
  measurementId: "G-CGKKGJEK62"
};

const app = initializeApp(firebaseConfig)

// ✨ เปลี่ยนวิธี Export auth เพื่อให้มันจำรหัสผ่านในเครื่อง (Persistence)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
})

export const db = getFirestore(app)