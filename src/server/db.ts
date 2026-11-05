import {
  UserProfile,
  TriageRecord,
  OPDToken,
  SOSEvent,
  PrescriptionRecord,
  QueueItem,
} from '../types';

// In-Memory Database store with seed records for prototype demonstrations
class SanjeevaniDatabase {
  private users: Map<string, UserProfile> = new Map();
  private triageRecords: Map<string, TriageRecord> = new Map();
  private tokens: Map<string, OPDToken> = new Map();
  private sosEvents: Map<string, SOSEvent> = new Map();
  private prescriptions: Map<string, PrescriptionRecord> = new Map();
  private tokenCounter = 101;
  private sosCounter = 1;
  private listeners: Set<(event: { type: string; data: any }) => void> = new Set();

  constructor() {
    this.seedInitialData();
  }

  // Pub/Sub for Real-Time SSE
  public subscribe(listener: (event: { type: string; data: any }) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notify(type: string, data: any) {
    for (const listener of this.listeners) {
      try {
        listener({ type, data });
      } catch (err) {
        console.error('Error notifying listener:', err);
      }
    }
  }

  private seedInitialData() {
    // Default demo patient
    const demoUser: UserProfile = {
      id: 'USR-PAT-001',
      name: 'Ramesh Varma',
      phone: '+91 98480 22338',
      email: 'ramesh.varma@example.com',
      preferred_language: 'te',
      age: 48,
      gender: 'Male',
      emergency_contact: {
        name: 'Sita Varma',
        phone: '+91 98480 22339',
        relationship: 'Spouse',
      },
      known_conditions: ['Hypertension (Stage 1)'],
      allergies: ['Penicillin'],
    };
    this.users.set(demoUser.id, demoUser);

    // Initial Tier 2 OPD Patient in queue
    const seedTriageId = 'TRG-SEED-001';
    const seedTriage: TriageRecord = {
      id: seedTriageId,
      patient_id: demoUser.id,
      patient_name: demoUser.name,
      patient_phone: demoUser.phone,
      detected_language: 'te',
      original_transcript: 'నాకు మూడు రోజుల నుండి కడుపులో విపరీతమైన మంట మరియు నొప్పి ఉంది.',
      translated_symptoms: 'Patient reports severe burning abdominal pain and nausea persisting for 3 days.',
      tier: 2,
      severity_score: 6,
      clinical_department: 'Gastroenterology',
      patient_instructions_native: 'దయచేసి వైద్యుని సంప్రదించండి. ఖాళీ కడుపుతో కారం మరియు నూనె ఆహారాలు నివారించండి.',
      requires_human_assessment: true,
      assigned_hospital: {
        id: 'HOSP-VZG-001',
        name: 'Apollo Hospitals, Ramnagar',
        distance_km: 2.4,
        phone: '+91 891 272 7272',
      },
      opd_token: 'OPD-101',
      status: 'token_issued',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    };
    this.triageRecords.set(seedTriage.id, seedTriage);

    const seedToken: OPDToken = {
      id: 'TKN-001',
      token_number: 'OPD-101',
      patient_id: demoUser.id,
      patient_name: demoUser.name,
      patient_phone: demoUser.phone,
      triage_id: seedTriageId,
      hospital_id: 'HOSP-VZG-001',
      hospital_name: 'Apollo Hospitals, Ramnagar',
      department: 'Gastroenterology',
      priority: 'medium',
      severity_score: 6,
      status: 'waiting',
      distance_km: 2.4,
      created_at: seedTriage.created_at,
      estimated_wait_minutes: 25,
    };
    this.tokens.set(seedToken.id, seedToken);

    // Initial High Severity Tier 2 Patient
    const p2Id = 'USR-PAT-002';
    const p2: UserProfile = {
      id: p2Id,
      name: 'Sunita Sharma',
      phone: '+91 97001 88992',
      preferred_language: 'hi',
      age: 62,
      gender: 'Female',
      emergency_contact: {
        name: 'Amit Sharma',
        phone: '+91 97001 88990',
        relationship: 'Son',
      },
    };
    this.users.set(p2Id, p2);

    const triageP2: TriageRecord = {
      id: 'TRG-SEED-002',
      patient_id: p2Id,
      patient_name: p2.name,
      patient_phone: p2.phone,
      detected_language: 'hi',
      original_transcript: 'मुझे पिछले दो घंटे से छाती में भारीपन और हल्का चक्कर आ रहा है।',
      translated_symptoms: 'Patient reports chest tightness, heaviness, and mild dizziness lasting 2 hours.',
      tier: 2,
      severity_score: 8,
      clinical_department: 'Cardiology',
      patient_instructions_native: 'तुरंत अस्पताल के आपातकालीन/कार्डियोलॉजी विभाग पहुंचे। आराम करें और भारी काम न करें।',
      requires_human_assessment: true,
      assigned_hospital: {
        id: 'HOSP-VZG-001',
        name: 'Apollo Hospitals, Ramnagar',
        distance_km: 1.8,
        phone: '+91 891 272 7272',
      },
      opd_token: 'OPD-102',
      status: 'token_issued',
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    };
    this.triageRecords.set(triageP2.id, triageP2);

    const tokenP2: OPDToken = {
      id: 'TKN-002',
      token_number: 'OPD-102',
      patient_id: p2Id,
      patient_name: p2.name,
      patient_phone: p2.phone,
      triage_id: triageP2.id,
      hospital_id: 'HOSP-VZG-001',
      hospital_name: 'Apollo Hospitals, Ramnagar',
      department: 'Cardiology',
      priority: 'high',
      severity_score: 8,
      status: 'waiting',
      distance_km: 1.8,
      created_at: triageP2.created_at,
      estimated_wait_minutes: 10,
    };
    this.tokens.set(tokenP2.id, tokenP2);

    this.tokenCounter = 103;
  }

  // User Management
  public getUser(id: string): UserProfile | undefined {
    return this.users.get(id);
  }

  public getDefaultUser(): UserProfile {
    return Array.from(this.users.values())[0];
  }

  public upsertUser(user: UserProfile): UserProfile {
    this.users.set(user.id, user);
    return user;
  }

  // Triage Records
  public saveTriage(record: TriageRecord): TriageRecord {
    this.triageRecords.set(record.id, record);
    this.notify('triage_created', record);
    return record;
  }

  public getTriage(id: string): TriageRecord | undefined {
    return this.triageRecords.get(id);
  }

  public getAllTriage(): TriageRecord[] {
    return Array.from(this.triageRecords.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Concurrency-Safe OPD Token Generation
  public generateToken(
    patientId: string,
    triageId: string,
    hospitalId: string,
    hospitalName: string,
    department: string,
    severityScore: number,
    distanceKm: number
  ): OPDToken {
    const user = this.getUser(patientId) || this.getDefaultUser();
    const tokenNum = `OPD-${this.tokenCounter++}`;

    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (severityScore >= 9) priority = 'critical';
    else if (severityScore >= 7) priority = 'high';
    else if (severityScore <= 3) priority = 'low';

    const token: OPDToken = {
      id: `TKN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      token_number: tokenNum,
      patient_id: patientId,
      patient_name: user.name,
      patient_phone: user.phone,
      triage_id: triageId,
      hospital_id: hospitalId,
      hospital_name: hospitalName,
      department,
      priority,
      severity_score: severityScore,
      status: 'waiting',
      distance_km: distanceKm,
      created_at: new Date().toISOString(),
      estimated_wait_minutes: Math.max(5, (10 - severityScore) * 5),
    };

    this.tokens.set(token.id, token);

    // Update corresponding triage record if present
    const triage = this.triageRecords.get(triageId);
    if (triage) {
      triage.opd_token = tokenNum;
      triage.status = 'token_issued';
    }

    this.notify('token_created', token);
    return token;
  }

  public getTokens(): OPDToken[] {
    return Array.from(this.tokens.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getTokenByNumber(tokenNumber: string): OPDToken | undefined {
    return Array.from(this.tokens.values()).find((t) => t.token_number === tokenNumber);
  }

  public updateTokenStatus(tokenId: string, status: OPDToken['status']): OPDToken | undefined {
    const token = this.tokens.get(tokenId);
    if (token) {
      token.status = status;
      this.notify('token_updated', token);
    }
    return token;
  }

  // SOS Emergency Management
  public createSOSEvent(
    patientId: string,
    latitude: number,
    longitude: number
  ): SOSEvent {
    const user = this.getUser(patientId) || this.getDefaultUser();
    const sosId = `SOS-${String(this.sosCounter++).padStart(3, '0')}`;

    const sosEvent: SOSEvent = {
      id: sosId,
      patient_id: patientId,
      patient_name: user.name,
      patient_phone: user.phone,
      latitude,
      longitude,
      priority: 0,
      status: 'received',
      created_at: new Date().toISOString(),
    };

    this.sosEvents.set(sosId, sosEvent);
    this.notify('sos_dispatched', sosEvent);
    return sosEvent;
  }

  public attachSOSAudio(sosId: string, audioUrl: string, durationSec: number): SOSEvent | undefined {
    const sos = this.sosEvents.get(sosId);
    if (sos) {
      sos.ambient_audio_url = audioUrl;
      sos.ambient_duration_sec = durationSec;
      sos.status = 'dispatched';
      this.notify('sos_audio_attached', sos);
    }
    return sos;
  }

  public updateSOSStatus(sosId: string, status: SOSEvent['status']): SOSEvent | undefined {
    const sos = this.sosEvents.get(sosId);
    if (sos) {
      sos.status = status;
      if (status === 'resolved') {
        sos.resolved_at = new Date().toISOString();
      }
      this.notify('sos_updated', sos);
    }
    return sos;
  }

  public getSOSEvents(): SOSEvent[] {
    return Array.from(this.sosEvents.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getSOSById(id: string): SOSEvent | undefined {
    return this.sosEvents.get(id);
  }

  // Prescriptions
  public savePrescription(prescription: PrescriptionRecord): PrescriptionRecord {
    this.prescriptions.set(prescription.id, prescription);
    this.notify('prescription_saved', prescription);
    return prescription;
  }

  public getPrescriptions(patientId?: string): PrescriptionRecord[] {
    const all = Array.from(this.prescriptions.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (patientId) {
      return all.filter((p) => p.patient_id === patientId);
    }
    return all;
  }

  // Hospital Priority Queue Calculation
  public getSortedQueue(hospitalId?: string): QueueItem[] {
    const items: QueueItem[] = [];

    // 1. Priority 0 SOS Events (Unresolved or Active)
    for (const sos of this.sosEvents.values()) {
      if (sos.status !== 'resolved') {
        items.push({
          id: sos.id,
          type: 'sos',
          priority_rank: 0,
          patient_name: sos.patient_name,
          patient_phone: sos.patient_phone,
          patient_id: sos.patient_id,
          created_at: sos.created_at,
          status: sos.status,
          sos_data: sos,
        });
      }
    }

    // 2. Tier 3 Emergencies
    for (const triage of this.triageRecords.values()) {
      if (triage.tier === 3 && triage.status !== 'completed') {
        items.push({
          id: triage.id,
          type: 'emergency',
          priority_rank: 1,
          patient_name: triage.patient_name,
          patient_phone: triage.patient_phone,
          patient_id: triage.patient_id,
          created_at: triage.created_at,
          status: triage.status,
          triage_data: triage,
        });
      }
    }

    // 3. Tier 2 OPD Tokens (Filter by hospital if specified)
    for (const token of this.tokens.values()) {
      if (token.status === 'waiting' || token.status === 'in_consultation') {
        if (!hospitalId || token.hospital_id === hospitalId) {
          const triage = this.triageRecords.get(token.triage_id);
          let rank = 3;
          if (token.severity_score >= 8) rank = 2; // High
          else if (token.severity_score <= 4) rank = 4; // Low

          items.push({
            id: token.id,
            type: 'opd',
            priority_rank: rank,
            patient_name: token.patient_name,
            patient_phone: token.patient_phone,
            patient_id: token.patient_id,
            created_at: token.created_at,
            status: token.status,
            token_data: token,
            triage_data: triage,
          });
        }
      }
    }

    // Strict priority sort:
    // Priority 0 SOS first, then Tier 3 Emergency, then High severity Tier 2, etc.
    // Ties broken by created_at (earliest first)
    return items.sort((a, b) => {
      if (a.priority_rank !== b.priority_rank) {
        return a.priority_rank - b.priority_rank;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }
}

export const db = new SanjeevaniDatabase();
