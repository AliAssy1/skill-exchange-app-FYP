import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
};

export default function RegistrationScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    const kingstonEmailRegex = /^K\d{7}@KINGSTON\.AC\.UK$/i;

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!kingstonEmailRegex.test(email.trim())) {
      newErrors.email = 'Use format: K1234567@KINGSTON.AC.UK';
    }
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!termsAccepted) newErrors.terms = 'You must accept the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    const trimmedName = fullName.trim();
    const normalizedEmail = email.trim().toUpperCase();

    setFullName(trimmedName);
    setEmail(normalizedEmail);

    if (validateForm()) {
      setLoading(true);
      setErrors({});
      
      try {
        await register({
          full_name: trimmedName,
          email: normalizedEmail,
          password,
          major: 'Not specified',
          year_of_study: 'Not specified',
        });
        
        showAlert(
          'Success', 
          'Registration successful! Welcome to SkillSwap.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ProfileSetup')
            }
          ]
        );
      } catch (error) {
        setLoading(false);
        showAlert(
          'Registration Failed',
          error.message || 'Could not create account. Please try again.'
        );
      }
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the skill exchange community</Text>

        {/* Email format hint */}
        <View style={styles.formatHint}>
          <Text style={styles.formatHintTitle}>📧 Email Format</Text>
          <Text style={styles.formatHintExample}>K1234567@KINGSTON.AC.UK</Text>
        </View>

        <InputField
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
          accessibilityLabel="Full Name Input"
        />

        <InputField
          label="Kingston Email"
          placeholder="K1234567@KINGSTON.AC.UK"
          value={email}
          onChangeText={(text) => setEmail(text.toUpperCase())}
          autoCapitalize="characters"
          keyboardType="email-address"
          error={errors.email}
          accessibilityLabel="Email Input"
        />

        <InputField
          label="Password"
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
          accessibilityLabel="Password Input"
        />

        <InputField
          label="Confirm Password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
          accessibilityLabel="Confirm Password Input"
        />

        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setTermsAccepted(!termsAccepted)}
            accessible
            accessibilityLabel="Accept Terms and Conditions"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
          >
            {termsAccepted && <View style={styles.checkmark} />}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>
            I accept the Terms and Conditions
          </Text>
        </View>
        {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

        <Button
          title={loading ? 'Registering...' : 'Register'}
          onPress={handleRegister}
          disabled={loading}
          accessibilityLabel="Register Button"
        />

        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            accessible
            accessibilityLabel="Go to Login"
          >
            <Text style={styles.linkHighlight}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkmark: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  linkHighlight: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emailPreview: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  emailPreviewLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 2,
  },
  formatHintSub: {
    fontSize: 11,
    color: '#3B82F6',
    textAlign: 'center',
  },
  formatHint: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  formatHintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  formatHintExample: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
});
