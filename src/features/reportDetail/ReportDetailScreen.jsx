import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, StatusBar, Alert, TextInput
} from 'react-native'
import { doc, getDoc, deleteDoc, collection, addDoc, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useApp } from '../../context/AppContext'
import * as ImagePicker from 'expo-image-picker'
import { uploadImage } from '../../services/cloudinaryService'

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
  const [deleting, setDeleting] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentImage, setCommentImage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [])

  useEffect(() => {
    // Real-time listener for comments
    const q = query(
      collection(db, 'reports', reportId, 'comments'),
      orderBy('createdAt', 'asc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setComments(data)
    }, (error) => console.log('Comments listener error:', error))

    return () => unsubscribe()
  }, [reportId])

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
          setDeleting(true)
          try {
            // Delete all notifications for this report
            const q = query(
              collection(db, 'notifications'),
              where('reportId', '==', reportId)
            )
            const snapshot = await getDocs(q)
            for (const docSnap of snapshot.docs) {
              await deleteDoc(docSnap.ref)
            }

            // Delete the report
            await deleteDoc(doc(db, 'reports', reportId))
            navigation.goBack()
          } catch (e) {
            Alert.alert('Error', 'Failed to delete report')
            console.log(e)
            setDeleting(false)
          }
        }
      }
    ])
  }

  const pickCommentImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    })
    if (!result.canceled) {
      setCommentImage(result.assets[0].uri)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment')
      return
    }

    setSubmitting(true)
    try {
      let imageUrl = null
      if (commentImage) {
        imageUrl = await uploadImage(commentImage)
      }

      await addDoc(collection(db, 'reports', reportId, 'comments'), {
        text: commentText.trim(),
        imageUrl,
        userId: currentUser.uid,
        userName: currentUser.name,
        userRole: currentUser.role || 'user',
        createdAt: new Date().toISOString(),
      })

      // Reset form
      setCommentText('')
      setCommentImage(null)
      Alert.alert('Success', 'Comment added!')
    } catch (e) {
      Alert.alert('Error', 'Failed to add comment')
      console.log(e)
    } finally {
      setSubmitting(false)
    }
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

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>💬 Comments ({comments.length})</Text>
          {comments.length === 0 ? (
            <Text style={styles.emptyText}>No comments yet</Text>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.userName}</Text>
                    <Text style={styles.commentRole}>{comment.userRole === 'admin' ? '🛡️ Admin' : '👤 User'}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  {comment.imageUrl && (
                    <Image source={{ uri: comment.imageUrl }} style={styles.commentImage} />
                  )}
                  <Text style={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString('en-GB')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Comment Input Form */}
        <View style={styles.commentFormBox}>
          <Text style={styles.sectionLabel}>Add a Comment</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Write your comment..."
            placeholderTextColor="#A0ADA0"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            numberOfLines={3}
            maxLength={300}
          />
          <Text style={styles.charCount}>{commentText.length}/300</Text>

          {commentImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: commentImage }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImage} onPress={() => setCommentImage(null)}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.imageButton} onPress={pickCommentImage} disabled={submitting}>
              <Text style={styles.imageButtonText}>📷 Add Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitCommentButton, submitting && { opacity: 0.7 }]}
              onPress={handleAddComment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitCommentText}>Send 📤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

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
          <TouchableOpacity
            style={[styles.deleteButton, deleting && { opacity: 0.7 }]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#E05252" />
            ) : (
              <Text style={styles.deleteText}>🗑️ Delete Report</Text>
            )}
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
  emptyText: { fontSize: 14, color: '#A0ADA0', fontStyle: 'italic' },
  commentsList: { gap: 12, marginTop: 8 },
  commentItem: {
    backgroundColor: '#F5F7F5', borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#2D7A5F',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1A2E1A' },
  commentRole: { fontSize: 11, color: '#6B7C6B' },
  commentText: { fontSize: 14, color: '#1A2E1A', lineHeight: 20, marginBottom: 6 },
  commentImage: { width: '100%', height: 150, borderRadius: 10, marginBottom: 8 },
  commentDate: { fontSize: 11, color: '#A0ADA0' },
  commentFormBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginTop: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#E8EEE8',
  },
  commentInput: {
    backgroundColor: '#F5F7F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#1A2E1A', height: 100, textAlignVertical: 'top',
    marginBottom: 4, borderWidth: 1, borderColor: '#E8EEE8',
  },
  charCount: { fontSize: 11, color: '#A0ADA0', textAlign: 'right', marginBottom: 12 },
  imagePreview: { marginBottom: 12, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: 120, borderRadius: 10 },
  removeImage: {
    position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  imageButton: {
    flex: 1, backgroundColor: '#ebfdf6', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#2D7A5F',
  },
  imageButtonText: { color: '#2D7A5F', fontSize: 13, fontWeight: '600' },
  submitCommentButton: {
    flex: 1, backgroundColor: '#2D7A5F', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center',
  },
  submitCommentText: { color: '#fff', fontSize: 13, fontWeight: '600' },
})