import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import transactionService from '../services/transactionService';
import { loadProfilePhoto } from '../utils/profilePhoto';
import { AppColors, Shadows } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLLAPSE_AT = 80;
const CREDIT_BANNER_H = 112;

// ── Action definitions ────────────────────────────────────────────────────────

const TOOLS_ACTIONS = [
  { icon: 'chatbubbles',   label: 'Messages',        route: 'Messages',       color: '#0D9488', bg: '#F0FDFA' },
  { icon: 'calendar',      label: 'Calendar',        route: 'Calendar',       color: '#D97706', bg: '#FFFBEB' },
  { icon: 'notifications', label: 'Notifications',   route: 'Notifications',  color: '#7C3AED', bg: '#F5F3FF' },
  { icon: 'images',        label: 'Portfolio',       route: 'Portfolio',      color: '#BE185D', bg: '#FDF2F8' },
  { icon: 'briefcase',     label: 'My Services',     route: 'MyServices',     color: '#1D4ED8', bg: '#EFF6FF' },
  { icon: 'git-compare',   label: 'Skill Matches',   route: 'SkillMatching',  color: '#059669', bg: '#ECFDF5' },
  { icon: 'diamond',       label: 'Buy Credits',     route: 'BuyCredits',     color: '#7C3AED', bg: '#F5F3FF' },
  { icon: 'time',          label: 'Service History', route: 'ServiceHistory', color: '#059669', bg: '#ECFDF5' },
];

const ACTIVITY_ACTIONS = [
  { icon: 'arrow-down-circle', label: 'Incoming Requests', route: 'IncomingRequests', color: '#7C3AED', bg: '#F5F3FF' },
  { icon: 'paper-plane',       label: 'Sent Requests',     route: 'SentRequests',     color: '#2563EB', bg: '#EFF6FF' },
];

const DISCOVER_ACTIONS = [
  { icon: 'search',   label: 'Browse Services', route: 'Browse',      color: '#2563EB', bg: '#EFF6FF' },
  { icon: 'location', label: 'Nearby Students', route: 'NearbyUsers', color: '#0891B2', bg: '#ECFEFF' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function ActionCard({ icon, label, route, color, bg, navigation, badge }) {
  return (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={() => navigation.navigate(route)}
      activeOpacity={0.72}
      accessibilityLabel={label}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={26} color={color} />
        {badge > 0 && (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionGrid({ items, navigation, badges = {} }) {
  return (
    <View style={styles.actionsGrid}>
      {items.map(({ icon, label, route, color, bg }) => (
        <ActionCard
          key={route}
          icon={icon}
          label={label}
          route={route}
          color={color}
          bg={bg}
          navigation={navigation}
          badge={badges[route] || 0}
        />
      ))}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const safeTop = insets.top || 24;

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

  // Header collapse interpolations — always respect device safe area
  const headerPaddingTop = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT],
    outputRange: [safeTop + 14, safeTop + 4],
    extrapolate: 'clamp',
  });
  const headerPaddingBottom = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT],
    outputRange: [16, 10],
    extrapolate: 'clamp',
  });
  const expandedOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT * 0.55],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const compactOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_AT * 0.45, COLLAPSE_AT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const creditBannerHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT],
    outputRange: [CREDIT_BANNER_H, 0],
    extrapolate: 'clamp',
  });
  const creditBannerOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_AT * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const badges = {
    IncomingRequests: stats.incomingRequests,
    SentRequests: stats.sentRequests,
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary[700]} />

      {/* ── Animated Header ───────────────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: headerPaddingTop, paddingBottom: headerPaddingBottom }]}>
        {/* Avatar — always visible */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
          accessibilityLabel="Go to Profile"
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.headerPhoto} />
          ) : (
            <PlaceholderAvatar size={44} initials={initials} name={user?.full_name} />
          )}
        </TouchableOpacity>

        {/* Center slot: cross-fade between expanded and compact */}
        <View style={styles.headerCenter}>
          {/* Expanded greeting */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: expandedOpacity, justifyContent: 'center' }]}>
            <Text style={styles.greeting} numberOfLines={1}>{getGreeting()},</Text>
            <Text style={styles.userName} numberOfLines={1}>{firstName}</Text>
          </Animated.View>

          {/* Compact info */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: compactOpacity, justifyContent: 'center' }]}>
            <Text style={styles.compactName} numberOfLines={1}>{firstName}</Text>
            <View style={styles.compactCreditsRow}>
              <Ionicons name="diamond" size={12} color={AppColors.primary[200]} />
              <Text style={styles.compactCreditsText}>{(user?.credits || 0).toLocaleString()} credits</Text>
            </View>
          </Animated.View>
        </View>

        {/* Notification bell — always visible */}
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={24} color={AppColors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Credits Banner (collapses on scroll) ─────────── */}
      <Animated.View style={{ height: creditBannerHeight, opacity: creditBannerOpacity, overflow: 'hidden' }}>
        <TouchableOpacity
          style={styles.creditBanner}
          onPress={() => navigation.navigate('BuyCredits')}
          activeOpacity={0.88}
          accessibilityLabel="Buy Credits"
        >
          <View>
            <Text style={styles.creditLabel}>Skill Credits</Text>
            <Text style={styles.creditAmount}>{(user?.credits || 0).toLocaleString()}</Text>
            <Text style={styles.creditSub}>Tap to buy more</Text>
          </View>
          <View style={styles.creditIconWrap}>
            <Ionicons name="diamond-outline" size={36} color="rgba(255,255,255,0.85)" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Scrollable Content ────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={AppColors.primary[600]} />
          </View>
        ) : (
          <>
            {/* ── Stats Row ────────────────────────────────── */}
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
                  {highlight && <View style={styles.statDot} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Activity ─────────────────────────────────── */}
            <SectionHeader title="Activity" />
            <View style={styles.sectionBody}>
              <ActionGrid items={ACTIVITY_ACTIONS} navigation={navigation} badges={badges} />
            </View>

            {/* ── Quick Actions ─────────────────────────────── */}
            <SectionHeader title="Quick Actions" />
            <View style={styles.sectionBody}>
              <ActionGrid items={TOOLS_ACTIONS} navigation={navigation} />
            </View>

            {/* ── Discover ──────────────────────────────────── */}
            <SectionHeader title="Discover" />
            <View style={styles.sectionBody}>
              <ActionGrid items={DISCOVER_ACTIONS} navigation={navigation} />
            </View>

            {/* ── Get Started ───────────────────────────────── */}
            <SectionHeader title="Get Started" />
            <View style={[styles.sectionBody, { paddingBottom: 0 }]}>
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
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },

  // ── Header ───────────────────────────────────────────────
  header: {
    backgroundColor: AppColors.primary[700],
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  headerCenter: {
    flex: 1,
    height: 44,
  },
  greeting: {
    fontSize: 12,
    color: AppColors.primary[200],
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.white,
    marginTop: 1,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.white,
  },
  compactCreditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  compactCreditsText: {
    fontSize: 12,
    color: AppColors.primary[200],
    fontWeight: '600',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Credits Banner ───────────────────────────────────────
  creditBanner: {
    backgroundColor: AppColors.primary[600],
    marginHorizontal: 16,
    marginTop: -1,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  creditLabel: { fontSize: 11, color: AppColors.primary[200], fontWeight: '600', letterSpacing: 0.5 },
  creditAmount: { fontSize: 34, fontWeight: '800', color: AppColors.white, marginTop: 1 },
  creditSub: { fontSize: 11, color: AppColors.primary[200], marginTop: 2 },
  creditIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll ───────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },

  // ── Stats ────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: AppColors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    ...Shadows.sm,
  },
  statValue: { fontSize: 19, fontWeight: '800' },
  statLabel: { fontSize: 10, color: AppColors.neutral[500], fontWeight: '600', textAlign: 'center' },
  statCardHighlight: {
    borderWidth: 1.5,
    borderColor: AppColors.primary[300],
    backgroundColor: AppColors.primary[50],
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AppColors.primary[500],
    marginTop: 2,
  },

  // ── Section headers ──────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.neutral[500],
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.neutral[200],
  },
  sectionBody: {
    marginBottom: 28,
  },

  // ── Action grid ──────────────────────────────────────────
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.sm,
  },
  actionIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: AppColors.primary[600],
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  actionBadgeText: { fontSize: 9, color: AppColors.white, fontWeight: '700' },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.neutral[700],
    flex: 1,
    lineHeight: 18,
  },

  // ── CTA ──────────────────────────────────────────────────
  ctaPrimary: {
    backgroundColor: AppColors.primary[700],
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...Shadows.md,
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
});
