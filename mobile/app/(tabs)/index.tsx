import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
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

  const activeToken = tokens.find((t) => t.status === 'waiting' || t.status === 'in_consultation');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Application Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>सं</Text>
          </View>
          <View>
            <View style={styles.appNameRow}>
              <Text style={styles.appName}>{t.appTitle || 'Sanjeevani'}</Text>
              <View style={styles.opdBadge}>
                <Text style={styles.opdBadgeText}>OPD</Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={10} color="#0d9488" />
              <Text style={styles.locationText}>{t.medicalHubLocation || 'Visakhapatnam Hub'}</Text>
            </View>
          </View>
        </View>

        {/* Language Switcher & Profile Button */}
        <View style={styles.topRightActions}>
          <View style={styles.langSelector}>
            {(['te', 'hi', 'en'] as Language[]).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => setLanguage(lang)}
                style={[styles.langBtn, language === lang && styles.langBtnActive]}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    language === lang && styles.langBtnTextActive,
                  ]}
                >
                  {lang === 'te' ? 'తె' : lang === 'hi' ? 'हि' : 'EN'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatarBtn}
          >
            <Text style={styles.avatarText}>
              {profile?.name ? profile.name.charAt(0) : 'R'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d9488']} />}
      >
        {/* Patient Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>
            {t.greeting
              ? t.greeting(profile?.name || (language === 'te' ? 'రమేష్ వర్మ' : language === 'hi' ? 'रमेश वर्मा' : 'Ramesh Varma'))
              : `Namaste, ${profile?.name || 'Ramesh'}`}
          </Text>
          <Text style={styles.greetingSubtitle}>
            {t.greetingSubtitle || 'How can our healthcare AI assist you today?'}
          </Text>
        </View>

        {/* Genuine Google Health Connect Card */}
        <HealthConnectCard />

        {/* PRIMARY HERO: Live AI Voice Conversation & OPD Booking */}
        <Pressable
          onPress={() => router.push('/modal/live-voice')}
          style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.95 }]}
        >
          {/* Top Hero Pill Row */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroMicBadge}>
              <Ionicons name="radio" size={20} color="#2dd4bf" />
            </View>
            <View style={styles.heroBadgeGroup}>
              <View style={styles.liveTag}>
                <View style={styles.pulsingDot} />
                <Text style={styles.liveTagText}>Gemini 3.8 Live</Text>
              </View>
              <View style={styles.skillTag}>
                <Ionicons name="flash" size={10} color="#fde047" />
                <Text style={styles.skillTagText}>OPD Skill</Text>
              </View>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {t.liveVoiceHeroTitle || 'Live AI Voice Conversation'}
          </Text>
          <Text style={styles.heroDesc}>
            {t.liveVoiceHeroSubtitle ||
              'Real-time conversational voice triage & instant OPD hospital queue token booking.'}
          </Text>

          <View style={styles.heroFooter}>
            <View style={styles.heroLangChips}>
              <Text style={styles.heroLangChip}>Telugu</Text>
              <Text style={styles.heroLangChip}>Hindi</Text>
              <Text style={styles.heroLangChip}>English</Text>
            </View>
            <View style={styles.startCallPill}>
              <Text style={styles.startCallText}>{t.startLiveVoiceHero || 'Talk Live'}</Text>
              <Ionicons name="arrow-forward" size={14} color="#0f172a" />
            </View>
          </View>
        </Pressable>

        {/* SECONDARY ACTION: Smart Rx Decoder */}
        <Pressable
          onPress={() => router.push('/modal/rx-scanner')}
          style={({ pressed }) => [styles.rxCard, pressed && { opacity: 0.92 }]}
        >
          <View style={styles.rxIconBox}>
            <Ionicons name="camera" size={20} color="#0d9488" />
          </View>
          <View style={styles.rxTextBox}>
            <Text style={styles.rxTitle}>{t.smartRxTitle || 'Smart Rx Decoder'}</Text>
            <Text style={styles.rxDesc}>
              {t.smartRxDesc || 'Photograph doctor prescription & get safe dosage instructions'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </Pressable>

        {/* DUAL FEATURE CARDS */}
        <View style={styles.dualGrid}>
          {/* Card 1: Gemini Live Audio */}
          <Pressable
            onPress={() => router.push('/modal/live-voice')}
            style={({ pressed }) => [styles.gridCard, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.gridCardIcon}>
              <Ionicons name="mic" size={18} color="#2dd4bf" />
            </View>
            <Text style={styles.gridCardTitle}>{t.liveVoiceTitle || 'Live Voice'}</Text>
            <Text style={styles.gridCardDesc}>{t.liveVoiceDesc || 'Real-time audio'}</Text>
            <View style={styles.gridCardLink}>
              <Text style={styles.gridLinkText}>⚡ {t.talkLive || 'Talk'}</Text>
              <Ionicons name="chevron-forward" size={12} color="#2dd4bf" />
            </View>
          </Pressable>

          {/* Card 2: AI Health Chatbot */}
          <Pressable
            onPress={() => router.push('/(tabs)/chat')}
            style={({ pressed }) => [styles.gridCard, pressed && { opacity: 0.92 }]}
          >
            <View style={[styles.gridCardIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Ionicons name="chatbubbles" size={18} color="#a5b4fc" />
            </View>
            <Text style={styles.gridCardTitle}>{t.aiChatTitle || 'AI Chatbot'}</Text>
            <Text style={styles.gridCardDesc}>{t.aiChatDesc || 'Multi-turn Q&A'}</Text>
            <View style={styles.gridCardLink}>
              <Text style={styles.gridLinkText}>⚡ {t.bookOpdSkillBtn || 'Book'}</Text>
              <Ionicons name="chevron-forward" size={12} color="#2dd4bf" />
            </View>
          </Pressable>
        </View>

        {/* ACTIVE OPD TOKEN BANNER (If available) */}
        {activeToken && (
          <Pressable
            onPress={() => router.push('/(tabs)/tokens')}
            style={styles.tokenBanner}
          >
            <View style={styles.tokenBannerHeader}>
              <View style={styles.tokenBannerLeft}>
                <Ionicons name="ticket" size={16} color="#0d9488" />
                <Text style={styles.tokenBannerTitle}>Active OPD Queue Token</Text>
              </View>
              <Text style={styles.tokenNumber}>{activeToken.token_number}</Text>
            </View>
            <View style={styles.tokenDetailsRow}>
              <Text style={styles.tokenDetailText}>{activeToken.hospital_name}</Text>
              <Text style={styles.tokenWaitText}>~{activeToken.estimated_wait_minutes}m wait</Text>
            </View>
          </Pressable>
        )}

        {/* 108 Emergency Helpline Banner */}
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyLeft}>
            <Ionicons name="call" size={16} color="#e11d48" />
            <View>
              <Text style={styles.emergencyTitle}>{t.ambulanceHelpline || 'Ambulance Helpline 108'}</Text>
              <Text style={styles.emergencySub}>Toll-free 24/7 direct dialer</Text>
            </View>
          </View>
          <Pressable
            onPress={() => Linking.openURL('tel:108')}
            style={styles.dialButton}
          >
            <Text style={styles.dialButtonText}>{t.dial108 || 'Call 108'}</Text>
          </Pressable>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  opdBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  opdBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f766e',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: 10,
    color: '#64748b',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: '#0d9488',
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  langBtnTextActive: {
    color: '#ffffff',
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#5eead4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f766e',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  greetingSection: {
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  greetingSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    elevation: 4,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroMicBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(45, 212, 191, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2dd4bf',
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2dd4bf',
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(253, 224, 71, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  skillTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fef08a',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 14,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  heroLangChips: {
    flexDirection: 'row',
    gap: 4,
  },
  heroLangChip: {
    fontSize: 9,
    fontWeight: '700',
    color: '#cbd5e1',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  startCallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2dd4bf',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  startCallText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  rxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rxIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rxTextBox: {
    flex: 1,
  },
  rxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  rxDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  dualGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  gridCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  gridCardDesc: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 10,
  },
  gridCardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  gridLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  tokenBanner: {
    backgroundColor: '#f0fdfa',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#99f6e4',
    marginBottom: 14,
  },
  tokenBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tokenBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tokenBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f766e',
  },
  tokenNumber: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f766e',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tokenDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenDetailText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  tokenWaitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff1f2',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9f1239',
  },
  emergencySub: {
    fontSize: 9,
    color: '#be123c',
  },
  dialButton: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dialButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});
