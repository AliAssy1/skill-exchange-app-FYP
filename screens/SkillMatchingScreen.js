import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import serviceService from '../services/serviceService';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const CATEGORIES = [
  { key: 'All',          label: 'All',         icon: 'apps' },
  { key: 'Programming',  label: 'Programming',  icon: 'code-slash' },
  { key: 'Design',       label: 'Design',       icon: 'color-palette' },
  { key: 'Academics',    label: 'Academics',    icon: 'school' },
  { key: 'Languages',    label: 'Languages',    icon: 'language' },
  { key: 'Music',        label: 'Music',        icon: 'musical-notes' },
  { key: 'Business',     label: 'Business',     icon: 'briefcase' },
  { key: 'Fitness',      label: 'Fitness',      icon: 'fitness' },
];

const SORT_OPTIONS = [
  { key: 'relevance',  label: 'Best Match',    icon: 'git-compare' },
  { key: 'rating',     label: 'Top Rated',     icon: 'star' },
  { key: 'price_low',  label: 'Lowest Price',  icon: 'arrow-down' },
  { key: 'price_high', label: 'Highest Price', icon: 'arrow-up' },
  { key: 'newest',     label: 'Newest',        icon: 'time' },
];

export default function SkillMatchingScreen({ navigation }) {
  const { user } = useAuth();
  const [services, setServices]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [sortBy, setSortBy]           = useState('relevance');
  const [showSort, setShowSort]       = useState(false);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const result = await serviceService.getAllServices({ status: 'active' });
      if (result.success) {
        setServices((result.data || []).filter((s) => s.user_id !== user?.id));
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMatchScore = (service) => {
    if (!user?.skills?.length) return 50;
    const needed = user.skills
      .filter((s) => s.skill_type === 'needed')
      .map((s) => s.skill_name.toLowerCase());
    const title = (service.title || '').toLowerCase();
    const desc  = (service.description || '').toLowerCase();
    let score = 30;
    for (const n of needed) {
      if (title.includes(n) || desc.includes(n)) { score += 35; break; }
      for (const word of n.split(' ')) {
        if (word.length > 3 && (title.includes(word) || desc.includes(word))) { score += 20; break; }
      }
    }
    const r = parseFloat(service.provider_rating) || 0;
    score += r >= 4.5 ? 15 : r >= 3.5 ? 10 : r > 0 ? 5 : 0;
    return Math.min(score, 98);
  };

  const filtered = useMemo(() => {
    let res = [...services];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter((s) =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.provider_name || '').toLowerCase().includes(q)
      );
    }
    if (selectedCat !== 'All') res = res.filter((s) => s.category === selectedCat);
    res = res.map((s) => ({ ...s, matchScore: getMatchScore(s) }));
    switch (sortBy) {
      case 'rating':     res.sort((a, b) => (parseFloat(b.provider_rating) || 0) - (parseFloat(a.provider_rating) || 0)); break;
      case 'price_low':  res.sort((a, b) => (a.credits_cost || 0) - (b.credits_cost || 0)); break;
      case 'price_high': res.sort((a, b) => (b.credits_cost || 0) - (a.credits_cost || 0)); break;
      case 'newest':     res.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
      default:           res.sort((a, b) => b.matchScore - a.matchScore);
    }
    return res;
  }, [services, searchQuery, selectedCat, sortBy]);

  const getMatchStyle = (score) => {
    if (score >= 70) return { bg: '#ECFDF5', color: '#059669', label: 'Great Match' };
    if (score >= 45) return { bg: '#FFFBEB', color: '#D97706', label: 'Good Match' };
    return { bg: AppColors.primary[50], color: AppColors.primary[600], label: 'Explore' };
  };

  const fmtDuration = (m) => {
    if (!m) return null;
    return m < 60 ? `${m}min` : `${(m / 60).toFixed(1)}h`;
  };

  const currentSort = SORT_OPTIONS.find((s) => s.key === sortBy);

  const renderService = ({ item }) => {
    const match = getMatchStyle(item.matchScore);
    return (
      <View style={styles.matchCard}>
        {/* Match badge */}
        <View style={[styles.matchBadge, { backgroundColor: match.bg }]}>
          <Ionicons name="git-compare-outline" size={12} color={match.color} />
          <Text style={[styles.matchBadgeText, { color: match.color }]}>
            {match.label} · {item.matchScore}%
          </Text>
        </View>

        {/* Provider + title */}
        <View style={styles.cardTopRow}>
          <PlaceholderAvatar size={48} initials={(item.provider_name || '??').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)} name={item.provider_name} />
          <View style={styles.cardTopInfo}>
            <Text style={styles.serviceTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.providerName}>{item.provider_name || 'Student'}</Text>
            <View style={styles.badgeRow}>
              {item.provider_rating > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={11} color="#D97706" />
                  <Text style={styles.ratingText}>{parseFloat(item.provider_rating).toFixed(1)}</Text>
                </View>
              )}
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{item.category}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="diamond-outline" size={15} color={AppColors.primary[600]} />
            <Text style={styles.statValue}>{item.credits_cost}</Text>
            <Text style={styles.statLabel}>credits</Text>
          </View>
          {item.duration_minutes ? (
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={15} color={AppColors.neutral[400]} />
              <Text style={styles.statValue}>{fmtDuration(item.duration_minutes)}</Text>
              <Text style={styles.statLabel}>duration</Text>
            </View>
          ) : null}
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={15} color="#059669" />
            <Text style={[styles.statValue, { color: '#059669' }]}>Available</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => navigation.navigate('ServiceRequestOffer', { service: item, mode: 'view' })}
          >
            <Ionicons name="document-text-outline" size={16} color={AppColors.neutral[700]} />
            <Text style={styles.btnOutlineText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() =>
              navigation.navigate('Chat', {
                userId: item.user_id,
                userName: item.provider_name || 'Provider',
              })
            }
          >
            <Ionicons name="chatbubble-outline" size={16} color={AppColors.white} />
            <Text style={styles.btnPrimaryText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSuccess}
            onPress={() =>
              navigation.navigate('ServiceRequestOffer', {
                service: item,
                mode: 'view',
                provider: { id: item.user_id, full_name: item.provider_name },
              })
            }
          >
            <Ionicons name="send-outline" size={16} color={AppColors.white} />
            <Text style={styles.btnSuccessText}>Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchServices(); }}
            colors={[AppColors.primary[600]]}
          />
        }
      >
        {/* Your skills card */}
        {user?.skills && user.skills.length > 0 && (
          <View style={styles.mySkillsCard}>
            <Text style={styles.mySkillsTitle}>Your Skills Profile</Text>
            <View style={styles.skillsRow}>
              <View style={styles.skillGroup}>
                <View style={styles.skillGroupHeader}>
                  <View style={[styles.skillDot, { backgroundColor: '#059669' }]} />
                  <Text style={styles.skillGroupLabel}>I Can Teach</Text>
                </View>
                <View style={styles.tagRow}>
                  {user.skills.filter((s) => s.skill_type === 'offered').slice(0, 3).map((s, i) => (
                    <View key={i} style={styles.tagOffer}>
                      <Text style={styles.tagOfferText}>{s.skill_name}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.skillGroup}>
                <View style={styles.skillGroupHeader}>
                  <View style={[styles.skillDot, { backgroundColor: AppColors.primary[500] }]} />
                  <Text style={styles.skillGroupLabel}>I Want to Learn</Text>
                </View>
                <View style={styles.tagRow}>
                  {user.skills.filter((s) => s.skill_type === 'needed').slice(0, 3).map((s, i) => (
                    <View key={i} style={styles.tagNeed}>
                      <Text style={styles.tagNeedText}>{s.skill_name}</Text>
                    </View>
                  ))}
                  {user.skills.filter((s) => s.skill_type === 'needed').length === 0 && (
                    <Text style={styles.noSkillHint}>Add needed skills in your profile</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={AppColors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search skills, topics, providers..."
              placeholderTextColor={AppColors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={AppColors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category chips */}
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catList}
          contentContainerStyle={{ paddingHorizontal: Spacing.base }}
          renderItem={({ item }) => {
            const active = selectedCat === item.key;
            return (
              <TouchableOpacity
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setSelectedCat(item.key)}
              >
                <Ionicons name={item.icon} size={14} color={active ? AppColors.white : AppColors.neutral[500]} />
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Sort row */}
        <View style={styles.sortRow}>
          <Text style={styles.resultsCount}>
            {filtered.length} {filtered.length === 1 ? 'service' : 'services'} found
          </Text>
          <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
            <Ionicons name={currentSort?.icon || 'options-outline'} size={14} color={AppColors.primary[600]} />
            <Text style={styles.sortBtnText}>{currentSort?.label || 'Sort'}</Text>
            <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={14} color={AppColors.neutral[400]} />
          </TouchableOpacity>
        </View>

        {/* Sort dropdown */}
        {showSort && (
          <View style={styles.sortMenu}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortOption, sortBy === opt.key && styles.sortOptionActive]}
                onPress={() => { setSortBy(opt.key); setShowSort(false); }}
              >
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={sortBy === opt.key ? AppColors.primary[600] : AppColors.neutral[400]}
                />
                <Text style={[styles.sortOptionText, sortBy === opt.key && styles.sortOptionTextActive]}>
                  {opt.label}
                </Text>
                {sortBy === opt.key && <Ionicons name="checkmark" size={16} color={AppColors.primary[600]} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Main list */}
        <View style={styles.listWrap}>
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={AppColors.primary[600]} />
              <Text style={styles.loadingText}>Finding best matches...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="search-outline" size={36} color={AppColors.neutral[300]} />
              </View>
              <Text style={styles.emptyTitle}>No services found</Text>
              <Text style={styles.emptySub}>
                {searchQuery || selectedCat !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to offer a skill!'}
              </Text>
              {(searchQuery || selectedCat !== 'All') && (
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={() => { setSearchQuery(''); setSelectedCat('All'); }}
                >
                  <Text style={styles.clearFiltersBtnText}>Clear all filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderService}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

  // Skills card
  mySkillsCard: {
    backgroundColor: AppColors.white,
    margin: Spacing.base,
    marginBottom: 0,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: AppColors.neutral[100],
    ...Shadows.sm,
  },
  mySkillsTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: AppColors.neutral[800], marginBottom: Spacing.sm },
  skillsRow: { gap: 12 },
  skillGroup: { gap: 6 },
  skillGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillDot: { width: 8, height: 8, borderRadius: 4 },
  skillGroupLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: AppColors.neutral[500] },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagOffer: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
  tagOfferText: { fontSize: 12, fontWeight: Typography.fontWeight.semibold, color: '#059669' },
  tagNeed: { backgroundColor: AppColors.primary[50], paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
  tagNeedText: { fontSize: 12, fontWeight: Typography.fontWeight.semibold, color: AppColors.primary[700] },
  noSkillHint: { fontSize: 12, color: AppColors.neutral[400], fontStyle: 'italic' },

  // Search
  searchWrap: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: AppColors.neutral[200],
    ...Shadows.sm,
  },
  searchInput: { flex: 1, fontSize: Typography.fontSize.sm, color: AppColors.neutral[800] },

  // Categories
  catList: { marginVertical: Spacing.md },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: AppColors.neutral[200],
    backgroundColor: AppColors.white,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: AppColors.primary[600], borderColor: AppColors.primary[600] },
  catChipText: { fontSize: 12, fontWeight: Typography.fontWeight.semibold, color: AppColors.neutral[600] },
  catChipTextActive: { color: AppColors.white },

  // Sort
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  resultsCount: { fontSize: Typography.fontSize.xs, color: AppColors.neutral[500] },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.neutral[200],
  },
  sortBtnText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: AppColors.primary[600] },
  sortMenu: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: AppColors.neutral[200],
    overflow: 'hidden',
    ...Shadows.md,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral[100],
  },
  sortOptionActive: { backgroundColor: AppColors.primary[50] },
  sortOptionText: { fontSize: Typography.fontSize.sm, color: AppColors.neutral[700] },
  sortOptionTextActive: { color: AppColors.primary[700], fontWeight: Typography.fontWeight.semibold },

  // List
  listWrap: { paddingHorizontal: Spacing.base, paddingBottom: 32 },

  // Match card
  matchCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: 12,
    ...Shadows.md,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  matchBadgeText: { fontSize: 12, fontWeight: Typography.fontWeight.bold },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: Spacing.md },
  cardTopInfo: { flex: 1 },
  serviceTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: AppColors.neutral[900], lineHeight: 22, marginBottom: 2 },
  providerName: { fontSize: Typography.fontSize.xs, color: AppColors.neutral[500], marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  ratingText: { fontSize: 11, fontWeight: Typography.fontWeight.bold, color: '#92400E' },
  catBadge: {
    backgroundColor: AppColors.primary[50],
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  catBadgeText: { fontSize: 11, fontWeight: Typography.fontWeight.medium, color: AppColors.primary[600] },

  description: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[500],
    lineHeight: 20,
    marginBottom: Spacing.md,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginBottom: Spacing.md,
    gap: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 13, fontWeight: Typography.fontWeight.bold, color: AppColors.neutral[800] },
  statLabel: { fontSize: 10, color: AppColors.neutral[400], fontWeight: Typography.fontWeight.medium },

  actionRow: { flexDirection: 'row', gap: 8 },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: AppColors.neutral[200],
    backgroundColor: AppColors.white,
  },
  btnOutlineText: { fontSize: 13, fontWeight: Typography.fontWeight.semibold, color: AppColors.neutral[700] },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: AppColors.primary[600],
  },
  btnPrimaryText: { fontSize: 13, fontWeight: Typography.fontWeight.semibold, color: AppColors.white },
  btnSuccess: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#059669',
  },
  btnSuccessText: { fontSize: 13, fontWeight: Typography.fontWeight.semibold, color: AppColors.white },

  // Loading / Empty
  centerBox: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: Typography.fontSize.sm, color: AppColors.neutral[400] },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: AppColors.neutral[700], marginBottom: 6 },
  emptySub: { fontSize: Typography.fontSize.sm, color: AppColors.neutral[400], textAlign: 'center', paddingHorizontal: 32, marginBottom: 16, lineHeight: 20 },
  clearFiltersBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: AppColors.primary[50],
  },
  clearFiltersBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: AppColors.primary[600] },
});
