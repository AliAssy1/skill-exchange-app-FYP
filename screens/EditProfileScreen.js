import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import InputField from '../components/InputField';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { showAlert } from '../utils/alertHelper';
import { saveProfilePhoto, loadProfilePhoto } from '../utils/profilePhoto';
import { AppColors, Shadows, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();

  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [skillsOffered, setSkillsOffered] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(true);

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setMajor(user.major || '');
      setYearOfStudy(user.year_of_study || '');
    }
    // Load skills and photo
    const load = async () => {
      if (user?.id) {
        const [photo, profileResult] = await Promise.all([
          loadProfilePhoto(user.id),
          userService.getUserById(user.id),
        ]);
        if (photo) setProfilePhoto(photo);
        if (profileResult.success) {
          const u = profileResult.data?.user || profileResult.data;
          const skills = u?.skills || [];
          setSkillsOffered(skills.filter(s => s.skill_type === 'offered').map(s => s.skill_name).join(', '));
          setSkillsNeeded(skills.filter(s => s.skill_type === 'needed').map(s => s.skill_name).join(', '));
          if (u?.bio) setBio(u.bio);
          if (u?.major) setMajor(u.major);
          if (u?.year_of_study) setYearOfStudy(u.year_of_study);
        }
      }
      setLoadingPhoto(false);
    };
    load();
  }, []);

  const handlePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission Required', 'Please allow access to your photo library.');
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileResult = await userService.updateProfile(user?.id, {
        full_name: user?.full_name,
        major,
        year_of_study: yearOfStudy,
        bio,
      });

      if (!profileResult.success) throw new Error(profileResult.message);

      const skills = [];
      skillsOffered.split(',').map(s => s.trim()).filter(Boolean).forEach(skill =>
        skills.push({ skill_name: skill, skill_type: 'offered', proficiency_level: 'intermediate' })
      );
      skillsNeeded.split(',').map(s => s.trim()).filter(Boolean).forEach(skill =>
        skills.push({ skill_name: skill, skill_type: 'needed', proficiency_level: 'beginner' })
      );

      if (skills.length > 0) await userService.updateSkills(skills);

      await updateUser();
      navigation.goBack();
    } catch (error) {
      showAlert('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        <TouchableOpacity style={styles.photoWrap} onPress={handlePhoto} activeOpacity={0.8}>
          {loadingPhoto ? (
            <View style={styles.photoPlaceholder}>
              <ActivityIndicator color={AppColors.primary[600]} />
            </View>
          ) : profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.photo} />
          ) : (
            <PlaceholderAvatar size={96} initials={initials} name={user?.full_name} />
          )}
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={18} color={AppColors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap to change photo</Text>

        {/* Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <InputField
            label="Bio"
            placeholder="Tell others about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />
          <InputField
            label="Major / Field of Study"
            placeholder="e.g. Computer Science"
            value={major}
            onChangeText={setMajor}
          />
          <InputField
            label="Year of Study"
            placeholder="e.g. Second Year"
            value={yearOfStudy}
            onChangeText={setYearOfStudy}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <InputField
            label="Skills I Can Offer (comma-separated)"
            placeholder="e.g. Python, Maths Tutoring"
            value={skillsOffered}
            onChangeText={setSkillsOffered}
            multiline
            numberOfLines={2}
          />
          <InputField
            label="Skills I Want to Learn (comma-separated)"
            placeholder="e.g. Spanish, Guitar"
            value={skillsNeeded}
            onChangeText={setSkillsNeeded}
            multiline
            numberOfLines={2}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={AppColors.white} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.neutral[50] },
  content: { padding: Spacing.base, paddingBottom: 40 },

  photoWrap: { alignSelf: 'center', marginTop: 8, marginBottom: 4 },
  photo: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: AppColors.primary[200] },
  photoPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: AppColors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: AppColors.primary[600],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: AppColors.white,
  },
  photoHint: {
    textAlign: 'center',
    fontSize: 12,
    color: AppColors.neutral[400],
    marginBottom: 20,
  },

  section: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: 12,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary[600],
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    marginBottom: 12,
    ...Shadows.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: AppColors.white, fontSize: 16, fontWeight: '700' },

  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: { fontSize: 15, color: AppColors.neutral[400], fontWeight: '500' },
});
