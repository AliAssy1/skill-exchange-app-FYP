import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Card from '../components/Card';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import serviceService from '../services/serviceService';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    credits: 0,
    offeredServices: 0,
    requestedServices: 0,
    reputation: 0,
    completedExchanges: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Get user stats from API
      if (user?.id) {
        const statsResult = await userService.getUserStats(user.id);
        if (statsResult.success) {
          const data = statsResult.data;
          setStats({
            credits: user.credits || 0,
            offeredServices: data.services_offered || 0,
            requestedServices: data.services_requested || 0,
            reputation: user.reputation_score || 5.0,
            completedExchanges: data.completed_transactions || 0,
          });
        }
      } else {
        // Fallback to user object if stats API not available
        setStats({
          credits: user?.credits || 0,
          offeredServices: 0,
          requestedServices: 0,
          reputation: user?.reputation_score || 5.0,
          completedExchanges: 0,
        });
      }

      // Get recent activities (can be implemented later)
      setRecentActivities([]);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to user object data
      setStats({
        credits: user?.credits || 0,
        offeredServices: 0,
        requestedServices: 0,
        reputation: user?.reputation_score || 5.0,
        completedExchanges: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.greeting}>Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}!</Text>
        <Text style={styles.heroSubtext}>Your skill exchange journey continues</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary[600]} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : (
          <>
            {/* Credits Card - Premium Style*/}
            <View style={styles.creditCardContainer}>
              <Card variant="elevated" style={styles.creditCard}>
                <View style={styles.creditIconContainer}>
                  <Text style={styles.creditIcon}>💎</Text>
                </View>
                <View style={styles.creditContent}>
                  <Text style={styles.creditLabel}>Skill Credits</Text>
                  <Text style={styles.creditValue}>{stats.credits.toLocaleString()}</Text>
                  <Text style={styles.creditSubtext}>Available for exchanges</Text>
                </View>
              </Card>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <Card variant="outlined" style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statEmoji}>📤</Text>
                </View>
                <Text style={styles.statValue}>{stats.offeredServices}</Text>
                <Text style={styles.statLabel}>Offered</Text>
              </Card>
              <Card variant="outlined" style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statEmoji}>📥</Text>
                </View>
                <Text style={styles.statValue}>{stats.requestedServices}</Text>
                <Text style={styles.statLabel}>Requested</Text>
              </Card>
            </View>

            <View style={styles.statsGrid}>
              <Card variant="outlined" style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statEmoji}>⭐</Text>
                </View>
                <Text style={styles.statValue}>{typeof stats.reputation === 'number' ? stats.reputation.toFixed(1) : '5.0'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </Card>
              <Card variant="outlined" style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statEmoji}>✅</Text>
                </View>
                <Text style={styles.statValue}>{stats.completedExchanges}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </Card>
            </View>

            {/* Recent Activity */}
            <View style={styles.activitySection}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {recentActivities.length === 0 ? (
                <Card variant="outlined" style={styles.activityCard}>
                  <Text style={styles.emptyActivityText}>No recent activity yet</Text>
                  <Text style={styles.emptyActivitySubtext}>Start exchanging skills to see activity here</Text>
                </Card>
              ) : (
                <FlatList
                  data={recentActivities}
                  keyExtractor={(item) => String(item.id)}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <Card variant="outlined" style={styles.activityCard}>
                      <View style={styles.activityContent}>
                        <View style={styles.activityLeft}>
                          <Text style={styles.activityUser}>{item.user}</Text>
                          <Text style={styles.activityText}>{item.action}</Text>
                        </View>
                        <Text style={styles.activityTime}>{item.time}</Text>
                      </View>
                    </Card>
                  )}
                />
              )}
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Browse')}
              accessible
              accessibilityLabel="Browse Services"
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Browse Available Services</Text>
              <Text style={styles.actionButtonIcon}>→</Text>
            </TouchableOpacity>

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Calendar')}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIconContainer}>
                    <Text style={styles.quickActionIcon}>📅</Text>
                  </View>
                  <Text style={styles.quickActionText}>Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('SkillMatching')}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIconContainer}>
                    <Text style={styles.quickActionIcon}>🎯</Text>
                  </View>
                  <Text style={styles.quickActionText}>Matches</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Notifications')}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIconContainer}>
                    <Text style={styles.quickActionIcon}>🔔</Text>
                  </View>
                  <Text style={styles.quickActionText}>Notifications</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('Portfolio')}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIconContainer}>
                    <Text style={styles.quickActionIcon}>💼</Text>
                  </View>
                  <Text style={styles.quickActionText}>Portfolio</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.neutral[50],
  },
  heroSection: {
    backgroundColor: AppColors.primary[600],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  greeting: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
    marginBottom: Spacing.xs,
  },
  heroSubtext: {
    fontSize: Typography.fontSize.base,
    color: AppColors.primary[100],
    fontWeight: Typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingTop: Spacing.base,
  },
  creditCardContainer: {
    marginBottom: Spacing.xl,
    marginTop: -Spacing['3xl'],
  },
  creditCard: {
    backgroundColor: `linear-gradient(135deg, ${AppColors.accent[400]} 0%, ${AppColors.accent[600]} 100%)`,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditIconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  creditIcon: {
    fontSize: 32,
  },
  creditContent: {
    flex: 1,
  },
  creditLabel: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.accent[50],
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  creditValue: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: AppColors.white,
    letterSpacing: -1,
  },
  creditSubtext: {
    fontSize: Typography.fontSize.xs,
   color: AppColors.accent[100],
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.base,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.primary[600],
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[600],
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
  activitySection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
    marginBottom: Spacing.base,
  },
  activityCard: {
    marginBottom: Spacing.sm,
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityLeft: {
    flex: 1,
  },
  activityUser: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.neutral[900],
    marginBottom: Spacing.xs,
  },
  activityText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[600],
  },
  activityTime: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.neutral[400],
    marginLeft: Spacing.sm,
  },
  actionButton: {
    backgroundColor: AppColors.primary[600],
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  actionButtonText: {
    color: AppColors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginRight: Spacing.sm,
  },
  actionButtonIcon: {
    color: AppColors.white,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  quickActionsSection: {
    marginBottom: Spacing['2xl'],
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: AppColors.white,
    borderWidth: 2,
    borderColor: AppColors.neutral[200],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionIcon: {
    fontSize: 28,
  },
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.neutral[700],
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: AppColors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  emptyActivityText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.neutral[700],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptyActivitySubtext: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[500],
    textAlign: 'center',
  },
});
