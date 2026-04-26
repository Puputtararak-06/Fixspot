import React, { useState } from 'react'
import { registerUser } from '../../services/authService'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar, ScrollView
} from 'react-native'

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

 const handleRegister = async () => {
    // 1. Validation (เหมือนเดิม)
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setError('')
    setLoading(true)

    try {
      // ✨ 2. เรียกสมัครสมาชิก "ครั้งเดียว" และเก็บค่า User ไว้
      await registerUser(email, password, name)
      
      

    } catch (e) {
      console.log("Register Error:", e)
      // เช็ค Error เฉพาะกรณีเมลซ้ำ
      if (e.code === 'auth/email-already-in-use') {
        setError('This email is already registered')
      } else {
        setError('An error occurred during registration')
      }
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#ebfdf6" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🔧</Text>
          </View>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.appSub}>FixSpot — Infrastructure Issue Reporting</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#A0ADA0" value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#A0ADA0" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput style={styles.input} placeholder="Password (min. 6 characters)" placeholderTextColor="#A0ADA0" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.inputIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#A0ADA0" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Sign Up</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Mae Fah Luang University • Facilities Management</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ebfdf6' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 80, height: 80, backgroundColor: '#2D7A5F', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: '#2D7A5F', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 26, fontWeight: '700', color: '#1A2E1A', letterSpacing: 0.5 },
  appSub: { fontSize: 13, color: '#6B7C6B', marginTop: 4, textAlign: 'center' },
  form: { gap: 12 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#E8EEE8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1A2E1A' },
  errorText: { color: '#E05252', fontSize: 13, textAlign: 'center' },
  registerButton: {
    backgroundColor: '#2D7A5F', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#2D7A5F', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  registerButtonText: { color: '#fff', fontSize: 17, fontWeight: '600', letterSpacing: 0.5 },
  loginText: { textAlign: 'center', color: '#6B7C6B', fontSize: 14, marginTop: 8 },
  loginLink: { color: '#2D7A5F', fontWeight: '600' },
  footer: { textAlign: 'center', color: '#A0ADA0', fontSize: 12, marginTop: 40 },
})