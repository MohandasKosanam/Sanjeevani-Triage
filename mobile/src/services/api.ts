import Constants from 'expo-constants';
import {
  UserProfile,
  TriageRecord,
  OPDToken,
  SOSEvent,
  PrescriptionRecord,
  DailyHealthInsight,
  Hospital,
} from '../types';

// For Android emulator: 10.0.2.2 points to host localhost.
// On physical device: Use EXPO_PUBLIC_API_URL or host machine IP.
const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api/v1`;
  }
  return 'http://10.0.2.2:3000/api/v1';
};

const API_BASE = getApiBaseUrl();

export const api = {
  getBaseUrl(): string {
    return API_BASE;
  },

  // Auth & Profile
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/me`);
    const data = await res.json();
    return data.user;
  },

  async register(patientData: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Registration failed');
    return data.user;
  },

  async login(phone: string): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Login failed');
    return data;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/patients/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.patient;
  },

  // Triage & Symptoms
  async submitTriage(payload: {
    audioUri?: string;
    symptoms_text?: string;
    language?: string;
    lat?: number;
    lng?: number;
  }): Promise<{ triage: TriageRecord; token: OPDToken | null }> {
    const formData = new FormData();
    if (payload.audioUri) {
      formData.append('audio', {
        uri: payload.audioUri,
        name: 'symptom-recording.m4a',
        type: 'audio/m4a',
      } as any);
    }
    if (payload.symptoms_text) formData.append('symptoms_text', payload.symptoms_text);
    if (payload.language) formData.append('language', payload.language);
    if (payload.lat) formData.append('lat', payload.lat.toString());
    if (payload.lng) formData.append('lng', payload.lng.toString());

    const res = await fetch(`${API_BASE}/triage`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Triage submission failed');
    return { triage: data.triage, token: data.token };
  },

  async getTriageHistory(): Promise<TriageRecord[]> {
    const res = await fetch(`${API_BASE}/triage/history`);
    const data = await res.json();
    return data.records || [];
  },

  // Prescription Scanning
  async scanPrescription(imageUri: string, language: string): Promise<PrescriptionRecord> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'prescription-scan.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('language', language);

    const res = await fetch(`${API_BASE}/prescriptions/scan`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Prescription scan failed');
    return data.prescription;
  },

  async getPrescriptions(): Promise<PrescriptionRecord[]> {
    const res = await fetch(`${API_BASE}/prescriptions`);
    const data = await res.json();
    return data.prescriptions || [];
  },

  // OPD Tokens & Booking
  async getTokens(): Promise<OPDToken[]> {
    const res = await fetch(`${API_BASE}/tokens`);
    const data = await res.json();
    return data.tokens || [];
  },

  async bookOPD(params?: {
    department?: string;
    symptoms?: string;
    severity_score?: number;
    hospital_id?: string;
    lat?: number;
    lng?: number;
  }): Promise<{ success: boolean; token: OPDToken; hospital?: any; distance_km?: number }> {
    const res = await fetch(`${API_BASE}/opd/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to book OPD token');
    return data;
  },

  async updateTokenStatus(id: string, status: OPDToken['status']): Promise<OPDToken> {
    const res = await fetch(`${API_BASE}/tokens/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    return data.token;
  },

  // 2.5-Second SOS Emergency System
  async dispatchSOS(lat: number, lng: number): Promise<{ sos_id: string; status: string }> {
    const res = await fetch(`${API_BASE}/sos-dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'SOS dispatch failed');
    return data;
  },

  async uploadSOSAudio(sosId: string, audioUri: string, durationSec = 20): Promise<SOSEvent> {
    const formData = new FormData();
    formData.append('ambient_audio', {
      uri: audioUri,
      name: 'sos-ambient-audio.m4a',
      type: 'audio/m4a',
    } as any);
    formData.append('duration_sec', durationSec.toString());

    const res = await fetch(`${API_BASE}/sos/${sosId}/context`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = await res.json();
    return data.sos;
  },

  async getSOSHistory(): Promise<SOSEvent[]> {
    const res = await fetch(`${API_BASE}/sos/history`);
    const data = await res.json();
    return data.events || [];
  },

  // Health Insights (Server-side observation)
  async getHealthInsights(): Promise<DailyHealthInsight> {
    const res = await fetch(`${API_BASE}/health-insights`);
    const data = await res.json();
    return data.insight;
  },

  // Multi-turn Gemini Chatbot with OPD Skill
  async sendChatMessage(payload: {
    messages: Array<{ role: 'user' | 'model'; content: string }>;
    model?: string;
    role?: string;
    language?: string;
  }): Promise<{ reply: string; modelUsed: string; opdToken?: OPDToken }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Chat request failed');
    return data;
  },

  // Hospitals
  async getHospitals(): Promise<Hospital[]> {
    const res = await fetch(`${API_BASE}/hospitals`);
    const data = await res.json();
    return data.hospitals || [];
  },
};
