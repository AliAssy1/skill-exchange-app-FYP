import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import transactionService from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle' },
  disputed:  { label: 'Disputed',  color: '#B45309', bg: '#FFFBEB', icon: 'alert-circle' },
};

const HISTORY_STATUSES = ['completed', 'cancelled', 'disputed'];

export default function ServiceHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('received');
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const result = await transactionService.getTransactions({ type: 'all' }).catch(() => ({ success: false }));
    if (result.success) {
      setAll((result.data || []).filter(t => HISTORY_STATUSES.includes(t.status)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
    const unsub = navigation.addListener('focus', fetchHistory);
    return unsub;
  }, [fetchHistory, navigation]);

  const received = all.filter(t => t.requester_id === user?.id);
  const provided = all.filter(t => t.provider_id === user?.id);
  const items = tab === 'received' ? received : provided;

  const getOther = (item) =>
    tab === 'received'
      ? { id: item.provider_id, name: item.provider_name }
      : { id: item.requester_id, name: item.requester_name };

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.completed;
    const other = getOther(item);
    const initials = (other.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const isReceived = tab === 'received';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <PlaceholderAvatar size={46} initials={initials} name={other.name} />
          <View style={styles.headerInfo}>
            <Text style={styles.serviceTitle} numberOfLines={1}>{item.service_title}</Text>
            <Text style={styles.otherName} numberOfLines={1}>
              {isReceived ? 'Provider: ' : 'Requested by: '}
              <Text style={styles.otherNameBold}>{other.name || 'Unknown'}</Text>
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="diamond-outline" size={13} color={AppColors.primary[600]} />
            <Text style={styles.metaText}>
              {isReceived ? `-${item.credits_amount}` : `+${item.credits_amount}`} credits
            </Text>
          </View>
          {item.category && (
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={13} color={AppColors.neutral[400]} />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={AppColors.neutral[400]} />
            <Text style={styles.metaText}>
              {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.btnMessage}
            onPress={() => navigation.navigate('Chat', { userId: other.id, userName: other.name || 'User' })}
          >
            <Ionicons name="chatbubble-outline" size={15} color={AppColors.primary[700]} />
            <Text style={styles.btnMessageText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnReport}
            onPress={() => navigation.navigate('ReportModeration', { transactionId: item.id, reportedUserId: other.id, reportedUserName: other.name })}
          >
            <Ionicons name="flag-outline" size={15} color={AppColors.error[600]} />
            <Text style={styles.btnReportText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'received' && styles.tabActive]}
          onPress={() => setTab('received')}
        >
          <Ionicons
            name="arrow-down-circle-outline"
            size={16}
            color={tab === 'received' ? AppColors.primary[600] : AppColors.neutral[400]}
          />
          <Text style={[styles.tabText, tab === 'received' && styles.tabTextActive]}>
            Received ({received.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'provided' && styles.tabActive]}
          onPress={() => setTab('provided')}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={16}
            color={tab === 'provided' ? AppColors.primary[600] : AppColors.neutral[400]}
          />
          <Text style={[styles.tabText, tab === 'provided' && styles.tabTextActive]}>
            Provided ({provided.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary[600]} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name={tab === 'received' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
              size={44}
              color={AppColors.primary[300]}
            />
          </View>
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySub}>
            {tab === 'received'
              ? 'Services you have requested will appear here once completed or ended.'
              : 'Services you have provided to others will appear here once completed or ended.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchHistory}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

  tabs: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral[100],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: AppColors.primary[600],
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.neutral[400],
  },
  tabTextActive: { color: AppColors.primary[600] },

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
  serviceTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[900],
  },
  otherName: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.neutral[500],
    marginTop: 2,
  },
  otherNameBold: { fontWeight: Typography.fontWeight.semibold, color: AppColors.neutral[700] },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: { fontSize: 11, fontWeight: Typography.fontWeight.semibold },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.fontSize.xs, color: AppColors.neutral[500] },

  actionRow: { flexDirection: 'row', gap: 10 },
  btnMessage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: AppColors.primary[300],
    backgroundColor: AppColors.primary[50],
  },
  btnMessageText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.primary[700],
  },
  btnReport: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: AppColors.error[200],
    backgroundColor: AppColors.error[50],
  },
  btnReportText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.error[600],
  },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  loadingText: { marginTop: Spacing.md, fontSize: Typography.fontSize.sm, color: AppColors.neutral[400] },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: AppColors.primary[50],
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[800],
    marginBottom: Spacing.sm,
  },
  emptySub: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[400],
    textAlign: 'center',
    lineHeight: 22,
  },
});
