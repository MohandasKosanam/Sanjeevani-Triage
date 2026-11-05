import { Language } from '../types';

export interface TranslationDictionary {
  // Global Header & Navigation
  appTitle: string;
  appSubtitle: string;
  dualScreenView: string;
  patientAppView: string;
  adminQueueView: string;
  monorepoView: string;
  liveVoiceBtn: string;
  aiChatBtn: string;
  servicesOperational: string;
  medicalHubLocation: string;

  // Mobile App Header & Greeting
  greeting: (name: string) => string;
  greetingSubtitle: string;
  dailyHealthInsight: string;
  simulatedHealthConnect: string;
  steps: string;
  stepsGoal: string;
  sleep: string;
  sleepLow: string;
  avgHeartRate: string;
  restingNormal: string;
  insightTip: string;

  // Mobile Primary Actions
  speakSymptomsTitle: string;
  speakSymptomsDesc: string;
  holdToSpeak: string;
  smartRxTitle: string;
  smartRxDesc: string;
  liveVoiceTitle: string;
  liveVoiceDesc: string;
  talkLive: string;
  aiChatTitle: string;
  aiChatDesc: string;
  openChat: string;

  // Voice Triage Modal
  voiceTriageModalTitle: string;
  voiceTriageModalSubtitle: string;
  listeningSymptoms: string;
  analyzingGemini: string;
  tellUsSymptoms: string;
  tapToSpeak: string;
  stopRecording: string;
  processing: string;
  cancelRecording: string;
  tier1Title: string;
  tier2Title: string;
  tier3Title: string;
  severity: string;
  digitalOpdToken: string;
  statusLabel: string;
  patientInstructions: string;
  clinicalSummaryDoc: string;
  estWait: string;
  doneAndRecords: string;
  quickTestPresets: string;

  // Prescription Scanner Modal
  rxModalTitle: string;
  rxModalSubtitle: string;
  snapOrUpload: string;
  snapDesc: string;
  takePhoto: string;
  uploadFile: string;
  decodingPrescription: string;
  safetyGuardrailTriggered: string;
  safetyPolicyDesc: string;
  extractedMedicines: string;
  dosage: string;
  duration: string;
  frequency: string;
  pharmacistVerifyNotice: string;
  scanAnother: string;
  doneBtn: string;
  testSamples: string;
  legibleSample: string;
  illegibleSample: string;

  // SOS Emergency
  holdSosBtn: string;
  priority0Activated: string;
  emergencyDispatchLive: string;
  sosTicketLabel: string;
  hospitalAlertStage: string;
  localSirenStage: string;
  ambientAudioStage: string;
  gpsCoordinates: string;
  ambulanceHelpline: string;
  dial108: string;
  acknowledgeBtn: string;

  // OPD Tokens
  activeOpdTokensTitle: string;
  noActiveTokens: string;
  noActiveTokensDesc: string;
  issuedAt: string;
  straightLineDist: string;

  // Health Records
  healthRecordsTitle: string;
  triageRecordsTab: string;
  prescriptionsTab: string;
  sosLogsTab: string;
  noTriageRecords: string;
  noPrescriptions: string;
  noSosLogs: string;

  // Patient Profile
  profileTitle: string;
  emergencyContact: string;
  medicalFlags: string;
  knownConditions: string;
  allergies: string;
  noneRecorded: string;

  // Bottom Navigation Bar
  navHome: string;
  navChat: string;
  navRecords: string;
  navTokens: string;
  navProfile: string;

  // Hospital Admin Dashboard
  adminCommandCenter: string;
  adminSubtitle: string;
  liveQueueBadge: string;
  totalPatientsToday: string;
  activeQueueCount: string;
  emergencyCasesCount: string;
  waitingOpdCount: string;
  inConsultationCount: string;
  queueTableHeader: string;
  queueTableSubheader: string;
  departmentFilterLabel: string;
  allDepartments: string;
  queueClearTitle: string;
  queueClearDesc: string;
  p0SosEventBadge: string;
  tier3EmergencyBadge: string;
  tier2OpdBadge: string;
  callbackPatientBtn: string;
  markResolvedBtn: string;
  openLocationLink: string;
  contactPatientBtn: string;
  directCallbackTitle: string;
  directCallbackSubtitle: string;
  closeBtn: string;
  dialNowBtn: string;

  // Gemini Chatbot & History
  chatModalTitle: string;
  chatModalSubtitle: string;
  chatHistoryTitle: string;
  newChatBtn: string;
  noPastConversations: string;
  deleteSession: string;
  modelLabel: string;
  roleLabel: string;
  roleGeneral: string;
  roleSpecialist: string;
  roleFastTriage: string;
  chatInputPlaceholder: string;
  tryPrompt: string;
  thinkingNotice: string;
  clearChat: string;

  // Gemini Live Voice
  liveVoiceModalTitle: string;
  liveVoiceListening: string;
  liveVoiceConnected: string;
  liveVoiceSpeaking: string;
  liveVoiceDisconnected: string;
  endConversationBtn: string;
  quickVoiceQueries: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  // TELUGU (తెలుగు)
  te: {
    appTitle: 'సంజీవని ట్రయాజ్',
    appSubtitle: 'మల్టీమోడల్ AI ట్రయాజ్ • ప్రిస్క్రిప్షన్ స్కానర్ • 2.5s SOS • ఆసుపత్రి క్యూ',
    dualScreenView: 'ద్వంద్వ వీక్షణ',
    patientAppView: 'రోగి యాప్',
    adminQueueView: 'ఆసుపత్రి క్యూ',
    monorepoView: 'మోనోరెపో & EAS',
    liveVoiceBtn: 'లైవ్ వాయిస్',
    aiChatBtn: 'AI హెల్త్ చాట్',
    servicesOperational: 'అన్ని సేవలు అందుబాటులో ఉన్నాయి',
    medicalHubLocation: 'విశాఖపట్నం మెడికల్ హబ్',

    greeting: (name: string) => `నమస్తే, ${name}`,
    greetingSubtitle: 'ఈ రోజు మీ ఆరోగ్యానికి మేము ఎలా సహాయపడగలం?',
    dailyHealthInsight: 'రోజువారీ ఆరోగ్య సమాచారం',
    simulatedHealthConnect: 'హెల్త్ కనెక్ట్ డేటా',
    steps: 'అడుగులు',
    stepsGoal: 'లక్ష్యం: 8,000',
    sleep: 'నిద్ర',
    sleepLow: 'తక్కువ (-2.3 గం)',
    avgHeartRate: 'గుండె వేగం',
    restingNormal: 'విశ్రాంతి: సాధారణం',
    insightTip: 'వాతావరణం 32°C వేడిగా ఉంది. ఎక్కువ నీరు త్రాగండి మరియు తగినంత విశ్రాంతి తీసుకోండి.',

    speakSymptomsTitle: 'మీ లక్షణాలను మాట్లాడండి',
    speakSymptomsDesc: 'తెలుగు, హిందీ లేదా ఇంగ్లీషులో సహజంగా మాట్లాడండి. తక్షణ డిజిటల్ ఓపీడీ టోకెన్ పొందండి.',
    holdToSpeak: 'మాట్లాడటానికి నొక్కండి',
    smartRxTitle: 'స్మార్ట్ ప్రిస్క్రిప్షన్ డీకోడర్',
    smartRxDesc: 'డాక్టర్ ప్రిస్క్రిప్షన్ ఫోటో తీయండి & మందుల వివరాలు తెలుసుకోండి',
    liveVoiceTitle: 'లైవ్ వాయిస్ సంభాషణ',
    liveVoiceDesc: 'gemini-3.8-live ద్వారా రియల్-టైమ్ వాయిస్ సంభాషణ',
    talkLive: 'లైవ్ మాట్లాడండి',
    aiChatTitle: 'AI హెల్త్ చాట్‌బాట్',
    aiChatDesc: 'మల్టీ-టర్న్ జెమిని మెడికల్ చాట్ & చరిత్ర',
    openChat: 'చాట్ ప్రారంభించండి',

    voiceTriageModalTitle: 'వాయిస్-టు-టోకెన్ ఓపీడీ',
    voiceTriageModalSubtitle: 'తెలుగు, హిందీ లేదా ఇంగ్లీషులో సహజంగా మాట్లాడండి',
    listeningSymptoms: 'మీ లక్షణాలను వింటున్నాము...',
    analyzingGemini: 'జెమిని AI ద్వారా విశ్లేషిస్తున్నాము...',
    tellUsSymptoms: 'మీకు ఎలా ఉందో చెప్పండి',
    tapToSpeak: 'మాట్లాడటానికి నొక్కండి',
    stopRecording: 'ఆపండి',
    processing: 'ప్రాసెసింగ్...',
    cancelRecording: 'రద్దు చేయండి',
    tier1Title: 'టైర్ 1: స్వీయ సంరక్షణ సూచనలు',
    tier2Title: 'టైర్ 2: ఓపీడీ సంప్రదింపు అవసరం',
    tier3Title: 'టైర్ 3: అత్యవసర హెచ్చరిక!',
    severity: 'తీవ్రత',
    digitalOpdToken: 'డిజిటల్ ఓపీడీ టోకెన్',
    statusLabel: 'స్థితి',
    patientInstructions: 'రోగి సూచనలు',
    clinicalSummaryDoc: 'వైద్యుల క్లినికల్ సారాంశం (ఇంగ్లీష్)',
    estWait: 'వేచి ఉండే సమయం',
    doneAndRecords: 'పూర్తయింది & రికార్డుల్లో చూడండి',
    quickTestPresets: 'శీఘ్ర పరీక్ష నమూనాలు',

    rxModalTitle: 'స్మార్ట్ ప్రిస్క్రిప్షన్ డీకోడర్',
    rxModalSubtitle: 'మందుల సూచనలను సురక్షితంగా అనువదించండి',
    snapOrUpload: 'ప్రిస్క్రిప్షన్ ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి',
    snapDesc: 'మందుల పేర్లు మరియు మోతాదు స్పష్టంగా కనిపించేలా చూడండి',
    takePhoto: 'ఫోటో తీయండి',
    uploadFile: 'ఫైల్ అప్‌లోడ్',
    decodingPrescription: 'ప్రిస్క్రిప్షన్ పరిశీలిస్తున్నాము...',
    safetyGuardrailTriggered: 'ప్రిస్క్రిప్షన్ భద్రతా హెచ్చరిక అమలు చేయబడింది',
    safetyPolicyDesc: 'అస్పష్టమైన చేతిరాతలో మందుల పేర్లను ఊహించడం జరగదు. దయచేసి అర్హతగల ఫార్మసిస్ట్‌ను సంప్రదించండి.',
    extractedMedicines: 'గుర్తించిన మందులు',
    dosage: 'మోతాదు',
    duration: 'కాలవ్యవధి',
    frequency: 'ఫ్రీక్వెన్సీ',
    pharmacistVerifyNotice: 'మందులు వేసుకునే ముందు ఎల్లప్పుడూ ఫార్మసిస్ట్‌తో నిర్ధారించుకోండి.',
    scanAnother: 'మరొకటి స్కాన్ చేయండి',
    doneBtn: 'పూర్తయింది',
    testSamples: 'నమూనా ప్రిస్క్రిప్షన్లు:',
    legibleSample: 'స్పష్టమైన ప్రిస్క్రిప్షన్',
    illegibleSample: 'అస్పష్టమైన చేతిరాత (భద్రతా పరీక్ష)',

    holdSosBtn: 'SOS పట్టుకోండి',
    priority0Activated: 'ప్రాధాన్యత 0 అత్యవసరం యాక్టివేట్ చేయబడింది',
    emergencyDispatchLive: 'అత్యవసర రెస్పాన్స్ లైవ్',
    sosTicketLabel: 'టికెట్ నంబర్',
    hospitalAlertStage: 'ఆసుపత్రి డ్యాష్‌బోర్డ్ అలర్ట్',
    localSirenStage: 'లోకల్ ఆడియో సైరన్ (10 సె)',
    ambientAudioStage: 'పరిసర ఆడియో రికార్డింగ్ (20 సె)',
    gpsCoordinates: 'GPS స్థానం',
    ambulanceHelpline: 'జాతీయ అంబులెన్స్',
    dial108: '108 కు డయల్ చేయండి',
    acknowledgeBtn: 'ధృవీకరించండి & పర్యవేక్షించండి',

    activeOpdTokensTitle: 'యాక్టివ్ ఓపీడీ టోకెన్',
    noActiveTokens: 'యాక్టివ్ ఓపీడీ టోకెన్లు లేవు',
    noActiveTokensDesc: 'వాయిస్ ట్రయాజ్ ద్వారా మీ లక్షణాలు చెప్పి డిజిటల్ టోకెన్ పొందండి.',
    issuedAt: 'జారీ చేయబడింది',
    straightLineDist: 'నేరుగా దూరం',

    healthRecordsTitle: 'ఆరోగ్య రికార్డులు',
    triageRecordsTab: 'ట్రయాజ్ రికార్డులు',
    prescriptionsTab: 'ప్రిస్క్రిప్షన్లు',
    sosLogsTab: 'SOS లాగ్‌లు',
    noTriageRecords: 'ట్రయాజ్ రికార్డులు కనుగొనబడలేదు.',
    noPrescriptions: 'స్కాన్ చేసిన ప్రిస్క్రిప్షన్లు లేవు.',
    noSosLogs: 'అత్యవసర సంఘటనలు నమోదు కాలేదు.',

    profileTitle: 'రోగి ప్రొఫైల్',
    emergencyContact: 'అత్యవసర సంప్రదింపు వ్యక్తి',
    medicalFlags: 'వైద్య సమాచారం',
    knownConditions: 'తెలిసిన ఆరోగ్య పరిస్థితులు',
    allergies: 'అలెర్జీలు',
    noneRecorded: 'ఏమీ నమోదు కాలేదు',

    navHome: 'హోమ్',
    navChat: 'చాట్',
    navRecords: 'రికార్డులు',
    navTokens: 'టోకెన్లు',
    navProfile: 'ప్రొఫైల్',

    adminCommandCenter: 'ఆసుపత్రి కమాండ్ సెంటర్',
    adminSubtitle: 'ప్రాధాన్యత ఆధారిత రోగి రూటింగ్ & అత్యవసర నిర్వహణ',
    liveQueueBadge: 'లైవ్ క్యూ',
    totalPatientsToday: 'ఈ రోజు మొత్తం రోగులు',
    activeQueueCount: 'యాక్టివ్ క్యూ',
    emergencyCasesCount: 'అత్యవసర కేసులు (P0 / టైర్ 3)',
    waitingOpdCount: 'ఓపీడీలో వేచి ఉన్నవారు',
    inConsultationCount: 'కన్సల్టేషన్‌లో ఉన్నవారు',
    queueTableHeader: 'క్లినికల్ తీవ్రత ఆధారిత రోగి క్యూ',
    queueTableSubheader: 'ప్రాధాన్యత 0 SOS > టైర్ 3 అత్యవసరం > తీవ్రత ప్రకారం టైర్ 2 ఓపీడీ',
    departmentFilterLabel: 'విభాగం:',
    allDepartments: 'అన్ని విభాగాలు',
    queueClearTitle: 'క్యూ ఖాళీగా ఉంది',
    queueClearDesc: 'ఈ విభాగంలో పెండింగ్ రోగులు ఎవరూ లేరు.',
    p0SosEventBadge: 'ప్రాధాన్యత 0 SOS ఈవెంట్',
    tier3EmergencyBadge: 'టైర్ 3 అత్యవసరం',
    tier2OpdBadge: 'టైర్ 2 ఓపీడీ',
    callbackPatientBtn: 'రోగికి కాల్ చేయండి',
    markResolvedBtn: 'పరిష్కరించబడింది',
    openLocationLink: 'మ్యాప్‌లో చూడండి',
    contactPatientBtn: 'రోగిని సంప్రదించండి',
    directCallbackTitle: 'రోగికి ప్రత్యక్ష కాల్',
    directCallbackSubtitle: 'ధృవీకరించబడిన ఫోన్ కాల్ ప్రారంభించబడుతోంది',
    closeBtn: 'మూసివేయి',
    dialNowBtn: 'ఇప్పుడే కాల్ చేయండి',

    chatModalTitle: 'సంజీవని AI హెల్త్ చాట్',
    chatModalSubtitle: 'మల్టీ-టర్న్ మెడికల్ అసిస్టెంట్ & చాట్ హిస్టరీ',
    chatHistoryTitle: 'చాట్ చరిత్ర',
    newChatBtn: '+ కొత్త చాట్',
    noPastConversations: 'గత చాట్‌లు ఏవీ లేవు',
    deleteSession: 'తొలగించు',
    modelLabel: 'మోడల్:',
    roleLabel: 'పాత్ర:',
    roleGeneral: '🩺 సాధారణ గైడ్',
    roleSpecialist: '🧠 స్పెషలిస్ట్ రీజనింగ్',
    roleFastTriage: '⚡ శీఘ్ర ట్రయాజ్',
    chatInputPlaceholder: 'మీ ఆరోగ్య ప్రశ్నను టైప్ చేయండి...',
    tryPrompt: 'ఉదాహరణ:',
    thinkingNotice: 'ఆలోచిస్తున్నాము...',
    clearChat: 'చాట్ క్లియర్ చేయండి',

    liveVoiceModalTitle: 'జెమిని 3.8 లైవ్ (వాయిస్)',
    liveVoiceListening: 'జెమిని వింటోంది. సహజంగా మాట్లాడండి...',
    liveVoiceConnected: 'లైవ్ వాయిస్ సెషన్ యాక్టివ్',
    liveVoiceSpeaking: 'జెమిని 24kHz ఆడియో మాట్లాడుతోంది...',
    liveVoiceDisconnected: 'కాల్ ముగిసింది',
    endConversationBtn: 'కాల్ ముగించండి',
    quickVoiceQueries: 'శీఘ్ర వాయిస్ ప్రశ్నలు:',
  },

  // HINDI (हिंदी)
  hi: {
    appTitle: 'संजीवनी ट्राइएज',
    appSubtitle: 'मल्टीमॉडल AI ट्राइएज • प्रिस्क्रिप्शन स्कैनर • 2.5s SOS • अस्पताल कतार',
    dualScreenView: 'डुअल स्क्रीन',
    patientAppView: 'मरीज़ ऐप',
    adminQueueView: 'अस्पताल कतार',
    monorepoView: 'मोनोरेपो & EAS',
    liveVoiceBtn: 'लाइव वॉयस',
    aiChatBtn: 'AI हेल्थ चैट',
    servicesOperational: 'सभी सेवाएं सक्रिय हैं',
    medicalHubLocation: 'विशाखापट्टनम मेडिकल हब',

    greeting: (name: string) => `नमस्ते, ${name}`,
    greetingSubtitle: 'आज हम आपके स्वास्थ्य में कैसे सहायता कर सकते हैं?',
    dailyHealthInsight: 'दैनिक स्वास्थ्य जानकारी',
    simulatedHealthConnect: 'हेल्थ कनेक्ट डेटा',
    steps: 'कदम',
    stepsGoal: 'लक्ष्य: 8,000',
    sleep: 'नींद',
    sleepLow: 'कम (-2.3 घंटे)',
    avgHeartRate: 'हृदय गति',
    restingNormal: 'सामान्य',
    insightTip: 'तापमान 32°C गर्म है। पर्याप्त पानी पिएं और दोपहर की धूप से बचें।',

    speakSymptomsTitle: 'अपने लक्षण बोलकर बताएं',
    speakSymptomsDesc: 'हिंदी, तेलुगु या अंग्रेजी में स्वाभाविक रूप से बोलें। तुरंत डिजिटल OPD टोकन प्राप्त करें।',
    holdToSpeak: 'बोलने के लिए दबाएं',
    smartRxTitle: 'स्मार्ट प्रिस्क्रिप्शन डिकोडर',
    smartRxDesc: 'डॉक्टर की पर्ची का फोटो लें और दवाओं की जानकारी समझें',
    liveVoiceTitle: 'लाइव वॉयस बातचीत',
    liveVoiceDesc: 'gemini-3.8-live के साथ रियल-टाइम वॉयस संवाद',
    talkLive: 'लाइव बात करें',
    aiChatTitle: 'AI हेल्थ चैटबॉट',
    aiChatDesc: 'मल्टी-टर्न जेमिनी मेडिकल चैट और चैट हिस्ट्री',
    openChat: 'चैट शुरू करें',

    voiceTriageModalTitle: 'वॉयस-टू-टोकन OPD',
    voiceTriageModalSubtitle: 'हिंदी, तेलुगु या अंग्रेजी में स्वाभाविक रूप से बोलें',
    listeningSymptoms: 'लक्षण सुन रहे हैं...',
    analyzingGemini: 'जेमिनी AI द्वारा विश्लेषण किया जा रहा है...',
    tellUsSymptoms: 'बताएं कि आप कैसा महसूस कर रहे हैं',
    tapToSpeak: 'बोलने के लिए टैप करें',
    stopRecording: 'रोकें',
    processing: 'प्रोसेसिंग...',
    cancelRecording: 'रद्द करें',
    tier1Title: 'टियर 1: स्व-देखभाल मार्गदर्शन',
    tier2Title: 'टियर 2: OPD परामर्श आवश्यक',
    tier3Title: 'टियर 3: आपातकालीन अलर्ट!',
    severity: 'गंभीरता',
    digitalOpdToken: 'डिजिटल OPD टोकन',
    statusLabel: 'स्थिति',
    patientInstructions: 'मरीज़ के लिए निर्देश',
    clinicalSummaryDoc: 'चिकित्सक सारांश (अंग्रेजी)',
    estWait: 'प्रतीक्षा समय',
    doneAndRecords: 'सम्पन्न & रिकॉर्ड्स में देखें',
    quickTestPresets: 'त्वरित परीक्षण लक्षण',

    rxModalTitle: 'स्मार्ट प्रिस्क्रिप्शन डिकोडर',
    rxModalSubtitle: 'दवा निर्देशों को सुरक्षित रूप से समझें',
    snapOrUpload: 'पर्ची की फोटो लें या अपलोड करें',
    snapDesc: 'सुनिश्चित करें कि दवा के नाम और खुराक स्पष्ट दिख रहे हों',
    takePhoto: 'फोटो लें',
    uploadFile: 'फाइल अपलोड',
    decodingPrescription: 'पर्ची का विश्लेषण कर रहे हैं...',
    safetyGuardrailTriggered: 'प्रिस्क्रिप्शन सुरक्षा चेतावनी लागू',
    safetyPolicyDesc: 'अस्पष्ट लिखावट में दवाओं का अनुमान नहीं लगाया जाता। कृपया किसी भौतिक फार्मासिस्ट से परामर्श लें।',
    extractedMedicines: 'पहचानी गई दवाएं',
    dosage: 'खुराक',
    duration: 'अवधि',
    frequency: 'बारंबारता',
    pharmacistVerifyNotice: 'दवा लेने से पहले हमेशा अपने फार्मासिस्ट से पुष्टि करें।',
    scanAnother: 'दूसरा स्कैन करें',
    doneBtn: 'सम्पन्न',
    testSamples: 'नमूना पर्चियां:',
    legibleSample: 'स्पष्ट पर्ची',
    illegibleSample: 'अस्पष्ट लिखावट (सुरक्षा परीक्षण)',

    holdSosBtn: 'SOS दबाकर रखें',
    priority0Activated: 'प्राथमिकता 0 आपातकाल सक्रिय',
    emergencyDispatchLive: 'आपातकालीन डिस्पैच लाइव',
    sosTicketLabel: 'टिकट संख्या',
    hospitalAlertStage: 'अस्पताल डैशबोर्ड अलर्ट',
    localSirenStage: 'लोकल ऑडियो सायरन (10 से)',
    ambientAudioStage: 'परिवेश ऑडियो रिकॉर्डिंग (20 से)',
    gpsCoordinates: 'GPS स्थान',
    ambulanceHelpline: 'राष्ट्रीय एम्बुलेंस',
    dial108: '108 डायल करें',
    acknowledgeBtn: 'स्वीकार करें & निगरानी रखें',

    activeOpdTokensTitle: 'सक्रिय OPD टोकन',
    noActiveTokens: 'कोई सक्रिय टोकन नहीं',
    noActiveTokensDesc: 'वॉयस ट्राइएज द्वारा अपने लक्षण बताएं और टोकन प्राप्त करें।',
    issuedAt: 'जारी समय',
    straightLineDist: 'सीधी दूरी',

    healthRecordsTitle: 'स्वास्थ्य रिकॉर्ड्स',
    triageRecordsTab: 'ट्राइएज रिकॉर्ड्स',
    prescriptionsTab: 'पर्चे',
    sosLogsTab: 'SOS लॉग्स',
    noTriageRecords: 'कोई ट्राइएज रिकॉर्ड नहीं मिला।',
    noPrescriptions: 'कोई स्कैन किया गया पर्चा नहीं है।',
    noSosLogs: 'कोई आपातकालीन घटना दर्ज नहीं है।',

    profileTitle: 'मरीज़ प्रोफाइल',
    emergencyContact: 'आपातकालीन संपर्क',
    medicalFlags: 'चिकित्सा विवरण',
    knownConditions: 'ज्ञात स्वास्थ्य स्थितियां',
    allergies: 'एलर्जी',
    noneRecorded: 'कोई दर्ज नहीं',

    navHome: 'होम',
    navChat: 'चैट',
    navRecords: 'रिकॉर्ड्स',
    navTokens: 'टोकन',
    navProfile: 'प्रोफाइल',

    adminCommandCenter: 'अस्पताल कमांड सेंटर',
    adminSubtitle: 'प्राथमिकता-आधारित मरीज़ रूटिंग और आपातकालीन प्रबंधन',
    liveQueueBadge: 'लाइव कतार',
    totalPatientsToday: 'आज के कुल मरीज़',
    activeQueueCount: 'सक्रिय कतार',
    emergencyCasesCount: 'आपातकालीन मामले (P0 / टियर 3)',
    waitingOpdCount: 'OPD में प्रतीक्षारत',
    inConsultationCount: 'परामर्श में',
    queueTableHeader: 'गंभीरता-आधारित सक्रिय मरीज़ कतार',
    queueTableSubheader: 'प्राथमिकता 0 SOS > टियर 3 आपातकाल > टियर 2 OPD स्कोर के आधार पर',
    departmentFilterLabel: 'विभाग:',
    allDepartments: 'सभी विभाग',
    queueClearTitle: 'कतार खाली है',
    queueClearDesc: 'इस विभाग में कोई लंबित मरीज़ नहीं हैं।',
    p0SosEventBadge: 'प्राथमिकता 0 SOS घटना',
    tier3EmergencyBadge: 'टियर 3 आपातकाल',
    tier2OpdBadge: 'टियर 2 OPD',
    callbackPatientBtn: 'मरीज़ को कॉल करें',
    markResolvedBtn: 'समाधान चिह्नित करें',
    openLocationLink: 'मानचित्र पर देखें',
    contactPatientBtn: 'मरीज़ से संपर्क करें',
    directCallbackTitle: 'सीधा टेलीफोन संपर्क',
    directCallbackSubtitle: 'सत्यापित फोन कॉल शुरू किया जा रहा है',
    closeBtn: 'बंद करें',
    dialNowBtn: 'अभी कॉल करें',

    chatModalTitle: 'संजीवनी AI हेल्थ चैट',
    chatModalSubtitle: 'मल्टी-टर्न मेडिकल असिस्टेंट और चैट हिस्ट्री',
    chatHistoryTitle: 'चैट इतिहास',
    newChatBtn: '+ नई चैट',
    noPastConversations: 'कोई पिछला संवाद नहीं',
    deleteSession: 'हटाएं',
    modelLabel: 'मॉडल:',
    roleLabel: 'भूमिका:',
    roleGeneral: '🩺 सामान्य मार्गदर्शक',
    roleSpecialist: '🧠 विशेषज्ञ तर्क',
    roleFastTriage: '⚡ त्वरित ट्राइएज',
    chatInputPlaceholder: 'अपना स्वास्थ्य प्रश्न पूछें...',
    tryPrompt: 'प्रयास करें:',
    thinkingNotice: 'विचार किया जा रहा है...',
    clearChat: 'चैट खाली करें',

    liveVoiceModalTitle: 'जेमिनी 3.8 लाइव (वॉयस)',
    liveVoiceListening: 'जेमिनी सुन रहा है। स्वाभाविक रूप से बोलें...',
    liveVoiceConnected: 'लाइव वॉयस सत्र सक्रिय',
    liveVoiceSpeaking: 'जेमिनी 24kHz ऑडियो में बोल रहा है...',
    liveVoiceDisconnected: 'कॉल समाप्त',
    endConversationBtn: 'कॉल समाप्त करें',
    quickVoiceQueries: 'त्वरित वॉयस प्रश्न:',
  },

  // ENGLISH (en)
  en: {
    appTitle: 'Sanjeevani Triage',
    appSubtitle: 'Multimodal AI Triage • Smart Rx Decoder • 2.5s SOS • Hospital Queue',
    dualScreenView: 'Dual-Screen',
    patientAppView: 'Patient App',
    adminQueueView: 'Admin Queue',
    monorepoView: 'Monorepo & EAS',
    liveVoiceBtn: 'Live Voice',
    aiChatBtn: 'AI Health Chat',
    servicesOperational: 'All Services Operational',
    medicalHubLocation: 'Visakhapatnam Medical Hub',

    greeting: (name: string) => `Hello, ${name}`,
    greetingSubtitle: 'How can we assist your health today?',
    dailyHealthInsight: 'Daily Health Insight',
    simulatedHealthConnect: 'Simulated Health Connect',
    steps: 'Steps',
    stepsGoal: 'Goal: 8,000',
    sleep: 'Sleep',
    sleepLow: 'Low (-2.3h)',
    avgHeartRate: 'Avg HR',
    restingNormal: 'Resting: Normal',
    insightTip: 'Sleep duration is lower than recommended. Combined with 32°C heat, remember to stay hydrated with electrolytes.',

    speakSymptomsTitle: 'Speak Your Symptoms',
    speakSymptomsDesc: 'Natural voice symptom triage in Telugu, Hindi or English. Instant digital OPD token.',
    holdToSpeak: 'Hold to Speak',
    smartRxTitle: 'Smart Rx Decoder',
    smartRxDesc: 'Photograph doctor prescription & get instructions safely',
    liveVoiceTitle: 'Live Voice Conversation',
    liveVoiceDesc: 'Real-time conversational voice with gemini-3.8-live (Live API)',
    talkLive: 'Talk Live',
    aiChatTitle: 'AI Health Chatbot',
    aiChatDesc: 'Multi-turn Gemini medical chat & session history',
    openChat: 'Open Chat',

    voiceTriageModalTitle: 'Voice-to-Token OPD',
    voiceTriageModalSubtitle: 'Speak naturally in Telugu, Hindi or English',
    listeningSymptoms: 'Listening to symptoms...',
    analyzingGemini: 'Analyzing with Gemini AI...',
    tellUsSymptoms: 'Tell us how you are feeling',
    tapToSpeak: 'Tap to Speak',
    stopRecording: 'Stop',
    processing: 'Processing...',
    cancelRecording: 'Cancel recording',
    tier1Title: 'TIER 1: CONSERVATIVE SELF-CARE',
    tier2Title: 'TIER 2: OPD CONSULTATION REQUIRED',
    tier3Title: 'TIER 3: EMERGENCY ESCALATION',
    severity: 'Severity',
    digitalOpdToken: 'DIGITAL OPD TOKEN',
    statusLabel: 'Status',
    patientInstructions: 'Patient Instructions',
    clinicalSummaryDoc: 'Clinical Summary (for Healthcare Staff)',
    estWait: 'Est. Wait',
    doneAndRecords: 'Done & View in Records',
    quickTestPresets: 'Quick Test Presets (Audio / Colleague simulation)',

    rxModalTitle: 'Smart Rx Decoder',
    rxModalSubtitle: 'Scan & translate medicine instructions safely',
    snapOrUpload: 'Snap or Upload Prescription',
    snapDesc: 'Ensure medicine names, doctor instructions, and dosages are visible',
    takePhoto: 'Take Photo',
    uploadFile: 'Upload File',
    decodingPrescription: 'Decoding Prescription...',
    safetyGuardrailTriggered: 'Prescription Safety Guardrail Triggered',
    safetyPolicyDesc: 'Under clinical safety policy, Sanjeevani Triage never guesses or extrapolates ambiguous handwriting or medicine dosages. Please consult a physical pharmacist.',
    extractedMedicines: 'Extracted Medicines',
    dosage: 'Dosage',
    duration: 'Duration',
    frequency: 'Frequency',
    pharmacistVerifyNotice: 'Always verify with your pharmacist before taking medications.',
    scanAnother: 'Scan Another',
    doneBtn: 'Done',
    testSamples: 'Test with Sample Prescriptions:',
    legibleSample: 'Legible Rx',
    illegibleSample: 'Illegible Rx (Safety Protocol Test)',

    holdSosBtn: 'Hold SOS',
    priority0Activated: 'PRIORITY 0 EMERGENCY ACTIVATED',
    emergencyDispatchLive: 'Emergency Dispatch Live',
    sosTicketLabel: 'Ticket ID',
    hospitalAlertStage: 'Hospital Dashboard Alert',
    localSirenStage: 'Local Audio Siren (10s)',
    ambientAudioStage: 'Ambient Audio (20s)',
    gpsCoordinates: 'GPS Lat/Lng',
    ambulanceHelpline: 'National Ambulance',
    dial108: 'Dial 108',
    acknowledgeBtn: 'Acknowledge & Keep Monitoring',

    activeOpdTokensTitle: 'Active OPD Token',
    noActiveTokens: 'No Active OPD Tokens',
    noActiveTokensDesc: 'Describe your symptoms via Voice Triage to receive a smart prioritized OPD token.',
    issuedAt: 'Issued',
    straightLineDist: 'straight-line',

    healthRecordsTitle: 'Health Records',
    triageRecordsTab: 'Triage Records',
    prescriptionsTab: 'Prescriptions',
    sosLogsTab: 'SOS Logs',
    noTriageRecords: 'No triage records found.',
    noPrescriptions: 'No scanned prescriptions yet.',
    noSosLogs: 'No emergency events logged.',

    profileTitle: 'Patient Profile',
    emergencyContact: 'Emergency Contact',
    medicalFlags: 'Medical Flags',
    knownConditions: 'Known conditions',
    allergies: 'Allergies',
    noneRecorded: 'None recorded',

    navHome: 'Home',
    navChat: 'Chat',
    navRecords: 'Records',
    navTokens: 'Tokens',
    navProfile: 'Profile',

    adminCommandCenter: 'Hospital Command Center',
    adminSubtitle: 'Priority-based patient routing & emergency triage administration',
    liveQueueBadge: 'Live Queue',
    totalPatientsToday: 'Total Patients Today',
    activeQueueCount: 'Active Queue',
    emergencyCasesCount: 'Emergencies (P0 / Tier 3)',
    waitingOpdCount: 'Waiting in OPD',
    inConsultationCount: 'In Consultation',
    queueTableHeader: 'Dynamic Severity-Ranked Patient Queue',
    queueTableSubheader: 'Ranked dynamically: Priority 0 SOS > Tier 3 Emergency > Tier 2 by Severity Score (Tier 1 excluded)',
    departmentFilterLabel: 'Department:',
    allDepartments: 'All Departments',
    queueClearTitle: 'Queue is Clear',
    queueClearDesc: 'No pending emergency or OPD patients in this department.',
    p0SosEventBadge: 'PRIORITY 0 SOS EVENT',
    tier3EmergencyBadge: 'Tier 3 Emergency',
    tier2OpdBadge: 'Tier 2 OPD',
    callbackPatientBtn: 'CALLBACK PATIENT',
    markResolvedBtn: 'Mark Resolved',
    openLocationLink: 'Open Location Link',
    contactPatientBtn: 'Contact Patient',
    directCallbackTitle: 'Direct Patient Callback',
    directCallbackSubtitle: 'Initiating verified telephone contact',
    closeBtn: 'Close',
    dialNowBtn: 'Dial Now',

    chatModalTitle: 'Sanjeevani AI Health Chat',
    chatModalSubtitle: 'Multi-Turn Medical Assistant & Chat History',
    chatHistoryTitle: 'Conversation History',
    newChatBtn: '+ New Chat',
    noPastConversations: 'No previous conversations',
    deleteSession: 'Delete',
    modelLabel: 'Model:',
    roleLabel: 'Role:',
    roleGeneral: '🩺 General Health Guide',
    roleSpecialist: '🧠 Clinical Specialist',
    roleFastTriage: '⚡ Rapid Triage Bot',
    chatInputPlaceholder: 'Type your health question (Telugu, Hindi, English)...',
    tryPrompt: 'Try:',
    thinkingNotice: 'Gemini is thinking...',
    clearChat: 'Clear Conversation',

    liveVoiceModalTitle: 'Gemini 3.8 Live (Voice API)',
    liveVoiceListening: 'Gemini 3.8 Live is listening. Start speaking naturally...',
    liveVoiceConnected: 'Live Session Active',
    liveVoiceSpeaking: 'Gemini speaking in 24kHz PCM audio...',
    liveVoiceDisconnected: 'Live Session Disconnected',
    endConversationBtn: 'End Conversation',
    quickVoiceQueries: 'Quick Spoken Queries (Real-Time Ingestion):',
  },
};
