# Google Health Connect Native Android Integration Guide

## 1. Overview
Google Health Connect is Android's on-device centralized platform for health, fitness, and wellness data sharing. In Sanjeevani Triage, Health Connect provides real-time, user-consented vitals to assist clinical routing and personalized triage recommendations.

---

## 2. Permissions Required
Sanjeevani Triage requests **READ ONLY** permissions for the following data types:
1. `READ_STEPS`: Daily step count to gauge mobility.
2. `READ_HEART_RATE`: Heart rate readings for cardiovascular triage.
3. `READ_SLEEP`: Sleep session durations for exhaustion assessment.
4. `READ_TOTAL_CALORIES_BURNED`: Active and basal metabolic expenditure.
5. `READ_DISTANCE`: Distance walked/travelled.
6. `READ_RESTING_HEART_RATE`: Baseline resting heart rate.

---

## 3. Android Manifest & Expo Plugin Configuration
In `mobile/app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-health-connect",
        {
          "rationaleActivity": ".MainActivity"
        }
      ]
    ],
    "android": {
      "permissions": [
        "android.permission.health.READ_STEPS",
        "android.permission.health.READ_HEART_RATE",
        "android.permission.health.READ_SLEEP",
        "android.permission.health.READ_TOTAL_CALORIES_BURNED",
        "android.permission.health.READ_DISTANCE",
        "android.permission.health.READ_RESTING_HEART_RATE"
      ]
    }
  }
}
```

---

## 4. Connection & Data Flow
1. Check availability with `getSdkStatus()`.
   - `SDK_UNAVAILABLE`: Device Android version is lower than Android 9 (API 28).
   - `SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED`: Health Connect app needs update from Play Store.
   - `SDK_AVAILABLE`: Ready to request permissions.
2. Request permissions via `requestPermission()`.
3. Read records using:
   - `readRecords('Steps', { timeRangeFilter: { operator: 'between', startTime, endTime } })`
   - `readRecords('HeartRate', ...)`
   - `readRecords('SleepSession', ...)`
4. Honest display: If no readings exist, show clear empty state with synchronization timestamp. Never fabricate synthetic data as actual readings.
