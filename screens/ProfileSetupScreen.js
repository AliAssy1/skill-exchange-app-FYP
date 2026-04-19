import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import InputField from '../components/InputField';
import Button from '../components/Button';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { showAlert } from '../utils/alertHelper';
import { saveProfilePhoto, loadProfilePhoto } from '../utils/profilePhoto';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#1D4ED8',
};

export default function ProfileSetupScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState('');
  const [skillsOffered, setSkillsOffered] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState('');
  const [major, setMajor] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const { user, updateUser } = useAuth();

  // Load previously saved photo on mount
  React.useEffect(() => {
    if (user?.id) {
      loadProfilePhoto(user.id).then(uri => { if (uri) setProfilePhoto(uri); });
      // Pre-fill existing profile data
      if (user.bio) setBio(user.bio);
      if (user.major) setMajor(user.major);
      if (user.year_of_study) setYearOfStudy(user.year_of_study);
    }
  }, [user?.id]);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save profile on completion
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Update profile info
      const profileData = {
        full_name: user?.full_name,
        major: major,
        year_of_study: yearOfStudy,
        bio: bio
      };

      const profileResult = await userService.updateProfile(user?.id, profileData);
      
      if (!profileResult.success) {
        throw new Error(profileResult.message);
      }

      // Update skills if provided
      const skills = [];
      
      if (skillsOffered) {
        const offeredSkills = skillsOffered.split(',').map(s => s.trim()).filter(s => s);
        offeredSkills.forEach(skill => {
          skills.push({
            skill_name: skill,
            skill_type: 'offered',
            proficiency_level: 'intermediate'
          });
        });
      }

      if (skillsNeeded) {
        const neededSkills = skillsNeeded.split(',').map(s => s.trim()).filter(s => s);
        neededSkills.forEach(skill => {
          skills.push({
            skill_name: skill,
            skill_type: 'needed',
            proficiency_level: 'beginner'
          });
        });
      }

      if (skills.length > 0) {
        await userService.updateSkills(skills);
      }

      // Update user context
      await updateUser();
      
      showAlert('Success', '✅ Profile setup completed!');
      navigation.navigate('MainApp');
    } catch (error) {
      console.error('Profile setup error:', error);
      showAlert('Error', '❌ Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission Required', 'Please allow access to your photo library to upload a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePhoto(uri);
      await saveProfilePhoto(user?.id, uri);
    }
  };

  const handleSkip = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigation.navigate('MainApp');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.contentContainer}>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step {step} of 3</Text>
        </View>

        {step === 1 && (
          <>
            <Text style={styles.title}>Profile Photo</Text>
            <Text style={styles.subtitle}>Add a profile photo to help other students recognize you</Text>
            
            <View style={styles.avatarContainer}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
              ) : (
                <PlaceholderAvatar size={120} initials="U" />
              )}
            </View>

            <Button
              title={profilePhoto ? 'Change Photo' : 'Upload Photo'}
              variant="secondary"
              onPress={handleUploadPhoto}
              accessibilityLabel="Upload Profile Photo"
            />

            <InputField
              label="Bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              accessibilityLabel="Bio Input"
            />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.title}>Skills & Expertise</Text>
            <Text style={styles.subtitle}>What can you offer and what do you need?</Text>

            <InputField
              label="Skills You Can Offer"
              placeholder="e.g., Python, Mathematics Tutoring, Video Editing"
              value={skillsOffered}
              onChangeText={setSkillsOffered}
              multiline
              numberOfLines={3}
              accessibilityLabel="Skills Offered Input"
            />

            <InputField
              label="Skills You Need"
              placeholder="e.g., Spanish, Guitar, Graphic Design"
              value={skillsNeeded}
              onChangeText={setSkillsNeeded}
              multiline
              numberOfLines={3}
              accessibilityLabel="Skills Needed Input"
            />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.title}>Academic Details</Text>
            <Text style={styles.subtitle}>Help us match you with relevant services</Text>

            <InputField
              label="Major/Field of Study"
              placeholder="e.g., Computer Science, Business Administration"
              value={major}
              onChangeText={setMajor}
              accessibilityLabel="Major Input"
            />

            <InputField
              label="Year of Study"
              placeholder="e.g., First Year, Final Year"
              value={yearOfStudy}
              onChangeText={setYearOfStudy}
              accessibilityLabel="Year of Study Input"
            />
          </>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Skip"
            variant="secondary"
            onPress={handleSkip}
            disabled={loading}
            accessibilityLabel="Skip Step"
          />
          <Button
            title={step === 3 ? 'Complete' : 'Next'}
            onPress={handleNext}
            loading={loading}
            disabled={loading}
            accessibilityLabel={step === 3 ? 'Complete Profile Setup' : 'Next Step'}
          />
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
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
  stepIndicator: {
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
});
