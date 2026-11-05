import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { OPDToken } from '../../src/types';

export default function TokensScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [tokens, setTokens] = useState<OPDToken[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const data = await api.getTokens();
      setTokens(data);
    } catch (e) {
      console.warn('Error loading tokens:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTokens();
    setRefreshing(false);
  };

  const handleBookNew = async () => {
    try {
      const res = await api.bookOPD({ department: 'General Medicine' });
      setTokens((prev) => [res.token, ...prev]);
    } catch (e) {
      console.warn('Failed to book new OPD token:', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.activeOpdTokensTitle || 'Digital OPD Tokens'}</Text>
          <Text style={styles.headerSubtitle}>
            {tokens.length} {tokens.length === 1 ? 'Token issued' : 'Tokens issued'}
          </Text>
        </View>
        <Pressable onPress={handleBookNew} style={styles.bookBtn}>
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.bookBtnText}>Book OPD</Text>
        </Pressable>
      </View>

      <FlatList
        data={tokens}
        keyExtractor={(item) => item.id || item.token_number}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d9488']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>{t.noActiveTokens || 'No active OPD tokens'}</Text>
            <Text style={styles.emptyDesc}>
              {t.noActiveTokensDesc || 'Book an OPD consultation via Live Voice or the AI Health Chat.'}
            </Text>
            <Pressable onPress={handleBookNew} style={styles.emptyActionBtn}>
              <Text style={styles.emptyActionText}>⚡ {t.bookOpdSkillBtn || 'Book OPD Token'}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Top row */}
            <View style={styles.cardTopRow}>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenNumber}>{item.token_number}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'completed'
                    ? styles.statusCompleted
                    : item.status === 'in_consultation'
                    ? styles.statusInConsultation
                    : styles.statusWaiting,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'completed'
                      ? styles.statusTextCompleted
                      : item.status === 'in_consultation'
                      ? styles.statusTextInConsultation
                      : styles.statusTextWaiting,
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Hospital & Department */}
            <Text style={styles.hospitalName}>{item.hospital_name}</Text>
            <Text style={styles.departmentText}>{item.department}</Text>

            {/* Meta Row */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={14} color="#d97706" />
                <Text style={styles.metaText}>Wait: ~{item.estimated_wait_minutes} mins</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="navigate" size={14} color="#0d9488" />
                <Text style={styles.metaText}>{item.distance_km} km (straight-line)</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.issuedText}>
                {t.issuedAt || 'Issued'}: {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.priorityText}>Priority: {item.priority.toUpperCase()}</Text>
            </View>
          </View>
        )}
      />
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tokenBadge: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tokenNumber: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusWaiting: {
    backgroundColor: '#fef3c7',
  },
  statusInConsultation: {
    backgroundColor: '#e0e7ff',
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextWaiting: {
    color: '#b45309',
  },
  statusTextInConsultation: {
    color: '#4338ca',
  },
  statusTextCompleted: {
    color: '#15803d',
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  departmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0d9488',
    marginTop: 2,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  issuedText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  emptyActionBtn: {
    marginTop: 18,
    backgroundColor: '#0d9488',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
