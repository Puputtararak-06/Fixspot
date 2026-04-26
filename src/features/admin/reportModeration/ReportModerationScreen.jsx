import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image, StatusBar, Modal
} from 'react-native'
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import { useApp } from '../../../context/AppContext'
import * as ImagePicker from 'expo-image-picker'
import { uploadImage } from '../../../services/cloudinaryService'

export default function ReportModerationScreen({ navigation, route }) {
  const { reportId } = route.params
  const { currentUser } = useApp()
  const [report, setReport] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completionImage, setCompletionImage] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'reports', reportId))
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() }
        setReport(data)
        setAdminNote(data.adminNote || '')
      }
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled) {
        setCompletionImage(result.assets[0].uri)
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const takePhoto = async () => {
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync()
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera permission is required')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled) {
        setCompletionImage(result.assets[0].uri)
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const createNotification = async (userId, status, message) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        reportId,
        category: report.category,
        categoryIcon: report.categoryIcon || '📋',
        newStatus: status,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      })
    } catch (e) {
      console.log('Notification error:', e)
    }
  }

  const markNotificationAsRead = async () => {
    try {
      // Mark all notifications for this report as read
      const q = query(
        collection(db, 'notifications'),
        where('reportId', '==', reportId)
      )
      const snapshot = await getDocs(q)
      for (const docSnap of snapshot.docs) {
        await updateDoc(docSnap.ref, { read: true })
      }
    } catch (e) {
      console.log('Error marking notification as read:', e)
    }
  }

  const handleStartTask = () => {
    Alert.alert(
      '🚀 Start Task',
      'Confirm to start working on this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Task',
          style: 'default',
          onPress: async () => {
            setSaving(true)
            try {
              await updateDoc(doc(db, 'reports', reportId), {
                status: 'in_progress',
                adminNote: adminNote,
                updatedAt: new Date().toISOString(),
              })

              await createNotification(
                report.createdBy,
                'in_progress',
                `Your report "${report.category}" has been started. We're working on it!`
              )
              Alert.alert('Success ✅', 'Task started!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ])
            } catch (e) {
              Alert.alert('Error', 'Failed to start task')
              console.log(e)
            }
            setSaving(false)
          }
        }
      ]
    )
  }

  const handleReject = () => {
    Alert.alert(
      '❌ Reject Report',
      'Confirm to reject this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setSaving(true)
            try {
              await updateDoc(doc(db, 'reports', reportId), {
                status: 'rejected',
                adminNote: adminNote,
                updatedAt: new Date().toISOString(),
              })

              await createNotification(
                report.createdBy,
                'rejected',
                `Your report "${report.category}" has been rejected. Admin note: ${adminNote || 'No note provided'}`
              )
              Alert.alert('Success ✅', 'Report rejected!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ])
            } catch (e) {
              Alert.alert('Error', 'Failed to reject report')
              console.log(e)
            }
            setSaving(false)
          }
        }
      ]
    )
  }

  const handleMarkAsDone = () => {
    if (!completionImage) {
      Alert.alert('Error', 'Please upload a completion photo first')
      return
    }

    Alert.alert(
      '✅ Mark as Done',
      'Confirm to mark this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Done',
          style: 'default',
          onPress: async () => {
            setUploading(true)
            try {
              // Upload completion image
              const uploadedUrl = await uploadImage(completionImage)

              await updateDoc(doc(db, 'reports', reportId), {
                status: 'resolved',
                adminNote: adminNote,
                completionImage: uploadedUrl,
                resolvedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })

              await createNotification(
                report.createdBy,
                'resolved',
                `Your report "${report.category}" has been resolved! Check the completion photo.`
              )
              Alert.alert('Success ✅', 'Task marked as done!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ])
            } catch (e) {
              Alert.alert('Error', 'Failed to mark as done')
              console.log(e)
            }
            setUploading(false)
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#2D7A5F" />
      </View>
    )
  }

  const isPending = report?.status === 'pending'
  const isInProgress = report?.status === 'in_progress'

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} scrollEnabled={true}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>

        {/* Report Info */}
        <View style={styles.infoBox}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryIcon}>{report.categoryIcon || '📋'}</Text>
            <View>
              <Text style={styles.categoryLabel}>{report.category}</Text>
              <Text style={styles.reportedBy}>by {report.createdByName}</Text>
            </View>
          </View>
          <Text style={styles.description}>{report.description}</Text>
          {report.location && (
            <Text style={styles.location}>
              📍 {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
            </Text>
          )}
          <Text style={styles.date}>
            {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            }) : ''}
          </Text>
        </View>

        {/* Original Image */}
        {report.imageUrl && (
          <View>
            <Text style={styles.label}>Original Issue Photo</Text>
            <Image source={{ uri: report.imageUrl }} style={styles.image} />
          </View>
        )}

        {/* Completion Photo Section (In Progress Only) */}
        {isInProgress && (
          <View>
            <Text style={styles.label}>Completion Photo</Text>
            <Text style={styles.helperText}>Upload a photo showing the completed work</Text>

            {completionImage ? (
              <View>
                <Image source={{ uri: completionImage }} style={styles.image} />
                <View style={styles.photoButtonGroup}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={takePhoto}
                  >
                    <Text style={styles.photoButtonText}>📷 Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.photoButtonText}>🖼️ Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.photoButtonGroup}>
                <TouchableOpacity
                  style={[styles.photoButton, styles.photoButtonLarge]}
                  onPress={takePhoto}
                >
                  <Text style={styles.photoButtonText}>📷 Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoButton, styles.photoButtonLarge]}
                  onPress={pickImage}
                >
                  <Text style={styles.photoButtonText}>🖼️ Pick from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Admin Note */}
        <Text style={styles.label}>Admin Note</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Add a note for the user (optional)..."
          placeholderTextColor="#A0ADA0"
          value={adminNote}
          onChangeText={setAdminNote}
          multiline
          numberOfLines={4}
        />

        {/* Status-specific Action Buttons */}
        {isPending && (
          <>
            <Text style={styles.sectionLabel}>Actions</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={handleReject}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#E05252" />
                ) : (
                  <Text style={styles.rejectButtonText}>❌ Reject</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={handleStartTask}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.startButtonText}>▶️ Start Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {isInProgress && (
          <TouchableOpacity
            style={[styles.button, styles.doneButton]}
            onPress={handleMarkAsDone}
            disabled={uploading || !completionImage}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.doneButtonText}>✅ Mark as Done</Text>
            )}
          </TouchableOpacity>
        )}

      </View>
      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F5F7F5' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ebfdf6',
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: '#2D7A5F', lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A2E1A' },
  content: { padding: 24 },
  infoBox: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E8EEE8',
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryIcon: { fontSize: 28 },
  categoryLabel: { fontSize: 17, fontWeight: '700', color: '#1A2E1A' },
  reportedBy: { fontSize: 13, color: '#6B7C6B' },
  description: { fontSize: 14, color: '#1A2E1A', lineHeight: 20, marginBottom: 8 },
  location: { fontSize: 13, color: '#6B7C6B', marginBottom: 4 },
  date: { fontSize: 12, color: '#A0ADA0' },
  image: { width: '100%', height: 200, borderRadius: 16, marginBottom: 20 },
  label: {
    fontSize: 15, fontWeight: '600', color: '#1A2E1A',
    marginBottom: 10, marginTop: 8,
  },
  sectionLabel: {
    fontSize: 15, fontWeight: '600', color: '#1A2E1A',
    marginBottom: 12, marginTop: 16,
  },
  helperText: {
    fontSize: 13, color: '#6B7C6B', marginBottom: 12,
  },
  noteInput: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, fontSize: 15, color: '#1A2E1A',
    borderWidth: 1, borderColor: '#E8EEE8',
    height: 120, textAlignVertical: 'top',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#ebfdf6', borderRadius: 14,
    paddingVertical: 20, alignItems: 'center',
    borderWidth: 2, borderColor: '#2D7A5F',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  uploadButtonText: {
    color: '#2D7A5F', fontSize: 16, fontWeight: '600',
  },
  photoButtonGroup: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  photoButton: {
    flex: 1, backgroundColor: '#2D7A5F', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  photoButtonLarge: {
    paddingVertical: 16,
  },
  photoButtonText: {
    color: '#fff', fontSize: 15, fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row', gap: 12, marginBottom: 20,
  },
  button: {
    flex: 1, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E05252',
  },
  rejectButtonText: {
    color: '#E05252', fontSize: 16, fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#2D7A5F',
  },
  startButtonText: {
    color: '#fff', fontSize: 16, fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 16,
  },
  doneButtonText: {
    color: '#fff', fontSize: 17, fontWeight: '600',
  },
})
