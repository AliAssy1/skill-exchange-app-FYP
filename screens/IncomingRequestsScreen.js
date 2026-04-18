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
import { showAlert } from '../utils/alertHelper';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: AppColors.warning[600],  bg: AppColors.warning[50],  icon: 'time-outline' },
  accepted:    { label: 'Accepted',    color: AppColors.success[600],  bg: AppColors.success[50],  icon: 'checkmark-circle-outline' },
  in_progress: { label: 'In Progress', color: AppColors.info[600],     bg: AppColors.info[50],     icon: 'sync-outline' },
  completed:   { label: 'Completed',   color: AppColors.neutral[500],  bg: AppColors.neutral[100], icon: 'checkmark-done-outline' },
  cancelled:   { label: 'Cancelled',   color: AppColors.error[600],    bg: AppColors.error[50],    icon: 'close-circle-outline' },
  disputed:    { label: 'Disputed',    color: '#BE123C',               bg: '#FFF1F2',              icon: 'alert-circle-outline' },
};

export default function IncomingRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await transactionService.getTransactions({ type: 'provided' });
      if (result.success) {
        setRequests(result.data);
      } else {
        showAlert('Error', result.message || 'Failed to load requests');
      }
    } catch {
      showAlert('Error', 'Failed to load incoming requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const unsubscribe = navigation.addListener('focus', fetchRequests);
    return unsubscribe;
  }, [fetchRequests, navigation]);

  const handleAccept = async (item) => {
    setActionLoading(item.id + '_accept');
    const result = await transactionService.updateTransactionStatus(item.id, 'accepted');
    setActionLoading(null);
    if (result.success) {
      setRequests(prev => prev.map(r => r.id === item.id ? { ...r, status: 'accepted' } : r));
      navigation.navigate('Chat', {
        userId: item.requester_id,
        userName: item.requester_name || 'User',
      });
    } else {
      showAlert('Error', result.message || 'Failed to accept request');
    }
  };

  const handleDecline = (item) => {
    showAlert(
      'Decline Request',
      `Decline the request from ${item.requester_name} for "${item.service_title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(item.id + '_decline');
            const result = await transactionService.updateTransactionStatus(item.id, 'cancelled');
            setActionLoading(null);
            if (result.success) {
              setRequests(prev => prev.map(r => r.id === item.id ? { ...r, status: 'cancelled' } : r));
            } else {
              showAlert('Error', result.message || 'Failed to decline request');
            }
          },
        },
      ]
    );
  };

  const handleMarkComplete = (item) => {
    navigation.navigate('ServiceCompletion', {
      transactionId: item.id,
      serviceTitle: item.service_title,
      providerName: item.provider_name,
      creditsAmount: item.credits_amount,
      status: item.status,
    });
  };

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isPending = item.status === 'pending';
    const canComplete = item.status === 'accepted' || item.status === 'in_progress';
    const acceptActing = actionLoading === item.id + '_accept';
    const declineActing = actionLoading === item.id + '_decline';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <PlaceholderAvatar
            size={46}
            initials={(item.requester_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            name={item.requester_name}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.requesterName}>{item.requester_name || 'Unknown'}</Text>
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

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btnDecline, declineActing && styles.btnDisabled]}
              onPress={() => handleDecline(item)}
              disabled={!!(acceptActing || declineActing)}
            >
              {declineActing
                ? <ActivityIndicator size="small" color={AppColors.error[600]} />
                : <>
                    <Ionicons name="close" size={15} color={AppColors.error[600]} />
                    <Text style={styles.btnDeclineText}>Decline</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnAccept, acceptActing && styles.btnDisabled]}
              onPress={() => handleAccept(item)}
              disabled={!!(acceptActing || declineActing)}
            >
              {acceptActing
                ? <ActivityIndicator size="small" color={AppColors.white} />
                : <>
                    <Ionicons name="checkmark" size={15} color={AppColors.white} />
                    <Text style={styles.btnAcceptText}>Accept</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

        {canComplete && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.btnChat}
              onPress={() => navigation.navigate('Chat', { userId: item.requester_id, userName: item.requester_name || 'User' })}
            >
              <Ionicons name="chatbubble-outline" size={15} color={AppColors.primary[700]} />
              <Text style={styles.btnChatText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnComplete, { flex: 2 }]} onPress={() => handleMarkComplete(item)}>
              <Ionicons name="checkmark-done" size={15} color={AppColors.white} />
              <Text style={styles.btnCompleteText}>Mark Complete</Text>
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
        <Text style={styles.loadingText}>Loading incoming requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {requests.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="inbox-outline" size={44} color={AppColors.primary[300]} />
          </View>
          <Text style={styles.emptyTitle}>No incoming requests yet</Text>
          <Text style={styles.emptySubtext}>
            When someone requests one of your services, it will appear here. You can then accept or decline.
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
  requesterName: {
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
  btnDecline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: AppColors.error[500],
    backgroundColor: AppColors.error[50],
  },
  btnDeclineText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.error[600],
  },
  btnAccept: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: AppColors.success[600],
  },
  btnAcceptText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
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
  btnComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: BorderRadius.lg,
    backgroundColor: AppColors.primary[600],
  },
  btnCompleteText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
  },
  btnDisabled: { opacity: 0.6 },
});
