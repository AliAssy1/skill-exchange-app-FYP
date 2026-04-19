import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { showAlert } from '../utils/alertHelper';
import * as Notifications from 'expo-notifications';

// Matches k[one-or-more-digits]@kingston.ac.uk (case-insensitive)
const KINGSTON_REGEX = /^k\d+@kingston\.ac\.uk$/i;

export default function RegistrationScreen({ navigation }) {
  const [step, setStep] = useState(1);

  // Step 1 — Kingston email
  const [kingstonEmail, setKingstonEmail] = useState('');
  const [sendingCode, setSendingCode] = useState(false);

  // Step 2 — Verification code
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const codeRefs = useRef([]);

  // Step 3 — Name + password
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [registering, setRegistering] = useState(false);

  const { register } = useAuth();

  // ── Step 1: Send code to Kingston email ───────────────────────────────
  const handleSendCode = async () => {
    const trimmed = kingstonEmail.trim();
    if (!trimmed) {
      showAlert('Required', 'Please enter your Kingston University email.');
      return;
    }
    if (!KINGSTON_REGEX.test(trimmed)) {
      showAlert('Invalid Email', 'Please use your Kingston University email.\nExample: k1234567@kingston.ac.uk');
      return;
    }
    setSendingCode(true);
    try {
      await authService.sendVerificationCode(trimmed);
      setStep(2);
    } catch (error) {
      showAlert('Error', error.message || 'Could not send verification code. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  // ── Step 2: Verify code ───────────────────────────────────────────────
  const handleCodeChange = (val, index) => {
    const digits = val.replace(/[^0-9]/g, '');
    if (digits.length > 1) {
      const arr = [...code];
      for (let i = 0; i < 6 && index + i < 6; i++) arr[index + i] = digits[i] || '';
      setCode(arr);
      codeRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    const arr = [...code];
    arr[index] = digits;
    setCode(arr);
    if (digits && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      showAlert('Incomplete', 'Please enter all 6 digits.');
      return;
    }
    setVerifying(true);
    try {
      await authService.verifyCode(kingstonEmail.trim().toUpperCase(), fullCode);
      setStep(3);
    } catch (error) {
      showAlert('Verification Failed', error.message || 'Invalid or expired code. Try again.');
      setCode(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setSendingCode(true);
    try {
      await authService.sendVerificationCode(kingstonEmail.trim());
      setCode(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
      showAlert('Sent', 'A new verification code has been sent to your Kingston email.');
    } catch (error) {
      showAlert('Error', error.message || 'Could not resend code.');
    } finally {
      setSendingCode(false);
    }
  };

  // ── Step 3: Register ──────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!termsAccepted) errs.terms = 'You must accept the terms and conditions';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setRegistering(true);
    setErrors({});
    try {
      await register({
        full_name: fullName.trim(),
        email: kingstonEmail.trim().toUpperCase(),
        password,
        major: 'Not specified',
        year_of_study: 'Not specified',
      });
      await Notifications.requestPermissionsAsync().catch(() => {});
      showAlert(
        'Account Created!',
        "Welcome to SkillSwap! Let's set up your profile.",
        [{ text: 'Get Started', onPress: () => navigation.navigate('ProfileSetup') }]
      );
    } catch (error) {
      setRegistering(false);
      showAlert('Registration Failed', error.message || 'Could not create account. Please try again.');
    }
  };

  // ── Progress bar ──────────────────────────────────────────────────────
  const renderProgress = () => (
    <View style={styles.progressRow}>
      {[1, 2, 3].map(n => (
        <React.Fragment key={n}>
          <View style={[styles.progressDot, step >= n && styles.progressDotActive]}>
            {step > n
              ? <Ionicons name="checkmark" size={12} color={AppColors.white} />
              : <Text style={[styles.progressNum, step === n && styles.progressNumActive]}>{n}</Text>
            }
          </View>
          {n < 3 && <View style={[styles.progressLine, step > n && styles.progressLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  const stepLabels = ['Verify Email', 'Enter Code', 'Create Account'];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary[800]} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
          accessibilityLabel="Go Back"
        >
          <Ionicons name="arrow-back" size={22} color={AppColors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>SkillSwap</Text>
          <Text style={styles.tagline}>Create Account</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepLabel}>Step {step} of 3 — {stepLabels[step - 1]}</Text>
            {renderProgress()}
          </View>

          {/* ── STEP 1: Kingston email ── */}
          {step === 1 && (
            <>
              <Text style={styles.cardTitle}>Verify Your Kingston Email</Text>
              <Text style={styles.cardSubtitle}>
                Enter your Kingston University email. We'll send a 6-digit code to confirm it's yours.
              </Text>

              <View style={styles.infoBox}>
                <Ionicons name="school-outline" size={16} color={AppColors.primary[600]} />
                <Text style={styles.infoText}>
                  Example: <Text style={styles.infoCode}>k1234567@kingston.ac.uk</Text>
                </Text>
              </View>

              <InputField
                label="Kingston University Email"
                placeholder="k1234567@kingston.ac.uk"
                value={kingstonEmail}
                onChangeText={setKingstonEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Kingston Email Input"
              />

              <Button
                title={sendingCode ? 'Sending Code...' : 'Send Verification Code'}
                onPress={handleSendCode}
                loading={sendingCode}
                disabled={sendingCode}
                size="large"
                accessibilityLabel="Send Verification Code"
              />
            </>
          )}

          {/* ── STEP 2: Code entry ── */}
          {step === 2 && (
            <>
              <Text style={styles.cardTitle}>Enter Verification Code</Text>
              <Text style={styles.cardSubtitle}>
                A 6-digit code was sent to{'\n'}
                <Text style={styles.emailHighlight}>{kingstonEmail.toUpperCase()}</Text>
              </Text>

              <View style={styles.infoBox}>
                <Ionicons name="mail-outline" size={16} color={AppColors.primary[600]} />
                <Text style={styles.infoText}>Verification code sent to your email.</Text>
              </View>

              <View style={styles.codeRow}>
                {code.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { codeRefs.current[i] = ref; }}
                    style={[styles.codeBox, digit && styles.codeBoxFilled]}
                    value={digit}
                    onChangeText={val => handleCodeChange(val, i)}
                    onKeyPress={e => handleCodeKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    accessibilityLabel={`Code digit ${i + 1}`}
                  />
                ))}
              </View>

              <Button
                title={verifying ? 'Verifying...' : 'Verify Code'}
                onPress={handleVerifyCode}
                loading={verifying}
                disabled={verifying || code.join('').length < 6}
                size="large"
                accessibilityLabel="Verify Code"
              />

              <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't receive it? </Text>
                <TouchableOpacity onPress={handleResend} disabled={sendingCode}>
                  <Text style={styles.resendLink}>{sendingCode ? 'Sending...' : 'Resend Code'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── STEP 3: Name + password ── */}
          {step === 3 && (
            <>
              <Text style={styles.cardTitle}>Almost Done!</Text>
              <Text style={styles.cardSubtitle}>Set your name and choose a password.</Text>

              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={AppColors.success[600]} />
                <Text style={styles.verifiedText}>{kingstonEmail.toUpperCase()} — verified</Text>
              </View>

              <InputField
                label="Full Name"
                placeholder="e.g. John Smith"
                value={fullName}
                onChangeText={setFullName}
                error={errors.fullName}
                accessibilityLabel="Full Name Input"
              />
              <InputField
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
                accessibilityLabel="Password Input"
              />
              <InputField
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={errors.confirmPassword}
                accessibilityLabel="Confirm Password Input"
              />

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setTermsAccepted(!termsAccepted)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Ionicons name="checkmark" size={13} color={AppColors.white} />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I accept the <Text style={styles.termsLink}>Terms and Conditions</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms && <Text style={styles.fieldError}>{errors.terms}</Text>}

              <View style={styles.buttonWrap}>
                <Button
                  title="Create Account"
                  onPress={handleRegister}
                  loading={registering}
                  disabled={registering}
                  size="large"
                  accessibilityLabel="Create Account Button"
                />
              </View>
            </>
          )}

          <View style={styles.signinRow}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} accessibilityLabel="Go to Login">
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

  header: {
    backgroundColor: AppColors.primary[700],
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    ...Shadows.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  headerContent: { alignItems: 'center' },
  appTitle: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: AppColors.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary[200],
    fontWeight: Typography.fontWeight.medium,
    marginTop: 4,
    letterSpacing: 0.8,
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

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.primary[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: AppColors.primary[600] },
  progressNum: { fontSize: 11, fontWeight: '700', color: AppColors.neutral[400] },
  progressNumActive: { color: AppColors.white },
  progressLine: { width: 20, height: 2, backgroundColor: AppColors.neutral[200] },
  progressLineActive: { backgroundColor: AppColors.primary[600] },

  cardTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[500],
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  emailHighlight: {
    color: AppColors.primary[700],
    fontWeight: Typography.fontWeight.bold,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  infoText: { flex: 1, fontSize: Typography.fontSize.xs, color: AppColors.primary[700] },
  infoCode: { fontWeight: Typography.fontWeight.bold, letterSpacing: 0.3 },

  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: Spacing.lg,
  },
  codeBox: {
    width: 46,
    height: 58,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: AppColors.neutral[200],
    textAlign: 'center',
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
    backgroundColor: AppColors.neutral[50],
  },
  codeBoxFilled: {
    borderColor: AppColors.primary[500],
    backgroundColor: AppColors.primary[50],
    color: AppColors.primary[700],
  },

  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  resendText: { fontSize: Typography.fontSize.sm, color: AppColors.neutral[500] },
  resendLink: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary[600],
    fontWeight: Typography.fontWeight.bold,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.success[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedText: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.success[700],
    fontWeight: Typography.fontWeight.semibold,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: AppColors.primary[400],
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: AppColors.primary[600], borderColor: AppColors.primary[600] },
  checkboxLabel: { flex: 1, fontSize: Typography.fontSize.sm, color: AppColors.neutral[700], lineHeight: 20 },
  termsLink: { color: AppColors.primary[600], fontWeight: Typography.fontWeight.semibold },
  fieldError: { fontSize: Typography.fontSize.xs, color: AppColors.error[600], marginBottom: Spacing.sm },

  buttonWrap: { marginTop: Spacing.lg },
  signinRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  signinText: { fontSize: Typography.fontSize.sm, color: AppColors.neutral[500] },
  signinLink: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary[600],
    fontWeight: Typography.fontWeight.bold,
  },
});
