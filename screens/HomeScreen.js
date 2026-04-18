import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import transactionService from '../services/transactionService';
import { loadProfilePhoto } from '../utils/profilePhoto';
import { AppColors, Shadows } from '../constants/theme';

const QUICK_ACTIONS = [
  { icon: 'search',               label: 'Browse Services',     route: 'Browse',             color: '#2563EB', bg: '#EFF6FF' },
  { icon: 'git-compare',          label: 'Skill Matches',       route: 'SkillMatching',      color: '#059669', bg: '#ECFDF5' },
  { icon: 'chatbubbles',          label: 'Messages',            route: 'Messages',            color: '#0D9488', bg: '#F0FDFA' },
  { icon: 'calendar',             label: 'Calendar',            route: 'Calendar',            color: '#D97706', bg: '#FFFBEB' },
  { icon: 'notifications',        label: 'Notifications',       route: 'Notifications',       color: '#7C3AED', bg: '#F5F3FF' },
  { icon: 'images',               label: 'Portfolio',           route: 'Portfolio',           color: '#BE185D', bg: '#FDF2F8' },
  { icon: 'briefcase',            label: 'My Services',         route: 'MyServices',          color: '#1D4ED8', bg: '#EFF6FF' },
  { icon: 'arrow-down-circle',    label: 'Incoming Requests',   route: 'IncomingRequests',    color: '#7C3AED', bg: '#F5F3FF' },
  { icon: 'paper-plane',          label: 'Sent Requests',       route: 'SentRequests',        color: '#2563EB', bg: '#EFF6FF' },
  { icon: 'diamond',              label: 'Buy Credits',         route: 'BuyCredits',          color: '#7C3AED', bg: '#F5F3FF' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    credits: 0,
    offeredServices: 0,
    incomingRequests: 0,
    sentRequests: 0,
    reputation: 5.0,
    completedExchanges: 0,
  });
  const [loading, setLoading] = useState(true);
  const [photoUri, setPhotoUri] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
      loadProfilePhoto(user.id).then(uri => { if (uri) setPhotoUri(uri); });
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    const [statsResult, incomingResult, sentResult] = await Promise.all([
      user?.id
        ? userService.getUserStats(user.id).catch(() => ({ success: false }))
        : Promise.resolve({ success: false }),
      transactionService.getTransactions({ type: 'provided' }),
      transactionService.getTransactions({ type: 'requested' }),
    ]);

    const incomingCount = incomingResult.success
      ? (incomingResult.data || []).filter(t => t.status === 'pending').length
      : 0;
    const sentCount = sentResult.success
      ? (sentResult.data || []).filter(t => ['pending', 'accepted', 'in_progress'].includes(t.status)).length
      : 0;

    setStats({
      credits: user?.credits || 0,
      offeredServices: statsResult.success ? (statsResult.data?.services_offered || 0) : 0,
      incomingRequests: incomingCount,
      sentRequests: sentCount,
      reputation: user?.reputation_score || 5.0,
      completedExchanges: statsResult.success ? (statsResult.data?.completed_transactions || 0) : 0,
    });
    setLoading(false);
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Student';
  const initials = (user?.full_name || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary[800]} />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Avatar + greeting */}
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
          accessibilityLabel="Go to Profile"
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.headerPhoto} />
          ) : (
            <PlaceholderAvatar size={52} initials={initials} name={user?.full_name} />
          )}
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
        </TouchableOpacity>

        {/* Notification bell */}
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={24} color={AppColors.white} />
        </TouchableOpacity>
      </View>

      {/* ── Credits Banner ─────────────────────────────── */}
      <TouchableOpacity
        style={styles.creditBanner}
        onPress={() => navigation.navigate('BuyCredits')}
        activeOpacity={0.88}
        accessibilityLabel="Buy Credits"
      >
        <View style={styles.creditLeft}>
          <Text style={styles.creditLabel}>Skill Credits</Text>
          <Text style={styles.creditAmount}>{(user?.credits || 0).toLocaleString()}</Text>
          <Text style={styles.creditSub}>Tap to buy more credits</Text>
        </View>
        <View style={styles.creditIconWrap}>
          <Ionicons name="diamond-outline" size={40} color="rgba(255,255,255,0.85)" />
        </View>
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={AppColors.primary[600]} />
          </View>
        ) : (
          <>
            {/* ── Stats Row ──────────────────────────────── */}
            <View style={styles.statsRow}>
              {[
                { label: 'Incoming', value: stats.incomingRequests,  icon: 'arrow-down-circle', color: '#7C3AED', route: 'IncomingRequests', highlight: stats.incomingRequests > 0 },
                { label: 'Sent',     value: stats.sentRequests,      icon: 'paper-plane',       color: '#2563EB', route: 'SentRequests',    highlight: stats.sentRequests > 0 },
                { label: 'Rating',   value: typeof stats.reputation === 'number' ? stats.reputation.toFixed(1) : '5.0', icon: 'star', color: '#D97706', route: null, highlight: false },
                { label: 'Done',     value: stats.completedExchanges, icon: 'checkmark-circle',  color: '#059669', route: null, highlight: false },
              ].map(({ label, value, icon, color, route, highlight }) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.statCard, highlight && styles.statCardHighlight]}
                  onPress={() => route && navigation.navigate(route)}
                  activeOpacity={route ? 0.7 : 1}
                >
                  <Ionicons name={icon} size={22} color={color} />
                  <Text style={[styles.statValue, { color }]}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                  {highlight && (
                    <View style={styles.statBadge}>
                      <Text style={styles.statBadgeText}>Tap</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Quick Actions ──────────────────────────── */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map(({ icon, label, route, color, bg }) => (
                <TouchableOpacity
                  key={route}
                  style={styles.actionCard}
                  onPress={() => navigation.navigate(route)}
                  activeOpacity={0.72}
                  accessibilityLabel={label}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: bg }]}>
                    <Ionicons name={icon} size={30} color={color} />
                  </View>
                  <Text style={styles.actionLabel} numberOfLines={2}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── CTAs ───────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Get Started</Text>

            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={() => navigation.navigate('ServiceRequestOffer', { mode: 'create' })}
              activeOpacity={0.85}
              accessibilityLabel="Offer a Service"
            >
              <View style={styles.ctaIconWrap}>
                <Ionicons name="add-circle" size={28} color={AppColors.white} />
              </View>
              <View style={styles.ctaTextBlock}>
                <Text style={styles.ctaPrimaryTitle}>Offer a Service</Text>
                <Text style={styles.ctaPrimarySub}>Share your skills with others</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => navigation.navigate('Browse')}
              activeOpacity={0.85}
              accessibilityLabel="Browse Services"
            >
              <View style={[styles.ctaIconWrap, { backgroundColor: AppColors.primary[50] }]}>
                <Ionicons name="search" size={26} color={AppColors.primary[700]} />
              </View>
              <View style={styles.ctaTextBlock}>
                <Text style={styles.ctaSecondaryTitle}>Browse Services</Text>
                <Text style={styles.ctaSecondarySub}>Find skills you need</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={AppColors.primary[400]} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },

  // ── Header ───────────────────────────────────────────
  header: {
    backgroundColor: AppColors.primary[700],
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  greetingBlock: { marginLeft: 14 },
  greeting: { fontSize: 13, color: AppColors.primary[200], fontWeight: '500' },
  userName: { fontSize: 20, fontWeight: '800', color: AppColors.white, marginTop: 1 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // ── Credits Banner ───────────────────────────────────
  creditBanner: {
    backgroundColor: AppColors.primary[600],
    marginHorizontal: 16,
    marginTop: -1,
    marginBottom: 0,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  creditLeft: {},
  creditLabel: { fontSize: 12, color: AppColors.primary[200], fontWeight: '600', letterSpacing: 0.5 },
  creditAmount: { fontSize: 40, fontWeight: '800', color: AppColors.white, marginTop: 2 },
  creditSub: { fontSize: 12, color: AppColors.primary[200], marginTop: 2 },
  creditIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll ───────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 36 },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },

  // ── Stats ────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    ...Shadows.sm,
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: AppColors.neutral[500], fontWeight: '600', textAlign: 'center' },
  statCardHighlight: {
    borderWidth: 1.5,
    borderColor: AppColors.primary[300],
    backgroundColor: AppColors.primary[50],
  },
  statBadge: {
    backgroundColor: AppColors.primary[600],
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  statBadgeText: { fontSize: 9, color: AppColors.white, fontWeight: '700' },

  // ── Quick Actions ─────────────────────────────────────
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.neutral[800],
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    width: '47%',
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...Shadows.sm,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.neutral[700],
    flex: 1,
    lineHeight: 18,
  },

  // ── CTAs ─────────────────────────────────────────────
  ctaPrimary: {
    backgroundColor: AppColors.primary[700],
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    ...Shadows.md,
  },
  ctaSecondary: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: AppColors.primary[200],
    ...Shadows.sm,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ctaTextBlock: { flex: 1 },
  ctaPrimaryTitle: { fontSize: 16, fontWeight: '700', color: AppColors.white },
  ctaPrimarySub: { fontSize: 12, color: AppColors.primary[200], marginTop: 2 },
  ctaSecondaryTitle: { fontSize: 16, fontWeight: '700', color: AppColors.primary[800] },
  ctaSecondarySub: { fontSize: 12, color: AppColors.neutral[500], marginTop: 2 },
});
