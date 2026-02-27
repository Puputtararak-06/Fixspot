import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar, TextInput
} from 'react-native'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../../services/firebase'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#E07A2F', bg: '#FFF4EB' },
  in_progress: { label: 'In Progress', color: '#2F6AE0', bg: '#EBF0FD' },
  resolved: { label: 'Resolved', color: '#27AE60', bg: '#EDFAF3' },
  rejected: { label: 'Rejected', color: '#E05252', bg: '#FDEAEA' },
}

const FILTERS = ['All', 'pending', 'in_progress', 'resolved', 'rejected']

export default function ManageReportsScreen({ navigation }) {
  const [reports, setReports] = useState([])
  const [filtered, setFiltered] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    let result = reports
    if (activeFilter !== 'All') {
      result = result.filter(r => r.status === activeFilter)
    }
    if (search) {
      result = result.filter(r =>
        r.category?.toLowerCase().includes(search.toLowerCase()) ||
        r.createdByName?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      )
    }
    setFiltered(result)
  }, [activeFilter, search, reports])

  const fetchReports = async () => {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setReports(data)
      setFiltered(data)
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }

  const renderItem = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ReportModeration', { reportId: item.id })}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardIcon}>{item.categoryIcon || '📋'}</Text>
          </View>
          <View style={styles.cardMiddle}>
            <Text style={styles.cardTitle}>{item.category}</Text>
            <Text style={styles.cardUser}>👤 {item.createdByName}</Text>
            <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
            <Text style={styles.cardDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Reports</Text>
        <Text style={styles.headerCount}>{filtered.length} reports</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by category, user, description..."
          placeholderTextColor="#A0ADA0"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === 'All' ? 'All' : STATUS_CONFIG[f]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#2D7A5F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
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
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 16,
    borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#E8EEE8', gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1A2E1A' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 8, flexWrap: 'wrap', marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E8EEE8',
  },
  filterChipActive: { backgroundColor: '#2D7A5F', borderColor: '#2D7A5F' },
  filterText: { fontSize: 12, color: '#6B7C6B' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#E8EEE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardLeft: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#ebfdf6',
    justifyContent: 'center', alignItems: 'center',
  },
  cardIcon: { fontSize: 22 },
  cardMiddle: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A2E1A' },
  cardUser: { fontSize: 12, color: '#6B7C6B', marginTop: 2 },
  cardDesc: { fontSize: 13, color: '#A0ADA0', marginTop: 2 },
  cardDate: { fontSize: 11, color: '#A0ADA0', marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
})