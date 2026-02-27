import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import AdminDashboardScreen from '../features/admin/dashboard/AdminDashboardScreen'
import ManageReportsScreen from '../features/admin/manageReports/ManageReportsScreen'
import AdminProfileScreen from '../features/admin/profile/AdminProfileScreen'

const Tab = createBottomTabNavigator()

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2D7A5F',
        tabBarInactiveTintColor: '#A0ADA0',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E8EEE8',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📊</Text>
        }}
      />
      <Tab.Screen
        name="ManageReports"
        component={ManageReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📋</Text>
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AdminProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text>
        }}
      />
    </Tab.Navigator>
  )
}