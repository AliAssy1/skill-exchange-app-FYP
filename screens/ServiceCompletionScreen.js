import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import transactionService from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#1D4ED8',
};

export default function ServiceCompletionScreen({ navigation, route }) {
  const transactionId = route?.params?.transactionId;
  const serviceTitle = route?.params?.serviceTitle || 'Service Session';
  const providerName = route?.params?.providerName || 'Provider';
  const creditsAmount = route?.params?.creditsAmount || 0;
  const initialStatus = route?.params?.status || 'Pending';
  const { updateUser } = useAuth();

  const [completionLoading, setCompletionLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [checklist, setChecklist] = useState([
    { id: '1', task: 'Service delivered', completed: false },
    { id: '2', task: 'Work meets requirements', completed: false },
    { id: '3', task: 'Professional conduct observed', completed: false },
    { id: '4', task: 'Communication was clear', completed: false },
  ]);

  const toggleTask = (id) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const allTasksCompleted = checklist.every((item) => item.completed);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Service Completion</Text>

        <Card style={styles.summaryCard}>
          <Text style={styles.label}>Service Requested</Text>
          <Text style={styles.serviceName}>{serviceTitle}</Text>
          <Text style={[styles.label, { marginTop: 12 }]}>
            Provider
          </Text>
          <Text style={styles.providerName}>{providerName}</Text>
          <Text style={[styles.label, { marginTop: 12 }]}>
            Credits
          </Text>
          <Text style={styles.creditsText}>💰 {creditsAmount} credits</Text>
          <Text style={[styles.label, { marginTop: 12 }]}>
            Status
          </Text>
          <Text style={styles.statusText}>{completed ? 'Completed ✅' : initialStatus}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Completion Checklist</Text>

        {checklist.map((item) => (
          <View key={item.id} style={styles.checklistRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => toggleTask(item.id)}
              accessible
              accessibilityLabel={item.task}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.completed }}
            >
              {item.completed && <View style={styles.checkmark} />}
            </TouchableOpacity>
            <Text
              style={[
                styles.checklistText,
                item.completed && styles.checklistTextCompleted,
              ]}
            >
              {item.task}
            </Text>
          </View>
        ))}

        <View style={styles.actionButtons}>
          <Button
            title={completed ? 'Completed ✅' : (completionLoading ? 'Completing...' : (allTasksCompleted ? 'Mark Complete & Transfer Credits' : 'Complete (Verify Items)'))}
            onPress={async () => {
              if (allTasksCompleted && !completed) {
                if (!transactionId) {
                  showAlert('Error', 'No transaction found. Please request the service first.');
                  return;
                }
                setCompletionLoading(true);
                try {
                  const result = await transactionService.updateTransactionStatus(transactionId, 'completed');
                  if (result.success) {
                    setCompleted(true);
                    try { await updateUser(); } catch(e) {}
                    showAlert(
                      'Service Completed!',
                      `${creditsAmount} credits have been transferred to ${providerName}.\n\nWould you like to leave a review?`,
                      [
                        { text: 'Leave a Review', onPress: () => navigation.navigate('FeedbackReputation', { transactionId }) },
                        { text: 'No Thanks', style: 'cancel', onPress: () => navigation.navigate('MainApp') },
                      ]
                    );
                  } else {
                    showAlert('Error', result.message || 'Failed to complete transaction');
                  }
                } catch (error) {
                  console.error('Complete transaction error:', error);
                  showAlert('Error', error.message || 'Failed to complete transaction');
                } finally {
                  setCompletionLoading(false);
                }
              }
            }}
            disabled={!allTasksCompleted || completed || completionLoading}
            loading={completionLoading}
            accessibilityLabel="Mark Service Complete"
          />
        </View>

        <View style={styles.linkSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('FeedbackReputation', { transactionId })}
            accessible
            accessibilityLabel="Go to Feedback and Reputation"
          >
            <Text style={styles.linkText}>Leave Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ReportModeration')}
            accessible
            accessibilityLabel="Report Service Issue"
          >
            <Text style={[styles.linkText, styles.linkDanger]}>Report Issue</Text>
          </TouchableOpacity>
        </View>
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
  summaryCard: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  providerName: {
    fontSize: 16,
    color: COLORS.text,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  creditsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkmark: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  checklistText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  checklistTextCompleted: {
    color: COLORS.secondary,
    textDecorationLine: 'line-through',
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 20,
  },
  linkSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  linkDanger: {
    color: '#EF4444',
  },
});
