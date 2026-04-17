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
  Image,
} from 'react-native';
import Card from '../components/Card';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
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
};

const CATEGORY_CONFIG = {
  All: { icon: '📋', color: '#6366F1' },
  Programming: { icon: '💻', color: '#3B82F6' },
  Languages: { icon: '🌍', color: '#10B981' },
  Design: { icon: '🎨', color: '#F59E0B' },
  Music: { icon: '🎵', color: '#EC4899' },
  Academics: { icon: '📚', color: '#8B5CF6' },
};

const categories = ['All', 'Programming', 'Languages', 'Design', 'Music', 'Academics'];

export default function BrowseServicesScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const aiServices = route?.params?.aiServices || null;

  useEffect(() => {
    if (aiServices) {
      // Use AI-recommended services
      setServices(aiServices);
      setLoading(false);
    } else {
      // Fetch all services normally
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
    } catch (error) {
      console.error('Error fetching services:', error);
      showAlert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCategoryConfig = (category) => {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['All'];
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Browse Services</Text>
          <Text style={styles.subtitle}>Discover skills from fellow students</Text>
        </View>
        
        {aiServices && (
          <View style={styles.aiBanner}>
            <Text style={styles.aiBannerIcon}>🤖</Text>
            <View>
              <Text style={styles.aiBannerTitle}>AI Recommended</Text>
              <Text style={styles.aiBannerText}>Personalized matches based on your profile</Text>
            </View>
          </View>
        )}

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor={COLORS.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessible
            accessibilityLabel="Search Services by Name"
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Categories</Text>
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const config = getCategoryConfig(item);
              return (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedCategory === item && { backgroundColor: config.color, borderColor: config.color },
                  ]}
                  onPress={() => setSelectedCategory(item)}
                  accessible
                  accessibilityLabel={`Filter by ${item}`}
                >
                  <Text style={styles.filterChipIcon}>{config.icon}</Text>
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === item && styles.filterChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : (
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Available Services
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredServices.length}</Text>
              </View>
            </View>
            {filteredServices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No services found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
              </View>
            ) : (
              <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const catConfig = getCategoryConfig(item.category);
                  return (
                    <Card
                      onPress={() =>
                        navigation.navigate('ServiceRequestOffer', {
                          service: item,
                          mode: 'view',
                        })
                      }
                    >
                      <View style={styles.serviceCardHeader}>
                        <View style={[styles.categoryIconBadge, { backgroundColor: catConfig.color + '15' }]}>
                          <Text style={styles.categoryIconText}>{catConfig.icon}</Text>
                        </View>
                        <View style={styles.serviceHeaderInfo}>
                          <Text style={styles.serviceTitle}>{item.title}</Text>
                          <View style={[styles.categoryTag, { backgroundColor: catConfig.color + '15' }]}>
                            <Text style={[styles.categoryTagText, { color: catConfig.color }]}>{item.category}</Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {item.description || 'No description available'}
                      </Text>

                      <View style={styles.providerRow}>
                        <PlaceholderAvatar size={28} initials={getInitials(item.provider_name)} />
                        <Text style={styles.providerName}>{item.provider_name || 'Unknown Provider'}</Text>
                      </View>

                      <View style={styles.serviceFooter}>
                        <View style={styles.creditsBadge}>
                          <Text style={styles.creditsIcon}>💰</Text>
                          <Text style={styles.creditsValue}>{item.credits_cost || 0}</Text>
                          <Text style={styles.creditsLabel}>credits</Text>
                        </View>
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationIcon}>⏱️</Text>
                          <Text style={styles.durationValue}>{item.duration_hours || (item.duration_minutes ? (item.duration_minutes / 60).toFixed(1) : 0)}h</Text>
                        </View>
                        <View style={styles.statusBadge}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>Active</Text>
                        </View>
                      </View>
                    </Card>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 16,
  },
  headerSection: {
    marginBottom: 20,
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
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 44,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  filterChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.secondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  servicesSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  categoryIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 22,
  },
  serviceHeaderInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 12,
    lineHeight: 19,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  providerName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    marginLeft: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditsIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  creditsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
    marginRight: 2,
  },
  creditsLabel: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  durationValue: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  aiBannerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  aiBannerText: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
});
