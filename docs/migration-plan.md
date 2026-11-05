# Sanjeevani Triage — Native Android Migration Plan

## 1. Executive Summary & Migration Objective
The objective of this migration is to transition **Sanjeevani Triage** from a web-based prototype generated in Google AI Studio into a production-grade, genuine **native Android application** powered by **React Native**, **Expo (SDK 52+)**, **Expo Router**, and genuine **Google Health Connect** integration via `react-native-health-connect`.

The existing Node.js/Express server (`server.ts` + `src/server/*`) and Firebase Firestore backend will be completely preserved and connected to the native Android app via secure REST endpoints and real-time SSE / WebSocket streaming.

---

## 2. Source Codebase Inspection & Feature Inventory

| Module / Screen | Current Web Implementation | Target Native Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Authentication & Profile** | In-memory + Firebase user (`/api/v1/auth/*`) | Expo SecureStore + Native Login/Register + Profile Screen | Planned (M2) |
| **Home Dashboard** | `MobileAppView.tsx` Home Tab | `app/(tabs)/index.tsx` with native ScrollView, cards & actions | Planned (M2) |
| **Google Health Connect** | Simulated mock in `DailyHealthInsightCard.tsx` | Native Android Health Connect (`react-native-health-connect`) | Planned (M5) |
| **AI Live Voice Conversation** | Web Audio API + WebSocket (`GeminiLiveVoiceModal.tsx`) | `expo-av` + WebSocket streaming + Gemini 3.8 Live + OPD skill | Planned (M4, M6) |
| **AI Health Chatbot** | React DOM chat tab + `GeminiChatbotModal.tsx` | `app/(tabs)/chat.tsx` native FlatList, session drawer & OPD skill | Planned (M2, M4) |
| **Smart Rx Decoder** | HTML `<input type="file">` in `PrescriptionScannerSheet.tsx` | `expo-camera` / `expo-image-picker` native capture & crop | Planned (M6) |
| **Emergency SOS (2.5s)** | Web touch events + audio oscillators (`SOSEmergencyButton.tsx`) | Native `Pressable` + `expo-haptics` + `expo-location` + `expo-av` | Planned (M6) |
| **OPD Digital Tokens** | `OPDTokensList.tsx` HTML flexbox | `app/(tabs)/tokens.tsx` native FlatList + card components | Planned (M2) |
| **Health Records** | `HealthRecordsView.tsx` HTML tabs | `app/(tabs)/records.tsx` native segmented controls | Planned (M2) |
| **Hospital Routing & GPS** | Hardcoded lat/lng fallback in `hospitalEngine.ts` | `expo-location` live GPS coordinates + Haversine allocation | Planned (M6) |
| **Multilingual Engine** | `LanguageContext.tsx` + `translations.ts` (te/hi/en) | Native React Context + full `te`/`hi`/`en` native typography | Planned (M2) |

---

## 3. Technology Stack & Key Native Packages

- **Framework**: React Native 0.76+ with Expo SDK 52
- **Routing**: Expo Router v4 (file-based navigation with typed routes)
- **Google Health Connect**: `react-native-health-connect` with native Android manifest permissions
- **Camera**: `expo-camera` / `expo-image-picker`
- **Audio Recording & Playback**: `expo-av`
- **Location**: `expo-location`
- **Haptics**: `expo-haptics`
- **Secure Storage**: `expo-secure-store`
- **Network / API**: Native `fetch` with REST backend + WebSocket for Live Voice API

---

## 4. Incompatible Web Dependencies to Exclude
- `react-dom` / `@types/react-dom`
- HTML DOM elements (`<div>`, `<button>`, `<input>`, `<span>`)
- Web Audio API (`window.AudioContext`, `ScriptProcessorNode`, `navigator.mediaDevices`)
- Browser-specific `localStorage` (migrated to `AsyncStorage` / `SecureStore`)

---

## 5. Milestone Breakdown
1. **Milestone 0**: Project Inspection & Architectural Documentation
2. **Milestone 1**: Create Native Expo Foundation (`mobile/`)
3. **Milestone 2**: Migrate Navigation & Native Patient Screens (Expo Router)
4. **Milestone 3**: Migrate Firebase & Backend Integrations
5. **Milestone 4**: Migrate Gemini AI Multimodal Functionality
6. **Milestone 5**: Implement Genuine Google Health Connect Integration
7. **Milestone 6**: Implement Voice, Camera, GPS & 2.5s SOS Emergency Flow
8. **Milestone 7**: End-to-End Testing & Verification
9. **Milestone 8**: Android APK Build Configuration (EAS / Prebuild)
10. **Milestone 9**: Separate Website Architecture Setup (Landing page & APK host)
