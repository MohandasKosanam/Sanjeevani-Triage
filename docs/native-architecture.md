# Sanjeevani Triage — Native Android Architecture

## 1. Directory Structure

```
Sanjeevani-Triage/
├── mobile/                           # Native Android Expo Application
│   ├── app/                          # Expo Router Screens
│   │   ├── _layout.tsx               # Root Layout with Language & Query Providers
│   │   ├── (auth)/                   # Authentication Group
│   │   │   ├── login.tsx             # Native Phone OTP / Login
│   │   │   └── register.tsx          # Patient Registration & Demographics
│   │   ├── (tabs)/                   # Native Bottom Tabs
│   │   │   ├── _layout.tsx           # Custom Native Tab Bar with Floating SOS Button
│   │   │   ├── index.tsx             # Home Dashboard & Live Voice Hub
│   │   │   ├── chat.tsx              # Native AI Health Chatbot & OPD Skill
│   │   │   ├── records.tsx           # Health Records (Triage, Rx, SOS)
│   │   │   ├── tokens.tsx            # Active & Completed OPD Tokens
│   │   │   └── profile.tsx           # Patient Profile & Language Switcher
│   │   ├── health-connect/           # Health Connect Screens
│   │   │   └── index.tsx             # Genuine Google Health Connect Dashboard
│   │   ├── modal/                    # Full-screen Modals
│   │   │   ├── rx-scanner.tsx        # Camera Prescription Scanner
│   │   │   └── live-voice.tsx        # Gemini 3.8 Live Voice Session
│   │   └── sos-active.tsx            # Priority 0 Full-Screen SOS Overlay
│   ├── src/
│   │   ├── components/               # Native UI Atoms & Molecules
│   │   ├── context/                  # LanguageContext & HealthConnectContext
│   │   ├── services/                 # api.ts, healthConnect.ts, chatStorage.ts
│   │   ├── types/                    # Preserved & Extended TypeScript Interfaces
│   │   └── utils/                    # translations.ts (Telugu, Hindi, English)
│   ├── app.json                      # Expo App Configuration with Health Connect Plugin
│   ├── eas.json                      # EAS Build Profiles (preview, production APK)
│   └── package.json                  # Native Dependencies
├── src/server/                       # Preserved Express Backend
│   ├── db.ts                         # In-Memory DB with Firestore Sync
│   ├── gemini.ts                     # Gemini Models & Multilingual Clinical Engine
│   ├── hospitalEngine.ts             # Hospital Registry & Haversine Allocation
│   └── routes.ts                     # REST Endpoints
├── server.ts                         # Main Server Entry (REST + WebSocket /api/live)
└── docs/                             # Migration & Architecture Documentation
```

---

## 2. Component Mapping (Web to Native)

| Web Construct | React Native Equivalent |
| :--- | :--- |
| `<div>`, `<section>`, `<main>` | `<View>`, `<SafeAreaView>` |
| `<p>`, `<span>`, `<h1>` | `<Text>` with custom font weights and line heights |
| `<button>`, `onClick` | `<Pressable>`, `<TouchableOpacity>` |
| `<input type="text">` | `<TextInput>` |
| `overflow-y-auto` | `<ScrollView>`, `<FlatList>` |
| `localStorage` | `AsyncStorage` / `expo-secure-store` |
| `EventSource` (SSE) | React Native EventSource polyfill or long-polling |
| `WebSocket` | Native global `WebSocket` |
| Web Audio API (`AudioContext`) | `expo-av` Sound and Recording APIs |
| Camera `<input>` | `expo-camera` / `expo-image-picker` |
| GPS navigator | `expo-location` with high accuracy |
| Lucide React Web Icons | `@expo/vector-icons` (Ionicons, MaterialIcons, Feather) |

---

## 3. Google Health Connect Architecture
- Native library: `react-native-health-connect`
- Android Manifest permissions:
  - `android.permission.health.READ_STEPS`
  - `android.permission.health.READ_HEART_RATE`
  - `android.permission.health.READ_SLEEP`
  - `android.permission.health.READ_TOTAL_CALORIES_BURNED`
  - `android.permission.health.READ_DISTANCE`
  - `android.permission.health.READ_RESTING_HEART_RATE`
- Fallback & Error Handling: Honest empty states when Health Connect is not installed or permissions are revoked; zero fake measurements.
