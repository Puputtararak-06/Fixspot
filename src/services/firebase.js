import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDf0PQ_p_BzpIQPzc4KQypLA-Yy90xTexE",
  authDomain: "fixspot-14b8b.firebaseapp.com",
  projectId: "fixspot-14b8b",
  storageBucket: "fixspot-14b8b.firebasestorage.app",
  messagingSenderId: "443621045874",
  appId: "1:443621045874:web:cc0bf53014a071347eb4eb",
  measurementId: "G-CGKKGJEK62"
};

const app = initializeApp(firebaseConfig);

// 🛡️ ฟังก์ชันสร้าง Auth แบบแยกโลก
const getFirebaseAuth = () => {
  if (Platform.OS === 'web') {
    // 🌐 โลกของ Web: ใช้ getAuth แบบมาตรฐาน (เบราว์เซอร์รู้จักดี)
    return getAuth(app);
  } else {
    // 📱 โลกของ Mobile: ใช้ initializeAuth คู่กับ AsyncStorage
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
};

export const auth = getFirebaseAuth();
export const db = getFirestore(app);