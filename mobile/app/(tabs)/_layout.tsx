import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { NativeSOSButton } from '../../src/components/NativeSOSButton';

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0d9488',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 64 : 84,
          paddingBottom: Platform.OS === 'android' ? 8 : 28,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.navHome || 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size - 2} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: t.navChat || 'AI Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size - 2} color={color} />
          ),
        }}
      />

      {/* Floating Center 2.5s SOS Emergency Button */}
      <Tabs.Screen
        name="sos-placeholder"
        options={{
          title: '',
          tabBarButton: () => <NativeSOSButton />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // Don't navigate, handled by long press
          },
        }}
      />

      <Tabs.Screen
        name="records"
        options={{
          title: t.navRecords || 'Records',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size - 2} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tokens"
        options={{
          title: t.navTokens || 'Tokens',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket" size={size - 2} color={color} />
          ),
        }}
      />

      {/* Profile hidden from tab bar, accessed via avatar in Home header */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
