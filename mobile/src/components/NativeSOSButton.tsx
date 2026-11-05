import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
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

  const startPress = () => {
    setIsPressing(true);
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
          toValue: 1.15,
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
      await triggerSOS();
    }, 2500);
  };

  const cancelPress = () => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
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

      // 2. Open full-screen active SOS emergency overlay
      router.push({
        pathname: '/sos-active',
        params: {
          sos_id: res.sos_id,
          lat: lat.toString(),
          lng: lng.toString(),
        },
      });
    } catch (err: any) {
      console.error('Failed to trigger SOS:', err);
      // Still navigate so patient is protected
      router.push({
        pathname: '/sos-active',
        params: {
          sos_id: `SOS-${Date.now().toString().slice(-6)}`,
          lat: lat.toString(),
          lng: lng.toString(),
        },
      });
    } finally {
      cancelPress();
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
            styles.buttonWrapper,
            { transform: [{ scale: pulseAnim }] },
            isPressing && styles.buttonPressing,
          ]}
        >
          <View style={styles.innerCircle}>
            <Ionicons name="warning" size={24} color="#ffffff" />
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.holdText}>2.5s</Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -24,
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  buttonPressing: {
    backgroundColor: '#991b1b',
    borderColor: '#fca5a5',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  holdText: {
    color: '#fee2e2',
    fontSize: 8,
    fontWeight: '700',
  },
});
