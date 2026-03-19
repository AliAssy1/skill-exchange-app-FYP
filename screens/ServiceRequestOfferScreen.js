import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import InputField from '../components/InputField';
import { showAlert } from '../utils/alertHelper';
import Button from '../components/Button';
import Card from '../components/Card';
import serviceService from '../services/serviceService';
import transactionService from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
};

export default function ServiceRequestOfferScreen({ route, navigation }) {
  const { service = {}, mode = 'view' } = route.params || {};
  const { user, updateUser } = useAuth();
  const [message, setMessage] = useState('');
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerCategory, setOfferCategory] = useState('');
  const [offerCredits, setOfferCredits] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const isViewMode = mode === 'view';
  const userCredits = user?.credits || 0;
  const serviceCost = service?.credits_cost || 0;
  const canAfford = userCredits >= serviceCost;

  const handleRequestService = async () => {
    if (!canAfford) {
      showAlert('Insufficient Credits', `You need ${serviceCost} credits but only have ${userCredits}. Earn more credits by offering your skills to other students!`);
      return;
    }

    setRequestLoading(true);
    try {
      const result = await transactionService.createTransaction({
        service_id: service.id,
        notes: message,
      });

      if (result.success) {
        // Refresh user data to update credit balance
        try { await updateUser(); } catch(e) {}
        showAlert('Service Requested!', `You have requested "${service.title}". ${serviceCost} credits will be deducted when the session is completed.`);
        navigation.navigate('ServiceCompletion', {
          transactionId: result.data?.transaction_id || result.transaction_id,
          serviceTitle: service.title,
          providerName: service.provider_name || service.user || 'Provider',
          creditsAmount: serviceCost,
          status: 'Pending',
        });
      } else {
        showAlert('Error', result.message || 'Failed to request service');
      }
    } catch (error) {
      console.error('Request service error:', error);
      showAlert('Error', error.message || 'Failed to request service. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handlePostService = async () => {
    if (!offerTitle || !offerDescription || !offerCategory || !offerCredits) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const serviceData = {
        title: offerTitle,
        description: offerDescription,
        category: offerCategory,
        skill_required: skillsRequired,
        credits_cost: parseInt(offerCredits),
        duration_minutes: 60
      };

      const result = await serviceService.createService(serviceData);
      
      if (result.success) {
        showAlert('Success', 'Service posted successfully!');
        navigation.navigate('Browse');
      } else {
        showAlert('Error', result.message || 'Failed to post service');
      }
    } catch (error) {
      console.error('Post service error:', error);
      showAlert('Error', 'Failed to post service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        {isViewMode ? (
          <>
            <Text style={styles.title}>{service.title || 'Service Details'}</Text>

            <Card style={styles.creditCard}>
              <View style={styles.creditRow}>
                <View style={styles.creditItem}>
                  <Text style={styles.creditLabel}>Service Cost</Text>
                  <Text style={styles.creditValue}>💰 {serviceCost} credits</Text>
                </View>
                <View style={styles.creditDivider} />
                <View style={styles.creditItem}>
                  <Text style={styles.creditLabel}>Your Balance</Text>
                  <Text style={[styles.creditValue, !canAfford && styles.creditInsufficient]}>
                    💎 {userCredits} credits
                  </Text>
                </View>
              </View>
              {!canAfford && (
                <Text style={styles.insufficientText}>
                  ⚠️ You need {serviceCost - userCredits} more credits to request this service
                </Text>
              )}
            </Card>

            <Card>
              <Text style={styles.label}>Service Provider</Text>
              <Text style={styles.value}>{service.provider_name || service.user || 'Unknown'}</Text>
            </Card>

            <Card>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.value}>{service.category}</Text>
            </Card>

            <Card>
              <Text style={styles.label}>Rating</Text>
              <Text style={styles.value}>★ {service.rating || 'N/A'}</Text>
            </Card>

            <Text style={styles.sectionTitle}>About This Service</Text>
            <Card>
              <Text style={styles.descriptionText}>
                {service.description || `This service offers professional assistance in ${service.title?.toLowerCase()}. Perfect for students looking to learn or exchange their own skills.`}
              </Text>
            </Card>

            <InputField
              label="Your Message (Optional)"
              placeholder="Introduce yourself and why you're interested..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              accessibilityLabel="Message to Service Provider"
            />

            <View style={styles.buttonGroup}>
              <Button
                title={requestLoading ? 'Requesting...' : `Request Service (${serviceCost} credits)`}
                onPress={handleRequestService}
                disabled={requestLoading || !canAfford}
                loading={requestLoading}
                accessibilityLabel="Request This Service"
              />
              <Button
                title="Offer Your Service"
                variant="secondary"
                onPress={() => {
                  navigation.navigate('ServiceRequestOffer', { mode: 'create' });
                }}
                accessibilityLabel="Offer Your Own Service"
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Create Service Offer</Text>
            <Text style={styles.subtitle}>
              Offer a service to other students
            </Text>

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
              value={offerDescription}
              onChangeText={setOfferDescription}
              multiline
              numberOfLines={5}
              accessibilityLabel="Service Description Input"
            />

            <InputField
              label="Category *"
              placeholder="e.g., Programming, Design, Language"
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
              placeholder="What skills do students need?"
              value={skillsRequired}
              onChangeText={setSkillsRequired}
              accessibilityLabel="Skills Required Input"
            />

            <Button
              title="Post Service Offer"
              onPress={handlePostService}
              loading={loading}
              disabled={loading}
              accessibilityLabel="Post Service Offer"
            />
          </>
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  buttonGroup: {
    marginTop: 20,
    gap: 12,
  },
  creditCard: {
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditItem: {
    flex: 1,
    alignItems: 'center',
  },
  creditDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  creditLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  creditValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  creditInsufficient: {
    color: '#DC2626',
  },
  insufficientText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
});
