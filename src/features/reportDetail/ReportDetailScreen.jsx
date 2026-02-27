import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, StatusBar, Alert
} from 'react-native'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useApp } from '../../context/AppContext'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#E07A2F', bg: '#FFF4EB' },
  in_progress: { label: 'In Progress', color: '#2F6AE0', bg: '#EBF0FD' },
  resolved: { label: 'Resolved', color: '#27AE60', bg: '#EDFAF3' },
  rejected: { label: 'Rejected', color: '#E05252', bg: '#FDEAEA' },
}

export default function ReportDetailScreen({ navigation, route }) {
  const { reportId } = route.params
  const { currentUser } = useApp()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const docRef = doc(db, 'reports', reportId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setReport({ id: docSnap.id, ...docSnap.data() })
      }
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }

  const handleDelete = () => {
    Alert.alert('Delete Report', 'Are you sure you want to delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'reports', reportId))
          navigation.goBack()
        }
      }
    ])
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#2D7A5F" />
      </View>
    )
  }

  if (!report) {
    return (
      <View style={styles.loadingBox}>
        <Text style={{ color: '#6B7C6B' }}>Report not found</Text>
      </View>
    )
  }

  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending
  const canDelete = report.status === 'pending'

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>● {status.label}</Text>
        </View>

        {/* Category */}
        <View style={styles.categoryRow}>
          <Text style={styles.categoryIcon}>{report.categoryIcon || '📋'}</Text>
          <Text style={styles.categoryLabel}>{report.category}</Text>
        </View>

        {/* Image */}
        {report.imageUrl && (
          <View>
            <Text style={styles.imageLabel}>Issue Photo</Text>
            <Image source={{ uri: report.imageUrl }} style={styles.image} />
          </View>
        )}

        {/* Completion Photo — resolved only */}
        {report.status === 'resolved' && report.completionImage && (
          <View>
            <Text style={styles.imageLabel}>✅ Completion Photo</Text>
            <Image source={{ uri: report.completionImage }} style={styles.image} />
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.sectionValue}>{report.description}</Text>
        </View>

        {/* Location */}
        {report.location && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            <Text style={styles.sectionValue}>
              📍 {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Submitted</Text>
          <Text style={styles.sectionValue}>
            {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            }) : '-'}
          </Text>
        </View>

        {/* Admin Note */}
        {report.adminNote ? (
          <View style={styles.adminNoteBox}>
            <Text style={styles.adminNoteLabel}>🛡️ Admin Note</Text>
            <Text style={styles.adminNoteValue}>{report.adminNote}</Text>
          </View>
        ) : null}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Status Timeline</Text>
          <View style={styles.timeline}>
            {['pending', 'in_progress', 'resolved'].map((s, index) => {
              const statuses = ['pending', 'in_progress', 'resolved', 'rejected']
              const currentIndex = statuses.indexOf(report.status)
              const stepIndex = statuses.indexOf(s)
              const isActive = report.status === 'rejected'
                ? s === 'pending'
                : stepIndex <= currentIndex
              return (
                <View key={s} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, isActive && styles.timelineDotActive]} />
                  {index < 2 && <View style={[styles.timelineLine, isActive && styles.timelineLineActive]} />}
                  <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>
                    {STATUS_CONFIG[s]?.label}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Delete Button — pending only */}
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>🗑️ Delete Report</Text>
          </TouchableOpacity>
        )}

      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ebfdf6',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: '#2D7A5F', lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A2E1A' },
  content: { padding: 24 },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  statusText: { fontSize: 14, fontWeight: '600' },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 16,
  },
  categoryIcon: { fontSize: 32 },
  categoryLabel: { fontSize: 22, fontWeight: '700', color: '#1A2E1A' },
  imageLabel: { fontSize: 13, color: '#6B7C6B', fontWeight: '600', marginBottom: 8 },
  image: {
    width: '100%', height: 220,
    borderRadius: 16, marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14, padding: 16,
    marginBottom: 12,
    borderWidth: 1, borderColor: '#E8EEE8',
  },
  sectionLabel: { fontSize: 12, color: '#A0ADA0', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionValue: { fontSize: 15, color: '#1A2E1A', lineHeight: 22 },
  adminNoteBox: {
    backgroundColor: '#ebfdf6',
    borderRadius: 14, padding: 16,
    marginBottom: 12,
    borderWidth: 1, borderColor: '#2D7A5F',
  },
  adminNoteLabel: { fontSize: 13, color: '#2D7A5F', fontWeight: '700', marginBottom: 6 },
  adminNoteValue: { fontSize: 15, color: '#1A2E1A', lineHeight: 22 },
  timeline: { marginTop: 8, gap: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#E8EEE8',
    borderWidth: 2, borderColor: '#E8EEE8',
  },
  timelineDotActive: { backgroundColor: '#2D7A5F', borderColor: '#2D7A5F' },
  timelineLine: { width: 2, height: 24, backgroundColor: '#E8EEE8', marginLeft: 5 },
  timelineLineActive: { backgroundColor: '#2D7A5F' },
  timelineLabel: { fontSize: 14, color: '#A0ADA0' },
  timelineLabelActive: { color: '#2D7A5F', fontWeight: '600' },
  deleteButton: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 14, padding: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#FDEAEA',
  },
  deleteText: { color: '#E05252', fontSize: 15, fontWeight: '600' },
})