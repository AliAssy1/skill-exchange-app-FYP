import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../components/InputField';
import Button from '../components/Button';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import serviceService from '../services/serviceService';
import transactionService from '../services/transactionService';
import { showAlert } from '../utils/alertHelper';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const CATEGORY_ICONS = {
  Programming: 'code-slash',
  Design:      'color-palette',
  Languages:   'language',
  Music:       'musical-notes',
  Academics:   'school',
  Business:    'briefcase',
  Fitness:     'fitness',
};

export default function ServiceRequestOfferScreen({ route, navigation }) {
  const { service = {}, mode = 'view' } = route.params || {};
  const { user, updateUser } = useAuth();
  const [message, setMessage]             = useState('');
  const [offerTitle, setOfferTitle]       = useState('');
  const [offerDesc, setOfferDesc]         = useState('');
  const [offerCategory, setOfferCategory] = useState('');
  const [offerCredits, setOfferCredits]   = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [loading, setLoading]             = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const isViewMode  = mode === 'view';
  const userCredits = user?.credits || 0;
  const serviceCost = service?.credits_cost || 0;
  const canAfford   = userCredits >= serviceCost;
  const isOwn       = service.user_id != null && Number(service.user_id) === Number(user?.id);
  const catIcon     = CATEGORY_ICONS[service.category] || 'apps';

  const handleRequestService = async () => {
    if (!canAfford) {
      showAlert(
        'Insufficient Credits',
        `You need ${serviceCost} credits but only have ${userCredits}. Earn more by offering your skills!`
      );
      return;
    }
    setRequestLoading(true);
    try {
      const result = await transactionService.createTransaction({
        service_id: service.id,
        notes: message,
      });
      if (result.success) {
        try { await updateUser(); } catch { /* ignore */ }
        showAlert(
          'Request Sent!',
          `Your request for "${service.title}" has been sent to the provider. They will accept or decline it shortly.`
        );
        navigation.goBack();
      } else {
        showAlert('Error', result.message || 'Failed to request service');
      }
    } catch (error) {
      showAlert('Error', error.message || 'Failed to request service. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handlePostService = async () => {
    if (!offerTitle || !offerDesc || !offerCategory || !offerCredits) {
      showAlert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const result = await serviceService.createService({
        title: offerTitle,
        description: offerDesc,
        category: offerCategory,
        skill_required: skillsRequired,
        credits_cost: parseInt(offerCredits),
        duration_minutes: 60,
      });
      if (result.success) {
        navigation.goBack();
        showAlert('Success', 'Your service has been posted!');
      } else {
        showAlert('Error', result.message || 'Failed to post service');
      }
    } catch {
      showAlert('Error', 'Failed to post service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isViewMode) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <StatusBar barStyle="light-content" backgroundColor={AppColors.primary[800]} />

        {/* Hero header */}
        <View style={styles.heroHeader}>
          <View style={styles.catIconWrap}>
            <Ionicons name={catIcon} size={28} color={AppColors.white} />
          </View>
          <Text style={styles.heroTitle} numberOfLines={2}>{service.title || 'Service Details'}</Text>
          <View style={styles.heroBadgeRow}>
            {service.category ? (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{service.category}</Text>
              </View>
            ) : null}
            {service.status === 'active' && (
              <View style={[styles.heroBadge, styles.heroBadgeGreen]}>
                <View style={styles.activeDot} />
                <Text style={[styles.heroBadgeText, { color: '#ECFDF5' }]}>Active</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Credit balance card */}
          <View style={styles.creditsCard}>
            <View style={styles.creditsItem}>
              <Text style={styles.creditsLabel}>Service Cost</Text>
              <View style={styles.creditsValueRow}>
                <Ionicons name="diamond" size={18} color={AppColors.primary[600]} />
                <Text style={styles.creditsValue}>{serviceCost}</Text>
                <Text style={styles.creditsUnit}>credits</Text>
              </View>
            </View>
            <View style={styles.creditsDivider} />
            <View style={styles.creditsItem}>
              <Text style={styles.creditsLabel}>Your Balance</Text>
              <View style={styles.creditsValueRow}>
                <Ionicons name="wallet" size={18} color={canAfford ? '#059669' : AppColors.error[600]} />
                <Text style={[styles.creditsValue, { color: canAfford ? '#059669' : AppColors.error[600] }]}>
                  {userCredits}
                </Text>
                <Text style={styles.creditsUnit}>credits</Text>
              </View>
            </View>
          </View>
          {!canAfford && (
            <View style={styles.insufficientBanner}>
              <Ionicons name="warning" size={16} color={AppColors.warning[600]} />
              <Text style={styles.insufficientText}>
                You need {serviceCost - userCredits} more credits to request this service
              </Text>
            </View>
          )}

          {/* Provider card */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Service Provider</Text>
            <View style={styles.providerRow}>
              <PlaceholderAvatar
                size={52}
                initials={(service.provider_name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                name={service.provider_name}
              />
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{service.provider_name || 'Unknown'}</Text>
                {service.rating > 0 ? (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#D97706" />
                    <Text style={styles.ratingText}>{parseFloat(service.rating).toFixed(1)} rating</Text>
                  </View>
                ) : (
                  <Text style={styles.newProvider}>New provider</Text>
                )}
              </View>
              {!isOwn && (
                <TouchableOpacity
                  style={styles.msgBtn}
                  onPress={() =>
                    navigation.navigate('Chat', {
                      userId: service.user_id,
                      userName: service.provider_name || 'Provider',
                    })
                  }
                >
                  <Ionicons name="chatbubble-outline" size={18} color={AppColors.primary[600]} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About This Service</Text>
            <Text style={styles.descText}>
              {service.description ||
                `This service offers professional assistance in ${(service.title || '').toLowerCase()}. Perfect for students looking to learn or exchange skills.`}
            </Text>
          </View>

          {/* Details grid */}
          <View style={styles.detailsGrid}>
            {[
              { icon: 'apps', label: 'Category', value: service.category || '—' },
              { icon: 'diamond-outline', label: 'Credits', value: `${serviceCost} credits` },
              { icon: 'time-outline', label: 'Duration',
                value: service.duration_minutes
                  ? service.duration_minutes < 60
                    ? `${service.duration_minutes}min`
                    : `${(service.duration_minutes / 60).toFixed(1)}h`
                  : '1h' },
              { icon: 'star-outline', label: 'Rating', value: service.rating ? `${parseFloat(service.rating).toFixed(1)} / 5` : 'No reviews' },
            ].map(({ icon, label, value }) => (
              <View key={label} style={styles.detailItem}>
                <View style={styles.detailIconWrap}>
                  <Ionicons name={icon} size={18} color={AppColors.primary[600]} />
                </View>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Message input */}
          <InputField
            label="Your Message (Optional)"
            placeholder="Introduce yourself and why you're interested..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            accessibilityLabel="Message to Service Provider"
          />

          {/* Action buttons */}
          <View style={styles.actionSection}>
            {isOwn ? (
              <View style={styles.ownServiceBanner}>
                <Ionicons name="information-circle-outline" size={20} color={AppColors.primary[600]} />
                <Text style={styles.ownServiceText}>
                  This is your service. Log into a different account to request services from others.
                </Text>
              </View>
            ) : (
              <>
                <Button
                  title={requestLoading ? 'Requesting...' : `Request Service · ${serviceCost} credits`}
                  onPress={handleRequestService}
                  disabled={requestLoading || !canAfford}
                  loading={requestLoading}
                  size="large"
                  accessibilityLabel="Request This Service"
                />
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() =>
                    navigation.navigate('Chat', {
                      userId: service.user_id,
                      userName: service.provider_name || 'Provider',
                    })
                  }
                >
                  <Ionicons name="chatbubble-outline" size={18} color={AppColors.primary[600]} />
                  <Text style={styles.secondaryBtnText}>Message Provider</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => navigation.navigate('ServiceRequestOffer', { mode: 'create' })}
            >
              <Ionicons name="add-circle-outline" size={18} color={AppColors.neutral[600]} />
              <Text style={styles.ghostBtnText}>Offer Your Own Service</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Create mode ──────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.createRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.createContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.createHeader}>
        <View style={styles.createHeaderIcon}>
          <Ionicons name="add-circle" size={28} color={AppColors.primary[600]} />
        </View>
        <View>
          <Text style={styles.createTitle}>Create a Service</Text>
          <Text style={styles.createSub}>Share your skills with other students</Text>
        </View>
      </View>

      <InputField
        label="Service Title *"
        placeholder="What service are you offering?"
        value={offerTitle}
        onChangeText={setOfferTitle}
        accessibilityLabel="Service Title Input"
      />
      <InputField
        label="Description *"
        placeholder="Describe your service in detail..."
        value={offerDesc}
        onChangeText={setOfferDesc}
        multiline
        numberOfLines={5}
        accessibilityLabel="Service Description Input"
      />
      <InputField
        label="Category *"
        placeholder="e.g. Programming, Design, Languages"
        value={offerCategory}
        onChangeText={setOfferCategory}
        accessibilityLabel="Category Input"
      />
      <InputField
        label="Credits Cost *"
        placeholder="How many credits to charge?"
        value={offerCredits}
        onChangeText={setOfferCredits}
        keyboardType="numeric"
        accessibilityLabel="Credits Cost Input"
      />
      <InputField
        label="Skills Required (Optional)"
        placeholder="Any prerequisites for students?"
        value={skillsRequired}
        onChangeText={setSkillsRequired}
        accessibilityLabel="Skills Required Input"
      />

      <View style={styles.createFootnote}>
        <Ionicons name="information-circle-outline" size={14} color={AppColors.neutral[400]} />
        <Text style={styles.createFootnoteText}>
          Students will be able to see and request your service after it's posted.
        </Text>
      </View>

      <Button
        title="Post Service"
        onPress={handlePostService}
        loading={loading}
        disabled={loading}
        size="large"
        accessibilityLabel="Post Service Offer"
      />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

  // Hero header (view mode)
  heroHeader: {
    backgroundColor: AppColors.primary[700],
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  catIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.extrabold,
    color: AppColors.white,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  heroBadgeRow: { flexDirection: 'row', gap: 8 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  heroBadgeGreen: { backgroundColor: 'rgba(16,185,129,0.3)' },
  heroBadgeText: { fontSize: 12, fontWeight: Typography.fontWeight.semibold, color: AppColors.white },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6EE7B7' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: 40 },

  // Credits card
  creditsCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  creditsItem: { flex: 1, alignItems: 'center' },
  creditsDivider: { width: 1, backgroundColor: AppColors.neutral[100], marginVertical: 4 },
  creditsLabel: { fontSize: Typography.fontSize.xs, color: AppColors.neutral[400], marginBottom: 6, fontWeight: Typography.fontWeight.medium },
  creditsValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  creditsValue: { fontSize: 22, fontWeight: Typography.fontWeight.extrabold, color: AppColors.neutral[900] },
  creditsUnit: { fontSize: Typography.fontSize.xs, color: AppColors.neutral[400] },

  insufficientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.warning[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  insufficientText: { flex: 1, fontSize: Typography.fontSize.xs, color: AppColors.warning[600], fontWeight: Typography.fontWeight.medium },

  // Sections
  section: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerInfo: { flex: 1 },
  providerName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: AppColors.neutral[900] },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { fontSize: Typography.fontSize.xs, color: '#92400E', fontWeight: Typography.fontWeight.medium },
  newProvider: { fontSize: Typography.fontSize.xs, color: AppColors.neutral[400], marginTop: 3 },
  msgBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: AppColors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary[50],
  },
  descText: { fontSize: Typography.fontSize.sm, color: AppColors.neutral[600], lineHeight: 22 },

  // Details grid
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    width: '47%',
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadows.sm,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  detailLabel: { fontSize: 11, color: AppColors.neutral[400], fontWeight: Typography.fontWeight.medium },
  detailValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: AppColors.neutral[800], textAlign: 'center' },

  // Action buttons
  actionSection: { marginTop: Spacing.sm, gap: 10 },
  ownServiceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: AppColors.primary[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  ownServiceText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary[700],
    lineHeight: 20,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: AppColors.primary[300],
    backgroundColor: AppColors.primary[50],
  },
  secondaryBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: AppColors.primary[700] },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: AppColors.neutral[200],
    backgroundColor: AppColors.white,
  },
  ghostBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: AppColors.neutral[600] },

  // Create mode
  createRoot: { flex: 1, backgroundColor: AppColors.neutral[50] },
  createContent: { padding: Spacing.base, paddingBottom: 40 },
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  createHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: AppColors.neutral[900] },
  createSub: { fontSize: Typography.fontSize.xs, color: AppColors.neutral[400], marginTop: 2 },
  createFootnote: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    padding: Spacing.md,
    backgroundColor: AppColors.neutral[100],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
  },
  createFootnoteText: { flex: 1, fontSize: 12, color: AppColors.neutral[500], lineHeight: 18 },
});
