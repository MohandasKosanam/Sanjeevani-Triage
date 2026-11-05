import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  X,
  Volume2,
  AlertTriangle,
  Hospital as HospitalIcon,
  Ticket,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Language, TriageRecord, OPDToken } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preferredLanguage: Language;
  onTokenGenerated?: (token: OPDToken) => void;
}

type RecordingState =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'RECORDING'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export const VoiceTriageSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  preferredLanguage,
  onTokenGenerated,
}) => {
  const { language, t } = useLanguage();
  const [state, setState] = useState<RecordingState>('IDLE');
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [triageResult, setTriageResult] = useState<TriageRecord | null>(null);
  const [generatedToken, setGeneratedToken] = useState<OPDToken | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Quick preset test cases for hackathon / demo testing
  const sampleSymptoms = [
    {
      lang: 'te',
      label: 'Telugu: కడుపు నొప్పి & వాంతులు (Tier 2 OPD)',
      text: 'నాకు మూడు రోజుల నుండి కడుపులో విపరీతమైన నొప్పి మరియు వాంతులు అవుతున్నాయి. ఆహారం తినలేకపోతున్నాను.',
    },
    {
      lang: 'te',
      label: 'Telugu: ఛాతీలో తీవ్ర నొప్పి & చెమటలు (Tier 3 Emergency)',
      text: 'నాకు ఛాతీలో తీవ్రమైన నొప్పి, గుండెల్లో బరువుగా మరియు ఎడమ చేతికి నొప్పి వ్యాపిస్తోంది, చెమటలు పడుతున్నాయి!',
    },
    {
      lang: 'hi',
      label: 'Hindi: पेट में तेज जलन और उल्टी (Tier 2 OPD)',
      text: 'मुझे पिछले दो दिनों से पेट में बहुत तेज दर्द और ऐंठन हो रही है, उल्टी जैसा महसूस हो रहा है।',
    },
    {
      lang: 'en',
      label: 'English: Mild scratchy throat & sneezing (Tier 1 Self-care)',
      text: 'I have a mild runny nose and slight scratchy throat since this morning, no fever.',
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      handleCancel();
      setTriageResult(null);
      setGeneratedToken(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      setState('REQUESTING_PERMISSION');
      setErrorMsg('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start(250);
      setState('RECORDING');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone permission or hardware error:', err);
      setState('FAILED');
      setErrorMsg('Microphone access denied or unavailable. You can use preset symptoms below.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && state === 'RECORDING') {
      setState('UPLOADING');
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancel = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    }
    setState('IDLE');
    setDuration(0);
  };

  const processAudio = async (audioBlob: Blob) => {
    setState('PROCESSING');
    try {
      const res = await api.submitTriage({
        audioBlob,
        language: preferredLanguage || language,
        lat: 17.7124,
        lng: 83.3156,
      });

      setTriageResult(res.triage);
      if (res.token) {
        setGeneratedToken(res.token);
        if (onTokenGenerated) onTokenGenerated(res.token);
      }
      setState('SUCCESS');
    } catch (err: any) {
      setState('FAILED');
      setErrorMsg(err.message || 'Triage processing failed');
    }
  };

  const testWithPreset = async (presetText: string, lang: string) => {
    setState('PROCESSING');
    setErrorMsg('');
    try {
      const res = await api.submitTriage({
        symptoms_text: presetText,
        language: lang,
        lat: 17.7124,
        lng: 83.3156,
      });

      setTriageResult(res.triage);
      if (res.token) {
        setGeneratedToken(res.token);
        if (onTokenGenerated) onTokenGenerated(res.token);
      }
      setState('SUCCESS');
    } catch (err: any) {
      setState('FAILED');
      setErrorMsg(err.message || 'Triage processing failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.voiceTriageModalTitle}</h2>
              <p className="text-xs text-slate-500">{t.voiceTriageModalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 flex flex-col items-center text-center">
          {state === 'SUCCESS' && triageResult ? (
            /* Results Screen */
            <div className="w-full text-left space-y-4">
              {/* Tier Banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  triageResult.tier === 3
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : triageResult.tier === 2
                    ? 'bg-teal-50 border-teal-200 text-teal-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {triageResult.tier === 3 ? (
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                    ) : triageResult.tier === 2 ? (
                      <HospitalIcon className="w-5 h-5 text-teal-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {triageResult.tier === 3
                        ? t.tier3Title
                        : triageResult.tier === 2
                        ? t.tier2Title
                        : t.tier1Title}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 shadow-xs">
                    {t.severity}: {triageResult.severity_score}/10
                  </span>
                </div>
                <p className="text-sm font-semibold mt-2">
                  {triageResult.clinical_department} Department
                </p>
              </div>

              {/* OPD Token Card if Tier 2 */}
              {generatedToken && (
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-2xl p-4 shadow-md">
                  <div className="flex items-center justify-between text-teal-100 text-xs font-medium">
                    <span className="flex items-center gap-1">
                      <Ticket className="w-4 h-4" /> {t.digitalOpdToken}
                    </span>
                    <span>{t.statusLabel}: {generatedToken.status.toUpperCase()}</span>
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight mt-1 mb-2 font-mono">
                    {generatedToken.token_number}
                  </div>
                  <div className="text-xs text-teal-100 border-t border-teal-500/40 pt-2 space-y-1">
                    <div className="font-semibold text-white">
                      {generatedToken.hospital_name}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{generatedToken.department}</span>
                      <span>{t.straightLineDist}: {generatedToken.distance_km} km</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-teal-200">
                      <Clock className="w-3 h-3" /> {t.estWait}: ~{generatedToken.estimated_wait_minutes} mins
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Instructions in Native Language */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" /> {t.patientInstructions} ({triageResult.detected_language.toUpperCase()})
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {triageResult.patient_instructions_native}
                </p>
              </div>

              {/* Clinical Symptoms Translation for Hospital Doctors */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5">
                <div className="font-bold text-slate-700 uppercase tracking-wide">
                  {t.clinicalSummaryDoc}:
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {triageResult.translated_symptoms}
                </p>
                {triageResult.safety_warning && (
                  <div className="text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg text-[11px] flex items-start gap-1.5 mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{triageResult.safety_warning}</span>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                {t.doneAndRecords} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Active Recording / Listening UI */
            <div className="w-full flex flex-col items-center">
              {/* Dynamic instruction text */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                  {state === 'RECORDING'
                    ? t.listeningSymptoms
                    : state === 'PROCESSING' || state === 'UPLOADING'
                    ? t.analyzingGemini
                    : t.tellUsSymptoms}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {state === 'RECORDING'
                    ? 'Speak clearly. Tap stop when finished.'
                    : state === 'PROCESSING'
                    ? 'Extracting symptoms, determining tier and nearest hospital...'
                    : 'Tap the microphone or select a sample symptom below.'}
                </p>
              </div>

              {/* Central Mic Button */}
              <div className="relative my-4 flex items-center justify-center">
                {state === 'RECORDING' && (
                  <div className="absolute w-36 h-36 rounded-full bg-teal-500/20 animate-ping" />
                )}
                {state === 'RECORDING' ? (
                  <button
                    onClick={stopRecording}
                    className="w-28 h-28 rounded-full bg-rose-600 text-white flex flex-col items-center justify-center shadow-xl hover:bg-rose-700 transition relative z-10"
                  >
                    <Square className="w-9 h-9" />
                    <span className="text-[11px] font-bold mt-1 uppercase tracking-wider">{t.stopRecording}</span>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={state === 'PROCESSING' || state === 'UPLOADING'}
                    className={`w-28 h-28 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex flex-col items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition relative z-10 ${
                      state === 'PROCESSING' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Mic className="w-10 h-10" />
                    <span className="text-[11px] font-bold mt-1 uppercase tracking-wider">
                      {state === 'PROCESSING' ? t.processing : t.tapToSpeak}
                    </span>
                  </button>
                )}
              </div>

              {/* Timer or Waveform */}
              {state === 'RECORDING' && (
                <div className="flex flex-col items-center gap-3 my-2">
                  <div className="text-rose-600 font-mono font-bold text-lg">
                    00:{duration < 10 ? `0${duration}` : duration}
                  </div>
                  {/* Waveform animation */}
                  <div className="flex items-center gap-1.5 h-10">
                    <div className="w-1.5 bg-teal-500 rounded-full wave-bar" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 bg-teal-600 rounded-full wave-bar" style={{ animationDelay: '0.3s' }} />
                    <div className="w-1.5 bg-teal-400 rounded-full wave-bar" style={{ animationDelay: '0.5s' }} />
                    <div className="w-1.5 bg-teal-700 rounded-full wave-bar" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 bg-teal-500 rounded-full wave-bar" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <button
                    onClick={handleCancel}
                    className="text-xs text-slate-500 hover:text-slate-800 underline mt-1"
                  >
                    {t.cancelRecording}
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl mt-3 text-left w-full">
                  {errorMsg}
                </div>
              )}

              {/* Preset Sample Symptoms for Fast Testing / Demonstrations */}
              <div className="w-full mt-6 pt-5 border-t border-slate-100 text-left">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{t.quickTestPresets}</span>
                  <span className="text-teal-600 font-medium">1-Click</span>
                </div>
                <div className="space-y-2">
                  {sampleSymptoms.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => testWithPreset(s.text, s.lang)}
                      disabled={state === 'PROCESSING'}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition flex items-center justify-between group"
                    >
                      <div className="pr-2">
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-700">
                          {s.label}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                          "{s.text}"
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
