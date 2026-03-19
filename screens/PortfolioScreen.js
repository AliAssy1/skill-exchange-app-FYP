import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
};

export default function PortfolioScreen({ navigation }) {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [filter, setFilter] = useState('all');

  const categories = ['all', 'Web Development', 'Programming', 'Design'];

  const filteredItems =
    filter === 'all'
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === filter);

  const getItemIcon = (type) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'code':
        return '💻';
      case 'link':
        return '🔗';
      case 'video':
        return '🎬';
      default:
        return '📄';
    }
  };

  const renderPortfolioItem = ({ item }) => (
    <Card style={styles.portfolioCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemIconContainer}>
          <Text style={styles.itemIcon}>{getItemIcon(item.type)}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
      </View>

      <Text style={styles.itemDescription}>{item.description}</Text>

      <View style={styles.itemFooter}>
        <View style={styles.statsContainer}>
          <Text style={styles.stat}>❤️ {item.likes}</Text>
          <Text style={styles.stat}>👁️ {item.views}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => showAlert('Portfolio', `Viewing: ${item.title}`)}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Portfolio</Text>
        <Text style={styles.headerSubtitle}>
          Showcase your work to potential skill exchange partners
        </Text>
      </View>

      <View style={styles.addButtonContainer}>
        <Button
          title="+ Add Work Sample"
          onPress={() =>
            showAlert(
              'Add Portfolio Item',
              'You can add work samples to showcase your skills. This feature will allow you to upload images, documents, or links to your projects.'
            )
          }
          accessibilityLabel="Add Portfolio Item"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollContainer}
        contentContainerStyle={styles.filterContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              filter === cat && styles.filterChipActive,
            ]}
            onPress={() => setFilter(cat)}
            accessible
            accessibilityLabel={`Filter by ${cat}`}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === cat && styles.filterChipTextActive,
              ]}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {filteredItems.length > 0 ? (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderPortfolioItem}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No items in this category
              </Text>
              <Button
                title="Add Your First Item"
                variant="secondary"
                onPress={() =>
                  showAlert(
                    'Add Portfolio Item',
                    'Start building your portfolio by adding work samples that showcase your skills and experience.'
                  )
                }
                accessibilityLabel="Add First Portfolio Item"
              />
            </View>
          )}

          <Card style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Portfolio Tips</Text>
            <Text style={styles.tipText}>
              • Upload clear photos or screenshots of your work{'\n'}
              • Include detailed descriptions{'\n'}
              • Add relevant tags to help others find your skills{'\n'}
              • Update regularly with your latest projects
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  addButtonContainer: {
    padding: 16,
    paddingTop: 12,
  },
  filterScrollContainer: {
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  portfolioCard: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  viewButtonText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: '#FEF3C7',
    marginTop: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
});
