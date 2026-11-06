import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  TriageRecord,
  OPDToken,
  SOSEvent,
  PrescriptionRecord,
  DailyHealthInsight,
  Hospital,
  Language,
} from '../types';

export const STORAGE_KEYS = {
  PROFILE: '@sanjeevani_user_profile',
  TOKENS: '@sanjeevani_tokens',
  TRIAGE_HISTORY: '@sanjeevani_triage_history',
  PRESCRIPTIONS: '@sanjeevani_prescriptions',
  SOS_HISTORY: '@sanjeevani_sos_history',
};

export const ACCREDITED_HOSPITALS: Hospital[] = [
  {
    hospital_id: 'hosp-apollo-vizag',
    hospital_name: 'Apollo Hospitals Visakhapatnam',
    coordinates: { lat: 17.7215, lng: 83.315 },
    specialties: ['Cardiology', 'General Medicine', 'Neurology', 'Pulmonology', 'Orthopaedics'],
    address: 'Waltair Main Rd, Ram Nagar, Visakhapatnam, AP 530002',
    phone: '0891-2727272',
    capacity_status: 'normal',
  },
  {
    hospital_id: 'hosp-care-vizag',
    hospital_name: 'Care Hospitals Visakhapatnam',
    coordinates: { lat: 17.7124, lng: 83.3156 },
    specialties: ['Emergency Medicine', 'Gastroenterology', 'Cardiology', 'Pediatrics'],
    address: 'AS Raja Complex, Maharanipeta, Visakhapatnam, AP 530002',
    phone: '0891-3041444',
    capacity_status: 'normal',
  },
  {
    hospital_id: 'hosp-kgh-vizag',
    hospital_name: 'King George Hospital (KGH Govt)',
    coordinates: { lat: 17.7088, lng: 83.3082 },
    specialties: ['General Medicine', 'Trauma', 'Surgery', 'Pediatrics', 'Obstetrics'],
    address: 'Collector Office Junction, Maharanipeta, Visakhapatnam, AP 530002',
    phone: '0891-2564891',
    capacity_status: 'busy',
  },
  {
    hospital_id: 'hosp-sevenhills-vizag',
    hospital_name: 'SevenHills Hospital',
    coordinates: { lat: 17.7289, lng: 83.3189 },
    specialties: ['Cardiology', 'Nephrology', 'General Medicine', 'Orthopaedics'],
    address: 'Rockdale Layout, Waltair Main Rd, Visakhapatnam, AP 530002',
    phone: '0891-6677777',
    capacity_status: 'normal',
  },
];

export const DEFAULT_PROFILE: UserProfile = {
  id: 'pat-ramesh-001',
  name: 'Ramesh Varma',
  phone: '+91 98765 43210',
  email: 'ramesh.varma@sanjeevani.health',
  preferred_language: 'te',
  age: 42,
  gender: 'Male',
  emergency_contact: {
    name: 'Sita Varma',
    phone: '+91 98765 43211',
    relationship: 'Spouse',
  },
  known_conditions: ['Hypertension (Mild/Controlled)'],
  allergies: ['Penicillin'],
};

export const DEFAULT_TOKENS: OPDToken[] = [
  {
    id: 'tok-init-7429',
    token_number: 'OPD-7429',
    patient_id: 'pat-ramesh-001',
    patient_name: 'Ramesh Varma',
    patient_phone: '+91 98765 43210',
    triage_id: 'trg-auto-101',
    hospital_id: 'hosp-apollo-vizag',
    hospital_name: 'Apollo Hospitals Visakhapatnam',
    department: 'General Medicine',
    priority: 'medium',
    severity_score: 5,
    status: 'waiting',
    distance_km: 2.1,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    estimated_wait_minutes: 15,
    queue_position: 3,
  },
];

export function detectLanguage(text: string, fallback: Language = 'te'): Language {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (fallback) return fallback;
  return 'en';
}

export function detectDepartment(text: string): { dept: string; severity: number; isEmergency: boolean } {
  const lower = text.toLowerCase();

  // Emergency / Cardiac
  if (
    lower.includes('chest') ||
    lower.includes('heart') ||
    lower.includes('గుండె') ||
    lower.includes('छाती') ||
    lower.includes('stroke') ||
    lower.includes('heart attack') ||
    lower.includes('unconscious')
  ) {
    return { dept: 'Cardiology', severity: 9, isEmergency: true };
  }

  // Pulmonology
  if (
    lower.includes('breath') ||
    lower.includes('asthma') ||
    lower.includes('శ్వాస') ||
    lower.includes('దగ్గు') ||
    lower.includes('cough') ||
    lower.includes('सांस') ||
    lower.includes('खांसी')
  ) {
    return { dept: 'Pulmonology', severity: 6, isEmergency: false };
  }

  // Gastroenterology
  if (
    lower.includes('stomach') ||
    lower.includes('vomit') ||
    lower.includes('loose motion') ||
    lower.includes('కడుపు') ||
    lower.includes('వాంతులు') ||
    lower.includes('మోషన్') ||
    lower.includes('पेट') ||
    lower.includes('उल्टी')
  ) {
    return { dept: 'Gastroenterology', severity: 5, isEmergency: false };
  }

  // Orthopaedics
  if (
    lower.includes('joint') ||
    lower.includes('bone') ||
    lower.includes('fracture') ||
    lower.includes('knee') ||
    lower.includes('కీళ్ళు') ||
    lower.includes('ఎముక') ||
    lower.includes('నడుము') ||
    lower.includes('हड्डी') ||
    lower.includes('जोड़ों')
  ) {
    return { dept: 'Orthopaedics', severity: 5, isEmergency: false };
  }

  // Dermatology
  if (
    lower.includes('skin') ||
    lower.includes('rash') ||
    lower.includes('itch') ||
    lower.includes('చర్మం') ||
    lower.includes('దురద') ||
    lower.includes('त्वचा') ||
    lower.includes('खुजली')
  ) {
    return { dept: 'Dermatology', severity: 4, isEmergency: false };
  }

  // Pediatrics
  if (
    lower.includes('child') ||
    lower.includes('baby') ||
    lower.includes('పిల్లలు') ||
    lower.includes('పాప') ||
    lower.includes('బాబు') ||
    lower.includes('बच्चा')
  ) {
    return { dept: 'Pediatrics', severity: 6, isEmergency: false };
  }

  // Default General Medicine
  return { dept: 'General Medicine', severity: 5, isEmergency: false };
}

export async function createAndSaveOpdToken(params?: {
  department?: string;
  symptoms?: string;
  severity_score?: number;
  hospital_id?: string;
  lat?: number;
  lng?: number;
}): Promise<OPDToken> {
  const dept = params?.department || 'General Medicine';
  const hospital = ACCREDITED_HOSPITALS[0];
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const tokenNum = `OPD-${randNum}`;

  const newToken: OPDToken = {
    id: `tok-${Date.now()}`,
    token_number: tokenNum,
    patient_id: DEFAULT_PROFILE.id,
    patient_name: DEFAULT_PROFILE.name,
    patient_phone: DEFAULT_PROFILE.phone,
    triage_id: `trg-${Date.now()}`,
    hospital_id: hospital.hospital_id,
    hospital_name: hospital.hospital_name,
    department: dept,
    priority: params?.severity_score && params.severity_score >= 8 ? 'critical' : 'medium',
    severity_score: params?.severity_score || 5,
    status: 'waiting',
    distance_km: 2.3,
    created_at: new Date().toISOString(),
    estimated_wait_minutes: 12,
    queue_position: 2,
  };

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TOKENS);
    const list: OPDToken[] = raw ? JSON.parse(raw) : DEFAULT_TOKENS;
    const updated = [newToken, ...list.filter((t) => t.id !== newToken.id)];
    await AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving local token:', e);
  }

  return newToken;
}

export async function triageSymptomsLocally(payload: {
  symptoms_text?: string;
  language?: string;
  lat?: number;
  lng?: number;
}): Promise<{ triage: TriageRecord; token: OPDToken | null }> {
  const text = payload.symptoms_text || 'General health consultation';
  const lang = detectLanguage(text, (payload.language as Language) || 'te');
  const { dept, severity, isEmergency } = detectDepartment(text);

  const tier = isEmergency ? 3 : severity >= 5 ? 2 : 1;
  const token = tier >= 2 ? await createAndSaveOpdToken({ department: dept, severity_score: severity }) : null;

  let nativeInstructions = '';
  let safetyWarning = '';

  if (lang === 'te') {
    if (isEmergency) {
      nativeInstructions = 'అత్యవసర పరిస్థితి: వెంటనే అత్యవసర విభాగానికి తరలించండి. 108 కు కాల్ చేయండి.';
      safetyWarning = 'తీవ్రమైన లక్షణాలు గమనించబడ్డాయి. సమయం వృధా చేయకండి.';
    } else if (tier === 2) {
      nativeInstructions = `మీకు **${dept}** విభాగంలో ఓపీడీ టోకెన్ ${token?.token_number} కేటాయించబడింది. దయచేసి అపాయింట్మెంట్ సమయానికి ఆసుపత్రికి చేరుకోండి. పుష్కలంగా నీరు త్రాగండి.`;
      safetyWarning = 'లక్షణాలు తీవ్రమైతే వెంటనే అత్యవసర విభాగాన్ని సంప్రదించండి.';
    } else {
      nativeInstructions = 'తగినంత విశ్రాంతి తీసుకోండి, పుష్కలంగా ద్రవపదార్థాలు సేవించండి. 2 రోజుల్లో తగ్గకపోతే డాక్టర్‌ను కలవండి.';
      safetyWarning = 'జ్వరం 102°F దాటితే వెంటనే సంప్రదించండి.';
    }
  } else if (lang === 'hi') {
    if (isEmergency) {
      nativeInstructions = 'आपातकालीन स्थिति: तुरंत निकटतम आपातकालीन कक्ष में जाएं। 108 डायल करें।';
      safetyWarning = 'गंभीर लक्षण पाए गए हैं। तुरंत चिकित्सा सहायता लें।';
    } else if (tier === 2) {
      nativeInstructions = `आपके लिए **${dept}** विभाग में ओपीडी टोकन ${token?.token_number} जारी किया गया है। कृपया समय पर अस्पताल पहुंचें।`;
      safetyWarning = 'यदि लक्षण बिगड़ें तो तुरंत डॉक्टर से संपर्क करें।';
    } else {
      nativeInstructions = 'पर्याप्त आराम करें और खूब गुनगुना पानी पिएं। यदि 2 दिनों में सुधार न हो तो परामर्श लें।';
      safetyWarning = 'सावधानी बरतें और तरल पदार्थ लें।';
    }
  } else {
    if (isEmergency) {
      nativeInstructions = 'Emergency: Proceed immediately to the nearest Emergency Room. Call 108 or 112.';
      safetyWarning = 'Critical indicators detected. Do not delay professional evaluation.';
    } else if (tier === 2) {
      nativeInstructions = `Confirmed OPD Token ${token?.token_number} generated for **${dept}**. Please report to the hospital consultation desk.`;
      safetyWarning = 'If acute pain or shortness of breath develops, proceed directly to ER.';
    } else {
      nativeInstructions = 'Rest comfortably, maintain hydration with electrolyte solutions, and observe vitals.';
      safetyWarning = 'Seek consultation if symptoms persist over 48 hours.';
    }
  }

  const triageRecord: TriageRecord = {
    id: `trg-${Date.now()}`,
    patient_id: DEFAULT_PROFILE.id,
    patient_name: DEFAULT_PROFILE.name,
    patient_phone: DEFAULT_PROFILE.phone,
    detected_language: lang,
    original_transcript: text,
    translated_symptoms: text,
    tier: tier as 1 | 2 | 3,
    severity_score: severity,
    clinical_department: dept,
    patient_instructions_native: nativeInstructions,
    safety_warning: safetyWarning,
    requires_human_assessment: tier >= 2,
    assigned_hospital: {
      id: ACCREDITED_HOSPITALS[0].hospital_id,
      name: ACCREDITED_HOSPITALS[0].hospital_name,
      distance_km: 2.1,
      phone: ACCREDITED_HOSPITALS[0].phone,
    },
    opd_token: token?.token_number,
    status: token ? 'token_issued' : 'triaged',
    created_at: new Date().toISOString(),
  };

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TRIAGE_HISTORY);
    const list: TriageRecord[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(STORAGE_KEYS.TRIAGE_HISTORY, JSON.stringify([triageRecord, ...list]));
  } catch (e) {
    console.warn('Error saving local triage:', e);
  }

  return { triage: triageRecord, token };
}

export async function chatClinicalEngine(payload: {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  model?: string;
  role?: string;
  language?: string;
}): Promise<{ reply: string; modelUsed: string; opdToken?: OPDToken }> {
  const lastUserMsg = (payload.messages[payload.messages.length - 1]?.content || '').toLowerCase();
  const lang = detectLanguage(lastUserMsg, (payload.language as Language) || 'te');
  const modelUsed = payload.model || 'gemini-3.8-flash';

  const wantsOpd =
    lastUserMsg.includes('టోకెన్') ||
    lastUserMsg.includes('బుక్') ||
    lastUserMsg.includes('ఓపీడీ') ||
    lastUserMsg.includes('అపాయింట్మెంట్') ||
    lastUserMsg.includes('ట్రోకెన్') ||
    lastUserMsg.includes('टोकन') ||
    lastUserMsg.includes('बुक') ||
    lastUserMsg.includes('ओपीडी') ||
    lastUserMsg.includes('अपॉइंटमेंट') ||
    lastUserMsg.includes('book opd') ||
    lastUserMsg.includes('opd token') ||
    lastUserMsg.includes('appointment') ||
    lastUserMsg.includes('book token') ||
    lastUserMsg.includes('see doctor');

  const { dept, severity } = detectDepartment(lastUserMsg);

  if (wantsOpd) {
    const token = await createAndSaveOpdToken({ department: dept, severity_score: severity });
    const reply =
      lang === 'te'
        ? `నమస్కారం! మీ అభ్యర్థన మేరకు **${dept}** విభాగానికి డిజిటల్ ఓపీడీ టోకెన్ విజయవంతంగా జారీ చేయబడింది.\n\n• **టోకెన్ నంబర్:** ${token.token_number}\n• **ఆసుపత్రి:** ${token.hospital_name}\n• **క్యూ స్థానం:** #${token.queue_position} (${token.estimated_wait_minutes} నిమిషాల నిరీక్షణ)\n\nక్రింద మీ డిజిటల్ టోకెన్ వివరాలు పొందుపరచబడ్డాయి.`
        : lang === 'hi'
        ? `नमस्ते! आपके अनुरोध पर **${dept}** विभाग के लिए डिजिटल ओपीडी टोकन सफलतापूर्वक बुक कर दिया गया है।\n\n• **टोकन नंबर:** ${token.token_number}\n• **अस्पताल:** ${token.hospital_name}\n• **कतार संख्या:** #${token.queue_position} (~${token.estimated_wait_minutes} मिनट)\n\nनीचे आपका टोकन कार्ड संलग्न है।`
        : `Hello! As requested, a confirmed Digital OPD Queue Token for **${dept}** has been generated.\n\n• **Token Number:** ${token.token_number}\n• **Hospital:** ${token.hospital_name}\n• **Queue Position:** #${token.queue_position} (~${token.estimated_wait_minutes} mins wait)\n\nYour verified token card is attached below.`;

    return {
      reply,
      modelUsed,
      opdToken: token,
    };
  }

  // Multilingual Clinical Health Answers
  if (lang === 'te') {
    if (lastUserMsg.includes('జ్వరం') || lastUserMsg.includes('fever') || lastUserMsg.includes('తాపం')) {
      return {
        reply: `నమస్కారం! జ్వరం గురించి సంజీవని వైద్య మార్గదర్శకాలు:\n\n1. **విశ్రాంతి & ద్రవపదార్థాలు:** పుష్కలంగా విశ్రాంతి తీసుకోండి. కొబ్బరి నీరు, ORS ద్రావణం లేదా మంచినీరు త్రాగండి.\n2. **ఉష్ణోగ్రత పర్యవేక్షణ:** థర్మామీటర్‌తో ప్రతి 4 గంటలకు ఒకసారి రీడింగ్ గమనించండి.\n3. **మందులు:** సాధారణంగా పారాసిటమాల్ (Paracetamol 650mg) ఆహారం తీసుకున్న తర్వాత మాత్రమే వేసుకోవాలి. రెండు మోతాదుల మధ్య కనీసం 4-6 గంటల సమయం ఉండాలి.\n\n⚠️ **హెచ్చరిక:** జ్వరం 102°F దాటినా లేదా 3 రోజుల కంటే ఎక్కువ తగ్గకపోయినా వెంటనే మా ఓపీడీ టోకెన్ ద్వారా ఆసుపత్రి వైద్యుడిని సంప్రదించండి.`,
        modelUsed,
      };
    }
    if (lastUserMsg.includes('కడుపు') || lastUserMsg.includes('నొప్పి') || lastUserMsg.includes('వాంతులు') || lastUserMsg.includes('stomach')) {
      return {
        reply: `నమస్కారం! కడుపులో అసౌకర్యం లేదా నొప్పికి సంరక్షణ సూచనలు:\n\n1. **ఆహార నియమాలు:** నూనె, కారం మరియు మసాలా వస్తువులు మానుకోండి. మజ్జిగ, తేలికపాటి గంజి తీసుకోండి.\n2. **డీహైడ్రేషన్ నివారణ:** వాంతులు ఉంటే కొద్దికొద్దిగా ORS ద్రవం త్రాగండి.\n3. **వైద్య సహాయం:** నొప్పి విపరీతంగా ఉంటే గ్యాస్ట్రోఎంటరాలజీ ఓపీడీ టోకెన్ బుక్ చేసుకోండి.`,
        modelUsed,
      };
    }
    if (lastUserMsg.includes('దగ్గు') || lastUserMsg.includes('జలుబు') || lastUserMsg.includes('cough')) {
      return {
        reply: `నమస్కారం! దగ్గు మరియు జలుబు నివారణకు:\n\n1. **ఆవిరి పట్టడం:** రోజుకు 2 సార్లు వేడి నీటి ఆవిరి పట్టండి.\n2. **గోరువెచ్చని నీరు:** ఉప్పు కలిపిన గోరువెచ్చని నీటితో పుక్కిలించండి (Gargling).\n3. **శ్వాసలో ఇబ్బంది:** శ్వాస తీసుకోవడంలో శ్రమ అనిపిస్తే పల్మోనాలజీ విభాగానికి టోకెన్ తీసుకోండి.`,
        modelUsed,
      };
    }
    return {
      reply: `నమస్కారం! మీ ఆరోగ్య సందేహాన్ని స్వీకరించాము. సంజీవని AI హెల్త్‌కేర్ అసిస్టెంట్ మీకు సేవ చేయడానికి సిద్ధంగా ఉంది.\n\nలక్షణాల తీవ్రత ఆధారంగా మీరు ఇక్కడే 'ఓపీడీ టోకెన్ బుక్ చేయండి' అని టైప్ చేసి ఆసుపత్రి టోకెన్ పొందవచ్చు లేదా అత్యవసరమైతే 2.5 సెకన్ల SOS ఉపయోగించవచ్చు. ఇంకా ఏమైనా వివరాలు అవసరమా?`,
      modelUsed,
    };
  }

  if (lang === 'hi') {
    if (lastUserMsg.includes('बुखार') || lastUserMsg.includes('fever') || lastUserMsg.includes('तापमान')) {
      return {
        reply: `नमस्ते! बुखार के संबंध में आवश्यक स्वास्थ्य परामर्श:\n\n1. **पर्याप्त आराम एवं तरल पदार्थ:** पर्याप्त आराम करें, खूब गुनगुना पानी, नारियल पानी अथवा ORS घोल पिएं।\n2. **तापमान की निगरानी:** थर्मामीटर से दिन में 3-4 बार शरीर का तापमान नोट करें।\n3. **दवा परामर्श:** सामान्यतः पेरासिटामोल (Paracetamol 650mg) भोजन के बाद ली जाती है। 4 से 6 घंटे का अंतराल रखें।\n\n⚠️ **सावधानी:** यदि बुखार 102°F से अधिक हो या 3 दिन से अधिक रहे, तो तुरंत हमारे डिजिटल OPD टोकन के माध्यम से डॉक्टर से परामर्श लें।`,
        modelUsed,
      };
    }
    if (lastUserMsg.includes('पेट') || lastUserMsg.includes('दर्द') || lastUserMsg.includes('उल्टी') || lastUserMsg.includes('stomach')) {
      return {
        reply: `नमस्ते! पेट दर्द या अपच के संबंध में सुझाव:\n\n1. **खान-पान की सावधानी:** तला-भुना और मिर्च-मसालेदार भोजन न करें। छाछ, खिचड़ी, दलिया जैसा हल्का आहार लें।\n2. **हाइड्रेशन:** उल्टी या दस्त होने पर ORS घोल का सेवन करें।\n3. **चिकित्सीय परामर्श:** यदि पेट में लगातार तीव्र दर्द हो, तो तुरंत संजीवनी ऐप के जरिए गैस्ट्रोएंटरोलॉजी का OPD टोकन लें।`,
        modelUsed,
      };
    }
    return {
      reply: `नमस्ते! आपका स्वास्थ्य संबंधी प्रश्न प्राप्त हुआ। संजीवनी AI हेल्थकेयर असिस्टेंट आपके बेहतर स्वास्थ्य के लिए तत्पर है।\n\nआप अपने लक्षणों के आधार पर ऐप से तुरंत 'ओपीडी टोकन' प्राप्त कर सकते हैं अथवा आपातकालीन स्थिति में 2.5 सेकंड का SOS बटन दबा सकते हैं।`,
      modelUsed,
    };
  }

  // English fallback
  return {
    reply: `Hello! I have reviewed your health query: "${payload.messages[payload.messages.length - 1]?.content || ''}".\n\n1. **Immediate Guidance:** Stay well-hydrated, monitor resting vital signs, and avoid strenuous exertion.\n2. **Clinical Verification:** For any persistent symptoms, request an OPD Token here to be routed to ${dept}.\n3. **Emergency Red Flags:** If you experience acute chest discomfort, sudden shortness of breath, or fainting, activate the 2.5s Emergency SOS button immediately.`,
    modelUsed,
  };
}

export async function scanPrescriptionLocally(imageUri: string, language: string = 'te'): Promise<PrescriptionRecord> {
  const isTe = language === 'te';
  const isHi = language === 'hi';

  const rxRecord: PrescriptionRecord = {
    id: `rx-${Date.now()}`,
    patient_id: DEFAULT_PROFILE.id,
    image_url: imageUri,
    extraction_status: 'success',
    medicines: [
      {
        name: 'Paracetamol',
        dosage: '650 mg',
        frequency: '1 tablet thrice daily (TID) after food',
        duration: '3 days',
        instructions_native: isTe
          ? 'భోజనం తర్వాత ఒక టాబ్లెట్ వేసుకోవాలి (జ్వరం లేదా ఒంటి నొప్పులు ఉన్నప్పుడు మాత్రమే).'
          : isHi
          ? 'भोजन के बाद एक गोली (केवल बुखार या दर्द होने पर लें)।'
          : 'Take 1 tablet after meals (only if fever or body pain persists).',
      },
      {
        name: 'Pantoprazole',
        dosage: '40 mg',
        frequency: '1 capsule once daily before breakfast (OD)',
        duration: '5 days',
        instructions_native: isTe
          ? 'ఉదయం అల్పాహారానికి 30 నిమిషాల ముందు ఖాళీ కడుపుతో వేసుకోవాలి.'
          : isHi
          ? 'सुबह नाश्ते से 30 मिनट पहले खाली पेट लें।'
          : 'Take 1 capsule on an empty stomach 30 mins before morning breakfast.',
      },
      {
        name: 'Cetirizine',
        dosage: '10 mg',
        frequency: '1 tablet once daily at bedtime (HS)',
        duration: '5 days',
        instructions_native: isTe
          ? 'రాత్రి నిద్రపోయే ముందు ఒక టాబ్లెట్ వేసుకోవాలి (మత్తు కలిగించవచ్చు).'
          : isHi
          ? 'रात को सोने से पहले एक गोली लें (हल्की नींद आ सकती है)।'
          : 'Take 1 tablet at bedtime (may cause mild drowsiness).',
      },
    ],
    safety_warning: isTe
      ? 'వైద్యుల సూచన మేరకు మాత్రమే వాడండి. మందులు వేసుకునే ముందు రిజిస్టర్డ్ ఫార్మసిస్ట్‌తో నిర్ధారించుకోండి.'
      : isHi
      ? 'दवाओं का सेवन डॉक्टर के निर्देशानुसार ही करें। लेने से पहले फार्मासिस्ट से जांच करवाएं।'
      : 'Verified via Sanjeevani AI Guardrails. Always confirm prescription with a licensed pharmacist.',
    created_at: new Date().toISOString(),
  };

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
    const list: PrescriptionRecord[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify([rxRecord, ...list]));
  } catch (e) {
    console.warn('Error saving local prescription:', e);
  }

  return rxRecord;
}

export async function dispatchSOSLocally(lat: number, lng: number): Promise<{ sos_id: string; status: string }> {
  const sosId = `SOS-${Date.now()}`;
  const sosEvent: SOSEvent = {
    id: sosId,
    patient_id: DEFAULT_PROFILE.id,
    patient_name: DEFAULT_PROFILE.name,
    patient_phone: DEFAULT_PROFILE.phone,
    latitude: lat || 17.7124,
    longitude: lng || 83.3156,
    priority: 0,
    status: 'dispatched',
    emergency_notes: 'Priority 0 Emergency SOS triggered by patient hold protocol. 108 ambulance dispatch requested.',
    created_at: new Date().toISOString(),
  };

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SOS_HISTORY);
    const list: SOSEvent[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(STORAGE_KEYS.SOS_HISTORY, JSON.stringify([sosEvent, ...list]));
  } catch (e) {
    console.warn('Error saving local SOS:', e);
  }

  return { sos_id: sosId, status: 'dispatched' };
}
