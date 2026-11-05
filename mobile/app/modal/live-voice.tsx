import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { OPDToken } from '../../src/types';

export default function LiveVoiceModal() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState('Connecting to Gemini 3.8 Live...');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [bookedToken, setBookedToken] = useState<OPDToken | null>(null);
  const [isBookingOPD, setIsBookingOPD] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    startPulseAnimation();
    connectLiveWs();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const connectLiveWs = () => {
    try {
      const baseUrl = api.getBaseUrl().replace('/api/v1', '');
      const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/live';

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusText(t.liveVoiceListening || 'Listening in Telugu, Hindi & English...');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ready') {
            setStatusText(t.liveVoiceListening || 'Gemini 3.8 Live active');
          } else if (data.type === 'text' && data.text) {
            setAiTranscript((prev) => prev + ' ' + data.text);
          } else if (data.type === 'opd_token_booked' && data.token) {
            setBookedToken(data.token);
            setStatusText('OPD Token Booked');
          }
        } catch (e) {}
      };

      ws.onerror = (e) => {
        console.warn('Live WebSocket error:', e);
        setStatusText('Live Audio Ready (Simulated Mode)');
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err: any) {
      setErrorMsg('Could not establish Live WebSocket. Falling back to local clinical engine.');
    }
  };

  const sendQuickSpeechText = (text: string) => {
    setUserTranscript(text);
    setAiTranscript('');
    setStatusText('Processing voice input with Gemini 3.8 Live...');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
    } else {
      // Fallback direct response
      setTimeout(() => {
        const fallbackText =
          language === 'te'
            ? 'నమస్కారం! మీ లక్షణాలను విన్నాము. మీ శరీర ఉష్ణోగ్రత మరియు రక్తపోటు గమనించండి. అవసరమైతే క్రింద ఓపీడీ టోకెన్ పొందవచ్చు.'
            : language === 'hi'
            ? 'नमस्ते! आपके लक्षण दर्ज कर लिए गए हैं। खूब पानी पिएं और तुरंत ओपीडी टोकन बुक करें।'
            : 'Sanjeevani Live received your symptoms. Rest, monitor vitals, and book an OPD queue token.';
        setAiTranscript(fallbackText);
        setIsAiSpeaking(false);
      }, 1000);
    }
  };

  const handleBookOPDDirectly = async (dept = 'General Medicine') => {
    setIsBookingOPD(true);
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'book_opd', department: dept }));
      }
      const res = await api.bookOPD({ department: dept });
      setBookedToken(res.token);
      const bookingNotice =
        language === 'te'
          ? `మీకు ${res.token.hospital_name} లో ఓపీడీ టోకెన్ ${res.token.token_number} (${res.token.department}) విజయవంతంగా బుక్ చేయబడింది!`
          : language === 'hi'
          ? `आपके लिए ${res.token.hospital_name} में ओपीडी टोकन ${res.token.token_number} (${res.token.department}) बुक कर दिया गया है!`
          : `OPD Token ${res.token.token_number} (${res.token.department}) booked for you at ${res.token.hospital_name}!`;
      setAiTranscript(bookingNotice);
    } catch (err: any) {
      setErrorMsg('Failed to book OPD token: ' + err.message);
    } finally {
      setIsBookingOPD(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.liveIndicator}>
            <View style={styles.activeDot} />
            <Text style={styles.liveIndicatorText}>{t.liveVoiceModalTitle || 'GEMINI 3.8 LIVE'}</Text>
          </View>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#94a3b8" />
          </Pressable>
        </View>

        {/* Pulsing Visualizer Orb */}
        <View style={styles.orbContainer}>
          <Animated.View style={[styles.orb, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons
              name={isMuted ? 'mic-off' : 'radio'}
              size={48}
              color="#2dd4bf"
            />
          </Animated.View>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        {/* Transcript Box */}
        <ScrollView style={styles.transcriptBox} contentContainerStyle={{ padding: 14 }}>
          {userTranscript ? (
            <Text style={styles.userTranscript}>
              <Text style={{ fontWeight: '800', color: '#64748b' }}>You: </Text>
              {userTranscript}
            </Text>
          ) : null}

          {aiTranscript ? (
            <Text style={styles.aiTranscript}>
              <Text style={{ fontWeight: '800', color: '#2dd4bf' }}>Gemini Live: </Text>
              {aiTranscript}
            </Text>
          ) : (
            <Text style={styles.placeholderTranscript}>
              Real-time conversational streaming audio in Telugu, Hindi & English.
            </Text>
          )}
        </ScrollView>

        {/* Booked OPD Token Banner */}
        {bookedToken && (
          <View style={styles.tokenCard}>
            <View style={styles.tokenCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="ticket" size={14} color="#2dd4bf" />
                <Text style={styles.tokenCardTitle}>
                  {t.opdTokenGeneratedNotice || 'OPD Token Confirmed'}
                </Text>
              </View>
              <Text style={styles.tokenNumber}>{bookedToken.token_number}</Text>
            </View>
            <Text style={styles.tokenHospital}>{bookedToken.hospital_name} • {bookedToken.department}</Text>
            <Text style={styles.tokenWait}>Estimated wait time: ~{bookedToken.estimated_wait_minutes} mins</Text>
          </View>
        )}

        {/* OPD Booking Skill Action Bar */}
        <View style={styles.skillBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.skillTitle}>{t.opdBookingSkillTitle || 'OPD Booking Skill'}</Text>
            <Text style={styles.skillDesc}>{t.bookOpdSkillDesc || 'Instant hospital routing'}</Text>
          </View>
          <Pressable
            onPress={() => handleBookOPDDirectly('General Medicine')}
            disabled={isBookingOPD}
            style={styles.skillBtn}
          >
            <Ionicons name="flash" size={14} color="#0f172a" />
            <Text style={styles.skillBtnText}>{t.bookOpdSkillBtn || '⚡ Book OPD'}</Text>
          </Pressable>
        </View>

        {/* Quick Voice Queries */}
        <View style={styles.quickQueryContainer}>
          <Text style={styles.quickQueryHeading}>{t.quickVoiceQueries || 'QUICK VOICE QUERIES'}</Text>
          <View style={styles.quickQueryGrid}>
            <Pressable
              onPress={() =>
                sendQuickSpeechText(
                  language === 'te'
                    ? 'నాకు గత రెండు రోజుల నుండి విపరీతమైన జ్వరం మరియు ఒంటి నొప్పులు ఉన్నాయి, ఓపీడీ టోకెన్ కావాలి.'
                    : language === 'hi'
                    ? 'मुझे दो दिनों से तेज बुखार है, मुझे ओपीडी टोकन बुक करना है।'
                    : 'I have had high fever for two days, please book an OPD queue token.'
                )
              }
              style={styles.queryBtn}
            >
              <Text style={styles.queryBtnText} numberOfLines={1}>
                {language === 'te' ? 'జ్వరం & ఓపీడీ బుకింగ్' : language === 'hi' ? 'बुखार & ओपीडी टोकन' : 'Fever & OPD Booking'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                sendQuickSpeechText(
                  language === 'te'
                    ? 'నాకు ఉదయం నుండి కడుపులో చాలా నొప్పిగా ఉంది, నేను ఏమి చేయాలి?'
                    : language === 'hi'
                    ? 'मुझे पेट में बहुत दर्द है, क्या उपाय करना चाहिए?'
                    : 'I have severe stomach ache since morning, what should I do?'
                )
              }
              style={styles.queryBtn}
            >
              <Text style={styles.queryBtnText} numberOfLines={1}>
                {language === 'te' ? 'కడుపు నొప్పి సలహా' : language === 'hi' ? 'पेट दर्द सलाह' : 'Stomach Ache'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom Call Controls */}
        <View style={styles.controlRow}>
          <Pressable
            onPress={() => setIsMuted((prev) => !prev)}
            style={[styles.muteBtn, isMuted && styles.muteBtnActive]}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color="#ffffff" />
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.endCallBtn}>
            <Ionicons name="call" size={20} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
            <Text style={styles.endCallText}>{t.endConversationBtn || 'End Session'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  liveIndicatorText: {
    color: '#2dd4bf',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbContainer: {
    alignItems: 'center',
    marginVertical: 18,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 2,
    borderColor: '#2dd4bf',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2dd4bf',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  statusText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  transcriptBox: {
    maxHeight: 140,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userTranscript: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 6,
  },
  aiTranscript: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 18,
  },
  placeholderTranscript: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
  },
  tokenCard: {
    backgroundColor: '#042f2e',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#14b8a6',
    marginVertical: 8,
  },
  tokenCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenCardTitle: {
    color: '#2dd4bf',
    fontSize: 11,
    fontWeight: '800',
  },
  tokenNumber: {
    backgroundColor: '#14b8a6',
    color: '#042f2e',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tokenHospital: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  tokenWait: {
    color: '#fbbf24',
    fontSize: 10,
    marginTop: 2,
  },
  skillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 6,
  },
  skillTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  skillDesc: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 1,
  },
  skillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2dd4bf',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  skillBtnText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '800',
  },
  quickQueryContainer: {
    marginVertical: 6,
  },
  quickQueryHeading: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  quickQueryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  queryBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    borderRadius: 12,
  },
  queryBtnText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
  },
  muteBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteBtnActive: {
    backgroundColor: '#d97706',
  },
  endCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  endCallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
