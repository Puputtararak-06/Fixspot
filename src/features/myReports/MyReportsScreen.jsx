import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar, Alert
} from 'react-native'
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useApp } from '../../context/AppContext'
import { useFocusEffect } from '@react-navigation/native'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#E07A2F', bg: '#FFF4EB' },
  in_progress: { label: 'In Progress', color: '#2F6AE0', bg: '#EBF0FD' },
  resolved: { label: 'Resolved', color: '#27AE60', bg: '#EDFAF3' },
  rejected: { label: 'Rejected', color: '#E05252', bg: '#FDEAEA' },
}

const FILTERS = ['All', 'pending', 'in_progress', 'resolved', 'rejected']
const FILTER_LABELS = {
  'All': 'All',
  'pending': 'Pending',
  'in_progress': 'In Progress',
  'resolved': 'Resolved',
  'rejected': 'Rejected',
}

export default function MyReportsScreen({ navigation }) {
  const { currentUser } = useApp()
  const [reports, setReports] = useState([])
  const [filtered, setFiltered] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useFocusEffect(
    useCallback(() => {
      fetchReports()
    }, [])
  )

  useEffect(() => {
    if (activeFilter === 'All') {
      setFiltered(reports)
    } else {
      setFiltered(reports.filter(r => r.status === activeFilter))
    }
  }, [activeFilter, reports])

  const fetchReports = async () => {
    try {
      const q = query(
        collection(db, 'reports'),
        where('createdBy', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setReports(data)
      setFiltered(data)
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (reportId) => {
    Alert.alert('Delete Report', 'Are you sure you want to delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          setDeletingId(reportId)
          try {
            await deleteDoc(doc(db, 'reports', reportId))
            setReports(prev => prev.filter(r => r.id !== reportId))
          } catch (e) {
            Alert.alert('Error', 'Failed to delete report')
            console.log(e)
            setDeleting(false)
            setDeletingId(null)
          }
        }
      }
    ])
  }

  const renderItem = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
    const canEdit = item.status === 'pending'

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardIcon}>{item.categoryIcon || '📋'}</Text>
          </View>
          <View style={styles.cardMiddle}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.category}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.cardDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {canEdit && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditReport', { reportId: item.id })}
            >
              <Text style={styles.editText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
              disabled={deleting && deletingId === item.id}
            >
              {deleting && deletingId === item.id ? (
                <ActivityIndicator color="#E05252" size="small" />
              ) : (
                <Text style={styles.deleteText}>🗑️ Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reports</Text>
        <Text style={styles.headerCount}>{filtered.length} reports</Text>
      </View>

      <View style={styles.filterContainer}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {FILTER_LABELS[filter]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#2D7A5F" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No reports found</Text>
        </View>
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
  filterContainer: {
    flexDirection: 'row', paddingHorizontal: 16,
    paddingVertical: 12, gap: 8, flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E8EEE8',
  },
  filterChipActive: { backgroundColor: '#2D7A5F', borderColor: '#2D7A5F' },
  filterText: { fontSize: 13, color: '#6B7C6B' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#E8EEE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardLeft: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#ebfdf6', justifyContent: 'center', alignItems: 'center',
  },
  cardIcon: { fontSize: 22 },
  cardMiddle: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A2E1A' },
  cardDesc: { fontSize: 13, color: '#6B7C6B', marginTop: 2 },
  cardDate: { fontSize: 11, color: '#A0ADA0', marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row', gap: 10,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  editButton: {
    flex: 1, backgroundColor: '#ebfdf6',
    borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#2D7A5F',
  },
  editText: { color: '#2D7A5F', fontSize: 14, fontWeight: '600' },
  deleteButton: {
    flex: 1, backgroundColor: '#fff',
    borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#FDEAEA',
  },
  deleteText: { color: '#E05252', fontSize: 14, fontWeight: '600' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6B7C6B' },
})