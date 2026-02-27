import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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

export const auth = getAuth(app)
export const db = getFirestore(app)