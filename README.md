# FixSpot 
### Infrastructure Issue Reporting System
> Mae Fah Luang University — Facilities Management

---

##  Links

| | Link |
|---|---|
|  Landing Page | https://fixspot-14b8b.web.app |
|  Web App | https://fixspot-app.web.app |
|  Google Play Store | https://play.google.com/store/apps/details?id=com.pupattararak.fixspot&hl=th |

>  Or search **"FixSpot"** on Google Play Store

---

##  About
FixSpot is a mobile application that allows students and staff at Mae Fah Luang University to report infrastructure problems such as broken street lights, damaged roads, water system issues, and more. Admins can manage and resolve reports directly through the app.

---

##  Tech Stack

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

##  Features

###  User
- Register / Login / Forgot Password
- Report New Issue (Photo + GPS + Category + Description)
- Edit Report (Pending status only)
- Delete Report (Pending status only)
- My Reports with filter (All / Pending / In Progress / Resolved / Rejected)
- Report Detail (Status timeline + Admin note + Completion photo)
- In-app Notifications (Bell icon + Unread badge)
- Profile (Edit name / Sign out)

###  Admin
- Dashboard (Report counts by status + Total users)
- Manage Reports (Search + Filter)
- Report Moderation
  - Pending → Start Task or Reject
  - In Progress → Upload completion photo + Mark as Done
  - Add admin note (sent to user via notification)
- User Management (Toggle role: user ↔ admin)

---

##  Status Flow
pending → in_progress → resolved
pending → rejected

---

## Setup & Installation

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

### 3. Run the app
```bash
npx expo start -c
```
Scan QR code with Expo Go app

---

##  Admin Account
Contact developer to request admin access

Developer: Pupattararak Masomjit
Email: 6731503115@lamduan.mfu.ac.th


## Developer

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
