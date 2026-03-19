import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/alertHelper';
import chatService from '../services/chatService';
import aiService from '../services/aiService';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
  aiPrimary: '#3B82F6',
  aiBackground: '#EFF6FF',
};

export default function ChatScreen({ route, navigation }) {
  const { userId, userName, isAI } = route.params || {};
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const scrollViewRef = useRef();

  useEffect(() => {
    if (userId) {
      if (isAI) {
        // AI conversation - start with welcome message
        setMessages([
          {
            id: 'welcome',
            sender_id: 'ai',
            message: "👋 Hi! I'm your AI Service Finder assistant.\n\nI can help you find:\n• Tutors (Spanish, Math, Programming, etc.)\n• Study partners\n• Academic help\n• Skills exchange\n\nJust tell me what you're looking for!",
            created_at: new Date().toISOString()
          }
        ]);
        setLoading(false);
      } else {
        fetchMessages();
      }
    }
  }, [userId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const result = await chatService.getMessages(userId);
      if (result.success) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (message.trim()) {
      const messageText = message;
      setMessage('');
      setSending(true);

      if (isAI) {
        // AI conversation
        // Add user message immediately
        const userMsg = {
          id: Date.now(),
          sender_id: user?.id,
          message: messageText,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);

        try {
          const result = await aiService.chat(messageText);
          if (result.success) {
            // Add AI response with service results
            const aiMsg = {
              id: Date.now() + 1,
              sender_id: 'ai',
              message: result.data.response,
              services: result.data.results || [], // Store service results
              created_at: new Date().toISOString()
            };
            console.log('AI Response with services:', aiMsg.services.length, 'services found');
            setMessages(prev => [...prev, aiMsg]);
            
            // Scroll to bottom
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          } else {
            showAlert('Error', result.message);
          }
        } catch (error) {
          console.error('Error sending AI message:', error);
          showAlert('Error', 'Failed to send message');
        } finally {
          setSending(false);
        }
      } else {
        // Regular chat
        try {
          const result = await chatService.sendMessage({
            receiver_id: userId,
            message: messageText,
          });
          if (result.success) {
            fetchMessages();
          } else {
            showAlert('Error', 'Failed to send message');
          }
        } catch (error) {
          console.error('Error sending message:', error);
          showAlert('Error', 'Failed to send message');
        } finally {
          setSending(false);
        }
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isAI ? COLORS.aiPrimary : COLORS.primary} />
        </View>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer} 
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => {
            const isMine = msg.sender_id === user?.id;
            const isAiMsg = msg.sender_id === 'ai';
            const hasServices = isAiMsg && msg.services && msg.services.length > 0;
            
            // Debug logging
            if (isAiMsg) {
              console.log('AI Message:', { 
                hasServices, 
                servicesCount: msg.services?.length || 0,
                services: msg.services 
              });
            }
            
            return (
              <View key={msg.id || index} style={[styles.messageWrapper, isMine && styles.myMessageWrapper]}>
                <View style={styles.messageContainer}>
                  <Card style={[
                    styles.messageBubble, 
                    isMine ? styles.myMessage : isAiMsg ? styles.aiMessage : styles.otherMessage
                  ]}>
                    <Text style={[
                      styles.messageText, 
                      isMine ? styles.myMessageText : isAiMsg ? styles.aiMessageText : null
                    ]}>
                      {msg.message}
                    </Text>
                    <Text style={[
                      styles.timestamp, 
                      isMine ? styles.myTimestamp : isAiMsg ? styles.aiTimestamp : null
                    ]}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Card>
                  
                  {/* Browse Services Button for AI messages with results */}
                  {hasServices && (
                    <TouchableOpacity 
                      style={styles.browseButton}
                      onPress={() => {
                        console.log('Navigating to Browse with', msg.services.length, 'services');
                        // Navigate to MainApp and specifically the Browse tab with AI services
                        navigation.navigate('MainApp', {
                          screen: 'Browse',
                          params: {
                            aiServices: msg.services
                          }
                        });
                      }}
                    >
                      <Text style={styles.browseButtonText}>
                        📋 View {msg.services.length} Service{msg.services.length > 1 ? 's' : ''} in Browse
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
          {sending && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>{isAI ? '🤖 AI is thinking...' : 'Sending...'}</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={isAI ? "Ask me to find a service..." : "Type a message..."}
          value={message}
          onChangeText={setMessage}
          multiline
          editable={!sending}
        />
        <TouchableOpacity 
          style={[styles.sendButton, sending && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={styles.sendButtonText}>{sending ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
  },
  messageContainer: {
    maxWidth: '75%',
  },
  messageBubble: {
    padding: 0,
  },
  otherMessage: {
    backgroundColor: COLORS.white,
  },
  myMessage: {
    backgroundColor: COLORS.primary,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
  },
  myMessageText: {
    color: COLORS.white,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 4,
  },
  myTimestamp: {
    color: COLORS.white,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: COLORS.white,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // AI Message Styles
  aiMessage: {
    backgroundColor: COLORS.aiBackground,
    borderWidth: 1,
    borderColor: COLORS.aiPrimary,
  },
  aiMessageText: {
    color: COLORS.text,
  },
  aiTimestamp: {
    color: COLORS.aiPrimary,
  },
  typingIndicator: {
    padding: 12,
    alignItems: 'flex-start',
  },
  typingText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontStyle: 'italic',
  },
  // Browse Services Button
  browseButton: {
    marginTop: 8,
    backgroundColor: COLORS.aiPrimary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  browseButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
