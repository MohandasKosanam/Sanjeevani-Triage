import React, { useState } from 'react';
import {
  FolderTree,
  FileCode,
  Copy,
  Check,
  Terminal,
  Smartphone,
  Server,
  Layers,
  BookOpen,
  Cpu,
  ShieldCheck
} from 'lucide-react';

export const MonorepoExplorer: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const files = [
    {
      id: 'mobile-sos',
      path: 'mobile/app/emergency/index.tsx',
      title: 'Native 2.5s SOS State Machine (React Native / Expo)',
      code: `import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';

export default function NativeSOSEmergencyScreen() {
  const [state, setState] = useState<'IDLE' | 'HOLDING' | 'SIREN' | 'RECORDING' | 'DISPATCHED'>('IDLE');
  const [progress, setProgress] = useState(0);
  const holdStartRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  const startHold = () => {
    setState('HOLDING');
    holdStartRef.current = Date.now();
    timerRef.current = setInterval(async () => {
      const elapsed = Date.now() - holdStartRef.current;
      const pct = Math.min(100, (elapsed / 2500) * 100);
      setProgress(pct);

      if (elapsed >= 2500) {
        clearInterval(timerRef.current);
        await triggerEmergencyActivation();
      }
    }, 50);
  };

  const cancelHold = () => {
    if (state === 'HOLDING') {
      clearInterval(timerRef.current);
      setState('IDLE');
      setProgress(0);
    }
  };

  const triggerEmergencyActivation = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setState('SIREN');

    // 1. Immediately dispatch Priority 0 to backend with GPS
    const loc = await Location.getCurrentPositionAsync({});
    await fetch('https://api.sanjeevani-triage.org/api/v1/sos-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: loc.coords.latitude, lng: loc.coords.longitude, priority: 0 }),
    });

    // 2. Play 10s local audio siren & start 20s ambient recording...
  };

  return (
    <View style={styles.container}>
      <Pressable onPressIn={startHold} onPressOut={cancelHold} style={styles.sosButton}>
        <Text style={styles.buttonText}>{state === 'HOLDING' ? \`\${Math.round(progress)}%\` : 'HOLD SOS 2.5s'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  sosButton: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});`,
    },
    {
      id: 'prisma-schema',
      path: 'backend/prisma/schema.prisma',
      title: 'PostgreSQL Relational Schema (Prisma ORM)',
      code: `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  PATIENT
  HOSPITAL_STAFF
  ADMIN
}

enum TriageTier {
  TIER_1_SELF_CARE
  TIER_2_OPD
  TIER_3_EMERGENCY
}

model User {
  id                 String           @id @default(uuid())
  name               String
  phone              String           @unique
  email              String?
  preferred_language String           @default("te")
  role               Role             @default(PATIENT)
  created_at         DateTime         @default(now())
  updated_at         DateTime         @updatedAt
  triage_records     TriageRecord[]
  opd_tokens         OPDToken[]
  sos_events         SOSEvent[]
}

model TriageRecord {
  id                   String      @id @default(uuid())
  patient_id           String
  patient              User        @relation(fields: [patient_id], references: [id])
  detected_language    String
  original_transcript  String?
  translated_symptoms  String
  tier                 TriageTier
  severity_score       Int
  clinical_department  String
  patient_instructions String
  safety_warning       String?
  created_at           DateTime    @default(now())
}

model OPDToken {
  id            String   @id @default(uuid())
  token_number  String   @unique
  patient_id    String
  patient       User     @relation(fields: [patient_id], references: [id])
  hospital_id   String
  department    String
  status        String   @default("waiting")
  created_at    DateTime @default(now())
}

model SOSEvent {
  id                String   @id @default(uuid())
  patient_id        String
  patient           User     @relation(fields: [patient_id], references: [id])
  latitude          Float
  longitude         Float
  priority          Int      @default(0)
  status            String   @default("received")
  ambient_audio_url String?
  created_at        DateTime @default(now())
}`,
    },
    {
      id: 'eas-config',
      path: 'mobile/eas.json',
      title: 'EAS Build Configuration (Android APK & iOS IPA)',
      code: `{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}`,
    },
  ];

  const [activeFileId, setActiveFileId] = useState(files[0].id);
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-800">
      {/* Overview Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-teal-500/20 text-teal-400 font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30">
              Monorepo Architecture
            </span>
            <span className="text-xs text-slate-400 font-mono">React Native • Expo • Node.js • Prisma</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Native Monorepo & Deployment Hub</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Sanjeevani Triage is engineered with a strict 3-tier architecture: Native Expo React Native Patient App, Node.js + Express + Gemini Multimodal Backend Gateway, and Next.js Hospital Command Center.
          </p>
        </div>

        {/* Build Commands Pill */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs font-mono text-slate-300">
          <div className="text-[10px] text-teal-400 font-bold uppercase mb-1">Android APK Generation:</div>
          <code>eas build --platform android --profile preview</code>
        </div>
      </div>

      {/* Code Viewer & File Tree */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Tree Nav */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5" /> Project Files
          </div>
          {files.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFileId(f.id)}
              className={`w-full text-left p-3 rounded-2xl text-xs font-semibold transition flex flex-col gap-0.5 ${
                activeFileId === f.id
                  ? 'bg-teal-50 border border-teal-300 text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">{f.title}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 truncate pl-5">
                {f.path}
              </span>
            </button>
          ))}
        </div>

        {/* Right Code Display */}
        <div className="md:col-span-3 bg-slate-900 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-teal-400 font-bold">{activeFile.path}</span>
            </div>
            <button
              onClick={() => copyToClipboard(activeFile.code, activeFile.id)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              {copiedKey === activeFile.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </>
              )}
            </button>
          </div>

          <pre className="p-4 text-xs font-mono overflow-x-auto text-slate-300 leading-relaxed max-h-[500px]">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
