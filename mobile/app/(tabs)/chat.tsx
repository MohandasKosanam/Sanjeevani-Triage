import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { chatStorage, ChatSession, ChatMessage } from '../../src/services/chatStorage';
import { api } from '../../src/services/api';
import { OPDToken } from '../../src/types';

export default function ChatScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [showHistory, setShowHistory] = useState(false);

  const flatListRef = useRef<FlatList | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const list = await chatStorage.getSessions();
    setSessions(list);
    if (list.length > 0) {
      setCurrentSessionId(list[0].id);
      setMessages(list[0].messages);
      setModel(list[0].model);
    } else {
      initNewChat();
    }
  };

  const initNewChat = () => {
    const newId = `session-${Date.now()}`;
    const initialWelcome: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      content:
        language === 'te'
          ? 'నమస్తే! నేను సంజీవని AI హెల్త్ అసిస్టెంట్‌ని. మీ లక్షణాలు, మందులు లేదా ఆసుపత్రి మార్గదర్శకాల గురించి నన్ను అడగండి.'
          : language === 'hi'
          ? 'नमस्ते! मैं संजीवनी AI हेल्थ असिस्टेंट हूँ। अपने लक्षण, दवाइयों या अस्पताल से संबंधित प्रश्न पूछें।'
          : 'Namaste! I am Sanjeevani AI Healthcare Assistant. Ask me about symptoms, medicines, or hospital OPD triage.',
      modelUsed: model,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newSession: ChatSession = {
      id: newId,
      title: language === 'te' ? 'కొత్త సంభాషణ' : language === 'hi' ? 'नया संवाद' : 'New Health Chat',
      model,
      role: 'general',
      messages: [initialWelcome],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentSessionId(newId);
    setMessages([initialWelcome]);
    setSessions((prev) => [newSession, ...prev]);
    setShowHistory(false);
    chatStorage.saveSession(newSession);
  };

  const handleSelectSession = (sess: ChatSession) => {
    setCurrentSessionId(sess.id);
    setMessages(sess.messages);
    setModel(sess.model);
    setShowHistory(false);
  };

  const handleDeleteSession = async (sessId: string) => {
    await chatStorage.deleteSession(sessId);
    const updated = sessions.filter((s) => s.id !== sessId);
    setSessions(updated);
    if (currentSessionId === sessId) {
      if (updated.length > 0) {
        handleSelectSession(updated[0]);
      } else {
        initNewChat();
      }
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    setInputText('');
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    try {
      const history = updated.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        content: m.content,
      }));

      const res = await api.sendChatMessage({
        messages: history,
        model,
        role: 'general',
        language,
      });

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        content: res.reply,
        modelUsed: res.modelUsed || model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        opdToken: res.opdToken,
      };

      const final = [...updated, botMsg];
      setMessages(final);

      const active = sessions.find((s) => s.id === currentSessionId);
      const title =
        active?.title && !active.title.includes('New') && !active.title.includes('కొత్త')
          ? active.title
          : textToSend.slice(0, 24);

      const saved: ChatSession = {
        id: currentSessionId,
        title,
        model,
        role: 'general',
        messages: final,
        createdAt: active?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? saved : s))
      );
      chatStorage.saveSession(saved);
    } catch (err: any) {
      console.warn('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickBookOpd = async (dept = 'General Medicine') => {
    setIsLoading(true);
    try {
      const res = await api.bookOPD({ department: dept });
      const newTok = res.token;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-u`,
        sender: 'user',
        content:
          language === 'te'
            ? `నాకు ${dept} విభాగానికి ఓపీడీ టోకెన్ కావాలి.`
            : language === 'hi'
            ? `मुझे ${dept} विभाग के लिए ओपीडी टोकन चाहिए।`
            : `Please book an OPD queue token for ${dept}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        content:
          language === 'te'
            ? `మీకు **${newTok.hospital_name}** (${newTok.department}) లో ఓపీడీ టోకెన్ నంబర్ **${newTok.token_number}** విజయవంతంగా కేటాయించబడింది!`
            : language === 'hi'
            ? `आपके लिए **${newTok.hospital_name}** (${newTok.department}) में ओपीडी टोकन नंबर **${newTok.token_number}** सफलतापूर्वक बुक हो गया है!`
            : `Your OPD queue token **${newTok.token_number}** has been confirmed for **${newTok.department}** at ${newTok.hospital_name}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        opdToken: newTok,
        modelUsed: model,
      };

      const final = [...messages, userMsg, botMsg];
      setMessages(final);

      const active = sessions.find((s) => s.id === currentSessionId);
      const saved: ChatSession = {
        id: currentSessionId,
        title: language === 'te' ? 'ఓపీడీ బుకింగ్' : language === 'hi' ? 'ओपीडी बुकिंग' : 'OPD Booking',
        model,
        role: 'general',
        messages: final,
        createdAt: active?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? saved : s))
      );
      chatStorage.saveSession(saved);
    } catch (e: any) {
      console.warn('Direct OPD booking failed in chat:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => setShowHistory((prev) => !prev)}
            style={styles.historyBtn}
          >
            <Ionicons name="time" size={16} color="#0d9488" />
            <Text style={styles.historyBadge}>{sessions.length}</Text>
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>{t.chatModalTitle || 'AI Health Assistant'}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {sessions.find((s) => s.id === currentSessionId)?.title || 'Health Chat'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Model Switcher Pill */}
          <Pressable
            onPress={() => {
              if (model === 'gemini-3.8-flash') setModel('gemini-4-argon');
              else if (model === 'gemini-4-argon') setModel('gemini-3.1-flash-lite');
              else setModel('gemini-3.8-flash');
            }}
            style={styles.modelToggle}
          >
            <Text style={styles.modelToggleText}>
              {model === 'gemini-3.8-flash' ? '3.8 Flash' : model === 'gemini-4-argon' ? 'Argon 4' : '3.1 Lite'}
            </Text>
          </Pressable>

          <Pressable onPress={initNewChat} style={styles.newChatBtn}>
            <Ionicons name="add" size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* History Dropdown Drawer */}
      {showHistory && (
        <View style={styles.historyDrawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>{t.chatHistoryTitle || 'Past Conversations'}</Text>
            <Pressable onPress={() => setShowHistory(false)}>
              <Ionicons name="close" size={18} color="#64748b" />
            </Pressable>
          </View>
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelectSession(item)}
                style={[
                  styles.historyItem,
                  item.id === currentSessionId && styles.historyItemActive,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyItemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.historyItemMeta}>
                    {new Date(item.updatedAt).toLocaleDateString()} • {item.messages.length} messages
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteSession(item.id)}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </Pressable>
              </Pressable>
            )}
            style={{ maxHeight: 220 }}
          />
        </View>
      )}

      {/* Message Feed */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.sender === 'user' ? styles.userRow : styles.botRow,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  item.sender === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.sender === 'user' ? styles.userText : styles.botText,
                  ]}
                >
                  {item.content}
                </Text>

                {/* Confirmed OPD Token Card */}
                {item.opdToken && (
                  <View style={styles.tokenCard}>
                    <View style={styles.tokenCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="ticket" size={14} color="#0d9488" />
                        <Text style={styles.tokenCardTitle}>
                          {t.opdTokenGeneratedNotice || 'OPD Token Confirmed'}
                        </Text>
                      </View>
                      <Text style={styles.tokenCardNumber}>{item.opdToken.token_number}</Text>
                    </View>
                    <View style={styles.tokenCardGrid}>
                      <View>
                        <Text style={styles.tokenCardLabel}>HOSPITAL</Text>
                        <Text style={styles.tokenCardVal} numberOfLines={1}>
                          {item.opdToken.hospital_name}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.tokenCardLabel}>DEPARTMENT</Text>
                        <Text style={styles.tokenCardVal}>{item.opdToken.department}</Text>
                      </View>
                      <View>
                        <Text style={styles.tokenCardLabel}>EST. WAIT</Text>
                        <Text style={styles.tokenCardVal}>~{item.opdToken.estimated_wait_minutes}m</Text>
                      </View>
                      <View>
                        <Text style={styles.tokenCardLabel}>STATUS</Text>
                        <Text style={[styles.tokenCardVal, { color: '#16a34a' }]}>CONFIRMED</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => router.push('/(tabs)/tokens')}
                      style={styles.viewTokenBtn}
                    >
                      <Text style={styles.viewTokenText}>
                        {t.viewBookedTokenBtn || 'View in OPD Tokens'}
                      </Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.timestampRow}>
                  <Text style={styles.timestampText}>{item.timestamp}</Text>
                  {item.modelUsed && (
                    <Text style={styles.modelTag}>{item.modelUsed}</Text>
                  )}
                </View>
              </View>

              {/* Quick OPD Token Trigger Action */}
              {item.sender === 'assistant' && !item.opdToken && (
                <Pressable
                  onPress={() => handleQuickBookOpd('General Medicine')}
                  style={styles.bookOpdChip}
                >
                  <Ionicons name="flash" size={12} color="#0d9488" />
                  <Text style={styles.bookOpdChipText}>
                    {t.bookOpdSkillBtn || '⚡ Book OPD Token'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        />

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#0d9488" />
            <Text style={styles.loadingText}>Gemini AI is analyzing symptoms...</Text>
          </View>
        )}

        {/* Quick Prompts Bar */}
        <View style={styles.promptBar}>
          <Pressable
            onPress={() => handleQuickBookOpd('General Medicine')}
            style={styles.quickSkillPill}
          >
            <Ionicons name="flash" size={12} color="#0d9488" />
            <Text style={styles.quickSkillText}>{t.bookOpdSkillBtn || '⚡ Book OPD'}</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              handleSend(
                language === 'te'
                  ? 'నాకు గత రెండు రోజుల నుండి జ్వరం మరియు తీవ్రమైన కడుపు నొప్పి ఉంది'
                  : language === 'hi'
                  ? 'मुझे पिछले दो दिनों से बुखार और पेट दर्द है'
                  : 'I have persistent fever and stomach pain for 2 days'
              )
            }
            style={styles.quickPromptPill}
          >
            <Text style={styles.quickPromptText}>
              {language === 'te' ? 'జ్వరం & నొప్పి' : language === 'hi' ? 'बुखार & दर्द' : 'Fever & Pain'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              handleSend(
                language === 'te'
                  ? 'పారాసెటమాల్ 650 వేసుకున్న తర్వాత ఎన్ని గంటలకు మళ్లీ వేసుకోవాలి?'
                  : language === 'hi'
                  ? 'पैरासिटामोल 650 कितने घंटे बाद दोबारा ले सकते हैं?'
                  : 'What is the safe interval between Paracetamol 650 doses?'
              )
            }
            style={styles.quickPromptPill}
          >
            <Text style={styles.quickPromptText}>
              {language === 'te' ? 'మందుల మోతాదు' : language === 'hi' ? 'दवा खुराक' : 'Paracetamol'}
            </Text>
          </Pressable>
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t.chatInputPlaceholder || 'Ask symptoms, medicines, or book OPD...'}
            placeholderTextColor="#94a3b8"
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
          >
            <Ionicons name="send" size={16} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  historyBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0d9488',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    maxWidth: 160,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelToggle: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modelToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
  },
  newChatBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDrawer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 12,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 6,
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  historyItemActive: {
    backgroundColor: '#f0fdfa',
  },
  historyItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  historyItemMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    marginBottom: 12,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  botRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#0d9488',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: '#0f172a',
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  timestampText: {
    fontSize: 9,
    color: '#94a3b8',
  },
  modelTag: {
    fontSize: 8,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tokenCard: {
    marginTop: 10,
    backgroundColor: '#f0fdfa',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  tokenCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ccfbf1',
  },
  tokenCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f766e',
  },
  tokenCardNumber: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    backgroundColor: '#0d9488',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tokenCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  tokenCardLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0f766e',
  },
  tokenCardVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  viewTokenBtn: {
    marginTop: 8,
    backgroundColor: '#0d9488',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewTokenText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  bookOpdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#5eead4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  bookOpdChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0d9488',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  promptBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  quickSkillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickSkillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0d9488',
  },
  quickPromptPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickPromptText: {
    fontSize: 10,
    color: '#475569',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
});
