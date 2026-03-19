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
import Card from '../components/Card';
import serviceService from '../services/serviceService';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Browse Services</Text>
        
        {aiServices && (
          <View style={styles.aiBanner}>
            <Text style={styles.aiBannerText}>🤖 AI Recommended Services</Text>
          </View>
        )}

        <View style={styles.searchBox}>
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
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCategory === item && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(item)}
                accessible
                accessibilityLabel={`Filter by ${item}`}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === item && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>
              Available Services ({filteredServices.length})
            </Text>
            {filteredServices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No services found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
              </View>
            ) : (
              <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Card
                    onPress={() =>
                      navigation.navigate('ServiceRequestOffer', {
                        service: item,
                        mode: 'view',
                      })
                    }
                  >
                    <Text style={styles.serviceTitle}>{item.title}</Text>
                    <Text style={styles.serviceUser}>{item.provider_name || 'Unknown Provider'}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                      {item.description || 'No description available'}
                    </Text>
                    <View style={styles.serviceFooter}>
                      <Text style={styles.serviceCredits}>💰 {item.credits_cost || 0} credits</Text>
                      <Text style={styles.serviceDuration}>⏱️ {item.duration_hours || 0}h</Text>
                      <Text style={styles.serviceCategory}>{item.category}</Text>
                    </View>
                  </Card>
                )}
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
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  searchBox: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  serviceUser: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 18,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  serviceCredits: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  serviceDuration: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  serviceCategory: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  aiBanner: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  aiBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
});
