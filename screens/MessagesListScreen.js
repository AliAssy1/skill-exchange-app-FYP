import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import { AppColors, Shadows } from '../constants/theme';

export default function MessagesListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
    const unsub = navigation.addListener('focus', fetchConversations);
    return unsub;
  }, []);

  const fetchConversations = async () => {
    try {
      const result = await chatService.getConversations();
      if (result.success) setConversations(result.data || []);
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const filteredConversations = conversations.filter((c) =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const renderAI = () => (
    <TouchableOpacity
      style={styles.aiCard}
      onPress={() => navigation.navigate('Chat', { userId: 'ai', userName: 'AI Assistant', isAI: true })}
      activeOpacity={0.8}
    >
      <View style={styles.aiAvatar}>
        <Text style={{ fontSize: 26 }}>🤖</Text>
      </View>
      <View style={styles.convContent}>
        <View style={styles.convRow}>
          <Text style={styles.aiName}>AI Service Finder</Text>
          <View style={styles.newBadge}><Text style={styles.newBadgeText}>AI</Text></View>
        </View>
        <Text style={styles.aiDesc}>Ask me to find services for you!</Text>
      </View>
    </TouchableOpacity>
  );

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.convCard}
      onPress={() => navigation.navigate('Chat', {
        userId: item.other_user_id,
        userName: item.full_name,
        userAvatar: item.avatar_url,
      })}
      activeOpacity={0.75}
      accessibilityLabel={`Chat with ${item.full_name}`}
    >
      <PlaceholderAvatar size={52} name={item.full_name} />
      <View style={styles.convContent}>
        <View style={styles.convRow}>
          <Text style={styles.convName} numberOfLines={1}>{item.full_name || 'Unknown'}</Text>
          <Text style={styles.convTime}>{formatTime(item.last_message_time)}</Text>
        </View>
        <View style={styles.convRow}>
          <Text
            style={[styles.convLast, item.unread_count > 0 && styles.convLastUnread]}
            numberOfLines={1}
          >
            {item.last_message || 'No messages yet'}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={AppColors.neutral[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={AppColors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search Conversations"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={AppColors.neutral[400]} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={AppColors.primary[600]} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => String(item.other_user_id)}
          renderItem={renderConversation}
          ListHeaderComponent={renderAI}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={56} color={AppColors.neutral[300]} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>Browse services and tap "Message Provider" to start chatting</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary[600]]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.neutral[50] },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AppColors.neutral[200],
    ...Shadows.sm,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: AppColors.neutral[800],
  },

  listContent: { paddingHorizontal: 12, paddingBottom: 20 },

  // AI Card
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: AppColors.info[500],
    ...Shadows.sm,
  },
  aiAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.info[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiName: { fontSize: 15, fontWeight: '700', color: '#1E40AF' },
  aiDesc: { fontSize: 13, color: AppColors.info[600], fontStyle: 'italic', marginTop: 2 },
  newBadge: {
    backgroundColor: AppColors.success[500],
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: { fontSize: 10, fontWeight: '700', color: AppColors.white },

  // Conversation row
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    ...Shadows.sm,
  },
  convContent: { flex: 1, marginLeft: 12 },
  convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convName: { fontSize: 15, fontWeight: '700', color: AppColors.neutral[800], flex: 1, marginRight: 8 },
  convTime: { fontSize: 11, color: AppColors.neutral[400] },
  convLast: { fontSize: 13, color: AppColors.neutral[500], flex: 1, marginRight: 8 },
  convLastUnread: { fontWeight: '600', color: AppColors.neutral[800] },
  unreadBadge: {
    backgroundColor: AppColors.primary[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { color: AppColors.white, fontSize: 11, fontWeight: '700' },

  // Loading / empty
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 10, fontSize: 14, color: AppColors.neutral[500] },
  emptyBox: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: AppColors.neutral[700], marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: AppColors.neutral[400], textAlign: 'center', lineHeight: 21 },
});
