import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { showAlert } from '../utils/alertHelper';

const PACKAGES = [
  { id: 1, credits: 50,   price: '£1.99',  perCredit: '£0.04',  popular: false, bonus: null },
  { id: 2, credits: 100,  price: '£3.49',  perCredit: '£0.035', popular: false, bonus: null },
  { id: 3, credits: 250,  price: '£7.99',  perCredit: '£0.032', popular: true,  bonus: '+25 bonus' },
  { id: 4, credits: 500,  price: '£14.99', perCredit: '£0.030', popular: false, bonus: '+75 bonus' },
  { id: 5, credits: 1000, price: '£24.99', perCredit: '£0.025', popular: false, bonus: '+200 bonus' },
];

export default function BuyCreditsScreen({ navigation }) {
  const [selected, setSelected] = useState(3);

  const handlePurchase = (pkg) => {
    showAlert(
      'Payment Coming Soon',
      `In-app purchases will be available in a future update.\n\nYou selected: ${pkg.credits} credits for ${pkg.price}.\n\nFor now, earn credits by offering and completing services on SkillSwap.`,
      [{ text: 'Got it' }]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary[800]} />

      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="diamond" size={32} color={AppColors.white} />
        </View>
        <Text style={styles.headerTitle}>Buy Credits</Text>
        <Text style={styles.headerSub}>Power up your skill exchange</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={AppColors.primary[600]} />
          <Text style={styles.infoText}>
            Credits are used to request services from other students. Earn credits by offering your own skills.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Choose a Package</Text>

        {PACKAGES.map((pkg) => {
          const isSelected = selected === pkg.id;
          return (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.packageCard, isSelected && styles.packageCardSelected]}
              onPress={() => setSelected(pkg.id)}
              activeOpacity={0.8}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.packageRow}>
                <View style={styles.packageLeft}>
                  <View style={styles.creditAmountRow}>
                    <Ionicons name="diamond" size={18} color={isSelected ? AppColors.primary[600] : AppColors.neutral[400]} />
                    <Text style={[styles.creditAmount, isSelected && styles.creditAmountSelected]}>
                      {pkg.credits.toLocaleString()}
                    </Text>
                    <Text style={styles.creditLabel}>credits</Text>
                  </View>
                  {pkg.bonus && (
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusText}>{pkg.bonus}</Text>
                    </View>
                  )}
                  <Text style={styles.perCredit}>{pkg.perCredit} per credit</Text>
                </View>

                <View style={styles.packageRight}>
                  <Text style={[styles.price, isSelected && styles.priceSelected]}>{pkg.price}</Text>
                  <View style={[styles.selectDot, isSelected && styles.selectDotActive]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color={AppColors.white} />}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Purchase button */}
        {(() => {
          const pkg = PACKAGES.find(p => p.id === selected);
          return (
            <TouchableOpacity
              style={styles.purchaseBtn}
              onPress={() => handlePurchase(pkg)}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={20} color={AppColors.white} />
              <Text style={styles.purchaseBtnText}>
                Purchase {pkg.credits} Credits · {pkg.price}
              </Text>
            </TouchableOpacity>
          );
        })()}

        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={AppColors.neutral[400]} />
          <Text style={styles.securityText}>Secure payments · No subscription · Credits never expire</Text>
        </View>

        <Text style={styles.earnTitle}>Or earn credits for free</Text>

        {[
          { icon: 'add-circle-outline', color: '#2563EB', text: 'Offer a service and get paid in credits when completed' },
          { icon: 'git-compare-outline', color: '#059669', text: 'Match skills with other students and exchange directly' },
          { icon: 'star-outline', color: '#D97706', text: 'Build your reputation to attract more service requests' },
        ].map(({ icon, color, text }) => (
          <View key={text} style={styles.earnItem}>
            <View style={[styles.earnIcon, { backgroundColor: color + '15' }]}>
              <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.earnText}>{text}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.offerBtn}
          onPress={() => navigation.navigate('ServiceRequestOffer', { mode: 'create' })}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={18} color={AppColors.primary[700]} />
          <Text style={styles.offerBtnText}>Offer a Service</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

  header: {
    backgroundColor: AppColors.primary[700],
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    ...Shadows.lg,
  },
  headerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: AppColors.white,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary[200],
    fontWeight: Typography.fontWeight.medium,
  },

  scroll: { flex: 1 },
  content: { padding: Spacing.base, paddingBottom: 48 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: AppColors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: AppColors.primary[700],
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[800],
    marginBottom: Spacing.md,
  },

  packageCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: AppColors.neutral[100],
    ...Shadows.sm,
  },
  packageCardSelected: {
    borderColor: AppColors.primary[400],
    backgroundColor: AppColors.primary[50],
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primary[600],
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: Spacing.sm,
  },
  popularText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
    letterSpacing: 0.3,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageLeft: { flex: 1 },
  creditAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  creditAmount: {
    fontSize: 26,
    fontWeight: Typography.fontWeight.extrabold,
    color: AppColors.neutral[700],
  },
  creditAmountSelected: { color: AppColors.primary[700] },
  creditLabel: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[400],
    fontWeight: Typography.fontWeight.medium,
    marginTop: 4,
  },
  bonusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bonusText: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.semibold,
    color: '#059669',
  },
  perCredit: {
    fontSize: 11,
    color: AppColors.neutral[400],
    marginTop: 2,
  },
  packageRight: { alignItems: 'flex-end', gap: 8 },
  price: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.extrabold,
    color: AppColors.neutral[700],
  },
  priceSelected: { color: AppColors.primary[700] },
  selectDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.neutral[300],
    backgroundColor: AppColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectDotActive: {
    backgroundColor: AppColors.primary[600],
    borderColor: AppColors.primary[600],
  },

  purchaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppColors.primary[700],
    borderRadius: BorderRadius.xl,
    paddingVertical: 18,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  purchaseBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
  },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.xl,
  },
  securityText: {
    fontSize: 11,
    color: AppColors.neutral[400],
    textAlign: 'center',
  },

  earnTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.neutral[700],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  earnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  earnText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[600],
    lineHeight: 20,
  },

  offerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: AppColors.primary[300],
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    marginTop: Spacing.sm,
    backgroundColor: AppColors.white,
  },
  offerBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.primary[700],
  },
});
