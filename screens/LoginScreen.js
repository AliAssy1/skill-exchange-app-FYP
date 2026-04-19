import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/alertHelper';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      e => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => setKeyboardHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const kingstonRegex = /^k\d+@kingston\.ac\.uk$/i;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!kingstonRegex.test(email.trim())) {
      newErrors.email = 'Use format: k1234567@kingston.ac.uk';
    }
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      const response = await login(email.trim().toUpperCase(), password);
      const u = response.user;
      if (u.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else {
        navigation.navigate('MainApp');
      }
    } catch (error) {
      setLoading(false);
      showAlert('Login Failed', error.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: keyboardHeight }]}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary[800]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Ionicons name="git-compare" size={32} color={AppColors.white} />
        </View>
        <Text style={styles.appTitle}>SkillSwap</Text>
        <Text style={styles.tagline}>Exchange Skills · Build Community</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue your journey</Text>

          {/* Email format hint */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color={AppColors.primary[600]} />
            <Text style={styles.infoText}>
              Example:{' '}
              <Text style={styles.infoCode}>k1234567@kingston.ac.uk</Text>
            </Text>
          </View>

          <InputField
            label="Kingston Email"
            placeholder="k1234567@kingston.ac.uk"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.email}
            accessibilityLabel="Email Input"
          />

          <InputField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            accessibilityLabel="Password Input"
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              accessibilityLabel="Remember Me"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color={AppColors.white} />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => showAlert('Info', 'Password reset coming soon')}
              accessibilityLabel="Forgot Password"
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonWrap}>
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              size="large"
              accessibilityLabel="Login Button"
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Registration')}
              accessibilityLabel="Go to Registration"
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hintBox}>
            <Ionicons name="shield-checkmark-outline" size={14} color={AppColors.primary[600]} />
            <Text style={styles.hintText}>
              Kingston University students only. Use your k-number email to sign in.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

  // Header
  header: {
    backgroundColor: AppColors.primary[700],
    paddingTop: 64,
    paddingBottom: 36,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    alignItems: 'center',
    ...Shadows.lg,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appTitle: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: AppColors.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.primary[200],
    fontWeight: Typography.fontWeight.medium,
    marginTop: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: 48 },

  formCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[500],
    marginBottom: Spacing.xl,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  infoText: { flex: 1, fontSize: Typography.fontSize.xs, color: AppColors.primary[700], lineHeight: 18 },
  infoCode: { fontWeight: Typography.fontWeight.bold, letterSpacing: 0.3 },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: AppColors.primary[400],
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: AppColors.primary[600], borderColor: AppColors.primary[600] },
  rememberText: { fontSize: Typography.fontSize.sm, color: AppColors.neutral[700], fontWeight: Typography.fontWeight.medium },
  forgotText: { fontSize: Typography.fontSize.sm, color: AppColors.primary[600], fontWeight: Typography.fontWeight.semibold },

  buttonWrap: { marginBottom: Spacing.xl },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: AppColors.neutral[100] },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.xs,
    color: AppColors.neutral[400],
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 1,
  },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.xl },
  signupText: { fontSize: Typography.fontSize.sm, color: AppColors.neutral[500] },
  signupLink: { fontSize: Typography.fontSize.sm, color: AppColors.primary[600], fontWeight: Typography.fontWeight.bold },

  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.md,
    backgroundColor: AppColors.primary[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    color: AppColors.primary[700],
    lineHeight: 16,
  },
});
