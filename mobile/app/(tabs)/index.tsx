import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { HealthConnectCard } from '../../src/components/HealthConnectCard';
import { api } from '../../src/services/api';
import { OPDToken, UserProfile, Language } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<OPDToken[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [u, tok] = await Promise.all([api.getProfile(), api.getTokens()]);
      setProfile(u);
      setTokens(tok);
    } catch (e) {
      console.warn('Error loading home data:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const activeToken = tokens.find((tok) => tok.status === 'waiting' || tok.status === 'in_consultation');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Application Bar matching Screenshot 2 */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>सं</Text>
          </View>
          <View>
            <View style={styles.appNameRow}>
              <Text style={styles.appName}>Sanjeevani Triage</Text>
              <View style={styles.opdBadge}>
                <Text style={styles.opdBadgeText}>OPD</Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={11} color="#0d9488" style={{ marginRight: 2 }} />
              <Text style={styles.locationText}>Visakhapatnam Medical Hub</Text>
            </View>
          </View>
        </View>

        {/* Language Switcher Pill (తెలుగు | हिंदी | EN) */}
        <View style={styles.langContainer}>
          <Pressable
            onPress={() => setLanguage('te')}
            style={[styles.langItem, language === 'te' && styles.langItemActive]}
          >
            <Text style={[styles.langText, language === 'te' && styles.langTextActive]}>
              తెలుగు
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage('hi')}
            style={[styles.langItem, language === 'hi' && styles.langItemActive]}
          >
            <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>
              हिंदी
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage('en')}
            style={[styles.langItem, language === 'en' && styles.langItemActive]}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
              EN
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d9488']} />}
      >
        {/* Patient Greeting Row with Right Avatar */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextGroup}>
            <Text style={styles.greetingTitle}>
              {language === 'te'
                ? 'నమస్కారం, రమేష్ వర్మ'
                : language === 'hi'
                ? 'नमस्ते, रमेश वर्मा'
                : 'Hello, Ramesh Varma'}
            </Text>
            <Text style={styles.greetingSubtitle}>
              {language === 'te'
                ? 'ఈరోజు మీ ఆరోగ్యానికి ఎలా సహాయపడగలం?'
                : language === 'hi'
                ? 'आज हम आपके स्वास्थ्य में कैसे सहायता कर सकते हैं?'
                : 'How can we assist your health today?'}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarInitial}>
              {profile?.name ? profile.name.charAt(0) : 'R'}
            </Text>
          </Pressable>
        </View>

        {/* CARD 1: DAILY HEALTH INSIGHT (Google Health Connect) */}
        <HealthConnectCard />

        {/* CARD 2: GEMINI 3.8 LIVE VOICE CONVERSATION */}
        <View style={styles.voiceHeroCard}>
          {/* Header Row */}
          <View style={styles.voiceHeaderRow}>
            <View style={styles.voiceTitleGroup}>
              <View style={styles.voiceIconBadge}>
                <Ionicons name="radio" size={16} color="#2dd4bf" />
              </View>
              <View>
                <Text style={styles.geminiTag}>GEMINI 3.8 LIVE</Text>
                <Text style={styles.geminiLangText}>Telugu • Hindi • English</Text>
              </View>
            </View>

            {/* OPD Booking Skill Badge */}
            <Pressable
              onPress={() => router.push('/modal/live-voice')}
              style={styles.skillPill}
            >
              <Ionicons name="sparkles" size={11} color="#2dd4bf" style={{ marginRight: 4 }} />
              <Text style={styles.skillPillText}>OPD Booking Skill</Text>
            </Pressable>
          </View>

          {/* Body Copy */}
          <Text style={styles.voiceMainTitle}>Live AI Voice Conversation</Text>
          <Text style={styles.voiceMainDesc}>
            Real-time conversational voice triage & instant OPD booking
          </Text>

          {/* Action Buttons Row */}
          <View style={styles.voiceActionRow}>
            <Pressable
              onPress={() => router.push('/modal/live-voice')}
              style={({ pressed }) => [styles.startVoiceBtn, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="mic" size={16} color="#2dd4bf" style={{ marginRight: 6 }} />
              <Text style={styles.startVoiceText}>Start Live Conversation</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/tokens')}
              style={({ pressed }) => [styles.opdTokenBtn, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="flash" size={13} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.opdTokenText}>OPD Token →</Text>
            </Pressable>
          </View>
        </View>

        {/* CARD 3: SMART RX DECODER */}
        <Pressable
          onPress={() => router.push('/modal/rx-scanner')}
          style={({ pressed }) => [styles.rxCard, pressed && { opacity: 0.94 }]}
        >
          <View style={styles.rxIconBadge}>
            <Ionicons name="camera-outline" size={22} color="#0d9488" />
          </View>
          <View style={styles.rxTextGroup}>
            <Text style={styles.rxTitle}>Smart Rx Decoder</Text>
            <Text style={styles.rxSubtitle}>
              Photograph doctor prescription & get instructions safely
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </Pressable>

        {/* CARD 4: 2.5s EMERGENCY SOS COMMAND (Requirement 6) */}
        <Pressable
          onPress={() => router.push('/(tabs)/sos')}
          style={({ pressed }) => [styles.sosCard, pressed && { opacity: 0.94 }]}
        >
          <View style={styles.sosCardIconBadge}>
            <Ionicons name="alert-circle" size={22} color="#ffffff" />
          </View>
          <View style={styles.sosCardTextGroup}>
            <View style={styles.sosCardHeaderRow}>
              <Text style={styles.sosCardTitle}>Priority 0 Emergency SOS</Text>
              <View style={styles.sosBadgePill}>
                <Text style={styles.sosBadgePillText}>EMERGENCY</Text>
              </View>
            </View>
            <Text style={styles.sosCardSubtitle}>
              2.5s hold protocol for instant hospital queue dispatch & 108
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#e11d48" />
        </Pressable>

        {/* ACTIVE OPD TOKEN PREVIEW (When booked) */}
        {activeToken && (
          <Pressable
            onPress={() => router.push('/(tabs)/tokens')}
            style={styles.activeTokenCard}
          >
            <View style={styles.tokenTopRow}>
              <View style={styles.tokenBadgeGroup}>
                <Ionicons name="ticket" size={14} color="#0d9488" style={{ marginRight: 4 }} />
                <Text style={styles.tokenTitle}>Active OPD Token</Text>
              </View>
              <Text style={styles.tokenNumber}>{activeToken.token_number}</Text>
            </View>
            <Text style={styles.tokenHospital}>{activeToken.hospital_name}</Text>
            <Text style={styles.tokenMeta}>
              Queue: #{activeToken.queue_position} ahead • ~{activeToken.estimated_wait_minutes} mins wait
            </Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  opdBadge: {
    backgroundColor: '#ccfbf1',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 6,
  },
  opdBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f766e',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  locationText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  langContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  langItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langItemActive: {
    backgroundColor: '#0d9488',
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  langTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#f8fafc',
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingTextGroup: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#99f6e4',
  },
  avatarInitial: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f766e',
  },
  voiceHeroCard: {
    backgroundColor: '#0b1b2b',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#115e59',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  voiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  voiceTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  geminiTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2dd4bf',
    letterSpacing: 0.5,
  },
  geminiLangText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d3834',
    borderWidth: 1,
    borderColor: '#14b8a6',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  skillPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  voiceMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  voiceMainDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: '#94a3b8',
    marginBottom: 16,
  },
  voiceActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  startVoiceBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#08332e',
    borderWidth: 1,
    borderColor: '#134e4a',
    borderRadius: 14,
    paddingVertical: 11,
  },
  startVoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  opdTokenBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d9488',
    borderRadius: 14,
    paddingVertical: 11,
  },
  opdTokenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  rxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rxIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rxTextGroup: {
    flex: 1,
  },
  rxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  rxSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  activeTokenCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderLeftWidth: 4,
    borderLeftColor: '#0d9488',
    marginBottom: 14,
  },
  tokenTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d9488',
  },
  tokenNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  tokenHospital: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  tokenMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 14,
  },
  sosCardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sosCardTextGroup: {
    flex: 1,
  },
  sosCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sosCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#881337',
  },
  sosBadgePill: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  sosBadgePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#be123c',
    letterSpacing: 0.5,
  },
  sosCardSubtitle: {
    fontSize: 11,
    color: '#9f1239',
    marginTop: 2,
    lineHeight: 15,
  },
});
