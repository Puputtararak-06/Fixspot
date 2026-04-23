import React, { useState } from 'react'
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, StatusBar 
} from 'react-native'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'

// ✨ นำเข้าตัวช่วยจาก Context และ Service
import { useApp } from '../../context/AppContext' 
import { logoutUser } from '../../services/authService'

export default function PDPAScreen({ navigation, route }) {
  const { userId } = route.params 
  const [loading, setLoading] = useState(false)
  const { updateCurrentUser } = useApp() // ✨ แก้ตัวสะกดเป็น U ใหญ่

  const handleAccept = async () => {
    setLoading(true)
    try {
      // 1. ✨ อัปเดตสถานะใน Firestore
      await updateDoc(doc(db, 'users', userId), { 
        pdpaAccepted: true,
        pdpaAcceptedAt: new Date().toISOString()
      })

      // 2. ✨ สั่ง Logout ทันทีเพื่อทำลาย Session การสมัคร
      await logoutUser() 
      
      // 3. ✨ เคลียร์ข้อมูลในเครื่องให้เป็น null 
      // เพื่อให้ AppNavigator ดีดกลับไปหน้า Login อัตโนมัติ
      updateCurrentUser(null) 
      
      Alert.alert(
        'สำเร็จ ✅', 
        'ขอบคุณที่ยอมรับข้อตกลงการใช้งาน กรุณาเข้าสู่ระบบใหม่อีกครั้ง', 
        [
          { 
            text: 'ไปหน้า Login', 
            onPress: () => {
              // ✨ ล้างประวัติหน้าจอทั้งหมดแล้วกลับไปที่ Login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } 
          }
        ],
        { cancelable: false } // บังคับให้กดปุ่มเท่านั้น
      )
    } catch (e) {
      console.log("PDPA Error:", e)
      Alert.alert('Error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>นโยบายความเป็นส่วนตัว</Text>
        <Text style={styles.headerSub}>Privacy Policy & Data Protection</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>การจัดเก็บและใช้งานข้อมูล (PDPA)</Text>
          <Text style={styles.text}>
            แอปพลิเคชัน <Text style={{fontWeight: '700'}}>FixSpot</Text> มีความจำเป็นต้องขออนุญาตจัดเก็บและใช้งานข้อมูลของท่านเพื่อประสิทธิภาพในการแจ้งซ่อม ดังนี้:
          </Text>

          {/* ... (ส่วน Point ต่างๆ เหมือนเดิมของนายเลย กริ๊บอยู่แล้ว) ... */}
          <View style={styles.point}>
            <Text style={styles.pointIcon}>📍</Text>
            <View style={{flex: 1}}>
              <Text style={styles.pointTitle}>ข้อมูลตำแหน่ง (Location Data)</Text>
              <Text style={styles.pointText}>ใช้ระบุพิกัดของปัญหาที่ท่านแจ้ง เพื่อให้เจ้าหน้าที่เข้าถึงพื้นที่ได้อย่างแม่นยำ</Text>
            </View>
          </View>

          <View style={styles.point}>
            <Text style={styles.pointIcon}>📸</Text>
            <View style={{flex: 1}}>
              <Text style={styles.pointTitle}>รูปภาพ (Photos)</Text>
              <Text style={styles.pointText}>รูปภาพความเสียหายที่ท่านอัปโหลด จะถูกนำมาใช้เพื่อวิเคราะห์และเป็นหลักฐานในการดำเนินการซ่อมแซม</Text>
            </View>
          </View>

          <View style={styles.point}>
            <Text style={styles.pointIcon}>⏳</Text>
            <View style={{flex: 1}}>
              <Text style={styles.pointTitle}>ระยะเวลาการจัดเก็บข้อมูล</Text>
              <Text style={styles.pointText}>ข้อมูลการแจ้งซ่อมและประวัติทั้งหมด จะถูกจัดเก็บไว้เป็นเวลา 90 วัน เพื่อตรวจสอบและประเมินผล</Text>
            </View>
          </View>

          <View style={styles.point}>
            <Text style={styles.pointIcon}>👤</Text>
            <View style={{flex: 1}}>
              <Text style={styles.pointTitle}>ข้อมูลโปรไฟล์</Text>
              <Text style={styles.pointText}>ชื่อและอีเมลของท่านจะใช้เพื่อยืนยันตัวตนและการแจ้งเตือนเท่านั้น</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerNote}>
          * การกด "ยอมรับ" หมายถึงท่านยินยอมให้แอปเข้าถึงข้อมูลตามระบุไว้ข้างต้น
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.7 }]} 
          onPress={handleAccept}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>ยอมรับและดำเนินการต่อ</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F5' },
  header: { backgroundColor: '#ebfdf6', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A2E1A' },
  headerSub: { fontSize: 14, color: '#6B7C6B', marginTop: 4 },
  content: { flex: 1, padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E8EEE8' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2D7A5F', marginBottom: 12 },
  text: { fontSize: 15, color: '#1A2E1A', lineHeight: 22, marginBottom: 20 },
  point: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  pointIcon: { fontSize: 20 },
  pointTitle: { fontSize: 15, fontWeight: '700', color: '#1A2E1A' },
  pointText: { fontSize: 14, color: '#6B7C6B', lineHeight: 20, marginTop: 2 },
  footerNote: { padding: 20, fontSize: 12, color: '#A0ADA0', textAlign: 'center', lineHeight: 18 },
  footer: { padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E8EEE8' },
  button: { backgroundColor: '#2D7A5F', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})