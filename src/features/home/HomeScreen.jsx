import React, {useState ,useCallback, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, StatusBar, Modal, Alert
} from 'react-native'
import { collection, query, where, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useApp } from '../../context/AppContext'
import { useFocusEffect } from '@react-navigation/native'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#E07A2F', bg: '#FFF4EB' },
  in_progress: { label: 'In Progress', color: '#2F6AE0', bg: '#EBF0FD' },
  resolved: { label: 'Resolved', color: '#27AE60', bg: '#EDFAF3' },
  rejected: { label: 'Rejected', color: '#E05252', bg: '#FDEAEA' },
}

export default function HomeScreen({ navigation }) {
  const { currentUser } = useApp()
  const [counts, setCounts] = useState({ pending: 0, in_progress: 0, resolved: 0 })
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [showNoti, setShowNoti] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [markingRead, setMarkingRead] = useState(false)
  const shownNotificationIds = useRef(new Set())

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

      // Check for new unread notifications and show alert only once
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

 useFocusEffect(
  useCallback(() => {
    fetchData()
  }, [])
)

  const fetchData = async () => {
    try {
      const q = query(
        collection(db, 'reports'),
        where('createdBy', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setCounts({
        pending: reports.filter(r => r.status === 'pending').length,
        in_progress: reports.filter(r => r.status === 'in_progress').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
      })
      setRecentReports(reports.slice(0, 3))
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#ebfdf6" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.name}>{currentUser?.name || 'User'}</Text>
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

      {/* Status Cards */}
      <Text style={styles.sectionTitle}>Report Status</Text>
      <View style={styles.cardRow}>
        <View style={[styles.card, { backgroundColor: '#FFF4EB' }]}>
          <Text style={[styles.cardCount, { color: '#E07A2F' }]}>{counts.pending}</Text>
          <Text style={styles.cardLabel}>Pending</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#EBF0FD' }]}>
          <Text style={[styles.cardCount, { color: '#2F6AE0' }]}>{counts.in_progress}</Text>
          <Text style={styles.cardLabel}>In Progress</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#EDFAF3' }]}>
          <Text style={[styles.cardCount, { color: '#27AE60' }]}>{counts.resolved}</Text>
          <Text style={styles.cardLabel}>Resolved</Text>
        </View>
      </View>

      {/* Report Button */}
      <TouchableOpacity style={styles.reportButton} onPress={() => navigation.navigate('CreateReport')}>
        <View style={styles.reportButtonLeft}>
          <Text style={styles.reportButtonIcon}>📝</Text>
          <View>
            <Text style={styles.reportButtonTitle}>Report New Issue</Text>
            <Text style={styles.reportButtonSub}>Take a photo & submit</Text>
          </View>
        </View>
        <Text style={styles.reportButtonArrow}>›</Text>
      </TouchableOpacity>

      {/* Recent Reports */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyReports')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#2D7A5F" style={{ marginTop: 20 }} />
      ) : recentReports.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No Reports Yet</Text>
          <Text style={styles.emptySubText}>Tap Report New Issue to get started</Text>
        </View>
      ) : (
        <View style={styles.reportList}>
          {recentReports.map((report) => {
            const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending
            return (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
              >
                <View style={styles.reportCardLeft}>
                  <Text style={styles.reportCategory}>{report.categoryIcon || '📋'}</Text>
                </View>
                <View style={styles.reportCardMiddle}>
                  <Text style={styles.reportTitle} numberOfLines={1}>{report.category}</Text>
                  <Text style={styles.reportDesc} numberOfLines={1}>{report.description}</Text>
                  <Text style={styles.reportDate}>
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-GB') : ''}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      <View style={{ height: 30 }} />

      {/* Notification Modal */}
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
                  onPress={() => { setShowNoti(false); navigation.navigate('ReportDetail', { reportId: n.reportId }) }}
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ebfdf6', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24,
  },
  greeting: { fontSize: 16, color: '#6B7C6B' },
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
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingRight: 24,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '600', color: '#1A2E1A',
    marginTop: 24, marginBottom: 12, paddingHorizontal: 24,
  },
  seeAll: { color: '#2D7A5F', fontSize: 14, fontWeight: '600', marginTop: 12 },
  cardRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 10 },
  card: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  cardCount: { fontSize: 32, fontWeight: '800' },
  cardLabel: { fontSize: 11, color: '#6B7C6B', marginTop: 4, textAlign: 'center' },
  reportButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2D7A5F', borderRadius: 16, padding: 20,
    marginHorizontal: 24, marginTop: 24,
  },
  reportButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  reportButtonIcon: { fontSize: 28 },
  reportButtonTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  reportButtonSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  reportButtonArrow: { fontSize: 28, color: '#fff' },
  reportList: { paddingHorizontal: 24, gap: 10 },
  reportCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E8EEE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, gap: 12,
  },
  reportCardLeft: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#ebfdf6', justifyContent: 'center', alignItems: 'center',
  },
  reportCategory: { fontSize: 22 },
  reportCardMiddle: { flex: 1 },
  reportTitle: { fontSize: 15, fontWeight: '600', color: '#1A2E1A' },
  reportDesc: { fontSize: 13, color: '#6B7C6B', marginTop: 2 },
  reportDate: { fontSize: 11, color: '#A0ADA0', marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1A2E1A' },
  emptySubText: { fontSize: 13, color: '#6B7C6B', marginTop: 4 },
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