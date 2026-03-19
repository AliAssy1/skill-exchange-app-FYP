import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
};

export default function MessagesListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const result = await chatService.getConversations();
      if (result.success) {
        setConversations(result.data);
      } else {
        showAlert('Error', result.message);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAIAssistant = () => (
    <TouchableOpacity
      style={[styles.conversationCard, styles.aiCard]}
      onPress={() =>
        navigation.navigate('Chat', {
          userId: 'ai',
          userName: '🤖 AI Assistant',
          isAI: true,
        })
      }
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.aiAvatar]}>
          <Text style={styles.aiAvatarText}>🤖</Text>
        </View>
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.userName, styles.aiName]}>🤖 AI Service Finder</Text>
          <Text style={styles.aiTag}>NEW</Text>
        </View>
        <Text style={styles.aiDescription}>
          Ask me to find services! Try: "I need a Spanish tutor"
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderConversation = ({ item }) => {
    const initials = item.full_name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '??';
    
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() =>
          navigation.navigate('Chat', {
            userId: item.other_user_id,
            userName: item.full_name,
            userAvatar: item.avatar_url,
          })
        }
        accessible
        accessibilityLabel={`Chat with ${item.full_name}`}
      >
        <View style={styles.avatarContainer}>
          <PlaceholderAvatar size={56} name={item.full_name} />
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{item.full_name || 'Unknown User'}</Text>
            <Text style={styles.timestamp}>
              {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                item.unread_count > 0 && styles.lastMessageUnread,
              ]}
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={COLORS.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessible
          accessibilityLabel="Search Conversations"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* AI Assistant Card - Always visible */}
          <View style={styles.listContainer}>
            {renderAIAssistant()}
          </View>

          {/* User Conversations */}
          {filteredConversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation by browsing services</Text>
              <Text style={styles.emptySubtext}>Or try the AI Assistant above!</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredConversations.map((item) => (
                <View key={String(item.other_user_id)}>
                  {renderConversation({ item })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  conversationCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.secondary,
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: COLORS.text,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  // AI Assistant Styles
  aiCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    padding: 12,
    marginBottom: 8,
  },
  aiAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarText: {
    fontSize: 28,
  },
  aiName: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  aiTag: {
    backgroundColor: '#10B981',
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  aiDescription: {
    fontSize: 13,
    color: '#1E40AF',
    marginTop: 2,
    fontStyle: 'italic',
  },
});
