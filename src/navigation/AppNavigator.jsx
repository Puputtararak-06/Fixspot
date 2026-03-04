import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { useApp } from '../context/AppContext'
import LoginScreen from '../features/auth/LoginScreen'
import RegisterScreen from '../features/auth/RegisterScreen'
import UserTabs from './UserTabs'
import AdminTabs from './AdminTabs'
import CreateReportScreen from '../features/report/CreateReportScreen'
import EditReportScreen from '../features/report/EditReportScreen'
import ReportDetailScreen from '../features/reportDetail/ReportDetailScreen'
import ReportModerationScreen from '../features/admin/reportModeration/ReportModerationScreen'

const Stack = createStackNavigator()

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
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={currentUser ? (userRole === 'admin' ? 'AdminTabs' : 'UserTabs') : 'Login'}
      >
        {currentUser ? (
          userRole === 'admin' ? (
            <>
              <Stack.Screen name="AdminTabs" component={AdminTabs} />
              <Stack.Screen name="ReportModeration" component={ReportModerationScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="UserTabs" component={UserTabs} />
              <Stack.Screen name="CreateReport" component={CreateReportScreen} />
              <Stack.Screen name="EditReport" component={EditReportScreen} />
              <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
            </>
          )
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}