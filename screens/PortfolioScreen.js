import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Card from '../components/Card';
import Button from '../components/Button';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#1D4ED8',
  danger: '#EF4444',
};

const ITEM_TYPES = ['image', 'link', 'code', 'video'];
const CATEGORIES = ['Web Development', 'Programming', 'Design', 'Other'];

export default function PortfolioScreen({ navigation }) {
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    type: ITEM_TYPES[0],
    imageUri: null,
    link: '',
  });

  const categories = ['all', ...CATEGORIES];

  const filteredItems =
    filter === 'all'
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === filter);

  const getItemIcon = (type) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'code': return '💻';
      case 'link': return '🔗';
      case 'video': return '🎬';
      default: return '📄';
    }
  };

  const openAddModal = () => {
    setForm({ title: '', description: '', category: CATEGORIES[0], type: ITEM_TYPES[0], imageUri: null, link: '' });
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setForm(f => ({ ...f, imageUri: result.assets[0].uri, type: 'image' }));
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      showAlert('Required', 'Please enter a title for your portfolio item.');
      return;
    }
    const newItem = {
      id: Date.now(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      type: form.type,
      imageUri: form.imageUri,
      link: form.link.trim(),
      likes: 0,
      views: 0,
    };
    setPortfolioItems(prev => [newItem, ...prev]);
    setModalVisible(false);
  };

  const handleDelete = (id) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
  };

  const renderPortfolioItem = ({ item }) => (
    <Card style={styles.portfolioCard}>
      {item.imageUri && (
        <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
      )}
      <View style={styles.itemHeader}>
        <View style={styles.itemIconContainer}>
          <Text style={styles.itemIcon}>{getItemIcon(item.type)}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} accessibilityLabel="Delete item">
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {item.description ? (
        <Text style={styles.itemDescription}>{item.description}</Text>
      ) : null}

      {item.link ? (
        <Text style={styles.itemLink} numberOfLines={1}>🔗 {item.link}</Text>
      ) : null}

      <View style={styles.itemFooter}>
        <View style={styles.statsContainer}>
          <Text style={styles.stat}>❤️ {item.likes}</Text>
          <Text style={styles.stat}>👁️ {item.views}</Text>
        </View>
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
          onPress={openAddModal}
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
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(cat)}
            accessibilityLabel={`Filter by ${cat}`}
          >
            <Text style={[styles.filterChipText, filter === cat && styles.filterChipTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.emptyStateText}>No items in this category</Text>
              <Button
                title="Add Your First Item"
                variant="secondary"
                onPress={openAddModal}
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

      {/* Add Item Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Work Sample</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                {form.imageUri ? (
                  <Image source={{ uri: form.imageUri }} style={styles.pickedImage} />
                ) : (
                  <Text style={styles.imagePickerText}>📷  Tap to add an image</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., React Native App"
                value={form.title}
                onChangeText={(v) => setForm(f => ({ ...f, title: v }))}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your work..."
                value={form.description}
                onChangeText={(v) => setForm(f => ({ ...f, description: v }))}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Link (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://github.com/..."
                value={form.link}
                onChangeText={(v) => setForm(f => ({ ...f, link: v }))}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.chipGroup}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.selectChip, form.category === cat && styles.selectChipActive]}
                    onPress={() => setForm(f => ({ ...f, category: cat }))}
                  >
                    <Text style={[styles.selectChipText, form.category === cat && styles.selectChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.chipGroup}>
                {ITEM_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.selectChip, form.type === t && styles.selectChipActive]}
                    onPress={() => setForm(f => ({ ...f, type: t }))}
                  >
                    <Text style={[styles.selectChipText, form.type === t && styles.selectChipTextActive]}>
                      {getItemIcon(t)} {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} />
                <Button title="Save Item" onPress={handleSave} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    padding: 16, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: COLORS.secondary },
  addButtonContainer: { padding: 16, paddingTop: 12 },
  filterScrollContainer: { maxHeight: 50 },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  filterChipTextActive: { color: COLORS.white },
  scrollContainer: { flex: 1 },
  contentContainer: { padding: 16 },
  portfolioCard: { marginBottom: 16 },
  itemImage: { width: '100%', height: 160, borderRadius: 8, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemIconContainer: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  itemIcon: { fontSize: 20 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  itemCategory: { fontSize: 12, color: COLORS.secondary },
  deleteIcon: { fontSize: 18, paddingLeft: 8 },
  itemDescription: { fontSize: 13, color: COLORS.secondary, lineHeight: 19, marginBottom: 6 },
  itemLink: { fontSize: 12, color: '#3B82F6', marginBottom: 8 },
  itemFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  statsContainer: { flexDirection: 'row', gap: 16 },
  stat: { fontSize: 13, color: COLORS.secondary },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 16, color: COLORS.secondary, marginBottom: 20 },
  tipCard: { backgroundColor: '#FEF3C7', marginTop: 16 },
  tipTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  tipText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  modalClose: { fontSize: 18, color: COLORS.secondary, padding: 4 },
  imagePicker: {
    height: 140, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden',
  },
  imagePickerText: { fontSize: 15, color: COLORS.secondary },
  pickedImage: { width: '100%', height: '100%' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  textInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: COLORS.text, marginBottom: 14, backgroundColor: COLORS.white,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  selectChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  selectChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  selectChipText: { fontSize: 13, color: COLORS.text },
  selectChipTextActive: { color: COLORS.white },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
});
