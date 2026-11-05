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
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { api } from '../../src/services/api';
import { TriageRecord, PrescriptionRecord, SOSEvent } from '../../src/types';

export default function RecordsScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'triage' | 'prescriptions' | 'sos'>('triage');
  const [triageRecords, setTriageRecords] = useState<TriageRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllRecords();
  }, []);

  const loadAllRecords = async () => {
    try {
      const [trg, rx, sos] = await Promise.all([
        api.getTriageHistory(),
        api.getPrescriptions(),
        api.getSOSHistory(),
      ]);
      setTriageRecords(trg);
      setPrescriptions(rx);
      setSosEvents(sos);
    } catch (e) {
      console.warn('Error loading health records:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllRecords();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.healthRecordsTitle || 'Medical Records'}</Text>
        <Text style={styles.headerSubtitle}>Synchronized clinical history</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <Pressable
          onPress={() => setActiveTab('triage')}
          style={[styles.segmentBtn, activeTab === 'triage' && styles.segmentBtnActive]}
        >
          <Text style={[styles.segmentText, activeTab === 'triage' && styles.segmentTextActive]}>
            {t.triageRecordsTab || 'Triage'} ({triageRecords.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('prescriptions')}
          style={[styles.segmentBtn, activeTab === 'prescriptions' && styles.segmentBtnActive]}
        >
          <Text style={[styles.segmentText, activeTab === 'prescriptions' && styles.segmentTextActive]}>
            {t.prescriptionsTab || 'Rx'} ({prescriptions.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('sos')}
          style={[styles.segmentBtn, activeTab === 'sos' && styles.segmentBtnActive]}
        >
          <Text style={[styles.segmentText, activeTab === 'sos' && styles.segmentTextActive]}>
            {t.sosLogsTab || 'SOS Logs'} ({sosEvents.length})
          </Text>
        </Pressable>
      </View>

      {/* Records Lists */}
      <View style={{ flex: 1 }}>
        {activeTab === 'triage' && (
          <FlatList
            data={triageRecords}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d9488']} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>{t.noTriageRecords || 'No symptom triage records found'}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.tierBadge,
                      item.tier === 3 ? styles.tier3 : item.tier === 2 ? styles.tier2 : styles.tier1,
                    ]}
                  >
                    <Text style={styles.tierBadgeText}>TIER {item.tier}</Text>
                  </View>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>

                <Text style={styles.cardTitle}>{item.clinical_department}</Text>
                <Text style={styles.cardSymptoms}>{item.translated_symptoms}</Text>

                {item.patient_instructions_native && (
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsText}>{item.patient_instructions_native}</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.severityText}>Severity Score: {item.severity_score}/10</Text>
                  {item.opd_token && (
                    <Text style={styles.tokenTag}>Token: {item.opd_token}</Text>
                  )}
                </View>
              </View>
            )}
          />
        )}

        {activeTab === 'prescriptions' && (
          <FlatList
            data={prescriptions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d9488']} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="camera-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>{t.noPrescriptions || 'No scanned prescriptions'}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.id}</Text>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>

                {item.safety_warning ? (
                  <View style={styles.warningBox}>
                    <Ionicons name="warning" size={14} color="#e11d48" />
                    <Text style={styles.warningText}>{item.safety_warning}</Text>
                  </View>
                ) : null}

                {item.medicines.map((m, idx) => (
                  <View key={idx} style={styles.medRow}>
                    <Text style={styles.medName}>• {m.name}</Text>
                    <Text style={styles.medDosage}>{m.dosage} | {m.frequency}</Text>
                  </View>
                ))}
              </View>
            )}
          />
        )}

        {activeTab === 'sos' && (
          <FlatList
            data={sosEvents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d9488']} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>{t.noSosLogs || 'No emergency SOS events logged'}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.card, { borderColor: '#fecdd3' }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.p0Badge}>
                    <Text style={styles.p0Text}>PRIORITY 0 SOS</Text>
                  </View>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
                <Text style={styles.cardTitle}>Emergency Event ID: {item.id}</Text>
                <Text style={styles.sosCoords}>
                  GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
                <Text style={styles.sosStatus}>Status: {item.status.toUpperCase()}</Text>
              </View>
            )}
          />
        )}
      </View>
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
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#0d9488',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tier1: {
    backgroundColor: '#dcfce7',
  },
  tier2: {
    backgroundColor: '#fef3c7',
  },
  tier3: {
    backgroundColor: '#fee2e2',
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSymptoms: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  instructionsBox: {
    backgroundColor: '#f0fdfa',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  instructionsText: {
    fontSize: 10,
    color: '#0f766e',
    lineHeight: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  tokenTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0d9488',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    padding: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  warningText: {
    fontSize: 10,
    color: '#e11d48',
    flex: 1,
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  medName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  medDosage: {
    fontSize: 10,
    color: '#64748b',
  },
  p0Badge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  p0Text: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  sosCoords: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  sosStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e11d48',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
});
