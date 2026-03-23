import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/alertHelper';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) newErrors.email = 'Valid email address is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Normalize email before validation and submission
    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);

    if (validateForm()) {
      setLoading(true);
      setErrors({});
      
      try {
        const response = await login(normalizedEmail, password);
        
        // Check if admin user
        if (response.user.role === 'admin') {
          navigation.navigate('AdminDashboard');
        } else {
          navigation.navigate('ProfileSetup');
        }
      } catch (error) {
        setLoading(false);
        showAlert(
          'Login Failed',
          error.message || 'Invalid email or password. Please try again.'
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.neutral[ 50]} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>SkillSwap</Text>
          <Text style={styles.tagline}>Exchange Skills, Build Community</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue your journey</Text>

          <View style={styles.formSection}>

        <InputField
          label="Email Address"
          placeholder="your.email@kingston.ac.uk"
          value={email}
          onChangeText={setEmail}
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
          <View style={styles.rememberMeRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setRememberMe(!rememberMe)}
              accessible
              accessibilityLabel="Remember Me"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              {rememberMe && <View style={styles.checkmark} />}
            </TouchableOpacity>
            <Text style={styles.rememberMeText}>Remember me</Text>
          </View>
          <TouchableOpacity
            onPress={() => showAlert('Info', 'Password reset coming soon')}
            accessible
            accessibilityLabel="Forgot Password"
          >
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              accessibilityLabel="Login Button"
              size="large"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Registration')}
                accessible
                accessibilityLabel="Go to Registration"
              >
                <Text style={styles.linkHighlight}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Admin Hint */}
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>💡 Demo Admin: ali.assi@kingston.ac.uk</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.neutral[50],
  },
  header: {
    backgroundColor: AppColors.primary[600],
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    ...Shadows.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: AppColors.white,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary[100],
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
  },
  formCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: AppColors.neutral[600],
    marginBottom: Spacing.xl,
  },
  formSection: {
    marginTop: Spacing.base,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: AppColors.primary[400],
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  checkmark: {
    width: 14,
    height: 14,
    backgroundColor: AppColors.primary[600],
    borderRadius: 3,
  },
  rememberMeText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[700],
    fontWeight: Typography.fontWeight.medium,
  },
  forgotPassword: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.neutral[200],
  },
  dividerText: {
    marginHorizontal: Spacing.base,
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[400],
    fontWeight: Typography.fontWeight.medium,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.base,
  },
  linkText: {
    fontSize: Typography.fontSize.base,
    color:AppColors.neutral[600],
  },
  linkHighlight: {
    fontSize: Typography.fontSize.base,
    color: AppColors.primary[600],
    fontWeight: Typography.fontWeight.bold,
  },
  hintBox: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: AppColors.primary[50],
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary[400],
  },
  hintText: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.primary[700],
    textAlign: 'center',
  },
});
