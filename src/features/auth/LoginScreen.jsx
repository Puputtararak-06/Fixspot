import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar
} from 'react-native'
import { loginUser, resetPassword } from '../../services/authService'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { role } = await loginUser(email, password)
      if (role === 'admin') {
        navigation.replace('AdminTabs')
      } else {
        navigation.replace('UserTabs')
      }
    } catch (e) {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword(resetEmail)
      setResetSent(true)
    } catch (e) {
      setError('Email not found')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ebfdf6" />

      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🔧</Text>
        </View>
        <Text style={styles.appName}>FixSpot</Text>
        <Text style={styles.appSub}>Infrastructure Issue Reporting</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#A0ADA0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#A0ADA0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.inputIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.loginButtonText}>Sign In</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setShowReset(!showReset); setResetSent(false); setError('') }}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {showReset && (
          <View style={styles.resetBox}>
            {resetSent ? (
              <Text style={styles.resetSuccess}>
                ✅ Reset link sent! Please check your inbox.
              </Text>
            ) : (
              <>
                <Text style={styles.resetLabel}>Enter your registered email</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#A0ADA0"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.resetButtonText}>Send Reset Link</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      <Text style={styles.footer}>Mae Fah Luang University • Facilities Management</Text>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ebfdf6', justifyContent: 'center', paddingHorizontal: 28 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 80, height: 80, backgroundColor: '#21805e', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: '#21805e', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '700', color: '#1A2E1A', letterSpacing: 0.5 },
  appSub: { fontSize: 14, color: '#6B7C6B', marginTop: 4 },
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
  loginButton: {
    backgroundColor: '#2D7A5F', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#2D7A5F', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  loginButtonText: { color: '#fff', fontSize: 17, fontWeight: '600', letterSpacing: 0.5 },
  registerText: { textAlign: 'center', color: '#6B7C6B', fontSize: 14, marginTop: 8 },
  registerLink: { color: '#2D7A5F', fontWeight: '600' },
  forgotText: { textAlign: 'center', color: '#2D7A5F', fontSize: 14 },
  resetBox: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8EEE8', gap: 10 },
  resetLabel: { fontSize: 14, color: '#6B7C6B' },
  resetButton: { backgroundColor: '#2D7A5F', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  resetButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resetSuccess: { color: '#2D7A5F', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  footer: { textAlign: 'center', color: '#A0ADA0', fontSize: 12, marginTop: 48 },
})