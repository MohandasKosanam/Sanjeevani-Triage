export type Language = 'te' | 'hi' | 'en';

export type TriageTier = 1 | 2 | 3;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Hospital {
  hospital_id: string;
  hospital_name: string;
  coordinates: Coordinates;
  specialties: string[];
  address: string;
  phone: string;
  capacity_status?: 'normal' | 'busy' | 'critical';
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  preferred_language: Language;
  age?: number;
  gender?: string;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  known_conditions?: string[];
  allergies?: string[];
}

export interface TriageRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  detected_language: Language;
  original_transcript?: string;
  translated_symptoms: string;
  tier: TriageTier;
  severity_score: number; // 1 - 10
  clinical_department: string;
  patient_instructions_native: string;
  safety_warning?: string;
  requires_human_assessment: boolean;
  assigned_hospital?: {
    id: string;
    name: string;
    distance_km: number;
    phone: string;
  };
  opd_token?: string;
  status: 'pending' | 'triaged' | 'token_issued' | 'consultation' | 'completed';
  created_at: string;
}

export interface OPDToken {
  id: string;
  token_number: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  triage_id: string;
  hospital_id: string;
  hospital_name: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity_score: number;
  status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
  distance_km: number;
  created_at: string;
  estimated_wait_minutes: number;
}

export interface SOSEvent {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  latitude: number;
  longitude: number;
  priority: 0; // Priority 0 is highest emergency
  status: 'received' | 'dispatched' | 'contacted' | 'resolved';
  ambient_audio_url?: string;
  ambient_duration_sec?: number;
  emergency_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ExtractedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions_native: string;
}

export interface PrescriptionRecord {
  id: string;
  patient_id: string;
  image_url: string;
  extraction_status: 'success' | 'unclear' | 'failed';
  medicines: ExtractedMedicine[];
  safety_warning: string;
  created_at: string;
}

export interface DailyHealthInsight {
  metrics: {
    steps: number;
    sleep_duration_hours: number;
    avg_hr_bpm: number;
  };
  context: {
    location: string;
    weather: string;
    air_quality?: string;
  };
  observation: string;
  is_simulated: boolean;
}

export interface HealthConnectData {
  stepsToday: number;
  heartRateAvg: number;
  sleepHours: number;
  activeCalories: number;
  distanceMeters: number;
  restingHeartRate: number;
  lastSyncTimestamp: string;
  isAvailable: boolean;
  hasPermissions: boolean;
}
