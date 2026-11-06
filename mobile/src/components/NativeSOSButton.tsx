import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export const NativeSOSButton: React.FC = () => {
  const router = useRouter();
  const [isPressing, setIsPressing] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);
  const triggeredRef = useRef<boolean>(false);

  const startPress = () => {
    setIsPressing(true);
    triggeredRef.current = false;
    pressStartTimeRef.current = Date.now();

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Progress animation over 2.5 seconds (2500ms)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    ).start();

    timerRef.current = setTimeout(async () => {
      triggeredRef.current = true;
      await triggerSOS();
    }, 2500);
  };

  const cancelPress = () => {
    const elapsed = Date.now() - pressStartTimeRef.current;
    setIsPressing(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);

    // If quick tap without 2.5s hold, navigate to the dedicated SOS tab screen
    if (!triggeredRef.current && elapsed < 500) {
      router.push('/(tabs)/sos');
    }
  };

  const triggerSOS = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    let lat = 17.7124;
    let lng = 83.3156;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
    } catch (e) {
      console.warn('Could not get precise GPS, using fallback:', e);
    }

    try {
      // 1. Immediately submit Priority 0 SOS event
      const res = await api.dispatchSOS(lat, lng);

      // 2. Open full-screen active SOS emergency overlay with real ID
      router.push({
        pathname: '/sos-active',
        params: {
          sos_id: res.sos_id,
          lat: lat.toString(),
          lng: lng.toString(),
        },
      });
    } catch (e: any) {
      console.error('Failed to trigger emergency SOS:', e);
      const msg = e?.message || 'Hospital server unreachable';
      Alert.alert(
        'Hospital Dispatch Warning',
        `Could not reach hospital network (${msg}). Please dial emergency services directly immediately.`,
        [
          { text: 'Call 108 Ambulance', onPress: () => Linking.openURL('tel:108'), style: 'destructive' },
          { text: 'Open SOS Hub', onPress: () => router.push('/(tabs)/sos') },
        ]
      );
    } finally {
      setIsPressing(false);
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={startPress}
        onPressOut={cancelPress}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.outerHalo,
            { transform: [{ scale: pulseAnim }] },
            isPressing && styles.outerHaloPressing,
          ]}
        >
          <View style={[styles.innerRedCircle, isPressing && styles.innerRedPressing]}>
            <Ionicons name="alert-circle" size={26} color="#ffffff" />
          </View>
        </Animated.View>

        {/* Text underneath the red button matching screenshot 2 */}
        <Text style={styles.holdSosLabel}>HOLD SOS</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerHalo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  outerHaloPressing: {
    backgroundColor: '#fecaca',
  },
  innerRedCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  innerRedPressing: {
    backgroundColor: '#dc2626',
    borderColor: '#fca5a5',
  },
  holdSosLabel: {
    color: '#dc2626',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
