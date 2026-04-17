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
import Card from '../components/Card';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import serviceService from '../services/serviceService';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F8FAFC',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#E5E7EB',
  primary: '#6366F1',
  primaryLight: '#EEF2FF',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
};

const SKILL_CATEGORIES = [
  { key: 'All', label: 'All', icon: '📋' },
  { key: 'Programming', label: 'Programming', icon: '💻' },
  { key: 'Design', label: 'Design', icon: '🎨' },
  { key: 'Academics', label: 'Academics', icon: '📚' },
  { key: 'Languages', label: 'Languages', icon: '🌍' },
  { key: 'Music', label: 'Music', icon: '🎵' },
  { key: 'Business', label: 'Business', icon: '📊' },
  { key: 'Fitness', label: 'Fitness', icon: '💪' },
];

const SORT_OPTIONS = [
  { key: 'relevance', label: '🎯 Best Match' },
  { key: 'rating', label: '⭐ Top Rated' },
  { key: 'price_low', label: '💰 Lowest Price' },
  { key: 'price_high', label: '💎 Highest Price' },
  { key: 'newest', label: '🆕 Newest' },
];

export default function SkillMatchingScreen({ navigation }) {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const result = await serviceService.getAllServices({ status: 'active' });
      if (result.success) {
        // Filter out current user's own services
        const otherServices = (result.data || []).filter(s => s.user_id !== user?.id);
        setServices(otherServices);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  // Compute match score for a service based on user's skills
  const getMatchScore = (service) => {
    if (!user?.skills || user.skills.length === 0) return 50; // default if no skills set
    const userNeeded = user.skills
      .filter(s => s.skill_type === 'needed')
      .map(s => s.skill_name.toLowerCase());
    const serviceTitle = (service.title || '').toLowerCase();
    const serviceDesc = (service.description || '').toLowerCase();
    const serviceCategory = (service.category || '').toLowerCase();

    let score = 30; // base
    for (const need of userNeeded) {
      if (serviceTitle.includes(need) || serviceDesc.includes(need)) {
        score += 35;
        break;
      }
      // partial word match
      const words = need.split(' ');
      for (const word of words) {
        if (word.length > 3 && (serviceTitle.includes(word) || serviceDesc.includes(word))) {
          score += 20;
          break;
        }
      }
    }
    // Boost by provider rating
    const providerRating = parseFloat(service.provider_rating) || 0;
    if (providerRating >= 4.5) score += 15;
    else if (providerRating >= 3.5) score += 10;
    else if (providerRating > 0) score += 5;

    return Math.min(score, 98);
  };

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let result = [...services];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.provider_name || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category === selectedCategory);
    }

    // Score each service
    result = result.map(s => ({ ...s, matchScore: getMatchScore(s) }));

    // Sort
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (parseFloat(b.provider_rating) || 0) - (parseFloat(a.provider_rating) || 0));
        break;
      case 'price_low':
        result.sort((a, b) => (a.credits_cost || 0) - (b.credits_cost || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.credits_cost || 0) - (a.credits_cost || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'relevance':
      default:
        result.sort((a, b) => b.matchScore - a.matchScore);
        break;
    }

    return result;
  }, [services, searchQuery, selectedCategory, sortBy]);

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMatchColor = (score) => {
    if (score >= 70) return { bg: COLORS.successLight, text: COLORS.success, label: 'Great Match' };
    if (score >= 45) return { bg: COLORS.warningLight, text: '#92400E', label: 'Good Match' };
    return { bg: COLORS.primaryLight, text: COLORS.primary, label: 'Explore' };
  };

  const formatDuration = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const renderService = ({ item }) => {
    const matchInfo = getMatchColor(item.matchScore);
    return (
      <Card style={styles.matchCard}>
        {/* Match badge */}
        <View style={[styles.matchBadge, { backgroundColor: matchInfo.bg }]}>
          <Text style={[styles.matchBadgeText, { color: matchInfo.text }]}>
            {matchInfo.label} · {item.matchScore}%
          </Text>
        </View>

        {/* Provider info */}
        <View style={styles.matchHeader}>
          <PlaceholderAvatar size={48} initials={getInitials(item.provider_name)} />
          <View style={styles.matchInfo}>
            <Text style={styles.serviceTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.providerName}>{item.provider_name || 'Student'}</Text>
            <View style={styles.statsRow}>
              {item.provider_rating > 0 && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingIcon}>⭐</Text>
                  <Text style={styles.rating}>
                    {parseFloat(item.provider_rating).toFixed(1)}
                  </Text>
                </View>
              )}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {(SKILL_CATEGORIES.find(c => c.key === item.category) || {}).icon || '📋'} {item.category}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>

        {/* Details row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Credits</Text>
            <Text style={styles.detailValue}>🪙 {item.credits_cost}</Text>
          </View>
          {item.duration_minutes && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>⏱️ {formatDuration(item.duration_minutes)}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: COLORS.success }]}>✅ Available</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              showAlert(
                item.title,
                `${item.description}\n\nProvider: ${item.provider_name || 'N/A'}\nCategory: ${item.category}\nCredits: ${item.credits_cost}\nDuration: ${formatDuration(item.duration_minutes) || 'Flexible'}\nRating: ${item.provider_rating ? parseFloat(item.provider_rating).toFixed(1) + ' ⭐' : 'New provider'}`
              );
            }}
          >
            <Text style={styles.secondaryBtnText}>📄 Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              navigation.navigate('Messages', {
                screen: 'Chat',
                params: {
                  user: item.provider_name,
                  initials: getInitials(item.provider_name),
                  recipientId: item.user_id,
                  online: true,
                },
              })
            }
          >
            <Text style={styles.primaryBtnText}>💬 Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.requestBtn}
            onPress={() =>
              navigation.navigate('ServiceRequestOffer', {
                service: item,
                provider: { id: item.user_id, full_name: item.provider_name },
              })
            }
          >
            <Text style={styles.requestBtnText}>📩 Request</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const currentSort = SORT_OPTIONS.find(s => s.key === sortBy);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Skill Exchange</Text>
            <Text style={styles.subtitle}>
              Find the perfect skill swap among Kingston students
            </Text>
          </View>

          {/* Your skills summary */}
          {user?.skills && user.skills.length > 0 && (
            <View style={styles.mySkillsCard}>
              <Text style={styles.mySkillsTitle}>Your Profile</Text>
              <View style={styles.mySkillsRow}>
                <View style={styles.mySkillGroup}>
                  <Text style={styles.mySkillGroupLabel}>🟢 I Can Teach</Text>
                  <View style={styles.mySkillTags}>
                    {user.skills.filter(s => s.skill_type === 'offered').slice(0, 3).map((s, i) => (
                      <View key={i} style={styles.mySkillTag}>
                        <Text style={styles.mySkillTagText}>{s.skill_name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.mySkillGroup}>
                  <Text style={styles.mySkillGroupLabel}>🔴 I Want to Learn</Text>
                  <View style={styles.mySkillTags}>
                    {user.skills.filter(s => s.skill_type === 'needed').slice(0, 3).map((s, i) => (
                      <View key={i} style={[styles.mySkillTag, styles.mySkillTagNeeded]}>
                        <Text style={[styles.mySkillTagText, { color: '#B91C1C' }]}>{s.skill_name}</Text>
                      </View>
                    ))}
                    {user.skills.filter(s => s.skill_type === 'needed').length === 0 && (
                      <Text style={styles.noSkillHint}>Add needed skills in your profile for better matches</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Search */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search skills, topics, or people..."
              placeholderTextColor={COLORS.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          <FlatList
            data={SKILL_CATEGORIES}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === item.key && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(item.key)}
              >
                <Text style={styles.categoryChipIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === item.key && styles.categoryChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Sort & results count */}
          <View style={styles.sortRow}>
            <Text style={styles.resultsCount}>
              {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} found
            </Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortMenu(!showSortMenu)}
            >
              <Text style={styles.sortButtonText}>{currentSort?.label || 'Sort'}</Text>
              <Text style={styles.sortArrow}>{showSortMenu ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          </View>

          {/* Sort dropdown */}
          {showSortMenu && (
            <View style={styles.sortMenu}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.sortOption, sortBy === option.key && styles.sortOptionActive]}
                  onPress={() => {
                    setSortBy(option.key);
                    setShowSortMenu(false);
                  }}
                >
                  <Text style={[styles.sortOptionText, sortBy === option.key && styles.sortOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Main content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Finding best matches...</Text>
            </View>
          ) : filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No services found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to offer a skill to the community!'}
              </Text>
              {(searchQuery || selectedCategory !== 'All') && (
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  <Text style={styles.clearFiltersBtnText}>Clear all filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredServices}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  // My skills card
  mySkillsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mySkillsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  mySkillsRow: {
    gap: 12,
  },
  mySkillGroup: {
    gap: 6,
  },
  mySkillGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  mySkillTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mySkillTag: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mySkillTagNeeded: {
    backgroundColor: COLORS.dangerLight,
  },
  mySkillTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  noSkillHint: {
    fontSize: 12,
    color: COLORS.secondary,
    fontStyle: 'italic',
  },
  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  clearBtn: {
    fontSize: 16,
    color: COLORS.secondary,
    paddingLeft: 8,
  },
  // Categories
  categoryList: {
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  // Sort
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortButtonText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  sortArrow: {
    fontSize: 10,
    color: COLORS.secondary,
    marginLeft: 4,
  },
  sortMenu: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortOptionActive: {
    backgroundColor: COLORS.primaryLight,
  },
  sortOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  sortOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Match card
  matchCard: {
    marginBottom: 16,
    position: 'relative',
  },
  matchBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    lineHeight: 22,
  },
  providerName: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ratingIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  rating: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  // Details row
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.secondary,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  requestBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  requestBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Loading & empty
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  clearFiltersBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  clearFiltersBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
