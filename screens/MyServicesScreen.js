import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import serviceService from '../services/serviceService';
import { showAlert } from '../utils/alertHelper';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

export default function MyServicesScreen({ navigation }) {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyServices = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await serviceService.getUserServices(user.id);
      if (result.success) {
        const data = result.data;
        setServices(Array.isArray(data) ? data : data?.services || []);
      } else {
        showAlert('Error', result.message || 'Failed to load your services');
      }
    } catch {
      showAlert('Error', 'Failed to load your services');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMyServices();
    const unsubscribe = navigation.addListener('focus', fetchMyServices);
    return unsubscribe;
  }, [fetchMyServices, navigation]);

  const handleDelete = (serviceId, serviceTitle) => {
    showAlert(
      'Delete Service',
      `Are you sure you want to delete "${serviceTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await serviceService.deleteService(serviceId);
            if (result.success) {
              setServices(prev => prev.filter(s => s.id !== serviceId));
            } else {
              showAlert('Error', result.message || 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const renderService = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="briefcase-outline" size={20} color={AppColors.primary[600]} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.creditsWrap}>
          <Ionicons name="diamond" size={14} color={AppColors.primary[600]} />
          <Text style={styles.creditsText}>{item.credits_cost}</Text>
        </View>
      </View>

      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, item.status === 'active' ? styles.dotActive : styles.dotInactive]} />
          <Text style={styles.statusText}>{item.status || 'active'}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id, item.title)}
          accessibilityLabel="Delete Service"
        >
          <Ionicons name="trash-outline" size={15} color={AppColors.error[600]} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Services</Text>
          <Text style={styles.headerSubtitle}>Services you offer to others</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ServiceRequestOffer', { mode: 'create' })}
          accessibilityLabel="Add New Service"
        >
          <Ionicons name="add" size={18} color={AppColors.white} />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Incoming Requests banner */}
      <TouchableOpacity
        style={styles.requestsBanner}
        onPress={() => navigation.navigate('IncomingRequests')}
        activeOpacity={0.85}
      >
        <View style={styles.requestsBannerLeft}>
          <View style={styles.requestsIconWrap}>
            <Ionicons name="arrow-down-circle" size={22} color={AppColors.primary[600]} />
          </View>
          <View>
            <Text style={styles.requestsBannerTitle}>Incoming Requests</Text>
            <Text style={styles.requestsBannerSub}>Accept or decline service requests</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={AppColors.primary[400]} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary[600]} />
          <Text style={styles.loadingText}>Loading your services...</Text>
        </View>
      ) : services.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="briefcase-outline" size={40} color={AppColors.primary[300]} />
          </View>
          <Text style={styles.emptyTitle}>No services yet</Text>
          <Text style={styles.emptySubtext}>Start offering your skills to other students</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('ServiceRequestOffer', { mode: 'create' })}
          >
            <Ionicons name="add-circle-outline" size={18} color={AppColors.white} />
            <Text style={styles.createBtnText}>Create Your First Service</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={item => String(item.id)}
          renderItem={renderService}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchMyServices}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    paddingTop: Spacing.lg,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral[100],
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.neutral[400],
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primary[600],
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
  },
  addBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
  },

  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: AppColors.primary[100],
    padding: Spacing.base,
  },
  requestsBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  requestsBannerTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.primary[800],
  },
  requestsBannerSub: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.primary[500],
    marginTop: 1,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[400],
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.neutral[800],
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[400],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: 13,
    borderRadius: BorderRadius.xl,
  },
  createBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
  },

  list: { padding: Spacing.base, paddingBottom: 40 },

  card: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
    marginBottom: 3,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  categoryText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.primary[700],
  },
  creditsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.lg,
  },
  creditsText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.primary[700],
  },
  cardDesc: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[500],
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral[100],
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: AppColors.success[500] },
  dotInactive: { backgroundColor: AppColors.neutral[300] },
  statusText: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.neutral[500],
    textTransform: 'capitalize',
    fontWeight: Typography.fontWeight.medium,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: AppColors.error[200],
    backgroundColor: AppColors.error[50],
  },
  deleteBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.error[600],
  },
});
