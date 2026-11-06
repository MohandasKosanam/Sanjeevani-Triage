import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { api } from '../../src/services/api';
import { useLanguage } from '../../src/context/LanguageContext';
import { UserProfile } from '../../src/types';

export default function SOSScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 17.7124, lng: 83.3156 });
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 2500; // 2.5 seconds requirement

  useEffect(() => {
    loadProfileAndLocation();
  }, []);

  const loadProfileAndLocation = async () => {
    try {
      const u = await api.getProfile();
      setProfile(u);
    } catch (e) {
      console.warn('Could not load profile for emergency contact:', e);
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationStatus('granted');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } else {
        setLocationStatus('denied');
      }
    } catch (e) {
      setLocationStatus('denied');
    }
  };

  const startHold = () => {
    setDispatchError(null);
    setIsHolding(true);
    setHoldProgress(0);
    startTimeRef.current = Date.now();

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    ).start();

    // Progress timer
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setHoldProgress(pct);
    }, 40);

    holdTimerRef.current = setTimeout(() => {
      triggerSOSDispatch();
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const triggerSOSDispatch = async () => {
    cancelHold();
    setIsDispatching(true);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    try {
      // Real Priority 0 SOS dispatch to hospital gateway
      const res = await api.dispatchSOS(coords.lat, coords.lng);
      setIsDispatching(false);

      router.push({
        pathname: '/sos-active',
        params: {
          sos_id: res.sos_id,
          lat: coords.lat.toString(),
          lng: coords.lng.toString(),
        },
      });
    } catch (err: any) {
      setIsDispatching(false);
      const errMsg = err?.message || 'Hospital server unreachable';
      setDispatchError(errMsg);

      Alert.alert(
        'Hospital Dispatch Warning',
        `Could not reach hospital network (${errMsg}). Please dial emergency services directly immediately.`,
        [
          { text: 'Call 108 Ambulance', onPress: () => Linking.openURL('tel:108'), style: 'destructive' },
          { text: 'OK', style: 'cancel' },
        ]
      );
    }
  };

  const dialEmergencyContact = () => {
    if (profile?.emergency_contact?.phone) {
      Linking.openURL(`tel:${profile.emergency_contact.phone.replace(/\s+/g, '')}`);
    } else {
      Linking.openURL('tel:108');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerPill}>
          <View style={styles.dotRed} />
          <Text style={styles.headerPillText}>EMERGENCY COMMAND</Text>
        </View>
        <Text style={styles.title}>Priority 0 Emergency SOS</Text>
        <Text style={styles.subtitle}>
          Hold the red button for 2.5 seconds to dispatch your live location to the hospital emergency queue.
        </Text>
      </View>

      {/* Main Hold-to-SOS Button Section */}
      <View style={styles.sosButtonSection}>
        <Animated.View
          style={[
            styles.outerHalo,
            { transform: [{ scale: pulseAnim }] },
            isHolding && styles.outerHaloHolding,
          ]}
        >
          <Pressable
            onPressIn={startHold}
            onPressOut={cancelHold}
            disabled={isDispatching}
            style={({ pressed }) => [
              styles.innerButton,
              (pressed || isHolding) && styles.innerButtonHolding,
            ]}
          >
            <Ionicons name="warning" size={44} color="#ffffff" />
            <Text style={styles.sosButtonText}>
              {isDispatching ? 'DISPATCHING...' : isHolding ? `${Math.round((2.5 * (100 - holdProgress)) / 100 * 10) / 10}s` : 'HOLD SOS'}
            </Text>
            <Text style={styles.sosSubtext}>2.5 SECONDS</Text>
          </Pressable>
        </Animated.View>

        {isHolding && (
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${holdProgress}%` }]} />
          </View>
        )}
      </View>

      {/* Dispatch Error Notice if server unreachable */}
      {dispatchError && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#b91c1c" />
          <Text style={styles.errorText}>Server Warning: {dispatchError}. Use 108 below.</Text>
        </View>
      )}

      {/* Quick Direct Emergency Dial Buttons */}
      <View style={styles.actionCard}>
        <Text style={styles.sectionHeader}>DIRECT EMERGENCY DIAL (ONE-TAP)</Text>

        <Pressable onPress={() => Linking.openURL('tel:108')} style={styles.dialBtn}>
          <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="car" size={20} color="#dc2626" />
          </View>
          <View style={styles.dialTextGroup}>
            <Text style={styles.dialTitle}>108 Ambulance Transport</Text>
            <Text style={styles.dialSub}>Government Emergency Medical Service</Text>
          </View>
          <Ionicons name="call" size={20} color="#dc2626" />
        </Pressable>

        <Pressable onPress={() => Linking.openURL('tel:112')} style={styles.dialBtn}>
          <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="shield" size={20} color="#0284c7" />
          </View>
          <View style={styles.dialTextGroup}>
            <Text style={styles.dialTitle}>112 Unified Emergency</Text>
            <Text style={styles.dialSub}>Police, Fire & Medical Response</Text>
          </View>
          <Ionicons name="call" size={20} color="#0284c7" />
        </Pressable>

        <Pressable onPress={dialEmergencyContact} style={styles.dialBtn}>
          <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="people" size={20} color="#059669" />
          </View>
          <View style={styles.dialTextGroup}>
            <Text style={styles.dialTitle}>
              {profile?.emergency_contact ? `${profile.emergency_contact.name} (${profile.emergency_contact.relationship})` : 'Emergency Contact'}
            </Text>
            <Text style={styles.dialSub}>
              {profile?.emergency_contact?.phone || '+91 98480 22338 (Family)'}
            </Text>
          </View>
          <Ionicons name="call" size={20} color="#059669" />
        </Pressable>
      </View>

      {/* Location Status Footnote */}
      <View style={styles.locationFooter}>
        <Ionicons
          name={locationStatus === 'granted' ? 'location' : 'location-outline'}
          size={14}
          color={locationStatus === 'granted' ? '#0d9488' : '#e11d48'}
        />
        <Text style={styles.locationText}>
          GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)} ({locationStatus === 'granted' ? 'High Precision' : 'Default Medical Hub'})
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 8,
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e11d48',
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#be123c',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#881337',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#9f1239',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 320,
  },
  sosButtonSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  outerHalo: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#fecdd3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  outerHaloHolding: {
    backgroundColor: '#fda4af',
  },
  innerButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  innerButtonHolding: {
    backgroundColor: '#be123c',
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  sosSubtext: {
    color: '#ffe4e6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    width: 200,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffe4e6',
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#be123c',
    borderRadius: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9f1239',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dialTextGroup: {
    flex: 1,
  },
  dialTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  dialSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  locationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 16,
  },
  locationText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
