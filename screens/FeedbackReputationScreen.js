import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import reviewService from '../services/reviewService';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
};

export default function FeedbackReputationScreen({ route, navigation }) {
  const  { transactionId, userId } = route.params || {};
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const targetUserId = userId || user?.id;
      const result = await reviewService.getUserReviews(targetUserId);
      if (result.success) {
        setReviews(result.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const tags = ['Professional', 'Helpful', 'Knowledgeable', 'Responsive', 'Patient'];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!transactionId) {
      showAlert('Error', 'Transaction ID is required to submit a review');
      return;
    }
    if (rating === 0) {
      showAlert('Error', 'Please select a rating');
      return;
    }

    try {
      const result = await reviewService.createReview({
        transaction_id: transactionId,
        rating,
        comment: review,
      });

      if (result.success) {
        showAlert('Review Submitted', 'Thank you for your feedback!');
        setRating(0);
        setReview('');
        setSelectedTags([]);
        fetchReviews();
      } else {
        showAlert('Error', result.message);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showAlert('Error', 'Failed to submit review');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Feedback & Reputation</Text>

        <Card style={styles.reputationCard}>
          <Text style={styles.label}>Your Reputation Score</Text>
          <Text style={styles.reputationScore}>{user?.reputation_score || '0'} / 5.0</Text>
          <Text style={[styles.label, { marginTop: 12 }]}>
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Leave a Review</Text>

        <Card>
          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                accessible
                accessibilityLabel={`${star} stars`}
              >
                <Text
                  style={[
                    styles.star,
                    star <= rating && styles.starActive,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <InputField
          label="Your Review"
          placeholder="Share your experience with this service..."
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={4}
          accessibilityLabel="Review Text Input"
        />

        <Text style={styles.sectionTitle}>Add Tags</Text>
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                selectedTags.includes(tag) && styles.tagActive,
              ]}
              onPress={() => toggleTag(tag)}
              accessible
              accessibilityLabel={`Select tag: ${tag}`}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTags.includes(tag) && styles.tagTextActive,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Submit Review"
          onPress={handleSubmit}
          accessibilityLabel="Submit Review"
        />

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Recent Reviews</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : reviews.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No reviews yet</Text>
          </Card>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Card>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>{item.reviewer_name || 'Anonymous'}</Text>
                  <Text style={styles.reviewRating}>★ {item.rating}.0</Text>
                </View>
                <Text style={styles.reviewText}>{item.comment || 'No comment'}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </Card>
            )}
          />
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
  reputationCard: {
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  reputationScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  star: {
    fontSize: 32,
    color: COLORS.border,
  },
  starActive: {
    color: COLORS.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  tagActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  tagTextActive: {
    color: COLORS.white,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewRating: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    padding: 20,
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  smallTag: {
    fontSize: 11,
    color: COLORS.secondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
