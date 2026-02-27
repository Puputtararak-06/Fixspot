import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import HomeScreen from '../features/home/HomeScreen'
import MyReportsScreen from '../features/myReports/MyReportsScreen'
import ProfileScreen from '../features/profile/ProfileScreen'

const Tab = createBottomTabNavigator()

export default function UserTabs() {
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
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🏠</Text>
        }}
      />
      <Tab.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{
          tabBarLabel: 'My Reports',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📋</Text>
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text>
        }}
      />
    </Tab.Navigator>
  )
}