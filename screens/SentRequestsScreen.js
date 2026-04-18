import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import transactionService from '../services/transactionService';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: AppColors.warning[600],  bg: AppColors.warning[50],  icon: 'time-outline' },
  accepted:    { label: 'Accepted',    color: AppColors.success[600],  bg: AppColors.success[50],  icon: 'checkmark-circle-outline' },
  in_progress: { label: 'In Progress', color: AppColors.info[600],     bg: AppColors.info[50],     icon: 'sync-outline' },
  completed:   { label: 'Completed',   color: AppColors.neutral[500],  bg: AppColors.neutral[100], icon: 'checkmark-done-outline' },
  cancelled:   { label: 'Cancelled',   color: AppColors.error[600],    bg: AppColors.error[50],    icon: 'close-circle-outline' },
  disputed:    { label: 'Disputed',    color: '#BE123C',               bg: '#FFF1F2',              icon: 'alert-circle-outline' },
};

export default function SentRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await transactionService.getTransactions({ type: 'requested' });
      if (result.success) setRequests(result.data);
    } catch {
      // silently fail, empty list shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const unsubscribe = navigation.addListener('focus', fetchRequests);
    return unsubscribe;
  }, [fetchRequests, navigation]);

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const canAct = item.status === 'accepted' || item.status === 'in_progress';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <PlaceholderAvatar
            size={46}
            initials={(item.provider_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            name={item.provider_name}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.providerName}>{item.provider_name || 'Unknown'}</Text>
            <Text style={styles.serviceTitle} numberOfLines={1}>{item.service_title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="diamond-outline" size={13} color={AppColors.primary[600]} />
            <Text style={styles.metaText}>{item.credits_amount} credits</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={AppColors.neutral[400]} />
            <Text style={styles.metaText}>
              {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          {item.category ? (
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={13} color={AppColors.neutral[400]} />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
          ) : null}
        </View>

        {item.notes ? (
          <View style={styles.notesBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={AppColors.neutral[400]} />
            <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
          </View>
        ) : null}

        {canAct && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.btnChat}
              onPress={() => navigation.navigate('Chat', {
                userId: item.provider_id,
                userName: item.provider_name || 'Provider',
              })}
            >
              <Ionicons name="chatbubble-outline" size={15} color={AppColors.primary[700]} />
              <Text style={styles.btnChatText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPay}
              onPress={() => navigation.navigate('ServiceCompletion', {
                transactionId: item.id,
                serviceTitle: item.service_title,
                providerName: item.provider_name,
                creditsAmount: item.credits_amount,
                status: item.status,
              })}
            >
              <Ionicons name="diamond" size={15} color={AppColors.white} />
              <Text style={styles.btnPayText}>Pay {item.credits_amount} Credits</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AppColors.primary[600]} />
        <Text style={styles.loadingText}>Loading sent requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {requests.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="paper-plane-outline" size={44} color={AppColors.primary[300]} />
          </View>
          <Text style={styles.emptyTitle}>No requests sent yet</Text>
          <Text style={styles.emptySubtext}>
            When you request a service from another user it will appear here so you can track its status.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchRequests}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

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
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[800],
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[400],
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: Spacing.md,
  },
  headerInfo: { flex: 1 },
  providerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
  },
  serviceTitle: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.neutral[500],
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.semibold,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.fontSize.xs, color: AppColors.neutral[500] },

  notesBox: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    backgroundColor: AppColors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: AppColors.neutral[100],
  },
  notesText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: AppColors.neutral[600],
    lineHeight: 18,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.sm,
  },
  btnChat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: AppColors.primary[300],
    backgroundColor: AppColors.primary[50],
  },
  btnChatText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.primary[700],
  },
  btnPay: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: AppColors.primary[600],
  },
  btnPayText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
  },
});
