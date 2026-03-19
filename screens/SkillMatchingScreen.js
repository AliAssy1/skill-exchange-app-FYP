import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Card from '../components/Card';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
};

export default function SkillMatchingScreen({ navigation }) {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      // Search for users that have skills the current user might need
      const result = await userService.searchUsers({});
      if (result.success) {
        // Filter out the current user and format the data
        const otherUsers = result.data.filter(u => u.id !== user?.id);
        setMatches(otherUsers);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const renderMatch = ({ item }) => (
    <Card style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <PlaceholderAvatar size={60} initials={getInitials(item.full_name)} />
        <View style={styles.matchInfo}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.rating}>★ {item.average_rating || 'N/A'}</Text>
            <Text style={styles.exchanges}>
              {item.department || 'No department'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {item.skills && item.skills.length > 0 && (
        <View style={styles.needsContainer}>
          <Text style={styles.needsText}>
            🎯 Skills: <Text style={styles.needsHighlight}>{item.skills.join(', ')}</Text>
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <Button
          title="View Profile"
          onPress={() => {
            showAlert(
              `${item.full_name}'s Profile`,
              `Department: ${item.department || 'N/A'}\nYear: ${item.year_of_study || 'N/A'}\nRating: ${item.average_rating || 'N/A'} ⭐`
            );
          }}
          variant="secondary"
          accessibilityLabel={`View ${item.full_name}'s profile`}
        />
        <Button
          title="Send Message"
          onPress={() =>
            navigation.navigate('Messages', {
              screen: 'Chat',
              params: {
                user: item.full_name,
                initials: getInitials(item.full_name),
                recipientId: item.id,
                online: true,
              },
            })
          }
          accessibilityLabel={`Message ${item.full_name}`}
        />
      </View>
    </Card>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Perfect Matches</Text>
          <Text style={styles.subtitle}>
            Users who have what you need and need what you have
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 These matches are based on complementary skills - the best
            opportunity for mutual learning!
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No matches found yet</Text>
            <Text style={styles.emptySubtext}>Add your skills and browse services to find matches</Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMatch}
            scrollEnabled={false}
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
  },
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  matchCard: {
    marginBottom: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rating: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  exchanges: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  matchScoreBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  matchScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  matchLabel: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  skillExchangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exchangeColumn: {
    flex: 1,
  },
  exchangeLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  skillTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  skillTagText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  exchangeArrow: {
    marginHorizontal: 8,
  },
  arrowText: {
    fontSize: 24,
    color: COLORS.secondary,
  },
  needsContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  needsText: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
  },
  needsHighlight: {
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
  },
});
