import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import reportService from '../services/reportService';
import userService from '../services/userService';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#1D4ED8',
};

const reportReasons = [
  'Inappropriate behavior',
  'Poor quality service',
  'Non-compliance with terms',
  'Safety concern',
  'Other',
];

export default function ReportModerationScreen({ navigation }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [reportedUser, setReportedUser] = useState('');
  const [serviceRef, setServiceRef] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState([]);

  const handleAttachScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setScreenshots(prev => [...prev, ...result.assets.map(a => a.uri)]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason || !description.trim()) {
      showAlert('Incomplete Form', 'Please select a reason and provide a description.');
      return;
    }

    if (!reportedUser && !serviceRef) {
      showAlert('Incomplete Form', 'Please specify either a user or service to report.');
      return;
    }

    setLoading(true);
    try {
      // Parse service ID if provided (assume it's a number)
      const serviceId = serviceRef ? parseInt(serviceRef) : null;
      
      // Try to find user by email if provided
      let userId = null;
      if (reportedUser) {
        // If it's a number, use it as user ID directly
        if (!isNaN(reportedUser)) {
          userId = parseInt(reportedUser);
        } else {
          // Otherwise, try to search for the user
          const searchResult = await userService.searchUsers(reportedUser);
          if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
            userId = searchResult.data[0].id;
          }
        }
      }

      const reportData = {
        reported_user_id: userId,
        reported_service_id: serviceId,
        reason: selectedReason,
        description: description.trim()
      };

      const result = await reportService.createReport(reportData);

      if (result.success) {
        showAlert(
          'Report Submitted',
          'Thank you for reporting. Our moderation team will review this shortly.'
        );
        navigation.goBack();
      } else {
        showAlert('Error', result.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Submit report error:', error);
      showAlert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Report an Issue</Text>
        <Text style={styles.subtitle}>
          Help us maintain a safe and respectful community
        </Text>

        <Text style={styles.sectionTitle}>Report Reason</Text>
        {reportReasons.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[
              styles.reasonOption,
              selectedReason === reason && styles.reasonOptionSelected,
            ]}
            onPress={() => setSelectedReason(reason)}
            accessible
            accessibilityLabel={`Report reason: ${reason}`}
          >
            <View
              style={[
                styles.radioButton,
                selectedReason === reason && styles.radioButtonActive,
              ]}
            />
            <Text
              style={[
                styles.reasonText,
                selectedReason === reason && styles.reasonTextActive,
              ]}
            >
              {reason}
            </Text>
          </TouchableOpacity>
        ))}

        <InputField
          label="Reported User"
          placeholder="Name or email of the user"
          value={reportedUser}
          onChangeText={setReportedUser}
          accessibilityLabel="Reported User Input"
        />

        <InputField
          label="Service Reference (Optional)"
          placeholder="Service ID or title related to this report"
          value={serviceRef}
          onChangeText={setServiceRef}
          accessibilityLabel="Service Reference Input"
        />

        <InputField
          label="Description"
          placeholder="Describe what happened in detail..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          accessibilityLabel="Report Description Input"
        />

        <Card style={styles.attachmentCard}>
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={handleAttachScreenshot}
            accessible
            accessibilityLabel="Attach Screenshot"
          >
            <Text style={styles.attachmentButtonText}>📎 Attach Screenshot</Text>
          </TouchableOpacity>
          {screenshots.length > 0 && (
            <View style={styles.screenshotRow}>
              {screenshots.map((uri, i) => (
                <View key={i} style={styles.screenshotContainer}>
                  <Image source={{ uri }} style={styles.screenshotThumb} />
                  <TouchableOpacity
                    style={styles.removeScreenshot}
                    onPress={() => setScreenshots(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <Text style={styles.removeScreenshotText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          accessibilityLabel="Submit Report"
        />

        <Text style={styles.privacyNote}>
          Your report is confidential. Our moderation team will review it
          carefully.
        </Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  reasonOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F4FF',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  radioButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  reasonTextActive: {
    fontWeight: '600',
  },
  attachmentCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  attachmentButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  attachmentButtonText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  privacyNote: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  screenshotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  screenshotContainer: {
    position: 'relative',
  },
  screenshotThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeScreenshot: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeScreenshotText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
