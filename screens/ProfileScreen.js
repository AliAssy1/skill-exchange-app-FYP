import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
};

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const result = await userService.getUserById(user.id);
        if (result.success) {
          setProfile(result.data?.user || result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigation.navigate('Auth');
  };
  
  // Get initials from full name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayUser = profile || user || {};
  const skills = displayUser.skills || [];
  const skillsOffered = skills.filter(s => s.skill_type === 'offered' || s.skill_type === 'offer' || s.type === 'offered').map(s => s.skill_name || s.name);
  const skillsNeeded = skills.filter(s => s.skill_type === 'needed' || s.skill_type === 'need' || s.type === 'needed').map(s => s.skill_name || s.name);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        <View style={styles.profileHeader}>
          <PlaceholderAvatar size={100} initials={getInitials(displayUser.full_name)} />
          <Text style={styles.profileName}>{displayUser.full_name || 'User'}</Text>
          <Text style={styles.profileEmail}>{displayUser.email || ''}</Text>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{displayUser.average_rating || '0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{displayUser.services_count || '0'}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{displayUser.credits || '0'}</Text>
              <Text style={styles.statLabel}>Credits</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Bio</Text>
          <Text style={styles.bioText}>
            {displayUser.bio || 'No bio added yet. Edit your profile to add one.'}
          </Text>
        </Card>

        <Card>
          <Text style={styles.label}>Skills Offered</Text>
          <View style={styles.skillsContainer}>
            {skillsOffered.length > 0 ? (
              skillsOffered.map((skill, index) => (
                <Text key={index} style={styles.skill}>{skill}</Text>
              ))
            ) : (
              <Text style={styles.emptyText}>No skills offered yet</Text>
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Skills Needed</Text>
          <View style={styles.skillsContainer}>
            {skillsNeeded.length > 0 ? (
              skillsNeeded.map((skill, index) => (
                <Text key={index} style={styles.skill}>{skill}</Text>
              ))
            ) : (
              <Text style={styles.emptyText}>No skills needed yet</Text>
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Major</Text>
          <Text style={styles.value}>{displayUser.major || 'Not set'}</Text>
          <Text style={[styles.label, { marginTop: 12 }]}>
            Year of Study
          </Text>
          <Text style={styles.value}>{displayUser.year_of_study || 'Not set'}</Text>
        </Card>

        <Button
          title="Edit Profile"
          variant="secondary"
          onPress={() => navigation.navigate('ProfileSetup')}
          accessibilityLabel="Edit Profile Button"
        />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessible
          accessibilityLabel="Logout Button"
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
  },
  statsCard: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skill: {
    fontSize: 13,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontStyle: 'italic',
  },
});
