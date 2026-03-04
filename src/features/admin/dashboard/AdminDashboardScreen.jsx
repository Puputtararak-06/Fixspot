import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, StatusBar, TouchableOpacity, Modal, Alert
} from 'react-native'
import { collection, getDocs, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { useApp } from '../../../context/AppContext'
import { useFocusEffect } from '@react-navigation/native'

export default function AdminDashboardScreen({ navigation }) {
  const { currentUser } = useApp()
  const [stats, setStats] = useState({
    total: 0, pending: 0, in_progress: 0, resolved: 0, rejected: 0, totalUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [reportsLoading, setReportsLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [showNoti, setShowNoti] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [allReports, setAllReports] = useState([])
  const [filterStatus, setFilterStatus] = useState('pending')
  const [markingRead, setMarkingRead] = useState(false)
  const shownNotificationIds = useRef(new Set())

  // Set up real-time listener for reports
  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setAllReports(data)
      setReportsLoading(false)
    }, (error) => {
      console.log('Reports listener error:', error)
      setReportsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchStats()
    }, [])
  )

  // Set up real-time listener for notifications
  useEffect(() => {
    if (!currentUser?.uid) return

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)

      // Check for new unread notifications that haven't been shown yet
      const unreadNotifications = data.filter(n => !n.read)
      if (unreadNotifications.length > 0) {
        const latestNoti = unreadNotifications[0]
        // Only show alert if this notification hasn't been shown before
        if (!shownNotificationIds.current.has(latestNoti.id)) {
          Alert.alert('📬 New Notification', latestNoti.message)
          shownNotificationIds.current.add(latestNoti.id)
        }
      }
    }, (error) => console.log('Notification listener error:', error))

    return () => unsubscribe()
  }, [currentUser?.uid])

  const fetchStats = async () => {
    try {
      const reportsSnap = await getDocs(collection(db, 'reports'))
      const reports = reportsSnap.docs.map(d => d.data())

      const usersSnap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'user'))
      )

      setStats({
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        in_progress: reports.filter(r => r.status === 'in_progress').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
        totalUsers: usersSnap.size,
      })
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    setMarkingRead(true)
    try {
      const unread = notifications.filter(n => !n.read)
      for (const n of unread) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true })
      }
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) {
      console.log(e)
    } finally {
      setMarkingRead(false)
    }
  }

  const cards = [
    { label: 'Total Reports', count: stats.total, color: '#2D7A5F', bg: '#ebfdf6' },
    { label: 'Pending', count: stats.pending, color: '#E07A2F', bg: '#FFF4EB' },
    { label: 'In Progress', count: stats.in_progress, color: '#2F6AE0', bg: '#EBF0FD' },
    { label: 'Resolved', count: stats.resolved, color: '#27AE60', bg: '#EDFAF3' },
    { label: 'Rejected', count: stats.rejected, color: '#E05252', bg: '#FDEAEA' },
    { label: 'Total Users', count: stats.totalUsers, color: '#8B5CF6', bg: '#F3F0FF' },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel 🛡️</Text>
          <Text style={styles.name}>{currentUser?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.notiButton}
          onPress={() => { setShowNoti(true); markAllRead() }}
          disabled={markingRead}
        >
          <Text style={styles.notiIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.notiBadge}>
              <Text style={styles.notiBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      {loading ? (
        <ActivityIndicator color="#2D7A5F" style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.cardGrid}>
          {cards.map((card, index) => (
            <View key={index} style={[styles.card, { backgroundColor: card.bg }]}>
              <Text style={[styles.cardCount, { color: card.color }]}>{card.count}</Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />

      {/* Recent Reports Section */}
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tasks</Text>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'pending' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'pending' && styles.filterButtonTextActive
            ]}>
              🔵 New Task
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterStatus === 'in_progress' && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus('in_progress')}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === 'in_progress' && styles.filterButtonTextActive
            ]}>
              🟡 In Progress
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reports List */}
        {reportsLoading ? (
          <ActivityIndicator color="#2D7A5F" style={{ marginTop: 20 }} />
        ) : (
          (() => {
            const filteredReports = allReports.filter(r => r.status === filterStatus)
            return filteredReports.length === 0 ? (
              <View style={styles.emptyReports}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No {filterStatus === 'pending' ? 'new' : 'in progr ess'} tasks</Text>
              </View>
            ) : (
              <View style={styles.reportsList}>
                {filteredReports.map((report) => (
                  <TouchableOpacity
                    key={report.id}
                    style={styles.reportCard}
                    onPress={() => navigation.navigate('ReportModeration', { reportId: report.id })}
                  >
                    <Text style={styles.reportCardIcon}>{report.categoryIcon || '📋'}</Text>
                    <View style={styles.reportCardContent}>
                      <Text style={styles.reportCardTitle} numberOfLines={1}>
                        {report.category}
                      </Text>
                      <Text style={styles.reportCardDesc} numberOfLines={2}>
                        {report.description}
                      </Text>
                      <Text style={styles.reportCardUser}>
                        {report.createdByName || 'Unknown'}
                      </Text>
                    </View>
                    <Text style={styles.reportCardArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          })()
        )}
      </View>

      <View style={{ height: 40 }} />
      <Modal visible={showNoti} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNoti(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {notifications.length === 0 ? (
              <View style={styles.notiEmpty}>
                <Text style={styles.notiEmptyIcon}>🔕</Text>
                <Text style={styles.notiEmptyText}>No notifications yet</Text>
              </View>
            ) : (
              notifications.map(n => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.notiItem, !n.read && styles.notiItemUnread]}
                  onPress={() => {
                    setShowNoti(false)
                    if (n.reportId) {
                      navigation.navigate('ReportModeration', { reportId: n.reportId })
                    }
                  }}
                >
                  <Text style={styles.notiItemIcon}>{n.categoryIcon || '📋'}</Text>
                  <View style={styles.notiItemContent}>
                    <Text style={styles.notiItemText}>{n.message}</Text>
                    <Text style={styles.notiItemDate}>
                      {new Date(n.createdAt).toLocaleDateString('en-GB')}
                    </Text>
                  </View>
                  {!n.read && <View style={styles.notiDot} />}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ebfdf6',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  greeting: { fontSize: 14, color: '#6B7C6B' },
  name: { fontSize: 22, fontWeight: '700', color: '#1A2E1A', marginTop: 2 },
  notiButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  notiIcon: { fontSize: 22 },
  notiBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#E05252', justifyContent: 'center', alignItems: 'center',
  },
  notiBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  sectionTitle: {
    fontSize: 16, fontWeight: '600', color: '#1A2E1A',
    marginTop: 24, marginBottom: 12, paddingHorizontal: 24,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  cardGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10,
  },
  card: {
    width: '47%', borderRadius: 16,
    padding: 16, alignItems: 'center',
  },
  cardCount: { fontSize: 36, fontWeight: '800' },
  cardLabel: { fontSize: 13, color: '#6B7C6B', marginTop: 4, textAlign: 'center' },
  filterRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginBottom: 12,
  },
  filterButton: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#E8EEE8',
    backgroundColor: '#fff', alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2D7A5F', borderColor: '#2D7A5F',
  },
  filterButtonText: { fontSize: 13, fontWeight: '600', color: '#6B7C6B' },
  filterButtonTextActive: { color: '#fff' },
  reportsList: { paddingHorizontal: 24, gap: 10, marginBottom: 12 },
  reportCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#E8EEE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  reportCardIcon: { fontSize: 24, marginRight: 10 },
  reportCardContent: { flex: 1 },
  reportCardTitle: { fontSize: 14, fontWeight: '600', color: '#1A2E1A' },
  reportCardDesc: { fontSize: 12, color: '#6B7C6B', marginTop: 4 },
  reportCardUser: { fontSize: 11, color: '#A0ADA0', marginTop: 4 },
  reportCardArrow: { fontSize: 20, color: '#A0ADA0' },
  emptyReports: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7C6B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '70%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A2E1A' },
  modalClose: { fontSize: 20, color: '#6B7C6B' },
  notiEmpty: { alignItems: 'center', paddingVertical: 40 },
  notiEmptyIcon: { fontSize: 40, marginBottom: 10 },
  notiEmptyText: { fontSize: 15, color: '#6B7C6B' },
  notiItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  notiItemUnread: { backgroundColor: '#F8FFFC', borderRadius: 10, paddingHorizontal: 8 },
  notiItemIcon: { fontSize: 24 },
  notiItemContent: { flex: 1 },
  notiItemText: { fontSize: 14, color: '#1A2E1A', lineHeight: 20 },
  notiItemDate: { fontSize: 12, color: '#A0ADA0', marginTop: 2 },
  notiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D7A5F' },
})