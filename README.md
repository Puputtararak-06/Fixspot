# FixSpot 🔧
### Infrastructure Issue Reporting System
> Mae Fah Luang University — Facilities Management

---

## 📱 About
FixSpot is a mobile application that allows students and staff at Mae Fah Luang University to report infrastructure problems such as broken street lights, damaged roads, water system issues, and more. Admins can manage and resolve reports directly through the app.

---

## 🚀 Tech Stack

| Technology | Usage |
|---|---|
| React Native + Expo SDK 54 | Mobile App Framework |
| Firebase Authentication | User Login / Register |
| Firebase Firestore | Database |
| Firebase Hosting | Web Deploy |
| Cloudinary | Image Storage |
| React Navigation | Screen Navigation |
| expo-image-picker | Camera + Gallery |
| expo-location | GPS Coordinates |

---

## ✨ Features

### 👤 User
- Register / Login / Forgot Password
- Report New Issue (Photo + GPS + Category + Description)
- Edit Report (Pending status only)
- Delete Report (Pending status only)
- My Reports with filter (All / Pending / In Progress / Resolved / Rejected)
- Report Detail (Status timeline + Admin note + Completion photo)
- In-app Notifications (Bell icon + Unread badge)
- Profile (Edit name / Sign out)

### 🛡️ Admin
- Dashboard (Report counts by status + Total users)
- Manage Reports (Search + Filter)
- Report Moderation
  - Pending → Start Task or Reject
  - In Progress → Upload completion photo + Mark as Done
  - Add admin note (sent to user via notification)
- User Management (Toggle role: user ↔ admin)

---

## 📊 Status Flow
pending → in_progress → resolved
pending → rejected

## 📁 Project Structure
src/
├── context/
│   └── AppContext.jsx
├── navigation/
│   ├── AppNavigator.jsx
│   ├── UserTabs.jsx
│   └── AdminTabs.jsx
├── features/
│   ├── auth/
│   │   ├── LoginScreen.jsx
│   │   └── RegisterScreen.jsx
│   ├── home/
│   │   └── HomeScreen.jsx
│   ├── report/
│   │   ├── CreateReportScreen.jsx
│   │   └── EditReportScreen.jsx
│   ├── reportDetail/
│   │   └── ReportDetailScreen.jsx
│   ├── myReports/
│   │   └── MyReportsScreen.jsx
│   ├── profile/
│   │   └── ProfileScreen.jsx
│   └── admin/
│       ├── dashboard/
│       │   └── AdminDashboardScreen.jsx
│       ├── manageReports/
│       │   └── ManageReportsScreen.jsx
│       ├── reportModeration/
│       │   └── ReportModerationScreen.jsx
│       └── userManagement/
│           └── UserManagementScreen.jsx
└── services/
├── firebase.js
├── authService.js
└── cloudinaryService.js

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Expo Go app on your phone
- Firebase account
- Cloudinary account

### 1. Clone the repo
```bash
git clone https://github.com/Puputtararak-06/Fixspot.git
cd Fixspot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
Create `src/services/firebase.js`
```js
import { initializeApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
})
export const db = getFirestore(app)
```

### 4. Configure Cloudinary
Create `src/services/cloudinaryService.js`
```js
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload'
const UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'

export const uploadImage = async (uri) => {
  const formData = new FormData()
  formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' })
  formData.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData })
  const data = await res.json()
  return data.secure_url
}
```

### 5. Run the app
```bash
npx expo start -c
```
Scan QR code with Expo Go app

---

## 👑 Set Admin Account
Admin role must be set manually via Firebase Console
Firebase Console
→ Firestore Database
→ users collection
→ find your user document
→ change role: "user" → "admin"

---

## 🌐 Web Deploy

```bash
npx expo export --platform web
firebase deploy
```

Live at: https://fixspot-14b8b.web.app

---

## 📦 Build Android (.aab)

```bash
eas build --platform android
```

---

## 👨‍💻 Developer

| Info | Detail |
|---|---|
| Name | Pupattararak Masomjit |
| Student ID | 6731503115 |
| University | Mae Fah Luang University |
| Course | 2026 Mobile Development |

---

## 📄 License
This project is for educational purposes only.
Mae Fah Luang University — Facilities Management © 2026
