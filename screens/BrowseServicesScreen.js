import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import serviceService from '../services/serviceService';
import { useAuth } from '../contexts/AuthContext';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { showAlert } from '../utils/alertHelper';

const CATEGORY_CONFIG = {
  All:          { icon: 'apps',          color: '#6366F1' },
  Programming:  { icon: 'code-slash',    color: '#3B82F6' },
  Languages:    { icon: 'language',      color: '#10B981' },
  Design:       { icon: 'color-palette', color: '#F59E0B' },
  Music:        { icon: 'musical-notes', color: '#EC4899' },
  Academics:    { icon: 'school',        color: '#8B5CF6' },
  Business:     { icon: 'briefcase',     color: '#0891B2' },
  Fitness:      { icon: 'fitness',       color: '#EF4444' },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG);

export default function BrowseServicesScreen({ navigation, route }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const aiServices = route?.params?.aiServices || null;

  useEffect(() => {
    if (aiServices) {
      setServices(aiServices);
      setLoading(false);
    } else {
      fetchServices();
    }
  }, [aiServices]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const result = await serviceService.getAllServices({ status: 'active' });
      if (result.success) {
        setServices(result.data);
      } else {
        showAlert('Error', result.message);
      }
    } catch {
      showAlert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const matchSearch = (s.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
    const notOwn = !user?.id || Number(s.user_id) !== Number(user.id);
    return matchSearch && matchCat && notOwn;
  });

  const getInitials = (name) =>
    (name || '??').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={styles.root}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={AppColors.neutral[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor={AppColors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search Services"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={AppColors.neutral[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* AI banner */}
        {aiServices && (
          <View style={styles.aiBanner}>
            <View style={styles.aiBannerIcon}>
              <Ionicons name="sparkles" size={20} color={AppColors.primary[600]} />
            </View>
            <View style={styles.aiBannerText}>
              <Text style={styles.aiBannerTitle}>AI Recommended</Text>
              <Text style={styles.aiBannerSub}>Personalised matches based on your profile</Text>
            </View>
          </View>
        )}

        {/* Category chips */}
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catList}
          contentContainerStyle={{ paddingHorizontal: Spacing.base }}
          renderItem={({ item }) => {
            const cfg = CATEGORY_CONFIG[item];
            const active = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.catChip,
                  active && { backgroundColor: cfg.color, borderColor: cfg.color },
                ]}
                onPress={() => setSelectedCategory(item)}
                accessibilityLabel={`Filter by ${item}`}
              >
                <Ionicons
                  name={cfg.icon}
                  size={14}
                  color={active ? AppColors.white : cfg.color}
                />
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Services</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredServices.length}</Text>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={AppColors.primary[600]} />
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : filteredServices.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="search-outline" size={36} color={AppColors.neutral[300]} />
            </View>
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptySub}>Try adjusting your search or category filter</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {filteredServices.map((item) => {
              const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.All;
              return (
                <TouchableOpacity
                  key={String(item.id)}
                  style={styles.serviceCard}
                  onPress={() =>
                    navigation.navigate('ServiceRequestOffer', { service: item, mode: 'view' })
                  }
                  activeOpacity={0.75}
                  accessibilityLabel={`View ${item.title}`}
                >
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.catIconWrap, { backgroundColor: cfg.color + '18' }]}>
                      <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                    </View>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.serviceTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={[styles.catTag, { backgroundColor: cfg.color + '18' }]}>
                        <Text style={[styles.catTagText, { color: cfg.color }]}>{item.category}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={AppColors.neutral[300]} />
                  </View>

                  {/* Description */}
                  <Text style={styles.serviceDesc} numberOfLines={2}>
                    {item.description || 'No description available'}
                  </Text>

                  {/* Provider row */}
                  <View style={styles.providerRow}>
                    <PlaceholderAvatar size={26} initials={getInitials(item.provider_name)} name={item.provider_name} />
                    <Text style={styles.providerName}>{item.provider_name || 'Unknown Provider'}</Text>
                    {item.rating > 0 && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={11} color="#D97706" />
                        <Text style={styles.ratingText}>{parseFloat(item.rating).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <Ionicons name="diamond" size={14} color={AppColors.primary[600]} />
                      <Text style={styles.footerCredits}>{item.credits_cost || 0} credits</Text>
                    </View>
                    {item.duration_minutes ? (
                      <View style={styles.footerItem}>
                        <Ionicons name="time-outline" size={14} color={AppColors.neutral[400]} />
                        <Text style={styles.footerMeta}>
                          {item.duration_minutes < 60
                            ? `${item.duration_minutes}m`
                            : `${(item.duration_minutes / 60).toFixed(1)}h`}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.activeDot}>
                      <View style={styles.dot} />
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

  // Search
  searchWrap: {
    backgroundColor: AppColors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral[100],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.neutral[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.neutral[200],
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[800],
  },
  clearBtn: { padding: 4 },

  scroll: { paddingBottom: 32 },

  // AI banner
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary[50],
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
    gap: 12,
  },
  aiBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerText: { flex: 1 },
  aiBannerTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: AppColors.primary[700] },
  aiBannerSub: { fontSize: Typography.fontSize.xs, color: AppColors.primary[500], marginTop: 2 },

  // Categories
  catList: { marginVertical: Spacing.base },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: AppColors.neutral[200],
    backgroundColor: AppColors.white,
    marginRight: 8,
    ...Shadows.sm,
  },
  catChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.neutral[600],
  },
  catChipTextActive: { color: AppColors.white },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[800],
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: AppColors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.primary[600],
  },

  // Loading / Empty
  centerBox: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: Typography.fontSize.sm, color: AppColors.neutral[500] },
  emptyBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
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
  emptySub: { fontSize: Typography.fontSize.sm, color: AppColors.neutral[400], textAlign: 'center', lineHeight: 20 },

  // Service cards
  listWrap: { paddingHorizontal: Spacing.base, gap: 12 },
  serviceCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 12,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardHeaderInfo: { flex: 1 },
  serviceTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
    marginBottom: 4,
  },
  catTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  catTagText: { fontSize: 11, fontWeight: Typography.fontWeight.semibold },

  serviceDesc: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[500],
    lineHeight: 20,
    marginBottom: Spacing.md,
  },

  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral[100],
  },
  providerName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[700],
    fontWeight: Typography.fontWeight.medium,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  ratingText: { fontSize: 12, fontWeight: Typography.fontWeight.bold, color: '#92400E' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerCredits: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.primary[600],
  },
  footerMeta: { fontSize: Typography.fontSize.xs, color: AppColors.neutral[500] },
  activeDot: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  activeText: { fontSize: Typography.fontSize.xs, color: '#059669', fontWeight: Typography.fontWeight.medium },
});
