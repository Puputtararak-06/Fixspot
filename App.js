import React from 'react'
import AppNavigator from './src/navigation/AppNavigator'
import { AppProvider } from './src/context/AppContext'
// ลบ import { ScrollView } from 'react-native' ออกไปแล้ว

export default function App() {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  )
}