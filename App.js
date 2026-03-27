import React from 'react'
import AppNavigator from './src/navigation/AppNavigator'
import { AppProvider } from './src/context/AppContext'
import { ScrollView } from 'react-native'

export default function App() {
  return (
    <AppProvider>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <AppNavigator />
      </ScrollView>
    </AppProvider>
  )
}