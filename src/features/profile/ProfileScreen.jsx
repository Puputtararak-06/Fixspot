import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView, StatusBar
} from 'react-native'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useApp } from '../../context/AppContext'
import { logoutUser } from '../../services/authService'

export default function ProfileScreen({ navigation }) {
  const { currentUser, updateCurrentUser } = useApp()
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(currentUser?.name || '')
  const [loading, setLoading] = useState(false)

  const handleUpdateName = async () => {
  if (!newName.trim()) {
    Alert.alert('Error', 'Name cannot be empty')
    return
  }
  setLoading(true)
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), { name: newName.trim() })
    updateCurrentUser({ name: newName.trim() }) // ← เพิ่มบรรทัดนี้
    setEditing(false)
    Alert.alert('Success', 'Name updated successfully')
  } catch (e) {
    Alert.alert('Error', 'Failed to update name')
  }
  setLoading(false)
}

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logoutUser()
        }
      }
    ])
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Avatar + Info */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>

        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              placeholder="Enter your name"
              placeholderTextColor="#A0ADA0"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateName} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveButtonText}>Save</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameRow}>
            <Text style={styles.name}>{currentUser?.name}</Text>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.email}>{currentUser?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {currentUser?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyReports')}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuLabel}>My Reports</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('CreateReport')}>
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={styles.menuLabel}>Report New Issue</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Mae Fah Luang University • Facilities Management</Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  header: {
    backgroundColor: '#ebfdf6',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A2E1A' },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8EEE8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2D7A5F',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2D7A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  name: { fontSize: 22, fontWeight: '700', color: '#1A2E1A' },
  editIcon: { fontSize: 18 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  nameInput: {
    flex: 1, borderWidth: 1, borderColor: '#2D7A5F',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 16, color: '#1A2E1A',
  },
  saveButton: {
    backgroundColor: '#2D7A5F', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  cancelButton: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  },
  cancelButtonText: { color: '#6B7C6B' },
  email: { fontSize: 14, color: '#6B7C6B', marginBottom: 10 },
  roleBadge: {
    backgroundColor: '#ebfdf6', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  roleText: { color: '#2D7A5F', fontSize: 13, fontWeight: '600' },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EEE8',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 14,
  },
  menuIcon: { fontSize: 20 },
  menuLabel: { flex: 1, fontSize: 16, color: '#1A2E1A', fontWeight: '500' },
  menuArrow: { fontSize: 22, color: '#A0ADA0' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 54 },
  signOutButton: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDEAEA',
  },
  signOutText: { color: '#E05252', fontSize: 16, fontWeight: '600' },
  footer: {
    textAlign: 'center', color: '#A0ADA0',
    fontSize: 12, marginTop: 24,
  },
})