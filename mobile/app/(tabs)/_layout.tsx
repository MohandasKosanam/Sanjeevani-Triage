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
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 62 : 82,
          paddingBottom: Platform.OS === 'android' ? 6 : 24,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
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
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={21} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={21} color={color} />
          ),
        }}
      />

      {/* Floating Center 2.5s SOS Emergency Button */}
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarButton: () => <NativeSOSButton />,
        }}
      />

      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={21} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tokens"
        options={{
          title: 'Tokens',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'ticket' : 'ticket-outline'} size={21} color={color} />
          ),
        }}
      />

      {/* Profile screen accessed via avatar in Home header */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
