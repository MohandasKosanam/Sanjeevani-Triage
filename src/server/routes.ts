import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db } from './db';
import { analyzeSymptoms, decodePrescription, chatWithGemini } from './gemini';
import { allocateHospital, HOSPITAL_REGISTRY } from './hospitalEngine';
import { Language, TriageRecord, DailyHealthInsight, PrescriptionRecord } from '../types';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// ----------------------------------------------------
// Real-Time Server-Sent Events (SSE) Stream
// ----------------------------------------------------
router.get('/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  const unsubscribe = db.subscribe((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// ----------------------------------------------------
// Authentication & User Profile
// ----------------------------------------------------
router.get('/auth/me', (req: Request, res: Response) => {
  const user = db.getDefaultUser();
  res.json({ success: true, user });
});

router.post('/auth/register', (req: Request, res: Response) => {
  const { name, phone, preferred_language = 'te', age, gender } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone are required' });
  }

  const id = `USR-PAT-${Date.now().toString().slice(-4)}`;
  const newUser = db.upsertUser({
    id,
    name,
    phone,
    preferred_language: (preferred_language as Language) || 'te',
    age: age ? Number(age) : 35,
    gender: gender || 'Unspecified',
    emergency_contact: {
      name: 'Emergency Contact',
      phone: '+91 98480 00000',
      relationship: 'Family',
    },
  });

  res.json({ success: true, user: newUser });
});

router.post('/auth/login', (req: Request, res: Response) => {
  const { phone } = req.body;
  const user = db.getDefaultUser();
  res.json({ success: true, user, token: 'demo-jwt-session-token' });
});

router.get('/patients/me', (req: Request, res: Response) => {
  const user = db.getDefaultUser();
  res.json({ success: true, patient: user });
});

router.patch('/patients/me', (req: Request, res: Response) => {
  const current = db.getDefaultUser();
  const updated = db.upsertUser({
    ...current,
    ...req.body,
    id: current.id,
  });
  res.json({ success: true, patient: updated });
});

router.get('/patients/me/history', (req: Request, res: Response) => {
  const user = db.getDefaultUser();
  const triageHistory = db.getAllTriage().filter((t) => t.patient_id === user.id);
  const tokens = db.getTokens().filter((t) => t.patient_id === user.id);
  const prescriptions = db.getPrescriptions(user.id);
  const sosEvents = db.getSOSEvents().filter((s) => s.patient_id === user.id);

  res.json({
    success: true,
    history: {
      triage: triageHistory,
      tokens,
      prescriptions,
      sos: sosEvents,
    },
  });
});

// ----------------------------------------------------
// Triage (Voice and Text)
// ----------------------------------------------------
router.post('/triage', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const user = db.getDefaultUser();
    const {
      patient_id = user.id,
      language = user.preferred_language,
      lat = '17.7124',
      lng = '83.3156',
      symptoms_text,
    } = req.body;

    const patientLat = parseFloat(lat);
    const patientLng = parseFloat(lng);

    let audioBase64: string | undefined;
    let audioMimeType: string | undefined;

    if (req.file) {
      audioBase64 = req.file.buffer.toString('base64');
      audioMimeType = req.file.mimetype || 'audio/webm';
    } else if (req.body.audio_base64) {
      audioBase64 = req.body.audio_base64;
      audioMimeType = req.body.audio_mime_type || 'audio/webm';
    }

    const aiResult = await analyzeSymptoms({
      audioBase64,
      audioMimeType,
      textInput: symptoms_text,
      userLanguageHint: (language as Language) || 'te',
    });

    const triageId = `TRG-${Date.now().toString().slice(-6)}`;
    let assignedHospitalInfo: TriageRecord['assigned_hospital'] = undefined;
    let opdTokenNumber: string | undefined;

    // For Tier 2 (OPD), allocate hospital and generate token
    if (aiResult.tier === 2) {
      const match = allocateHospital(patientLat, patientLng, aiResult.clinical_department);
      assignedHospitalInfo = {
        id: match.hospital.hospital_id,
        name: match.hospital.hospital_name,
        distance_km: match.distance_km,
        phone: match.hospital.phone,
      };

      const token = db.generateToken(
        patient_id,
        triageId,
        match.hospital.hospital_id,
        match.hospital.hospital_name,
        aiResult.clinical_department,
        aiResult.severity_score,
        match.distance_km
      );
      opdTokenNumber = token.token_number;
    } else if (aiResult.tier === 3) {
      // Tier 3 Emergency: Automatically allocate nearest hospital emergency department
      const match = allocateHospital(patientLat, patientLng, 'Emergency');
      assignedHospitalInfo = {
        id: match.hospital.hospital_id,
        name: match.hospital.hospital_name,
        distance_km: match.distance_km,
        phone: match.hospital.phone,
      };
    }

    const triageRecord: TriageRecord = {
      id: triageId,
      patient_id,
      patient_name: user.name,
      patient_phone: user.phone,
      detected_language: aiResult.detected_language,
      original_transcript: aiResult.original_transcript,
      translated_symptoms: aiResult.translated_symptoms,
      tier: aiResult.tier,
      severity_score: aiResult.severity_score,
      clinical_department: aiResult.clinical_department,
      patient_instructions_native: aiResult.patient_instructions_native,
      safety_warning: aiResult.safety_warning,
      requires_human_assessment: aiResult.requires_human_assessment,
      assigned_hospital: assignedHospitalInfo,
      opd_token: opdTokenNumber,
      status: aiResult.tier === 2 ? 'token_issued' : 'triaged',
      created_at: new Date().toISOString(),
    };

    db.saveTriage(triageRecord);

    res.json({
      success: true,
      triage: triageRecord,
      token: opdTokenNumber ? db.getTokenByNumber(opdTokenNumber) : null,
    });
  } catch (err: any) {
    console.error('Triage endpoint error:', err);
    res.status(500).json({
      success: false,
      error: 'Triage processing failed: ' + (err.message || 'Unknown error'),
    });
  }
});

router.get('/triage/:id', (req: Request, res: Response) => {
  const triage = db.getTriage(req.params.id);
  if (!triage) {
    return res.status(404).json({ success: false, error: 'Triage record not found' });
  }
  res.json({ success: true, triage });
});

router.get('/triage/history', (req: Request, res: Response) => {
  res.json({ success: true, records: db.getAllTriage() });
});

// ----------------------------------------------------
// Smart Rx Decoder (Prescription)
// ----------------------------------------------------
router.post('/prescriptions/scan', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const user = db.getDefaultUser();
    const { patient_id = user.id, language = user.preferred_language } = req.body;

    let imageBase64: string = '';
    let mimeType = 'image/jpeg';

    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body.image_base64) {
      imageBase64 = req.body.image_base64.replace(/^data:image\/[a-z]+;base64,/, '');
      mimeType = req.body.mime_type || 'image/jpeg';
    } else {
      return res.status(400).json({ success: false, error: 'Prescription image is required' });
    }

    const extractionResult = await decodePrescription(imageBase64, mimeType, (language as Language) || 'en');

    const prescriptionRecord: PrescriptionRecord = {
      id: `RX-${Date.now().toString().slice(-6)}`,
      patient_id,
      image_url: req.body.image_url || 'data:image/jpeg;base64,' + imageBase64.slice(0, 100) + '...',
      extraction_status: extractionResult.status,
      medicines: extractionResult.medicines,
      safety_warning: extractionResult.safety_warning,
      created_at: new Date().toISOString(),
    };

    db.savePrescription(prescriptionRecord);

    res.json({
      success: true,
      prescription: prescriptionRecord,
    });
  } catch (err: any) {
    console.error('Prescription scanning failed:', err);
    res.status(500).json({
      success: false,
      error: 'Prescription scan failed: ' + err.message,
    });
  }
});

router.get('/prescriptions', (req: Request, res: Response) => {
  res.json({ success: true, prescriptions: db.getPrescriptions() });
});

// ----------------------------------------------------
// Hospital Allocation & Registry
// ----------------------------------------------------
router.get('/hospitals', (req: Request, res: Response) => {
  res.json({ success: true, hospitals: HOSPITAL_REGISTRY });
});

router.get('/hospitals/:id', (req: Request, res: Response) => {
  const hospital = HOSPITAL_REGISTRY.find((h) => h.hospital_id === req.params.id);
  if (!hospital) {
    return res.status(404).json({ success: false, error: 'Hospital not found' });
  }
  res.json({ success: true, hospital });
});

router.post('/hospitals/recommend', (req: Request, res: Response) => {
  const { lat = 17.7124, lng = 83.3156, department = 'General Medicine' } = req.body;
  const match = allocateHospital(Number(lat), Number(lng), department);
  res.json({
    success: true,
    recommendation: {
      hospital: match.hospital,
      distance_km: match.distance_km,
      distance_label: `${match.distance_km} km (straight-line)`,
    },
  });
});

// ----------------------------------------------------
// OPD Tokens
// ----------------------------------------------------
router.get('/tokens', (req: Request, res: Response) => {
  res.json({ success: true, tokens: db.getTokens() });
});

router.patch('/tokens/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = db.updateTokenStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Token not found' });
  }
  res.json({ success: true, token: updated });
});

// ----------------------------------------------------
// 2.5-Second SOS Emergency System
// ----------------------------------------------------
router.post('/sos-dispatch', (req: Request, res: Response) => {
  const user = db.getDefaultUser();
  const { lat = 17.7124, lng = 83.3156, patient_id = user.id } = req.body;

  // Immediate Priority 0 event created on backend
  const sosEvent = db.createSOSEvent(patient_id, Number(lat), Number(lng));

  res.json({
    success: true,
    sos_id: sosEvent.id,
    status: sosEvent.status,
    priority: 0,
    created_at: sosEvent.created_at,
    patient_name: sosEvent.patient_name,
    patient_phone: sosEvent.patient_phone,
  });
});

router.post('/sos/:id/context', upload.single('ambient_audio'), (req: Request, res: Response) => {
  const sosId = req.params.id;
  const durationSec = Number(req.body.duration_sec) || 20;

  // Create simulated or stored audio URL
  const audioUrl = req.file
    ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    : req.body.audio_data_url || 'simulated-ambient-audio.webm';

  const updated = db.attachSOSAudio(sosId, audioUrl, durationSec);

  if (!updated) {
    return res.status(404).json({ success: false, error: 'SOS event not found' });
  }

  res.json({
    success: true,
    sos: updated,
  });
});

router.get('/sos/history', (req: Request, res: Response) => {
  res.json({ success: true, events: db.getSOSEvents() });
});

router.get('/sos/:id', (req: Request, res: Response) => {
  const sos = db.getSOSById(req.params.id);
  if (!sos) {
    return res.status(404).json({ success: false, error: 'SOS event not found' });
  }
  res.json({ success: true, sos });
});

// ----------------------------------------------------
// Hospital Admin Dashboard & Queue Management
// ----------------------------------------------------
router.get('/admin/dashboard', (req: Request, res: Response) => {
  const hospitalId = (req.query.hospital_id as string) || 'HOSP-VZG-001';
  const hospital = HOSPITAL_REGISTRY.find((h) => h.hospital_id === hospitalId) || HOSPITAL_REGISTRY[0];
  const allTokens = db.getTokens();
  const allSOS = db.getSOSEvents();
  const allTriage = db.getAllTriage();

  const activeQueue = db.getSortedQueue(hospitalId);
  const emergencyCases = allSOS.filter((s) => s.status !== 'resolved').length +
    allTriage.filter((t) => t.tier === 3 && t.status !== 'completed').length;
  const waitingPatients = allTokens.filter((t) => t.status === 'waiting').length;
  const inConsultation = allTokens.filter((t) => t.status === 'in_consultation').length;
  const completed = allTokens.filter((t) => t.status === 'completed').length;

  res.json({
    success: true,
    stats: {
      hospital_name: hospital.hospital_name,
      hospital_id: hospital.hospital_id,
      total_patients_today: allTokens.length + allSOS.length,
      active_queue_count: activeQueue.length,
      emergency_cases: emergencyCases,
      waiting_patients: waitingPatients,
      in_consultation: inConsultation,
      completed_consultations: completed,
      last_sync: new Date().toISOString(),
    },
  });
});

router.get('/admin/queue', (req: Request, res: Response) => {
  const hospitalId = req.query.hospital_id as string | undefined;
  const queue = db.getSortedQueue(hospitalId);
  res.json({
    success: true,
    count: queue.length,
    queue,
    last_sync: new Date().toISOString(),
  });
});

router.patch('/admin/queue/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, type } = req.body;

  if (type === 'sos') {
    const updated = db.updateSOSStatus(id, status);
    return res.json({ success: true, item: updated });
  } else {
    const updated = db.updateTokenStatus(id, status);
    return res.json({ success: true, item: updated });
  }
});

router.post('/admin/patients/:id/callback', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = db.getUser(id) || db.getDefaultUser();

  if (!user.phone) {
    return res.status(400).json({
      success: false,
      error: 'No telephone number on file for this patient.',
    });
  }

  // Simulated direct phone callback
  res.json({
    success: true,
    message: `Initiating priority callback to ${user.name} at ${user.phone}`,
    patient: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      emergency_contact: user.emergency_contact,
    },
    dial_url: `tel:${user.phone.replace(/\s+/g, '')}`,
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// Daily Health Insights (Health Connect Mock / Observation)
// ----------------------------------------------------
router.get('/health-insights', (req: Request, res: Response) => {
  const insight: DailyHealthInsight = {
    metrics: {
      steps: 4200,
      sleep_duration_hours: 5.2,
      avg_hr_bpm: 78,
    },
    context: {
      location: 'Visakhapatnam, Andhra Pradesh',
      weather: 'Warm and Humid, 32°C',
      air_quality: 'Moderate (AQI 84)',
    },
    observation:
      'Sleep duration (5.2 hrs) is lower than the recommended 7-8 hours. Combined with 32°C heat, remember to stay hydrated with electrolytes and avoid peak afternoon sun.',
    is_simulated: true,
  };

  res.json({ success: true, insight });
});
// ----------------------------------------------------
// Multi-turn Gemini Chatbot
// ----------------------------------------------------
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, model = 'gemini-3.8-flash', role = 'general', language = 'te' } = req.body;

    const langDirective =
      language === 'te'
        ? 'The user prefers Telugu (తెలుగు). Reply in warm, natural Telugu script with respectful terms (నమస్తే, దయచేసి), though clinical drug names can stay in English or transliterated.'
        : language === 'hi'
        ? 'The user prefers Hindi (हिंदी). Reply in warm, natural Hindi in Devanagari script with respectful terms (नमस्ते, कृपया), though clinical drug names can stay in English or transliterated.'
        : 'The user prefers English. Reply in clear, empathetic English.';

    let systemInstruction = `You are Sanjeevani Health AI, an empathetic, multilingual medical assistant. Support Telugu, Hindi, and English. ${langDirective}`;
    if (role === 'specialist') {
      systemInstruction = `You are Sanjeevani Clinical Reasoning Specialist. You provide in-depth medical evaluations, discuss differential diagnoses, potential drug interactions, and explain lab/radiology findings with scientific rigor. Always clarify that physical examination by a licensed physician is essential. ${langDirective}`;
    } else if (role === 'fast_triage') {
      systemInstruction = `You are Sanjeevani Rapid Triage Bot. Deliver fast, concise health assessments (under 3 sentences), flag emergency red flags immediately, and give direct next steps. ${langDirective}`;
    }

    const result = await chatWithGemini(messages, model, systemInstruction);
    res.json({
      success: true,
      reply: result.reply,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ success: false, error: err.message || 'Chat processing error' });
  }
});

export default router;
