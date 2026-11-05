import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthConnectService } from '../services/healthConnect';
import { HealthConnectData } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const HealthConnectCard: React.FC = () => {
  const { t } = useLanguage();
  const [healthData, setHealthData] = useState<HealthConnectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const data = await healthConnectService.getTodayHealthData();
      setHealthData(data);
    } catch (e) {
      console.warn('Error fetching health data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectHealthData = async () => {
    setConnecting(true);
    try {
      const granted = await healthConnectService.requestPermissions();
      if (granted) {
        await fetchHealthData();
      }
    } catch (e) {
      console.warn('Failed to grant health permissions:', e);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconBadge}>
            <Ionicons name="fitness" size={16} color="#0d9488" />
          </View>
          <View>
            <Text style={styles.cardTitle}>{t.dailyHealthInsight || 'Google Health Connect'}</Text>
            <Text style={styles.syncText}>
              {healthData?.hasPermissions
                ? `Sync: ${healthData.lastSyncTimestamp}`
                : 'Android Health Platform'}
            </Text>
          </View>
        </View>

        {!healthData?.hasPermissions ? (
          <Pressable
            onPress={handleConnectHealthData}
            disabled={connecting}
            style={styles.connectButton}
          >
            {connecting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="link" size={12} color="#ffffff" />
                <Text style={styles.connectButtonText}>Connect</Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={styles.connectedBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        )}
      </View>

      {/* Metrics Grid */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#0d9488" />
        </View>
      ) : (
        <View style={styles.metricsGrid}>
          {/* Steps */}
          <View style={styles.metricBox}>
            <View style={styles.metricLabelRow}>
              <Ionicons name="footsteps" size={14} color="#0d9488" />
              <Text style={styles.metricLabel}>{t.steps || 'Steps'}</Text>
            </View>
            <Text style={styles.metricValue}>
              {healthData?.hasPermissions ? healthData.stepsToday.toLocaleString() : '—'}
            </Text>
            <Text style={styles.metricSub}>
              {healthData?.hasPermissions ? t.stepsGoal || 'Goal: 8,000' : 'Permissions needed'}
            </Text>
          </View>

          {/* Sleep */}
          <View style={styles.metricBox}>
            <View style={styles.metricLabelRow}>
              <Ionicons name="moon" size={14} color="#6366f1" />
              <Text style={styles.metricLabel}>{t.sleep || 'Sleep'}</Text>
            </View>
            <Text style={styles.metricValue}>
              {healthData?.hasPermissions && healthData.sleepHours > 0
                ? `${healthData.sleepHours}h`
                : '—'}
            </Text>
            <Text style={styles.metricSub}>
              {healthData?.hasPermissions ? (healthData.sleepHours < 6 ? t.sleepLow || 'Low' : 'Optimal') : 'Permissions needed'}
            </Text>
          </View>

          {/* Heart Rate */}
          <View style={styles.metricBox}>
            <View style={styles.metricLabelRow}>
              <Ionicons name="heart" size={14} color="#e11d48" />
              <Text style={styles.metricLabel}>{t.avgHeartRate || 'Avg HR'}</Text>
            </View>
            <Text style={styles.metricValue}>
              {healthData?.hasPermissions && healthData.heartRateAvg > 0
                ? `${healthData.heartRateAvg}`
                : '—'}
            </Text>
            <Text style={styles.metricSub}>
              {healthData?.hasPermissions ? 'BPM' : 'Permissions needed'}
            </Text>
          </View>
        </View>
      )}

      {/* Observation Tip */}
      <View style={styles.tipBox}>
        <Ionicons name="information-circle" size={16} color="#0d9488" style={{ marginTop: 1 }} />
        <Text style={styles.tipText}>
          {t.insightTip ||
            'Sleep duration combined with heat requires electrolyte hydration. Keep vitals in check.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  syncText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0d9488',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  connectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  metricSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: '#0f766e',
    lineHeight: 16,
  },
});
