import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Radio,
  Sparkles,
  AlertTriangle,
  RotateCw,
  PhoneCall,
  Activity,
  Ticket,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { OPDToken } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preferredLanguage?: string;
  onTokenBooked?: (token: OPDToken) => void;
  onViewTokens?: () => void;
}

export const GeminiLiveVoiceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  preferredLanguage = 'te',
  onTokenBooked,
  onViewTokens,
}) => {
  const { language, t } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState('Connecting to Gemini 3.8 Live...');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bookedToken, setBookedToken] = useState<OPDToken | null>(null);
  const [isBookingOPD, setIsBookingOPD] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    if (isOpen) {
      startLiveSession();
    } else {
      stopLiveSession();
    }
    return () => {
      stopLiveSession();
    };
  }, [isOpen]);

  const pcmToBase64 = (float32Array: Float32Array): string => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    let binary = '';
    const bytes = new Uint8Array(pcm16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const play24kHzAudioChunk = (base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
      }
      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const binary = window.atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;

      activeSourcesRef.current.push(source);
      setIsAiSpeaking(true);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsAiSpeaking(false);
        }
      };
    } catch (err) {
      console.error('Error playing 24kHz audio chunk:', err);
    }
  };

  const clearPlaybackQueue = () => {
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop();
        s.disconnect();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsAiSpeaking(false);
  };

  const startLiveSession = async () => {
    setErrorMsg('');
    setStatusText('Connecting to Gemini 3.8 Live...');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setStatusText(`${t.liveVoiceConnected}. Initializing microphone...`);
        await setupMicrophone(ws);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            setStatusText(t.liveVoiceListening);
          } else if (msg.type === 'audio' && msg.audio) {
            play24kHzAudioChunk(msg.audio);
          } else if (msg.type === 'text' && msg.text) {
            setAiTranscript((prev) => prev + ' ' + msg.text);
          } else if (msg.type === 'opd_token_booked' && msg.token) {
            setBookedToken(msg.token);
            if (onTokenBooked) onTokenBooked(msg.token);
            const bookingNotice =
              language === 'te'
                ? `ఓపీడీ టోకెన్ ${msg.token.token_number} (${msg.token.department}) విజయవంతంగా బుక్ చేయబడింది!`
                : language === 'hi'
                ? `ओपीडी टोकन ${msg.token.token_number} (${msg.token.department}) सफलतापूर्वक बुक हो गया!`
                : `OPD Token ${msg.token.token_number} (${msg.token.department}) booked successfully!`;
            setAiTranscript(bookingNotice);
            setStatusText('OPD Token Booked');
          } else if (msg.type === 'interrupted') {
            clearPlaybackQueue();
            setStatusText('User interrupted — listening...');
          } else if (msg.type === 'error') {
            setErrorMsg(msg.message || 'Error from Live session');
          }
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('Live WebSocket error:', e);
        setErrorMsg('Could not establish real-time WebSocket connection to Gemini 3.8 Live.');
        setStatusText('Connection error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusText(t.liveVoiceDisconnected);
      };
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize Live voice session');
    }
  };

  const setupMicrophone = async (ws: WebSocket) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN && !isMuted) {
          const channelData = e.inputBuffer.getChannelData(0);
          const base64Pcm = pcmToBase64(channelData);
          ws.send(JSON.stringify({ audio: base64Pcm }));
        }
      };

      setStatusText(`${t.liveVoiceListening}`);
    } catch (err: any) {
      console.warn('Microphone stream error in Live modal:', err);
      setErrorMsg('Microphone access denied. You can send test queries below.');
    }
  };

  const stopLiveSession = () => {
    clearPlaybackQueue();
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (e) {}
      inputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const sendQuickSpeechText = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setUserTranscript(text);
      setAiTranscript('');
      wsRef.current.send(JSON.stringify({ text }));
      setStatusText('Processing voice input with Gemini 3.8 Live...');
    }
  };

  const handleBookOPDDirectly = async (dept = 'General Medicine') => {
    setIsBookingOPD(true);
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'book_opd', department: dept }));
      }
      const res = await api.bookOPD({ department: dept });
      setBookedToken(res.token);
      if (onTokenBooked) onTokenBooked(res.token);
      const bookingNotice =
        language === 'te'
          ? `మీకు ${res.token.hospital_name} లో ఓపీడీ టోకెన్ ${res.token.token_number} (${res.token.department}) బుక్ చేయబడింది!`
          : language === 'hi'
          ? `आपके लिए ${res.token.hospital_name} में ओपीडी टोकन ${res.token.token_number} (${res.token.department}) बुक कर दिया गया है!`
          : `OPD Token ${res.token.token_number} (${res.token.department}) booked for you at ${res.token.hospital_name}!`;
      setAiTranscript(bookingNotice);
    } catch (err: any) {
      console.error('Direct live OPD booking failed:', err);
      setErrorMsg('Failed to book OPD token: ' + err.message);
    } finally {
      setIsBookingOPD(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-teal-500/40 w-full max-w-lg rounded-3xl p-6 text-white text-center shadow-2xl relative flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-teal-400 uppercase">
              {t.liveVoiceModalTitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pulsing Visualizer Orb */}
        <div className="py-8 flex flex-col items-center justify-center relative">
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center transition duration-500 relative ${
              isAiSpeaking
                ? 'bg-gradient-to-tr from-teal-500 to-indigo-500 shadow-2xl shadow-teal-500/50 scale-110 animate-pulse'
                : isConnected && !isMuted
                ? 'bg-gradient-to-tr from-teal-600 to-slate-800 shadow-lg shadow-teal-600/30'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {isAiSpeaking ? (
              <Volume2 className="w-12 h-12 text-white animate-bounce" />
            ) : isMuted ? (
              <MicOff className="w-12 h-12 text-slate-400" />
            ) : (
              <Radio className="w-12 h-12 text-teal-300 animate-pulse" />
            )}
          </div>

          <div className="mt-4 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>{statusText}</span>
          </div>
        </div>

        {/* Live Audio Transcripts / Dialogue Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs min-h-[90px] max-h-[140px] overflow-y-auto">
          {userTranscript && (
            <div className="text-teal-300">
              <span className="font-bold text-slate-400">You:</span> "{userTranscript}"
            </div>
          )}
          {aiTranscript ? (
            <div className="text-slate-100">
              <span className="font-bold text-indigo-400">Gemini Live:</span> {aiTranscript}
            </div>
          ) : isAiSpeaking ? (
            <div className="text-slate-400 italic flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 animate-spin text-teal-400" /> {t.liveVoiceSpeaking}
            </div>
          ) : (
            <div className="text-slate-500 text-center py-3">
              Real-time conversational streaming audio in Telugu, Hindi & English.
            </div>
          )}
        </div>

        {/* Live OPD Token Confirmation Badge if Booked */}
        {bookedToken && (
          <div className="mt-3 bg-gradient-to-br from-teal-950 to-slate-900 border border-teal-500/50 rounded-2xl p-3 text-left shadow-lg text-white">
            <div className="flex items-center justify-between pb-2 border-b border-teal-800/80">
              <div className="flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-teal-400" />
                <span className="font-black text-xs text-teal-200">
                  {t.opdTokenGeneratedNotice}
                </span>
              </div>
              <span className="text-[10px] font-mono bg-teal-500/30 text-teal-300 px-2 py-0.5 rounded-md font-extrabold border border-teal-500/40">
                {bookedToken.token_number}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-slate-300">
              <div>
                <span className="text-[9px] text-teal-400 uppercase font-semibold block">Hospital</span>
                <span className="font-bold text-white truncate block">{bookedToken.hospital_name}</span>
              </div>
              <div>
                <span className="text-[9px] text-teal-400 uppercase font-semibold block">Department</span>
                <span className="font-bold text-white">{bookedToken.department}</span>
              </div>
              <div>
                <span className="text-[9px] text-teal-400 uppercase font-semibold block">Estimated Wait</span>
                <span className="font-bold text-amber-300">~{bookedToken.estimated_wait_minutes} mins</span>
              </div>
              <div>
                <span className="text-[9px] text-teal-400 uppercase font-semibold block">Status</span>
                <span className="font-bold text-emerald-400 uppercase">Active • Waiting</span>
              </div>
            </div>
            {onViewTokens && (
              <button
                onClick={() => {
                  onClose();
                  onViewTokens();
                }}
                className="mt-2.5 w-full py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Ticket className="w-3.5 h-3.5" /> {t.viewBookedTokenBtn}
              </button>
            )}
          </div>
        )}

        {/* Live OPD Booking Skill Action Bar */}
        <div className="mt-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-left min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{t.opdBookingSkillTitle}</div>
              <div className="text-[9px] text-slate-400 truncate">{t.bookOpdSkillDesc}</div>
            </div>
          </div>
          <button
            onClick={() => handleBookOPDDirectly('General Medicine')}
            disabled={isBookingOPD}
            className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>{isBookingOPD ? t.liveVoiceBookingOpd : t.bookOpdSkillBtn}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 p-2.5 rounded-xl text-left">
            {errorMsg}
          </div>
        )}

        {/* Quick Voice Prompt Buttons */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.quickVoiceQueries}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => sendQuickSpeechText(
                language === 'te'
                  ? 'నాకు గత రెండు రోజుల నుండి విపరీతమైన జ్వరం మరియు ఒంటి నొప్పులు ఉన్నాయి, ఓపీడీ టోకెన్ కావాలి.'
                  : language === 'hi'
                  ? 'मुझे पिछले दो दिनों से तेज बुखार है, मुझे ओपीडी टोकन बुक करना है।'
                  : 'I have had high fever for two days, please book an OPD queue token for me.'
              )}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 text-left truncate flex items-center gap-1.5"
            >
              <Ticket className="w-3 h-3 text-teal-400 shrink-0" />
              <span className="truncate">
                {language === 'te' ? 'జ్వరం & ఓపీడీ బుకింగ్' : language === 'hi' ? 'बुखार & ओपीडी टोकन' : 'Fever & OPD Booking'}
              </span>
            </button>
            <button
              onClick={() => sendQuickSpeechText(
                language === 'te'
                  ? 'నాకు ఉదయం నుండి కడుపులో చాలా నొప్పిగా ఉంది, నేను ఏమి చేయాలి?'
                  : language === 'hi'
                  ? 'मुझे पेट में बहुत दर्द है, क्या उपाय करना चाहिए?'
                  : 'I have severe stomach ache since morning, what should I do?'
              )}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 text-left truncate"
            >
              {language === 'te' ? 'కడుపు నొప్పికి సలహా' : language === 'hi' ? 'पेट दर्द के लिए सलाह' : 'Stomach Ache Query'}
            </button>
          </div>
        </div>

        {/* Bottom Call Controls */}
        <div className="flex items-center justify-center gap-4 mt-5 pt-3 border-t border-slate-800">
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              isMuted ? 'bg-amber-500/20 text-amber-400 border border-amber-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full flex items-center gap-2 transition shadow-lg shadow-rose-600/30"
          >
            <PhoneCall className="w-4 h-4 rotate-135" /> {t.endConversationBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
