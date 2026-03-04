import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar, Alert
} from 'react-native'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { useApp } from '../../../context/AppContext'

export default function UserManagementScreen() {
  const { currentUser } = useApp()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [togglingRole, setTogglingRole] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setUsers(data)
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRole = (user) => {
    if (user.uid === currentUser.uid) {
      Alert.alert('Error', 'You cannot change your own role')
      return
    }
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    Alert.alert(
      'Change Role',
      `Change ${user.name} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setTogglingRole(true)
            setTogglingUserId(user.uid)
            try {
              await updateDoc(doc(db, 'users', user.uid), { role: newRole })
              setUsers(prev => prev.map(u =>
                u.uid === user.uid ? { ...u, role: newRole } : u
              ))
            } catch (e) {
              Alert.alert('Error', 'Failed to change role')
              console.log(e)
              setTogglingRole(false)
              setTogglingUserId(null)
            }
          }
        }
      ]
    )
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatarBox}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() || 'U'}
        </Text>
      </View>
      <View style={styles.cardMiddle}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.date}>
          Joined {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '-'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.roleBadge, item.role === 'admin' && styles.roleBadgeAdmin]}
        onPress={() => handleToggleRole(item)}
        disabled={togglingRole && togglingUserId === item.uid}
      >
        {togglingRole && togglingUserId === item.uid ? (
          <ActivityIndicator color={item.role === 'admin' ? '#8B5CF6' : '#2D7A5F'} size="small" />
        ) : (
          <Text style={[styles.roleText, item.role === 'admin' && styles.roleTextAdmin]}>
            {item.role === 'admin' ? '🛡️ Admin' : '👤 User'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <Text style={styles.headerCount}>{users.length} total</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#2D7A5F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  header: {
    backgroundColor: '#ebfdf6',
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A2E1A' },
  headerCount: { fontSize: 14, color: '#6B7C6B' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, gap: 12,
    borderWidth: 1, borderColor: '#E8EEE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatarBox: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#2D7A5F',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cardMiddle: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A2E1A' },
  email: { fontSize: 13, color: '#6B7C6B', marginTop: 2 },
  date: { fontSize: 11, color: '#A0ADA0', marginTop: 2 },
  roleBadge: {
    backgroundColor: '#ebfdf6', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#2D7A5F',
  },
  roleBadgeAdmin: { backgroundColor: '#F3F0FF', borderColor: '#8B5CF6' },
  roleText: { color: '#2D7A5F', fontSize: 12, fontWeight: '600' },
  roleTextAdmin: { color: '#8B5CF6' },
})