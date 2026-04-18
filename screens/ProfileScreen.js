import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { loadProfilePhoto } from '../utils/profilePhoto';
import { AppColors, Shadows } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUri, setPhotoUri] = useState(null);

  useEffect(() => {
    fetchProfile();
    const unsub = navigation.addListener('focus', fetchProfile);
    return unsub;
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const [profileResult, photo] = await Promise.all([
          userService.getUserById(user.id),
          loadProfilePhoto(user.id),
        ]);
        if (profileResult.success) setProfile(profileResult.data?.user || profileResult.data);
        if (photo) setPhotoUri(photo);
      }
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Auth');
  };

  const displayUser = profile || user || {};
  const skills = displayUser.skills || [];
  const skillsOffered = skills
    .filter(s => ['offered', 'offer'].includes(s.skill_type) || s.type === 'offered')
    .map(s => s.skill_name || s.name);
  const skillsNeeded = skills
    .filter(s => ['needed', 'need'].includes(s.skill_type) || s.type === 'needed')
    .map(s => s.skill_name || s.name);

  const initials = (displayUser.full_name || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={AppColors.primary[600]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
            accessibilityLabel="Edit Profile"
          >
            <Ionicons name="pencil" size={16} color={AppColors.white} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
        ) : (
          <PlaceholderAvatar size={88} initials={initials} name={displayUser.full_name} />
        )}
        <Text style={styles.profileName}>{displayUser.full_name || 'Student'}</Text>
        <Text style={styles.profileEmail}>{displayUser.email || ''}</Text>
        {displayUser.major && (
          <View style={styles.majorBadge}>
            <Text style={styles.majorBadgeText}>{displayUser.major}</Text>
            {displayUser.year_of_study ? <Text style={styles.majorBadgeText}> · {displayUser.year_of_study}</Text> : null}
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{displayUser.credits || 0}</Text>
          <Text style={styles.statLabel}>Credits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {displayUser.average_rating ? parseFloat(displayUser.average_rating).toFixed(1) : '—'}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{displayUser.services_count || 0}</Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{displayUser.completed_transactions || 0}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Bio */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={18} color={AppColors.primary[600]} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.bioText}>
            {displayUser.bio || 'No bio yet. Tap Edit to add one.'}
          </Text>
        </View>

        {/* Skills Offered */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star-outline" size={18} color={AppColors.success[600]} />
            <Text style={styles.sectionTitle}>Skills I Offer</Text>
          </View>
          {skillsOffered.length > 0 ? (
            <View style={styles.tagRow}>
              {skillsOffered.map((skill, i) => (
                <View key={i} style={[styles.tag, styles.tagOffer]}>
                  <Text style={[styles.tagText, styles.tagOfferText]}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyHint}>No skills added yet</Text>
          )}
        </View>

        {/* Skills Needed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={18} color={AppColors.info[600]} />
            <Text style={styles.sectionTitle}>Skills I Want to Learn</Text>
          </View>
          {skillsNeeded.length > 0 ? (
            <View style={styles.tagRow}>
              {skillsNeeded.map((skill, i) => (
                <View key={i} style={[styles.tag, styles.tagNeed]}>
                  <Text style={[styles.tagText, styles.tagNeedText]}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyHint}>No skills added yet</Text>
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps-outline" size={18} color={AppColors.primary[600]} />
            <Text style={styles.sectionTitle}>More</Text>
          </View>

          {[
            { icon: 'briefcase-outline', label: 'My Services', route: 'MyServices', tab: true },
            { icon: 'images-outline', label: 'Portfolio', route: 'Portfolio' },
            { icon: 'calendar-outline', label: 'Calendar', route: 'Calendar' },
            { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
          ].map(({ icon, label, route, tab }) => (
            <TouchableOpacity
              key={route}
              style={styles.menuRow}
              onPress={() => tab ? navigation.navigate(route) : navigation.navigate(route)}
              accessibilityLabel={label}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={icon} size={20} color={AppColors.primary[600]} />
              </View>
              <Text style={styles.menuLabel}>{label}</Text>
              <Ionicons name="chevron-forward" size={16} color={AppColors.neutral[400]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          accessibilityLabel="Logout"
        >
          <Ionicons name="log-out-outline" size={20} color={AppColors.error[600]} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.neutral[50] },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  profilePhoto: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },

  // Banner
  banner: {
    backgroundColor: AppColors.primary[600],
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bannerActions: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  editBtnText: { color: AppColors.white, fontSize: 13, fontWeight: '600' },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.white,
    marginTop: 12,
  },
  profileEmail: { fontSize: 13, color: AppColors.primary[200], marginTop: 2 },
  majorBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  majorBadgeText: { fontSize: 12, color: AppColors.white, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    paddingVertical: 16,
    marginBottom: 12,
    ...Shadows.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.primary[700],
  },
  statLabel: { fontSize: 11, color: AppColors.neutral[500], marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: AppColors.neutral[200] },

  // Body
  body: { paddingHorizontal: 16, paddingBottom: 32 },
  section: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Shadows.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: AppColors.neutral[800] },
  bioText: { fontSize: 14, color: AppColors.neutral[600], lineHeight: 21 },
  emptyHint: { fontSize: 13, color: AppColors.neutral[400], fontStyle: 'italic' },

  // Tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagOffer: { backgroundColor: AppColors.success[50] },
  tagOfferText: { fontSize: 13, fontWeight: '600', color: AppColors.success[700] },
  tagNeed: { backgroundColor: AppColors.info[50] },
  tagNeedText: { fontSize: 13, fontWeight: '600', color: AppColors.info[700] },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral[100],
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: AppColors.neutral[800], fontWeight: '500' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.error[200],
    backgroundColor: AppColors.error[50],
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: AppColors.error[600] },
});
