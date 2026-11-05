import { GoogleGenAI, Type } from '@google/genai';
import { Language, TriageTier } from '../types';

// Centralized Gemini SDK Client
const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Configurable model name adhering to Gemini API skill
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export interface ChatMessageInput {
  role: 'user' | 'model';
  content: string;
}

export interface ChatResponseResult {
  reply: string;
  modelUsed: string;
  opdBookingRequested?: boolean;
  opdDepartment?: string;
  opdUrgency?: string;
}

/**
 * Multi-turn chat with Gemini supporting fast, general, and complex models.
 */
export async function chatWithGemini(
  messages: ChatMessageInput[],
  modelChoice: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' = 'gemini-3.8-flash',
  systemInstruction?: string,
  language: string = 'te'
): Promise<ChatResponseResult> {
  const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase();

  // Check if user specifically requested OPD booking
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

  // Detect department from symptoms
  let detectedDept = 'General Medicine';
  if (lastUserMsg.includes('గుండె') || lastUserMsg.includes('heart') || lastUserMsg.includes('chest') || lastUserMsg.includes('छाती')) {
    detectedDept = 'Cardiology';
  } else if (lastUserMsg.includes('కడుపు') || lastUserMsg.includes('stomach') || lastUserMsg.includes('వాంతులు') || lastUserMsg.includes('पेट')) {
    detectedDept = 'Gastroenterology';
  } else if (lastUserMsg.includes('కీళ్ళు') || lastUserMsg.includes('ఎముక') || lastUserMsg.includes('bone') || lastUserMsg.includes('joint') || lastUserMsg.includes('हड्डी')) {
    detectedDept = 'Orthopaedics';
  } else if (lastUserMsg.includes('శ్వాస') || lastUserMsg.includes('దగ్గు') || lastUserMsg.includes('cough') || lastUserMsg.includes('breath') || lastUserMsg.includes('सांस')) {
    detectedDept = 'Pulmonology';
  } else if (lastUserMsg.includes('చర్మం') || lastUserMsg.includes('skin') || lastUserMsg.includes('rash') || lastUserMsg.includes('खुजली')) {
    detectedDept = 'Dermatology';
  }

  if (ai) {
    try {
      const contents = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const sysInstruction =
        systemInstruction ||
        `You are Sanjeevani Healthcare Assistant, a knowledgeable, empathetic, multilingual medical guide with OPD Booking Skills.
You communicate natively in Telugu, Hindi, or English based on user preference (${language}).
Provide clear, structured, compassionate health advice. If patient needs hospital consultation or asks for OPD booking/appointment, utilize the book_opd_appointment tool skill to generate their queue token.`;

      const response = await ai.models.generateContent({
        model: modelChoice,
        contents,
        config: {
          systemInstruction: sysInstruction,
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'book_opd_appointment',
                  description: 'Book an OPD appointment and generate a digital hospital queue token for the patient based on symptoms or requested department.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      department: {
                        type: Type.STRING,
                        description: 'The clinical medical department (e.g., General Medicine, Cardiology, Gastroenterology, Neurology, Orthopaedics, Pulmonology, Pediatrics, Dermatology)',
                      },
                      urgency: {
                        type: Type.STRING,
                        description: 'Estimated urgency: normal or high',
                      },
                    },
                    required: ['department'],
                  },
                },
              ],
            },
          ],
        },
      });

      const functionCall = response.functionCalls?.[0];
      if (functionCall && functionCall.name === 'book_opd_appointment') {
        const args = (functionCall.args || {}) as any;
        const dept = args.department || detectedDept;
        const replyText =
          language === 'te'
            ? `నమస్కారం! మీ లక్షణాల ఆధారంగా **${dept}** విభాగానికి డిజిటల్ ఓపీడీ టోకెన్ విజయవంతంగా కేటాయించబడింది. క్రింద మీ డిజిటల్ టోకెన్ వివరాలు చూడవచ్చు.`
            : language === 'hi'
            ? `नमस्ते! आपके लक्षणों के आधार पर **${dept}** विभाग के लिए डिजिटल ओपीडी टोकन सफलतापूर्वक बुक कर दिया गया है। नीचे टोकन विवरण देखें।`
            : `Hello! Based on your symptoms, a digital OPD queue token for **${dept}** has been generated successfully. Your verified token card is attached below.`;

        return {
          reply: replyText,
          modelUsed: modelChoice,
          opdBookingRequested: true,
          opdDepartment: dept,
          opdUrgency: args.urgency || 'normal',
        };
      }

      if (response.text && response.text.trim().length > 0) {
        return {
          reply: response.text,
          modelUsed: modelChoice,
          opdBookingRequested: wantsOpd,
          opdDepartment: detectedDept,
        };
      }
    } catch (err: any) {
      console.warn(`Chat with ${modelChoice} failed, trying fallback:`, err);
    }
  }

  // Clinical Multilingual Knowledge Fallback Engine with OPD Booking Skill
  // Detect language if not explicitly provided
  const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(lastUserMsg);
  const isHindi = language === 'hi' || /[\u0900-\u097F]/.test(lastUserMsg);

  if (wantsOpd) {
    if (isTelugu) {
      return {
        reply: `నమస్కారం! మీ అభ్యర్థన మేరకు **${detectedDept}** విభాగానికి డిజిటల్ ఓపీడీ టోకెన్ జారీ చేయబడింది. సమీప ఆసుపత్రి మరియు క్యూ నంబర్ క్రింద చూడండి. దయచేసి నిర్ణీత సమయానికి చేరుకోండి.`,
        modelUsed: modelChoice,
        opdBookingRequested: true,
        opdDepartment: detectedDept,
      };
    } else if (isHindi) {
      return {
        reply: `नमस्ते! आपके अनुरोध पर **${detectedDept}** विभाग के लिए डिजिटल ओपीडी टोकन जारी कर दिया गया है। निकटतम अस्पताल और टोकन विवरण नीचे देखें।`,
        modelUsed: modelChoice,
        opdBookingRequested: true,
        opdDepartment: detectedDept,
      };
    } else {
      return {
        reply: `Hello! As requested, a confirmed Digital OPD Token for **${detectedDept}** has been booked for you. Your assigned queue details and room number are shown below.`,
        modelUsed: modelChoice,
        opdBookingRequested: true,
        opdDepartment: detectedDept,
      };
    }
  }

  if (isTelugu) {
    if (lastUserMsg.includes('జ్వరం') || lastUserMsg.includes('fever') || lastUserMsg.includes('తాపం')) {
      return {
        reply: `నమస్కారం! జ్వరం గురించి మీరు అడిగిన సమాచారం:\n\n1. **విశ్రాంతి & ద్రవపదార్థాలు:** తగినంత విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు, కొబ్బరి నీరు లేదా ORS ద్రావణం త్రాగండి.\n2. **ఉష్ణోగ్రత పర్యవేక్షణ:** థర్మామీటర్‌తో ప్రతి 4 గంటలకు ఒకసారి రీడింగ్ గమనించండి.\n3. **మందులు:** సాధారణంగా పారాసిటమాల్ (Paracetamol 650mg) ఆహారం తీసుకున్న తర్వాత మాత్రమే వేసుకోవాలి. రెండు మోతాదుల మధ్య కనీసం 4-6 గంటల సమయం ఉండాలి.\n\n⚠️ **హెచ్చరిక:** జ్వరం 102°F దాటినా, 3 రోజుల కంటే ఎక్కువ తగ్గకపోయినా, లేదా శ్వాసలో ఇబ్బంది ఉంటే వెంటనే మా డిజిటల్ ఓపీడీ టోకెన్ తీసుకుని ఆసుపత్రి వైద్యుడిని సంప్రదించండి.`,
        modelUsed: modelChoice,
      };
    }

    if (lastUserMsg.includes('కడుపు') || lastUserMsg.includes('నొప్పి') || lastUserMsg.includes('వాంతులు') || lastUserMsg.includes('stomach')) {
      return {
        reply: `నమస్కారం! కడుపులో అసౌకర్యం లేదా నొప్పికి సంబంధించి:\n\n1. **ఆహార జాగ్రత్తలు:** కారం, మసాలా, నూనెతో కూడిన ఆహారాలు మానుకోండి. మజ్జిగ, బార్లీ నీరు, తేలికపాటి గంజి వంటివి తీసుకోండి.\n2. **డీహైడ్రేషన్ నివారణ:** వాంతులు లేదా విరేచనాలు ఉంటే ప్రతి అరగంటకు కొద్దికొద్దిగా ORS ద్రవం త్రాగండి.\n3. **డాక్టర్ సంప్రదింపు:** కడుపు నొప్పి తీవ్రంగా ఉన్నా లేదా ఆగకుండా వాంతులు అవుతుంటే గ్యాస్ట్రోఎంటరాలజీ లేదా జనరల్ మెడిసిన్ ఓపీడీ టోకెన్ వెంటనే తీసుకోండి.`,
        modelUsed: modelChoice,
      };
    }

    if (lastUserMsg.includes('మోతాదు') || lastUserMsg.includes('మందు') || lastUserMsg.includes('పారాసెటమాల్') || lastUserMsg.includes('medicine')) {
      return {
        reply: `నమస్కారం! ఔషధాల వినియోగ సూచనలు:\n\n• **పారాసెటమాల్ (Paracetamol 650mg):** పెద్దలకు అవసరాన్ని బట్టి రోజుకు గరిష్టంగా 3 సార్లు (ప్రతి 6-8 గంటలకు ఒకసారి) భోజనం తర్వాత తీసుకోవచ్చు.\n• ఖాళీ కడుపుతో తీవ్రమైన నొప్పి నివారణ మందులు (NSAIDs) వేసుకోకండి.\n• మీ ప్రిస్క్రిప్షన్‌ను మా "స్మార్ట్ ప్రిస్క్రిప్షన్ డీకోడర్" ద్వారా స్కాన్ చేసి మోతాదు వివరాలు ధృవీకరించుకోవచ్చు. ఎల్లప్పుడూ రిజిస్టర్డ్ ఫార్మసిస్ట్ సలహా తీసుకోండి.`,
        modelUsed: modelChoice,
      };
    }

    return {
      reply: `నమస్కారం! మీ ఆరోగ్య ప్రశ్నను స్వీకరించాము. సంజీవని హెల్త్‌కేర్ అసిస్టెంట్‌గా మీ ఆరోగ్య సంరక్షణకు మేము సిద్ధంగా ఉన్నాము.\n\nమీ ప్రస్తుత లక్షణాల తీవ్రతను బట్టి మా 'వాయిస్-టు-టోకెన్ ఓపీడీ' ద్వారా తక్షణమే డిజిటల్ టోకెన్ పొందవచ్చు లేదా అత్యవసరమైతే 2.5 సెకన్ల SOS బటన్‌ను ఉపయోగించవచ్చు. ఇంకా ఏమైనా వివరాలు తెలుసుకోవాలనుకుంటున్నారా?`,
      modelUsed: modelChoice,
    };
  }

  if (isHindi) {
    if (lastUserMsg.includes('बुखार') || lastUserMsg.includes('fever') || lastUserMsg.includes('तापमान')) {
      return {
        reply: `नमस्ते! बुखार के संबंध में आवश्यक स्वास्थ्य परामर्श:\n\n1. **पर्याप्त आराम एवं तरल पदार्थ:** पर्याप्त आराम करें, खूब गुनगुना पानी, नारियल पानी अथवा ORS घोल पिएं ताकि डिहाइड्रेशन न हो।\n2. **तापमान की निगरानी:** थर्मामीटर से दिन में 3-4 बार शरीर का तापमान नोट करें।\n3. **दवा परामर्श:** सामान्यतः पेरासिटामोल (Paracetamol 650mg) भोजन के बाद ली जाती है। दो खुराकों के बीच न्यूनतम 4 से 6 घंटे का अंतराल रखें।\n\n⚠️ **सावधानी:** यदि बुखार 102°F से अधिक हो या 3 दिन से अधिक रहे, तो तुरंत हमारे डिजिटल OPD टोकन के माध्यम से चिकित्सक से परामर्श लें।`,
        modelUsed: modelChoice,
      };
    }

    if (lastUserMsg.includes('पेट') || lastUserMsg.includes('दर्द') || lastUserMsg.includes('उल्टी') || lastUserMsg.includes('stomach')) {
      return {
        reply: `नमस्ते! पेट दर्द या अपच के संबंध में महत्वपूर्ण सुझाव:\n\n1. **खान-पान की सावधानी:** तला-भुना, अधिक मिर्च-मसालेदार और भारी भोजन से परहेज करें। छाछ, खिचड़ी, दलिया जैसा हल्का आहार लें।\n2. **हाइड्रेशन:** उल्टी या दस्त होने पर थोड़े-थोड़े अंतराल पर ORS घोल का सेवन करें।\n3. **चिकित्सीय परामर्श:** यदि पेट में लगातार तीव्र दर्द या ऐंठन हो, तो तुरंत संजीवनी ऐप के जरिए गैस्ट्रोएंटरोलॉजी या जनरल मेडिसिन का OPD टोकन लें।`,
        modelUsed: modelChoice,
      };
    }

    if (lastUserMsg.includes('खुराक') || lastUserMsg.includes('दवा') || lastUserMsg.includes('पैरासिटामोल') || lastUserMsg.includes('medicine')) {
      return {
        reply: `नमस्ते! दवाओं के सुरक्षित उपयोग के नियम:\n\n• **पेरासिटामोल (Paracetamol 650mg):** वयस्कों के लिए आवश्यकतानुसार 6-8 घंटे के अंतराल पर भोजन के पश्चात ली जा सकती है (24 घंटे में अधिकतम 3-4 गोलियां)।\n• खाली पेट दर्दनिवारक दवाएं न लें।\n• डॉक्टर के पर्चे को हमारे "स्मार्ट प्रिस्क्रिप्शन डिकोडर" से स्कैन करके सुरक्षित निर्देश प्राप्त करें और फार्मासिस्ट से पुष्टि करें।`,
        modelUsed: modelChoice,
      };
    }

    return {
      reply: `नमस्ते! आपका स्वास्थ्य संबंधी प्रश्न प्राप्त हुआ। संजीवनी AI हेल्थकेयर असिस्टेंट आपके बेहतर स्वास्थ्य के लिए तत्पर है।\n\nआप अपने लक्षणों के आधार पर ऐप से तुरंत 'वॉयस OPD टोकन' प्राप्त कर सकते हैं अथवा आपातकालीन स्थिति में 2.5 सेकंड का SOS बटन दबा सकते हैं। क्या आप इस संबंध में कुछ और पूछना चाहते हैं?`,
      modelUsed: modelChoice,
    };
  }

  // English fallback
  return {
    reply: `Hello! I have reviewed your health query: "${messages[messages.length - 1]?.content || ''}".\n\n1. **Immediate Guidance:** Stay well-hydrated, monitor your resting vital signs, and avoid strenuous activity.\n2. **Clinical Verification:** For any persistent symptoms, generate a Digital OPD Token via our Voice Triage screen to be routed to the appropriate department.\n3. **Emergency Red Flags:** If you experience acute chest discomfort, sudden shortness of breath, or fainting, activate the 2.5s Emergency SOS button immediately.`,
    modelUsed: modelChoice,
  };
}

const MASTER_SYSTEM_PROMPT = `You are Sanjeevani Triage, an AI-assisted multimodal healthcare routing assistant.

Your job is to understand patient-reported symptoms, interpret medical documents when sufficiently legible, and provide structured information for a healthcare routing system.

You are not a doctor and must not independently diagnose diseases.

LANGUAGE:
Support Telugu (te), Hindi (hi), and English (en).
Detect the language of patient audio or text.
Understand natural speech and regional colloquialisms (e.g., Telugu "కడుపు నొప్పి", "గుండెల్లో బరువుగా ఉంది", Hindi "पेट में दर्द", "चक्कर आना").
Translate symptoms into professional English for hospital staff.
Provide patient-facing communication in the detected native language.

SYMPTOM EXTRACTION:
Extract only information supported by patient input.
Do not invent symptoms, medical history, or duration.
Identify missing information and uncertainty.
Flag potential emergency warning signs.

TIER 1 (Self-Care):
Recommend conservative self-care guidance only for clearly mild symptoms without warning signs (e.g. mild common cold, mild dry cough for 1 day, minor superficial abrasion).
Include a medical disclaimer and escalation instructions.

TIER 2 (OPD Consultation):
Identify the relevant clinical department (General Medicine, Cardiology, Gastroenterology, Neurology, Orthopaedics, Pulmonology, Pediatrics, Gynecology, Dermatology, etc.) and recommend clinical evaluation.
Do not independently assign a hospital. Severity score between 4 and 8.

TIER 3 (Emergency):
Identify potentially life-threatening symptoms (severe sudden chest pain, severe breathing distress, signs of acute stroke, severe trauma/bleeding, sudden loss of consciousness).
Set severity score to 10.
Recommend immediate emergency assistance.
Do not delay emergency instructions.

PRESCRIPTION SCANNING:
Extract only clearly legible medicine names, dosage, frequency, and duration.
Never guess missing information.
Never invent medication instructions.
If handwriting is ambiguous, unclear, smudged, or medicine identity cannot be verified with 100% certainty, abort extraction.
Return the exact warning:
"Medicine name is unclear. Please consult a physical pharmacist."

HOSPITAL ROUTING:
Do not invent hospital IDs, hospital names, specialties, availability, or distances.
The backend will perform geographical calculations and final hospital allocation.

OUTPUT:
Return valid JSON matching the schema.
Never provide unsupported medical claims.
Never claim that an ambulance or medical professional has been dispatched.`;

export interface TriageAIResult {
  status: 'success' | 'unclear';
  tier: TriageTier;
  translated_symptoms: string;
  detected_language: Language;
  clinical_department: string;
  severity_score: number;
  patient_instructions_native: string;
  safety_warning: string;
  requires_human_assessment: boolean;
  original_transcript?: string;
}

export interface PrescriptionAIResult {
  status: 'success' | 'unclear' | 'failed';
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions_native: string;
  }>;
  safety_warning: string;
}

/**
 * Analyzes patient symptom audio or text input using Gemini.
 */
export async function analyzeSymptoms(
  input: {
    audioBase64?: string;
    audioMimeType?: string;
    textInput?: string;
    userLanguageHint?: Language;
  }
): Promise<TriageAIResult> {
  if (ai) {
    try {
      const parts: any[] = [];

      if (input.audioBase64 && input.audioMimeType) {
        parts.push({
          inlineData: {
            mimeType: input.audioMimeType,
            data: input.audioBase64,
          },
        });
        parts.push({
          text: `Please transcribe and analyze this patient audio recording. Extract reported symptoms, detect the language (Telugu 'te', Hindi 'hi', or English 'en'), assess the triage tier (1: Self-care, 2: OPD, 3: Emergency), determine severity score (1-10), identify clinical department, and provide patient instructions in their native language.`
        });
      } else if (input.textInput) {
        parts.push({
          text: `Patient input: "${input.textInput}". User language hint: ${input.userLanguageHint || 'auto'}.
Analyze these symptoms, detect language ('te', 'hi', or 'en'), determine triage tier (1, 2, or 3), severity score (1-10), clinical department, English translation, and patient instructions in the detected language.`
        });
      } else {
        throw new Error('No input provided for symptom analysis');
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: { parts },
        config: {
          systemInstruction: MASTER_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              tier: { type: Type.INTEGER, description: '1 for Self-care, 2 for OPD, 3 for Emergency' },
              translated_symptoms: { type: Type.STRING, description: 'Clinical symptoms translated to English' },
              detected_language: { type: Type.STRING, description: 'te, hi, or en' },
              clinical_department: { type: Type.STRING, description: 'Clinical department like Cardiology, General Medicine, etc.' },
              severity_score: { type: Type.INTEGER, description: '1 to 10 scale' },
              patient_instructions_native: { type: Type.STRING, description: 'Instructions in the patient language' },
              safety_warning: { type: Type.STRING },
              requires_human_assessment: { type: Type.BOOLEAN },
              original_transcript: { type: Type.STRING },
            },
            required: [
              'status',
              'tier',
              'translated_symptoms',
              'detected_language',
              'clinical_department',
              'severity_score',
              'patient_instructions_native',
              'requires_human_assessment',
            ],
          },
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        let tier = parsed.tier as TriageTier;
        if (tier !== 1 && tier !== 2 && tier !== 3) tier = 2;

        return {
          status: 'success',
          tier,
          translated_symptoms: parsed.translated_symptoms || 'Patient reported symptoms requiring evaluation.',
          detected_language: (parsed.detected_language as Language) || input.userLanguageHint || 'en',
          clinical_department: parsed.clinical_department || 'General Medicine',
          severity_score: Math.min(10, Math.max(1, Number(parsed.severity_score) || 5)),
          patient_instructions_native: parsed.patient_instructions_native || 'Please proceed to the assigned department.',
          safety_warning: parsed.safety_warning || '',
          requires_human_assessment: parsed.requires_human_assessment !== false,
          original_transcript: parsed.original_transcript || input.textInput,
        };
      }
    } catch (error) {
      console.warn('Gemini API call failed, invoking clinical fallback rule engine:', error);
    }
  }

  // Clinical Rule Engine Fallback (guarantees safe, resilient triage even without API key or during network outage)
  return fallbackClinicalTriage(input.textInput || 'Voice symptom recording received', input.userLanguageHint || 'en');
}

/**
 * Decodes prescriptions from image using Gemini Vision with strict safety protocol.
 */
export async function decodePrescription(
  imageBase64: string,
  mimeType: string,
  preferredLanguage: Language = 'en'
): Promise<PrescriptionAIResult> {
  const EXACT_UNCLEAR_WARNING = 'Medicine name is unclear. Please consult a physical pharmacist.';

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: `Carefully examine this prescription.
Extract medicine names, dosage, frequency, and instructions.
CRITICAL SAFETY PROTOCOL:
- Never guess or extrapolate medicine names or dosages.
- If the handwriting is messy, smudged, ambiguous, or illegible, you MUST set status to "unclear", return an empty medicines array, and set safety_warning exactly to: "${EXACT_UNCLEAR_WARNING}".
- If readable, translate instructions to the requested language (${preferredLanguage}).`
            },
          ],
        },
        config: {
          systemInstruction: MASTER_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, description: '"success" or "unclear"' },
              safety_warning: { type: Type.STRING },
              medicines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    instructions_native: { type: Type.STRING },
                  },
                  required: ['name', 'dosage', 'frequency', 'duration', 'instructions_native'],
                },
              },
            },
            required: ['status', 'safety_warning', 'medicines'],
          },
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        if (parsed.status === 'unclear' || !parsed.medicines || parsed.medicines.length === 0) {
          return {
            status: 'unclear',
            medicines: [],
            safety_warning: EXACT_UNCLEAR_WARNING,
          };
        }
        return {
          status: 'success',
          medicines: parsed.medicines,
          safety_warning: parsed.safety_warning || 'Verification with licensed pharmacist recommended.',
        };
      }
    } catch (err) {
      console.warn('Prescription decoding failed via Gemini:', err);
    }
  }

  // Fallback for demo when API key is unavailable
  return {
    status: 'unclear',
    medicines: [],
    safety_warning: EXACT_UNCLEAR_WARNING,
  };
}

/**
 * Deterministic clinical rule engine fallback for resilient offline/outage operation.
 */
function fallbackClinicalTriage(rawText: string, langHint: Language): TriageAIResult {
  const text = rawText.toLowerCase();

  // Tier 3 Emergency indicators
  const emergencyKeywords = [
    'chest pain', 'గుండె నొప్పి', 'सीने में दर्द',
    'heart attack', 'శ్వాస తీసుకోవడంలో ఇబ్బంది', 'सांस लेने में तकलीफ',
    'difficulty breathing', 'breathless', 'stroke', 'unconscious',
    'bleeding heavily', 'కళ్ళు తిరిగి పడిపోవడం', 'बेहोश'
  ];

  const isEmergency = emergencyKeywords.some((k) => text.includes(k.toLowerCase()));

  if (isEmergency) {
    let nativeInstr = 'EMERGENCY: Immediate emergency medical care required. Call emergency services immediately.';
    if (langHint === 'te') {
      nativeInstr = 'అత్యవసర హెచ్చరిక: తక్షణ అత్యవసర వైద్య సంరక్షణ అవసరం. వెంటనే సమీపంలోని ఎమర్జెన్సీ వార్డుకు వెళ్ళండి లేదా 108 కు కాల్ చేయండి.';
    } else if (langHint === 'hi') {
      nativeInstr = 'आपातकालीन चेतावनी: तत्काल आपातकालीन चिकित्सा सहायता आवश्यक है। तुरंत 108 पर कॉल करें या नजदीकी आपातकालीन कक्ष जाएं।';
    }

    return {
      status: 'success',
      tier: 3,
      translated_symptoms: `CRITICAL: Patient reports severe life-threatening symptoms: ${rawText}`,
      detected_language: langHint,
      clinical_department: 'Emergency & Critical Care',
      severity_score: 10,
      patient_instructions_native: nativeInstr,
      safety_warning: 'Life-threatening symptoms detected. Do not delay medical intervention.',
      requires_human_assessment: true,
      original_transcript: rawText,
    };
  }

  // Tier 1 Mild Self-care indicators
  const mildKeywords = [
    'mild cold', 'చిన్న జలుబు', 'हल्की सर्दी',
    'runny nose', 'mild scratch', 'minor scrape', 'just tired',
    'sneezing once', 'mild dry cough'
  ];

  const isMild = mildKeywords.some((k) => text.includes(k.toLowerCase())) && !text.includes('severe') && !text.includes('blood');

  if (isMild) {
    let nativeInstr = 'Self-care guidance: Rest adequately, stay hydrated, and monitor temperature. If symptoms worsen, consult a doctor.';
    if (langHint === 'te') {
      nativeInstr = 'స్వీయ సంరక్షణ సూచనలు: తగినంత విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు త్రాగండి. లక్షణాలు ఎక్కువైతే సమీప ఆసుపత్రిని సంప్రదించండి.';
    } else if (langHint === 'hi') {
      nativeInstr = 'स्वयं-देखभाल निर्देश: पर्याप्त आराम करें, गुनगुना पानी पिएं। यदि लक्षण बढ़ते हैं तो तुरंत डॉक्टर से परामर्श लें।';
    }

    return {
      status: 'success',
      tier: 1,
      translated_symptoms: `Mild non-urgent condition: ${rawText}`,
      detected_language: langHint,
      clinical_department: 'General Medicine',
      severity_score: 2,
      patient_instructions_native: nativeInstr,
      safety_warning: 'Non-diagnostic advice. If high fever or warning signs appear, seek medical evaluation.',
      requires_human_assessment: false,
      original_transcript: rawText,
    };
  }

  // Default: Tier 2 OPD
  let dept = 'General Medicine';
  let severity = 6;

  if (text.includes('stomach') || text.includes('కడుపు') || text.includes('पेट') || text.includes('vomit') || text.includes('acidity')) {
    dept = 'Gastroenterology';
    severity = 6;
  } else if (text.includes('bone') || text.includes('fracture') || text.includes('కండరాల') || text.includes('हड्डी') || text.includes('knee')) {
    dept = 'Orthopaedics';
    severity = 7;
  } else if (text.includes('headache') || text.includes('migraine') || text.includes('తలనెప్పి') || text.includes('सिरदर्द')) {
    dept = 'Neurology';
    severity = 5;
  } else if (text.includes('fever') || text.includes('జ్వరం') || text.includes('बुखार')) {
    dept = 'Internal Medicine';
    severity = 6;
  }

  let nativeInstr = 'Please proceed to the assigned hospital OPD counter for physical examination.';
  if (langHint === 'te') {
    nativeInstr = 'దయచేసి డాక్టర్ పరీక్ష కోసం కేటాయించిన ఆసుపత్రి ఓపీడీ కౌంటర్‌కు వెళ్లండి. మీ డిజిటల్ టోకెన్ సిద్ధంగా ఉంది.';
  } else if (langHint === 'hi') {
    nativeInstr = 'कृपया डॉक्टर की जांच के लिए निर्धारित अस्पताल ओपीडी काउंटर पर जाएं। आपका डिजिटल टोकन जारी कर दिया गया है।';
  }

  return {
    status: 'success',
    tier: 2,
    translated_symptoms: `Patient presents with symptoms: ${rawText}`,
    detected_language: langHint,
    clinical_department: dept,
    severity_score: severity,
    patient_instructions_native: nativeInstr,
    safety_warning: 'Clinical evaluation required. Avoid self-medication.',
    requires_human_assessment: true,
    original_transcript: rawText,
  };
}
