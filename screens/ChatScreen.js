import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useUnread } from '../contexts/UnreadContext';
import { showAlert } from '../utils/alertHelper';
import chatService from '../services/chatService';
import aiService from '../services/aiService';
import { AppColors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME MESSAGE (shown when AI chat opens)
// ─────────────────────────────────────────────────────────────────────────────
const WELCOME_MESSAGE = {
  id: 'welcome',
  sender_id: 'ai',
  message: "Hi! I'm your SkillSwap assistant.\n\nI can help you find tutors, browse services, or guide you through the app. What would you like to do?",
  suggestions: [
    'Find a tutor',
    'Browse all services',
    'Offer my skills',
    'How do credits work?',
    'Check my requests',
  ],
  services: [],
  created_at: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
// SUGGESTION CHIPS
// ─────────────────────────────────────────────────────────────────────────────
function SuggestionChips({ suggestions, onTap, disabled }) {
  if (!suggestions?.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipsScroll}
      contentContainerStyle={styles.chipsContent}
      keyboardShouldPersistTaps="handled"
    >
      {suggestions.map((s, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.chip, disabled && styles.chipDisabled]}
          onPress={() => !disabled && onTap(s)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, disabled && styles.chipTextDisabled]} numberOfLines={1}>
            {s}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatScreen({ route, navigation }) {
  const { userId, userName, isAI } = route.params || {};
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { refreshUnread } = useUnread();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef();

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      e => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => setKeyboardHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (isAI) {
      setMessages([WELCOME_MESSAGE]);
      setLoading(false);
    } else {
      fetchMessages();
    }
  }, [userId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const result = await chatService.getMessages(userId);
      if (result.success) {
        setMessages(result.data);
        refreshUnread();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Core send logic — called by input submit AND suggestion taps
  const sendMessage = async (messageText) => {
    const text = messageText.trim();
    if (!text || sending) return;

    setSending(true);
    setMessage('');

    if (isAI) {
      // Optimistically add user bubble immediately
      const userMsg = {
        id: Date.now(),
        sender_id: user?.id,
        message: text,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);
      scrollToEnd();

      try {
        const result = await aiService.chat(text, messages);
        if (result.success) {
          const aiMsg = {
            id: Date.now() + 1,
            sender_id: 'ai',
            message: result.data.response,
            suggestions: result.data.suggestions || [],
            services: result.data.results || [],
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          setMessages(prev => [...prev, makeErrorMsg()]);
        }
      } catch (err) {
        console.error('AI send error:', err);
        setMessages(prev => [...prev, makeErrorMsg()]);
      } finally {
        setSending(false);
        scrollToEnd(150);
      }

    } else {
      // Regular human-to-human chat
      try {
        const result = await chatService.sendMessage({ receiver_id: userId, message: text });
        if (result.success) {
          fetchMessages();
        } else {
          showAlert('Error', 'Failed to send message');
        }
      } catch (err) {
        console.error('Error sending message:', err);
        showAlert('Error', 'Failed to send message');
      } finally {
        setSending(false);
      }
    }
  };

  const makeErrorMsg = () => ({
    id: Date.now() + 1,
    sender_id: 'ai',
    message: "Sorry, I had trouble responding. Please try again.",
    suggestions: ['Find a tutor', 'Browse services', 'Try again'],
    services: [],
    created_at: new Date().toISOString(),
  });

  const scrollToEnd = (delay = 80) => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), delay);
  };

  const handleSend = () => sendMessage(message);
  const handleSuggestion = (text) => sendMessage(text);

  // ── Render ─────────────────────────────────────────────────────────────────

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.root, { paddingBottom: keyboardHeight }]}>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={AppColors.primary[600]} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollToEnd(50)}
        >
          {messages.map((msg, index) => {
            const isMine  = msg.sender_id === user?.id;
            const isAiMsg = msg.sender_id === 'ai';

            if (isMine) {
              return (
                <View key={msg.id || index} style={styles.userRow}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.message}</Text>
                    <Text style={styles.userTime}>{formatTime(msg.created_at)}</Text>
                  </View>
                </View>
              );
            }

            // AI / other-user message
            return (
              <View key={msg.id || index} style={styles.otherRow}>
                {/* Avatar badge for AI */}
                {isAiMsg && (
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={14} color={AppColors.primary[600]} />
                  </View>
                )}

                <View style={styles.otherContent}>
                  {/* Message bubble */}
                  <View style={[styles.otherBubble, isAiMsg && styles.aiBubble]}>
                    <Text style={[styles.otherText, isAiMsg && styles.aiText]}>
                      {msg.message}
                    </Text>
                    <Text style={[styles.otherTime, isAiMsg && styles.aiTime]}>
                      {formatTime(msg.created_at)}
                    </Text>
                  </View>

                  {/* Suggestion chips */}
                  {isAiMsg && msg.suggestions?.length > 0 && (
                    <SuggestionChips
                      suggestions={msg.suggestions}
                      onTap={handleSuggestion}
                      disabled={sending}
                    />
                  )}

                  {/* Browse services button */}
                  {isAiMsg && msg.services?.length > 0 && (
                    <TouchableOpacity
                      style={styles.browseBtn}
                      onPress={() =>
                        navigation.navigate('MainApp', {
                          screen: 'Browse',
                          params: { aiServices: msg.services },
                        })
                      }
                      activeOpacity={0.85}
                    >
                      <Ionicons name="grid-outline" size={16} color={AppColors.white} />
                      <Text style={styles.browseBtnText}>
                        View {msg.services.length} Service{msg.services.length > 1 ? 's' : ''} in Browse
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Typing indicator */}
          {sending && isAI && (
            <View style={styles.typingRow}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={14} color={AppColors.primary[600]} />
              </View>
              <View style={[styles.otherBubble, styles.aiBubble, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Input bar ────────────────────────────────────────── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={isAI ? 'Ask me anything...' : 'Type a message...'}
          placeholderTextColor={AppColors.neutral[400]}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          editable={!sending}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!message.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || sending}
          activeOpacity={0.8}
        >
          <Ionicons
            name={sending ? 'ellipsis-horizontal' : 'send'}
            size={18}
            color={AppColors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.neutral[50],
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Scroll ───────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    gap: 4,
  },

  // ── User message (right-aligned) ─────────────────────────
  userRow: {
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  userBubble: {
    backgroundColor: AppColors.primary[600],
    borderRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '78%',
    ...Shadows.sm,
  },
  userText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.white,
    lineHeight: 20,
  },
  userTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
    textAlign: 'right',
  },

  // ── AI / other message (left-aligned) ────────────────────
  otherRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: 8,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: 8,
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  otherContent: {
    flex: 1,
    gap: 6,
  },
  otherBubble: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '88%',
    alignSelf: 'flex-start',
    ...Shadows.sm,
  },
  aiBubble: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.primary[100],
  },
  otherText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[800],
    lineHeight: 20,
  },
  aiText: {
    color: AppColors.neutral[800],
  },
  otherTime: {
    fontSize: 10,
    color: AppColors.neutral[400],
    marginTop: 4,
  },
  aiTime: {
    color: AppColors.primary[300],
  },

  // ── Suggestion chips ─────────────────────────────────────
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: AppColors.white,
    borderWidth: 1.5,
    borderColor: AppColors.primary[200],
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...Shadows.sm,
  },
  chipDisabled: {
    borderColor: AppColors.neutral[200],
    backgroundColor: AppColors.neutral[50],
  },
  chipText: {
    fontSize: 13,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.primary[700],
  },
  chipTextDisabled: {
    color: AppColors.neutral[400],
  },

  // ── Browse services button ────────────────────────────────
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary[600],
    borderRadius: BorderRadius.lg,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    ...Shadows.md,
  },
  browseBtnText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
  },

  // ── Typing indicator ─────────────────────────────────────
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AppColors.primary[300],
  },

  // ── Input bar ────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral[100],
    gap: 10,
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    backgroundColor: AppColors.neutral[50],
    borderWidth: 1,
    borderColor: AppColors.neutral[200],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: Typography.fontSize.sm,
    color: AppColors.neutral[800],
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  sendBtnDisabled: {
    backgroundColor: AppColors.neutral[300],
  },
});
