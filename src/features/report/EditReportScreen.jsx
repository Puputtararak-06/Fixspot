import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator,
  Alert, Image, StatusBar
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { uploadImage } from '../../services/cloudinaryService'

const CATEGORIES = [
  { icon: '💡', label: 'Street Lighting' },
  { icon: '🛣️', label: 'Road & Sidewalk' },
  { icon: '🚰', label: 'Water System' },
  { icon: '🗑️', label: 'Waste & Cleanliness' },
  { icon: '🚦', label: 'Traffic & Safety' },
  { icon: '🌳', label: 'Public Facilities' },
  { icon: '❓', label: 'Other' },
]

export default function EditReportScreen({ navigation, route }) {
  const { reportId } = route.params
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [categoryIcon, setCategoryIcon] = useState('')
  const [image, setImage] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'reports', reportId))
      if (docSnap.exists()) {
        const data = docSnap.data()
        setDescription(data.description || '')
        setCategory(data.category || '')
        setCategoryIcon(data.categoryIcon || '')
        setExistingImageUrl(data.imageUrl || null)
      }
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }

  const pickImage = async (useCamera) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Please allow access in settings')
      return
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 })
    if (!result.canceled) {
      setImage(result.assets[0].uri)
      setExistingImageUrl(null)
    }
  }

  const handleSave = async () => {
    if (!description || !category) {
      Alert.alert('Missing Information', 'Description and category are required')
      return
    }
    setSaving(true)
    try {
      let imageUrl = existingImageUrl
      if (image) {
        imageUrl = await uploadImage(image)
      }

      await updateDoc(doc(db, 'reports', reportId), {
        title: category,
        description,
        category,
        categoryIcon,
        imageUrl,
        updatedAt: new Date().toISOString(),
      })

      Alert.alert('Updated ✅', 'Report updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (e) {
      Alert.alert('Error', 'Failed to update report')
      console.log(e)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#2D7A5F" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>

        {/* Photo */}
        <Text style={styles.label}>Photo of Issue</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(true)}>
            <Text style={styles.photoIcon}>📷</Text>
            <Text style={styles.photoLabel}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(false)}>
            <Text style={styles.photoIcon}>🖼️</Text>
            <Text style={styles.photoLabel}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {(image || existingImageUrl) && (
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: image || existingImageUrl }}
              style={styles.previewImage}
            />
            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => { setImage(null); setExistingImageUrl(null) }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category */}
        <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.categoryItem, category === cat.label && styles.categoryItemActive]}
              onPress={() => { setCategory(cat.label); setCategoryIcon(cat.icon) }}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[
                styles.categoryLabel,
                category === cat.label && styles.categoryLabelActive
              ]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Briefly describe the issue..."
          placeholderTextColor="#A0ADA0"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={200}
        />
        <Text style={styles.charCount}>{description.length}/200</Text>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.saveIcon}>💾</Text>
              <Text style={styles.saveText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ebfdf6', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 28, color: '#2D7A5F', lineHeight: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A2E1A' },
  content: { padding: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#1A2E1A', marginBottom: 8, marginTop: 16 },
  required: { color: '#E05252' },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#E8EEE8', borderStyle: 'dashed',
  },
  photoIcon: { fontSize: 32, marginBottom: 8 },
  photoLabel: { fontSize: 14, color: '#6B7C6B', fontWeight: '500' },
  imagePreview: { marginTop: 12, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 14 },
  removeImage: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28,
    borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E8EEE8', gap: 6,
  },
  categoryItemActive: { backgroundColor: '#ebfdf6', borderColor: '#2D7A5F' },
  categoryIcon: { fontSize: 16 },
  categoryLabel: { fontSize: 12, color: '#6B7C6B', fontWeight: '500' },
  categoryLabelActive: { color: '#2D7A5F', fontWeight: '600' },
  input: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 16, color: '#1A2E1A',
    borderWidth: 1, borderColor: '#E8EEE8',
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#A0ADA0', textAlign: 'right', marginTop: 4 },
  saveButton: {
    backgroundColor: '#2D7A5F', borderRadius: 14, paddingVertical: 16, marginTop: 24,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#2D7A5F', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  saveIcon: { fontSize: 18 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '600' },
})