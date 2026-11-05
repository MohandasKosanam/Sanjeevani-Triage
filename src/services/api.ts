import {
  UserProfile,
  TriageRecord,
  OPDToken,
  SOSEvent,
  PrescriptionRecord,
  DailyHealthInsight,
  QueueItem,
  Hospital,
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Real-time EventSource listener
  connectEvents(onMessage: (event: { type: string; data: any }) => void) {
    const eventSource = new EventSource(`${API_BASE}/events`);
    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onMessage(parsed);
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };
    return () => eventSource.close();
  },

  // Auth & Profile
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/me`);
    const data = await res.json();
    return data.user;
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

  // Triage
  async submitTriage(payload: {
    audioBlob?: Blob;
    symptoms_text?: string;
    language?: string;
    lat?: number;
    lng?: number;
  }): Promise<{ triage: TriageRecord; token: OPDToken | null }> {
    const formData = new FormData();
    if (payload.audioBlob) {
      formData.append('audio', payload.audioBlob, 'symptom-recording.webm');
    }
    if (payload.symptoms_text) {
      formData.append('symptoms_text', payload.symptoms_text);
    }
    if (payload.language) {
      formData.append('language', payload.language);
    }
    if (payload.lat) formData.append('lat', payload.lat.toString());
    if (payload.lng) formData.append('lng', payload.lng.toString());

    const res = await fetch(`${API_BASE}/triage`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Triage processing failed');
    }
    return { triage: data.triage, token: data.token };
  },

  async getTriageHistory(): Promise<TriageRecord[]> {
    const res = await fetch(`${API_BASE}/triage/history`);
    const data = await res.json();
    return data.records || [];
  },

  // Prescription Scanner
  async scanPrescription(image: Blob | string, language: string): Promise<PrescriptionRecord> {
    const formData = new FormData();
    if (typeof image === 'string') {
      formData.append('image_base64', image);
    } else {
      formData.append('image', image, 'rx-scan.jpg');
    }
    formData.append('language', language);

    const res = await fetch(`${API_BASE}/prescriptions/scan`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Prescription scanning failed');
    }
    return data.prescription;
  },

  async getPrescriptions(): Promise<PrescriptionRecord[]> {
    const res = await fetch(`${API_BASE}/prescriptions`);
    const data = await res.json();
    return data.prescriptions || [];
  },

  // OPD Tokens
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
  }): Promise<{ success: boolean; token: OPDToken; hospital?: any; distance_km?: number }> {
    const res = await fetch(`${API_BASE}/opd/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to book OPD token');
    }
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

  // SOS Emergency
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

  async uploadSOSAudio(sosId: string, audioBlob: Blob, durationSec = 20): Promise<SOSEvent> {
    const formData = new FormData();
    formData.append('ambient_audio', audioBlob, 'ambient-sos.webm');
    formData.append('duration_sec', durationSec.toString());

    const res = await fetch(`${API_BASE}/sos/${sosId}/context`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.sos;
  },

  async getSOSHistory(): Promise<SOSEvent[]> {
    const res = await fetch(`${API_BASE}/sos/history`);
    const data = await res.json();
    return data.events || [];
  },

  // Hospital Admin
  async getDashboardStats(hospitalId = 'HOSP-VZG-001') {
    const res = await fetch(`${API_BASE}/admin/dashboard?hospital_id=${hospitalId}`);
    const data = await res.json();
    return data.stats;
  },

  async getAdminQueue(hospitalId?: string): Promise<QueueItem[]> {
    const url = hospitalId ? `${API_BASE}/admin/queue?hospital_id=${hospitalId}` : `${API_BASE}/admin/queue`;
    const res = await fetch(url);
    const data = await res.json();
    return data.queue || [];
  },

  async updateQueueStatus(id: string, status: string, type: 'sos' | 'token') {
    const res = await fetch(`${API_BASE}/admin/queue/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, type }),
    });
    return await res.json();
  },

  async triggerPatientCallback(patientId: string) {
    const res = await fetch(`${API_BASE}/admin/patients/${patientId}/callback`, {
      method: 'POST',
    });
    return await res.json();
  },

  // Health Insights
  async getHealthInsights(): Promise<DailyHealthInsight> {
    const res = await fetch(`${API_BASE}/health-insights`);
    const data = await res.json();
    return data.insight;
  },

  // Hospitals
  async getHospitals(): Promise<Hospital[]> {
    const res = await fetch(`${API_BASE}/hospitals`);
    const data = await res.json();
    return data.hospitals || [];
  },
};
