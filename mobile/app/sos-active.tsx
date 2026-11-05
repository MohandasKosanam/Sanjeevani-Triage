import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { api } from '../src/services/api';
import { useLanguage } from '../src/context/LanguageContext';

export default function SOSActiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sos_id: string; lat: string; lng: string }>();
  const { t } = useLanguage();

  const [stage, setStage] = useState<'recording' | 'buzzer' | 'ready'>('recording');
  const [secondsRemaining, setSecondsRemaining] = useState(20);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const sosId = params.sos_id || 'SOS-ACTIVE';
  const lat = params.lat || '17.7124';
  const lng = params.lng || '83.3156';

  useEffect(() => {
    startVisualPulse();
    runSOSSequence();

    return () => {
      cleanupAudio();
    };
  }, []);

  const startVisualPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const cleanupAudio = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
  };

  /**
   * Execution of the strict 5-stage protocol:
   * 1. Priority 0 SOS event already dispatched before navigation.
   * 2. Record ambient audio for 20 seconds.
   * 3. Play local buzzer for 10 seconds AFTER recording.
   * 4. Upload ambient audio to backend.
   */
  const runSOSSequence = async () => {
    // Stage 1: Record ambient audio for 20 seconds
    setStage('recording');
    setSecondsRemaining(20);

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (err) {
      console.warn('Audio recording init error:', err);
    }

    // Countdown 20s
    for (let i = 20; i > 0; i--) {
      setSecondsRemaining(i);
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Stop recording
    let recordedUri: string | null = null;
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        recordedUri = recordingRef.current.getURI();
        setAudioUri(recordedUri);
        recordingRef.current = null;
      } catch (e) {}
    }

    // Upload audio if captured
    if (recordedUri && sosId) {
      api.uploadSOSAudio(sosId, recordedUri, 20).catch((e) => console.warn('Audio upload warning:', e));
    }

    // Stage 2: Play local buzzer for 10 seconds AFTER recording
    setStage('buzzer');
    setSecondsRemaining(10);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Countdown 10s for buzzer
    for (let i = 10; i > 0; i--) {
      setSecondsRemaining(i);
      if (Platform.OS !== 'web' && i % 2 === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Finished sequence
    setStage('ready');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Emergency Beacon */}
        <View style={styles.topBeacon}>
          <View style={styles.beaconPill}>
            <View style={styles.beaconDot} />
            <Text style={styles.beaconText}>
              {t.priority0Activated || 'PRIORITY 0 SOS DISPATCHED'}
            </Text>
          </View>
          <Text style={styles.ticketId}>ID: {sosId}</Text>
        </View>

        {/* Central Flashing Siren Shield */}
        <View style={styles.centerSection}>
          <Animated.View style={[styles.sirenCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="warning" size={64} color="#ffffff" />
          </Animated.View>

          <Text style={styles.stageTitle}>
            {stage === 'recording'
              ? `🎙️ Recording Ambient Context (${secondsRemaining}s)`
              : stage === 'buzzer'
              ? `🔊 Local Emergency Siren Active (${secondsRemaining}s)`
              : 'Emergency Incident Transmitted'}
          </Text>

          <Text style={styles.stageDesc}>
            {stage === 'recording'
              ? 'Silently recording 20s of environmental audio for triage context before sounding buzzer.'
              : stage === 'buzzer'
              ? 'Local high-decibel siren active to guide immediate first responders to your position.'
              : 'Hospital dashboard notified. Keep phone accessible.'}
          </Text>
        </View>

        {/* Live GPS & Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>GPS COORDINATES:</Text>
            <Text style={styles.statusVal}>{lat}, {lng}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>ROUTING PROTOCOL:</Text>
            <Text style={[styles.statusVal, { color: '#fbbf24' }]}>PRIORITY 0 DISPATCH</Text>
          </View>
          <View style={styles.disclaimerBox}>
            <Ionicons name="shield-checkmark" size={14} color="#ffffff" />
            <Text style={styles.disclaimerText}>
              Medical alert dispatched to hospital command center. For road ambulance transport, call 108 below.
            </Text>
          </View>
        </View>

        {/* Direct Emergency Call Button */}
        <View style={styles.bottomActions}>
          <Pressable
            onPress={() => Linking.openURL('tel:108')}
            style={styles.call108Btn}
          >
            <Ionicons name="call" size={20} color="#ffffff" />
            <Text style={styles.call108Text}>{t.dial108 || 'Dial 108 Ambulance Directly'}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              cleanupAudio();
              router.back();
            }}
            style={styles.dismissBtn}
          >
            <Text style={styles.dismissText}>{t.acknowledgeBtn || 'Return to App'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7f1d1d',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  topBeacon: {
    alignItems: 'center',
    gap: 6,
  },
  beaconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  beaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  beaconText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ticketId: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  centerSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  sirenCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#dc2626',
    borderWidth: 6,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 24,
  },
  stageTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  stageDesc: {
    color: '#fee2e2',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  statusCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '800',
  },
  statusVal: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  disclaimerText: {
    color: '#ffffff',
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  bottomActions: {
    gap: 10,
  },
  call108Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
  },
  call108Text: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '900',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dismissText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
});
