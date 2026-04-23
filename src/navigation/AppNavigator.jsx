import React, { useState, useEffect, useRef } from 'react'
import { View, ActivityIndicator, Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

// --- Context & Services ---
import { useApp } from '../context/AppContext'
import { logoutUser } from '../services/authService'
import { db } from '../services/firebase'
import { doc, updateDoc } from 'firebase/firestore'

// --- Auth Screens ---
import LoginScreen from '../features/auth/LoginScreen'
import RegisterScreen from '../features/auth/RegisterScreen'
import PDPAScreen from '../features/auth/PDPAScreen'

// --- Navigation (Tabs) ---
import UserTabs from './UserTabs'
import AdminTabs from './AdminTabs'

// --- User Screens ---
import HomeScreen from '../features/home/HomeScreen'
import MyReportsScreen from '../features/myReports/MyReportsScreen'
import ProfileScreen from '../features/profile/ProfileScreen'
import CreateReportScreen from '../features/report/CreateReportScreen' // ✅ ต้องมีอันนี้!
import EditReportScreen from '../features/report/EditReportScreen'
import ReportDetailScreen from '../features/reportDetail/ReportDetailScreen' // ✅ มีแค่อันเดียวพอ!

// --- Admin Screens ---
import AdminDashboardScreen from '../features/admin/dashboard/AdminDashboardScreen'
import ManageReportsScreen from '../features/admin/manageReports/ManageReportsScreen'
import AdminProfileScreen from '../features/admin/profile/AdminProfileScreen'
import ReportModerationScreen from '../features/admin/reportModeration/ReportModerationScreen'
import UserManagementScreen from '../features/admin/userManagement/UserManagementScreen'


const Stack = createStackNavigator()


function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTabs" component={UserTabs} /> 
      
      <Stack.Screen name="CreateReport" component={CreateReportScreen} />
      <Stack.Screen name="EditReport" component={EditReportScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="MyReportsScreen" component={MyReportsScreen} />
      
      {/* เพิ่มหน้าอื่นๆ ของ User ตรงนี้ */}
    </Stack.Navigator>
  )
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="ManageReports" component={ManageReportsScreen} />
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
      <Stack.Screen name="ReportModeration" component={ReportModerationScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} /> 
  
    </Stack.Navigator>
  )
}

function PDPAStack({ userId }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PDPA" component={PDPAScreen} initialParams={{ userId }} />
    </Stack.Navigator>
  )
}

// --- 3. ตัวหลัก (AppNavigator) ---
export default function AppNavigator() {
  const { currentUser, userRole, loading } = useApp()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ebfdf6' }}>
        <ActivityIndicator size="large" color="#2D7A5F" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {currentUser ? (
        // 🛡️ ด่านตรวจ PDPA
        currentUser.pdpaAccepted === false ? (
          <PDPAStack userId={currentUser.uid} />
        ) : (
          // ✅ ถ้าผ่าน PDPA แล้ว ค่อยมาเช็ค Role ตรงนี้!
          userRole === 'admin' ? <AdminStack /> : <UserStack />
        )
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  )
}