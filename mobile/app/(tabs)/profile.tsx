import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { UserProfile, Language } from '../../src/types';
import { healthConnectService } from '../../src/services/healthConnect';

export default function ProfileScreen() {
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const u = await api.getProfile();
      setProfile(u);
    } catch (e) {
      console.warn('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
    try {
      await api.updateProfile({ preferred_language: lang });
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.profileTitle || 'Patient Profile & Settings'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color="#0d9488" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* User Details Card */}
            <View style={styles.card}>
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profile?.name?.charAt(0) || 'R'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{profile?.name || 'Ramesh Varma'}</Text>
                  <Text style={styles.userPhone}>{profile?.phone || '+91 98480 12345'}</Text>
                  <Text style={styles.userMeta}>
                    Age: {profile?.age || 38} • Gender: {profile?.gender || 'Male'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Language Preference Selector */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Application Language</Text>
              <Text style={styles.sectionSubtitle}>Select your native preferred language</Text>

              <View style={styles.langGrid}>
                {[
                  { code: 'te' as Language, label: 'తెలుగు (Telugu)' },
                  { code: 'hi' as Language, label: 'हिंदी (Hindi)' },
                  { code: 'en' as Language, label: 'English' },
                ].map((item) => (
                  <Pressable
                    key={item.code}
                    onPress={() => handleLanguageChange(item.code)}
                    style={[
                      styles.langOption,
                      language === item.code && styles.langOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.langOptionText,
                        language === item.code && styles.langOptionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {language === item.code && (
                      <Ionicons name="checkmark-circle" size={18} color="#0d9488" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Emergency Contact */}
            <View style={[styles.card, { borderColor: '#fecdd3', backgroundColor: '#fff1f2' }]}>
              <Text style={[styles.sectionTitle, { color: '#9f1239' }]}>
                {t.emergencyContact || 'Emergency Contact (108 Link)'}
              </Text>
              <Text style={styles.contactName}>
                {profile?.emergency_contact?.name || 'Sita Varma'} (
                {profile?.emergency_contact?.relationship || 'Spouse'})
              </Text>
              <Text style={styles.contactPhone}>
                {profile?.emergency_contact?.phone || '+91 98480 54321'}
              </Text>
            </View>

            {/* Medical Flags & Allergies */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t.medicalFlags || 'Medical Information'}</Text>
              <View style={styles.flagRow}>
                <Text style={styles.flagLabel}>{t.knownConditions || 'Known Conditions'}:</Text>
                <Text style={styles.flagValue}>
                  {profile?.known_conditions?.join(', ') || 'Hypertension, Mild Asthmatic'}
                </Text>
              </View>
              <View style={styles.flagRow}>
                <Text style={styles.flagLabel}>{t.allergies || 'Allergies'}:</Text>
                <Text style={styles.flagValue}>
                  {profile?.allergies?.join(', ') || 'Penicillin (Severe)'}
                </Text>
              </View>
            </View>

            {/* Google Health Connect Setting */}
            <Pressable
              onPress={() => healthConnectService.openHealthConnectPlayStore()}
              style={styles.card}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="fitness" size={20} color="#0d9488" />
                  <View>
                    <Text style={styles.sectionTitle}>Google Health Connect</Text>
                    <Text style={styles.sectionSubtitle}>Manage native data permissions</Text>
                  </View>
                </View>
                <Ionicons name="open-outline" size={18} color="#64748b" />
              </View>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ccfbf1',
    borderWidth: 2,
    borderColor: '#5eead4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f766e',
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  userPhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  userMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
    marginBottom: 10,
  },
  langGrid: {
    gap: 8,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  langOptionActive: {
    backgroundColor: '#f0fdfa',
    borderColor: '#5eead4',
  },
  langOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  langOptionTextActive: {
    color: '#0f766e',
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  contactPhone: {
    fontSize: 12,
    color: '#be123c',
    marginTop: 2,
  },
  flagRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  flagLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    width: 120,
  },
  flagValue: {
    fontSize: 11,
    color: '#0f172a',
    flex: 1,
  },
});
